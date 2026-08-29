import express from 'express';
import { register, login, logout, getProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticate, logout);

// Protected route (requires valid cookie)
router.get('/me', authenticate, getProfile);

export default router;