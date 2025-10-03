import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import {
  bookAppointment,
  getAppointmentsForPatient,
  getAppointmentsForDoctor,
  cancelAppointment,
  completeAppointment,
  // getDoctorAvailability
} from '../controllers/appointmentController.js';

const router = express.Router();

router.post('/book', authenticateJWT, authorizeRoles('PATIENT'), bookAppointment);

router.get('/patient/:patient_id', authenticateJWT, authorizeRoles('PATIENT', 'ADMIN'), getAppointmentsForPatient);

router.get('/doctor/:doctor_id', authenticateJWT, authorizeRoles('DOCTOR', 'ADMIN'), getAppointmentsForDoctor);

router.patch('/:appointment_id/cancel', authenticateJWT, authorizeRoles('PATIENT'), cancelAppointment);

router.patch('/:appointment_id/complete', authenticateJWT, authorizeRoles('DOCTOR'), completeAppointment);

// router.get('/availability/:doctor_id', authenticateJWT, getDoctorAvailability);

export default router;


