import mongoose from 'mongoose';
import { DoctorModel } from '../models/doctorModel.js';
import { AppointmentModel } from '../models/appointmentModel.js';
import { parseAvailability, isDateWithinAvailability, dayBounds } from '../services/availabilityService.js';

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


