import express from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';
const router = express.Router();

router.get('/dashboard', authenticateJWT, authorizeRoles('ADMIN'), (req, res) => {
  res.send('Welcome to Admin Dashboard');
});

export default router;
