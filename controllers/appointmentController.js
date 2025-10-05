import { AppointmentModel } from '../models/appointmentModel.js';
import { DoctorModel } from '../models/doctorModel.js';
import { User } from '../models/userModel.js';
import { Department } from '../models/departmentModel.js';

const SLOT_TIMES = [
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
  "17:00-18:00"
];

/**
 * Validates date format YYYY-MM-DD
 */
function isValidDateFormat(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Checks if date is a weekday (Monday-Friday)
 * Returns true if Mon-Fri, false otherwise
 */
function isWeekday(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Checks if date is in the past
 */
function isPastDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const appointmentDate = new Date(dateStr + 'T00:00:00');
  return appointmentDate < today;
}

/**
 * Validates slot number (must be 0-7)
 */
function isValidSlot(slot) {
  return Number.isInteger(slot) && slot >= 0 && slot <= 7;
}

/**
 * Returns availability for all 8 slots for a given doctor and date.
 *
 * @param {string} doctorId - Doctor's ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object} Result with slots array or error
 */
export const getDaySlots = async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const { date } = req.query;

    // Validate date format
    if (!isValidDateFormat(date)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid date format. Expected YYYY-MM-DD' } });
    }

    // Validate weekday
    if (!isWeekday(date)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Date must be a weekday (Monday-Friday)' } });
    }

    // Query all booked appointments for this doctor and date
    const bookedAppointments = await AppointmentModel.find({
      doctorId: doctor_id,
      date: date,
      status: 'BOOKED'
    });

    // Build a map of booked slots
    const bookedSlots = {};
    for (const appt of bookedAppointments) {
      bookedSlots[appt.slot] = appt.patientId.toString();
    }

    // Build result array with all 8 slots
    const slots = [];
    for (let i = 0; i < 8; i++) {
      slots.push({
        slot: i,
        time: SLOT_TIMES[i],
        available: !bookedSlots[i],
        bookedBy: bookedSlots[i] || null
      });
    }

    return res.status(200).json({ success: true, data: { date, doctorId: doctor_id, slots } });
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * Books an appointment with a best-effort application-level pre-check.
 * This approach tolerates race conditions and does NOT rely on DB unique indexes.
 *
 * @param {string} doctorId - Doctor's ID
 * @param {string} patientId - Patient's ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {number} slot - Slot number (0-7)
 * @returns {Object} Result with appointment data or error
 */
export const bookAppointment = async (req, res) => {
  try {
    const { doctor_id, patient_id, date, slot } = req.body;

    // Validation step a: Ensure slot is integer 0..7
    if (!isValidSlot(slot)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Slot must be an integer between 0 and 7' } });
    }

    // Validation step b: Ensure date is valid YYYY-MM-DD
    if (!isValidDateFormat(date)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid date format. Expected YYYY-MM-DD' } });
    }

    // Validation step c: Ensure date is weekday Mon-Fri
    if (!isWeekday(date)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Appointments only available Monday through Friday' } });
    }

    // Validation step d: Reject past dates
    if (isPastDate(date)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Cannot book appointments in the past' } });
    }

    // Best-effort pre-check: see if slot already booked
    const existing = await AppointmentModel.findOne({
      doctorId: doctor_id,
      date: date,
      slot: slot,
      status: 'BOOKED'
    });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'SLOT_TAKEN', message: 'Slot already booked for this doctor/date/slot' } });
    }

    const appointment = await AppointmentModel.create({
      doctorId: doctor_id,
      patientId: patient_id,
      date: date,
      slot: slot,
      status: 'BOOKED'
    });

    return res.status(201).json({ success: true, data: {
      _id: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      date: appointment.date,
      slot: appointment.slot,
      time: SLOT_TIMES[appointment.slot],
      status: appointment.status,
      createdAt: appointment.createdAt
    }});
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * Cancels an appointment by setting status to CANCELLED and setting cancelledAt timestamp.
 *
 * @param {string} appointmentId - Appointment ID
 * @param {string} patientId - Patient ID (for authorization)
 * @returns {Object} Result with cancelled appointment or error
 */
