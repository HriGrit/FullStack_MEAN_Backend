import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { adminDashboard, createDoctor, deleteDepartment, deleteDoctor, updateDepartment, updateDoctor, getAnalytics } from '../controllers/adminController.js';
import { createDepartment } from '../controllers/adminController.js';

const router = express.Router();

router.get('/dashboard', authenticateJWT, authorizeRoles('ADMIN'), adminDashboard);
router.get('/analytics', authenticateJWT, authorizeRoles('ADMIN', 'DOCTOR'), getAnalytics);

router.post('/departments', authenticateJWT, authorizeRoles('ADMIN'), createDepartment);
router.put('/departments/:id', authenticateJWT, authorizeRoles('ADMIN'), updateDepartment);
router.delete('/departments/:id', authenticateJWT, authorizeRoles('ADMIN'), deleteDepartment);

router.post('/doctors', authenticateJWT, authorizeRoles('ADMIN'), createDoctor);
router.put('/doctors/:doctorId', authenticateJWT, authorizeRoles('ADMIN'), updateDoctor);
router.delete('/doctors/:doctorId', authenticateJWT, authorizeRoles('ADMIN'), deleteDoctor);




export default router;
