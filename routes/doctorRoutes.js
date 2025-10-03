import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { getAvailableDoctors } from '../controllers/doctorController.js';

const router = express.Router();

// GET /api/v1/doctors/available
router.get('/available', authenticateJWT, authorizeRoles('PATIENT', 'ADMIN', 'DOCTOR'), getAvailableDoctors);

export default router;


