import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import {
  bookAppointment,
  getDaySlots,
  cancelAppointment,
  getAppointmentById
} from '../controllers/appointmentController.js';

const router = express.Router();

router.get('/slots/:doctor_id', authenticateJWT, getDaySlots);
router.get('/:id', authenticateJWT, getAppointmentById);
router.post('/book', authenticateJWT, authorizeRoles('PATIENT'), bookAppointment);
router.delete('/:appointment_id', authenticateJWT, authorizeRoles('PATIENT'), cancelAppointment);

export default router;


