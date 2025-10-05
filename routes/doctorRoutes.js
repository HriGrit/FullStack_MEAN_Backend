import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { getAvailableDoctors, getDoctorById, filterDoctors } from '../controllers/doctorController.js';
import { getDoctorAppointments } from '../controllers/appointmentController.js';

const router = express.Router();

// GET /api/v1/doctors/available
router.get('/available', authenticateJWT, authorizeRoles('PATIENT', 'ADMIN', 'DOCTOR'), getAvailableDoctors);

// GET /api/v1/doctors/:id
router.get('/:id', authenticateJWT, authorizeRoles('PATIENT', 'ADMIN', 'DOCTOR'), getDoctorById);

// GET /api/v1/doctors (filter by deptId and/or specialization)
router.get('/', authenticateJWT, authorizeRoles('PATIENT', 'ADMIN', 'DOCTOR'), filterDoctors);

// GET /api/v1/doctors/appointment (appointments for authenticated doctor)
router.get('/appointment', authenticateJWT, authorizeRoles('DOCTOR'), getDoctorAppointments);

export default router;


