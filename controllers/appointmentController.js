import { AppointmentModel } from '../models/appointmentModel.js';

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
    const { patient_id } = req.body;

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
    if (appointment.patientId.toString() !== patient_id) {
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