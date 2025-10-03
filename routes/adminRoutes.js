import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
import { adminDashboard } from '../controllers/adminController.js';
import { createDepartment } from '../controllers/adminController.js';
const router = express.Router();

router.get('/dashboard', authenticateJWT, authorizeRoles('ADMIN'),adminDashboard);
router.post('/create/Department',authenticateJWT,authorizeRoles('ADMIN'),createDepartment)

export default router;
