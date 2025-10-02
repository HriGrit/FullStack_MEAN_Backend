import express from 'express';
import { userSignup,userSignIn} from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', userSignup);
router.post('/signin', userSignIn);

export default router;
