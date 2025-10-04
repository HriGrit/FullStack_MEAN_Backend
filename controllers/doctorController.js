import mongoose from 'mongoose';
import { DoctorModel } from '../models/doctorModel.js';
import { AppointmentModel } from '../models/appointmentModel.js';

export const getAvailableDoctors = async (req, res) => {
  try {
    const { specialization, date, includeAppointments } = req.query;

    const filter = {};
    if (specialization && typeof specialization === 'string') {
      filter.specialization = specialization;
    }

    const doctors = await DoctorModel.find(filter)
      .select('specialization availability deptId userId')
      .populate({ path: 'deptId', select: 'name' })
      .populate({ path: 'userId', select: 'name' })
      .lean();

    let targetDate = null;
    let checkTime = false;
    if (date) {
      // Accept ISO or date-only
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
        // If time component present (contains 'T' or time), check time as well
        checkTime = /T|\d{2}:\d{2}/.test(date);
      }
    }

    const { start: dayStart, end: dayEnd } = targetDate ? getDayBounds(targetDate) : { start: null, end: null };

    const result = await Promise.all(
      doctors.map(async (d) => {
        if (targetDate) {
          if (checkTime) {
            if (!isDateWithinSlotHours(d.availability, targetDate)) return null;
          } else {
            const availabilityDays = extractAvailabilityDays(d.availability);
            if (!availabilityDays.has(targetDate.getDay())) return null;
          }
        }

        let existingAppointments = [];
        if (includeAppointments === 'true' && targetDate) {
          existingAppointments = await AppointmentModel.find({
            doctorId: d._id,
            status: 'BOOKED',
            appointmentDate: { $gte: dayStart, $lte: dayEnd }
          })
            .select('_id appointmentDate status')
            .lean();
        }

        return {
          doctor_id: d._id,
          name: d.userId?.name || '',
          specialization: d.specialization || '',
          department: d.deptId?.name || '',
          availability: d.availability || '',
          appointments: existingAppointments
        };
      })
    );

    const data = result.filter(Boolean);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_DOCTORS_FAILED', message: 'Something went wrong' }
    });
  }
};


// Helpers for availability parsing
function getDayBounds(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function extractAvailabilityDays(availability) {
  // Expected formats examples: 'MON-FRI 10am-6pm', 'MON, WED, FRI 9am-5pm'
  const daysMap = {
    SUN: 0,
    MON: 1,
    TUE: 2,
    WED: 3,
    THU: 4,
    FRI: 5,
    SAT: 6
  };
  const daysSet = new Set();
  if (typeof availability !== 'string') return daysSet;
  const upper = availability.toUpperCase();
  const rangeMatch = upper.match(/(MON|TUE|WED|THU|FRI|SAT|SUN)\s*-\s*(MON|TUE|WED|THU|FRI|SAT|SUN)/);
  if (rangeMatch) {
    const startDay = daysMap[rangeMatch[1]];
    const endDay = daysMap[rangeMatch[2]];
    if (startDay <= endDay) {
      for (let d = startDay; d <= endDay; d++) daysSet.add(d);
    } else {
      // Wrap-around range e.g., FRI-MON
      for (let d = startDay; d <= 6; d++) daysSet.add(d);
      for (let d = 0; d <= endDay; d++) daysSet.add(d);
    }
    return daysSet;
  }
  const listMatches = upper.match(/(MON|TUE|WED|THU|FRI|SAT|SUN)/g);
  if (listMatches) {
    listMatches.forEach((d) => daysSet.add(daysMap[d]));
  }
  // Default to weekdays if string contains 'MON-FRI'
  if (upper.includes('MON-FRI')) {
    [1,2,3,4,5].forEach((d) => daysSet.add(d));
  }
  return daysSet;
}

function isDateWithinSlotHours(availability, date) {
  // Very lightweight check: if availability string has hours like '10am-6pm', ensure date hour is inside
  if (typeof availability !== 'string') return true;
  const match = availability.match(/(\d{1,2})(am|pm)\s*-\s*(\d{1,2})(am|pm)/i);
  if (!match) return true;
  const [, startHourRaw, startAmpm, endHourRaw, endAmpm] = match;
  const to24 = (h, ap) => {
    let n = parseInt(h, 10) % 12;
    if (ap.toLowerCase() === 'pm') n += 12;
    return n;
  };
  const startHour = to24(startHourRaw, startAmpm);
  const endHour = to24(endHourRaw, endAmpm);
  const hour = date.getHours();
  if (startHour <= endHour) {
    return hour >= startHour && hour < endHour;
  } else {
    // overnight window
    return hour >= startHour || hour < endHour;
  }
}

export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid doctor id' }
      });
    }

    const doctor = await DoctorModel.findById(id)
      .select('specialization availability availableSlots deptId userId createdAt updatedAt')
      .populate({ path: 'deptId', select: 'name' })
      .populate({ path: 'userId', select: 'name email phone role' })
      .lean();

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor not found' }
      });
    }

    const data = {
      doctor_id: doctor._id,
      specialization: doctor.specialization || '',
      availability: doctor.availability || '',
      availableSlots: doctor.availableSlots || [],
      department: doctor.deptId?.name || '',
      user: doctor.userId
        ? {
            user_id: doctor.userId._id,
            name: doctor.userId.name || '',
            email: doctor.userId.email || '',
            phone: doctor.userId.phone || '',
            role: doctor.userId.role || ''
          }
        : null,
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_DOCTOR_FAILED', message: 'Something went wrong' }
    });
  }
};

export const filterDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;
    const dept = req.query.deptId || req.query.departmentId || req.query.department;

    const filter = {};

    if (dept) {
      if (!mongoose.Types.ObjectId.isValid(dept)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_DEPARTMENT_ID', message: 'Invalid department id' }
        });
      }
      filter.deptId = dept;
    }

    if (typeof specialization === 'string' && specialization.trim().length > 0) {
      filter.specialization = specialization.trim();
    }

    const doctors = await DoctorModel.find(filter)
      .select('specialization availability availableSlots deptId userId')
      .populate({ path: 'deptId', select: 'name' })
      .populate({ path: 'userId', select: 'name' })
      .lean();

    const data = doctors.map((d) => ({
      doctor_id: d._id,
      name: d.userId?.name || '',
      specialization: d.specialization || '',
      department: d.deptId?.name || '',
      availability: d.availability || '',
      availableSlots: d.availableSlots || []
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'FILTER_DOCTORS_FAILED', message: 'Something went wrong' }
    });
  }
};
