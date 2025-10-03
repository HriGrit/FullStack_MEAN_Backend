import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { adminDashboard, createDoctor, deleteDepartment, deleteDoctor, updateDepartment, updateDoctor } from '../controllers/adminController.js';
import { createDepartment } from '../controllers/adminController.js';

const router = express.Router();
//For Department Management
router.get('/dashboard', authenticateJWT, authorizeRoles('ADMIN'),adminDashboard);
router.post('/create/Department',authenticateJWT,authorizeRoles('ADMIN'),createDepartment)
router.put('/update/Department/:id',authenticateJWT,authorizeRoles('ADMIN'),updateDepartment)
router.delete('/delete/Department/:id',authenticateJWT,authorizeRoles('ADMIN'),deleteDepartment)
//For Doctor Management
// router.get('/dashboard', authenticateJWT, authorizeRoles('ADMIN'),adminDashboard);
router.post('/create/Doctor',authenticateJWT,authorizeRoles('ADMIN'),createDoctor)
router.put('/update/Doctor/:doctorId',authenticateJWT,authorizeRoles('ADMIN'),updateDoctor)
router.delete('/delete/Doctor/:doctorId',authenticateJWT,authorizeRoles('ADMIN'),deleteDoctor)




export default router;