export const cancelAppointment = async (req, res) => {
  try {
    const { appointment_id } = req.params;
    const patientId = req.userId;

    // Find the appointment
    const appointment = await AppointmentModel.findById(appointment_id);

    if (!appointment) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } });
    }

    // Check if already cancelled
    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_CANCELLED', message: 'Appointment is already cancelled' } });
    }

    // Verify patient_id matches (authorization check)
    if (appointment.patientId.toString() !== patientId) {
      return res.status(403).json({ success: false, error: { code: 'NOT_AUTHORIZED', message: 'Not authorized to cancel this appointment' } });
    }

    // Update appointment to CANCELLED
    appointment.status = 'CANCELLED';
    appointment.cancelledAt = new Date();
    await appointment.save();

    return res.status(200).json({ success: true, data: {
      _id: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      date: appointment.date,
      slot: appointment.slot,
      status: appointment.status,
      createdAt: appointment.createdAt,
      cancelledAt: appointment.cancelledAt
    }});
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * Fetches a single appointment by ID with populated doctor and patient data.
 *
 * @param {string} appointmentId - Appointment ID
 * @returns {Object} Result with appointment data including doctor and patient details
 */
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the appointment first
    const appointment = await AppointmentModel.findById(id);

    if (!appointment) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } });
    }

    // Fetch doctor data with populated user and department
    const doctor = await DoctorModel.findById(appointment.doctorId)
      .populate('userId')
      .populate('deptId');

    // Fetch patient data
    const patient = await User.findById(appointment.patientId);

    if (!doctor) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor not found' } });
    }

    if (!patient) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Patient not found' } });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: appointment._id,
        date: appointment.date,
        slot: appointment.slot,
        time: SLOT_TIMES[appointment.slot],
        status: appointment.status,
        cancelledAt: appointment.cancelledAt,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        doctor: {
          id: doctor._id,
          specialization: doctor.specialization,
          availability: doctor.availability,
          availableSlots: doctor.availableSlots,
          user: {
            id: doctor.userId._id,
            name: doctor.userId.name,
            email: doctor.userId.email,
            phone: doctor.userId.phone,
            role: doctor.userId.role
          },
          department: doctor.deptId ? {
            id: doctor.deptId._id,
            name: doctor.deptId.name
          } : null
        },
        patient: {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          role: patient.role
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * Fetches all appointments for the authenticated patient (from JWT).
 * Returns array of appointments with expanded doctor and patient data, same shape as getAppointmentById.
 */
export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.userId;

    const appointments = await AppointmentModel.find({ patientId }).sort({ date: -1, slot: -1 });

    const results = [];
    for (const appointment of appointments) {
      const doctor = await DoctorModel.findById(appointment.doctorId)
        .populate('userId')
        .populate('deptId');
      const patient = await User.findById(appointment.patientId);

      if (!doctor || !patient) continue;

      results.push({
        id: appointment._id,
        date: appointment.date,
        slot: appointment.slot,
        time: SLOT_TIMES[appointment.slot],
        status: appointment.status,
        cancelledAt: appointment.cancelledAt,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        doctor: {
          id: doctor._id,
          specialization: doctor.specialization,
          availability: doctor.availability,
          availableSlots: doctor.availableSlots,
          user: doctor.userId ? {
            id: doctor.userId._id,
            name: doctor.userId.name,
            email: doctor.userId.email,
            phone: doctor.userId.phone,
            role: doctor.userId.role
          } : null,
          department: doctor.deptId ? {
            id: doctor.deptId._id,
            name: doctor.deptId.name
          } : null
        },
        patient: patient ? {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          role: patient.role
        } : null
      });
    }

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};

/**
 * Fetches all appointments for the authenticated doctor (from JWT via mapping to Doctor document).
 * Returns array of appointments with expanded doctor and patient data, same shape as getAppointmentById.
 */
export const getDoctorAppointments = async (req, res) => {
  try {
    const userId = req.userId;

    const doctor = await DoctorModel.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Doctor profile not found for user' } });
    }

    const appointments = await AppointmentModel.find({ doctorId: doctor._id }).sort({ date: -1, slot: -1 });

    const results = [];
    for (const appointment of appointments) {
      const populatedDoctor = await DoctorModel.findById(appointment.doctorId)
        .populate('userId')
        .populate('deptId');
      const patient = await User.findById(appointment.patientId);

      if (!populatedDoctor || !patient) continue;

      results.push({
        id: appointment._id,
        date: appointment.date,
        slot: appointment.slot,
        time: SLOT_TIMES[appointment.slot],
        status: appointment.status,
        cancelledAt: appointment.cancelledAt,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        doctor: {
          id: populatedDoctor._id,
          specialization: populatedDoctor.specialization,
          availability: populatedDoctor.availability,
          availableSlots: populatedDoctor.availableSlots,
          user: populatedDoctor.userId ? {
            id: populatedDoctor.userId._id,
            name: populatedDoctor.userId.name,
            email: populatedDoctor.userId.email,
            phone: populatedDoctor.userId.phone,
            role: populatedDoctor.userId.role
          } : null,
          department: populatedDoctor.deptId ? {
            id: populatedDoctor.deptId._id,
            name: populatedDoctor.deptId.name
          } : null
        },
        patient: patient ? {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          role: patient.role
        } : null
      });
    }

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
};