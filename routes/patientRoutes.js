import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { getAllDepartments } from '../controllers/patientController.js';
import { getPatientAppointments } from '../controllers/appointmentController.js';

const router = express.Router();

router.get('/departments',authenticateJWT,authorizeRoles('PATIENT','DOCTOR','ADMIN'),getAllDepartments);
router.get('/appointment', authenticateJWT, authorizeRoles('PATIENT'), getPatientAppointments);

export default router;
