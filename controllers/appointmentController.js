import { AppointmentModel } from '../models/appointmentModel.js';
import { DoctorModel } from '../models/doctorModel.js';
import { isWithinAvailability, convertDayToIndex } from '../services/availability.js';

// Book appointment
export const bookAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_day } = req.body;

    if (!patient_id || !doctor_id || !appointment_day) {
      return res.status(400).json({
        success: false,
        message: 'patient_id, doctor_id, and appointment_day are required'
      });
    }

    const doctor = await DoctorModel.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const dayIndex = convertDayToIndex(appointment_day);
    if (dayIndex === null) {
      return res.status(400).json({ success: false, message: 'Invalid day' });
    }

    // Check if appointment is within doctor's availability
    if (!isWithinAvailability(doctor, dayIndex)) {
      return res.status(409).json({ success: false, message: 'Doctor not available at that time' });
    }

    // Atomically decrement the availableSlots for the given dayIndex by 1
    try {
      const updateResult = await DoctorModel.updateOne(
        { 
          _id: doctor_id,
          [`availableSlots.${dayIndex}`]: { $gt: 0 }
        },
        { 
          $inc: { [`availableSlots.${dayIndex}`]: -1 }
        }
      );
    
      if (updateResult.modifiedCount === 0) {
        return res.status(409).json({ 
          success: false, 
          message: 'No available slots for this day' 
        });
      }
    } catch (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update doctor availability' 
      });
    }

    const sameDayAppointments = await AppointmentModel.find({
      doctorId: doctor_id,
      status: 'BOOKED',
      appointmentDay: appointment_day
    });

    if (sameDayAppointments.length > 0) {
      return res.status(409).json({ success: false, message: 'Time slot already booked' });
    }

    // Create appointment
    const appointment = await AppointmentModel.create({
      patientId: patient_id,
      doctorId: doctor_id,
      appointmentDay: appointment_day.toLowerCase(),
      status: 'BOOKED'
    });

    return res.status(201).json({ 
      success: true, 
      data: appointment, 
      message: 'Appointment booked successfully' 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to book appointment' });
  }
};

// Get patient's appointments
export const getAppointmentsForPatient = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const appointments = await AppointmentModel.find({ patientId: patient_id })
      .sort({ appointmentDate: 1 })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' },
        select: 'specialization userId'
      });

    const data = appointments.map((appt) => ({
      appointment_id: appt._id,
      appointment_date: appt.appointmentDate,
      status: appt.status,
      doctor: {
        doctor_id: appt.doctorId?._id,
        name: appt.doctorId?.userId?.name || 'Unknown',
        specialization: appt.doctorId?.specialization || 'N/A'
      }
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};

// Get doctor's appointments
export const getAppointmentsForDoctor = async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const { date } = req.query;

    const filter = { doctorId: doctor_id };

    // Optional: filter by specific date
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        const { start, end } = dayBounds(d);
        filter.appointmentDate = { $gte: start, $lte: end };
      }
    }

    const appointments = await AppointmentModel.find(filter)
      .sort({ appointmentDate: 1 })
      .populate({ path: 'patientId', select: 'name' });

    const data = appointments.map((appt) => ({
      appointment_id: appt._id,
      appointment_date: appt.appointmentDate,
      status: appt.status,
      patient: {
        patient_id: appt.patientId?._id,
        name: appt.patientId?.name || 'Unknown'
      }
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { appointment_id } = req.params;

    const appointment = await AppointmentModel.findByIdAndUpdate(
      appointment_id,
      { status: 'CANCELLED' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to cancel appointment' });
  }
};

// Complete appointment
export const completeAppointment = async (req, res) => {
  try {
    const { appointment_id } = req.params;

    const appointment = await AppointmentModel.findByIdAndUpdate(
      appointment_id,
      { status: 'COMPLETED' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to complete appointment' });
  }
};