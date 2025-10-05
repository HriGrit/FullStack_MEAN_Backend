import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { getAllDepartments, getAllPatients, getPatientById } from '../controllers/patientController.js';
import { getPatientAppointments } from '../controllers/appointmentController.js';

const router = express.Router();

router.get('/departments',authenticateJWT,authorizeRoles('PATIENT','DOCTOR','ADMIN'),getAllDepartments);
router.get('/', authenticateJWT, authorizeRoles('DOCTOR','ADMIN'), getAllPatients);
router.get('/:id', authenticateJWT, authorizeRoles('DOCTOR','ADMIN'), getPatientById);
router.get('/appointment', authenticateJWT, authorizeRoles('PATIENT'), getPatientAppointments);

export default router;
