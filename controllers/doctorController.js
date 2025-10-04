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

    const { start: dayStart, end: dayEnd } = targetDate ? dayBounds(targetDate) : { start: null, end: null };

    const result = await Promise.all(
      doctors.map(async (d) => {
        if (targetDate) {
          if (checkTime) {
            if (!isDateWithinAvailability(d.availability, targetDate)) return null;
          } else {
            const parsedAvail = parseAvailability(d.availability);
            if (!parsedAvail.days.has(targetDate.getDay())) return null;
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
