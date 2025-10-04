import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { getAllDepartments } from '../controllers/patientController.js';

const router = express.Router();

router.get('/departments',authenticateJWT,authorizeRoles('PATIENT','DOCTOR','ADMIN'),getAllDepartments);

export default router;
