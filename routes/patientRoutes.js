import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { getAllDepartments, getAllDoctors } from '../controllers/patientController.js';

const router = express.Router();

router.get('/departments',authenticateJWT,authorizeRoles('PATIENT'),getAllDepartments);
router.get('/doctors',authenticateJWT,authorizeRoles('PATIENT'),getAllDoctors);

export default router;
