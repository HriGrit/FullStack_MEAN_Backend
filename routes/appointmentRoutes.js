import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import {
  bookAppointment,
  getDaySlots,
  cancelAppointment
} from '../controllers/appointmentController.js';

const router = express.Router();

router.get('/slots/:doctor_id', authenticateJWT, getDaySlots);
router.post('/book', authenticateJWT, authorizeRoles('PATIENT'), bookAppointment);
router.patch('/:appointment_id/cancel', authenticateJWT, authorizeRoles('PATIENT'), cancelAppointment);

export default router;


