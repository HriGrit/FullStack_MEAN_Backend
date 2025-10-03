import express from 'express';
import { userSignup, userSignIn, refreshTokens, userLogout } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', userSignup);
router.post('/signin', userSignIn);
router.post('/refresh', refreshTokens);
router.post('/logout', userLogout);

export default router;
