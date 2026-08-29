import { Router } from 'express';
import { getPostbackToken, handlePostback } from '../controllers/postback.controller.js';

const router = Router();

// Expose active security token to the frontend simulator
router.get('/config/token', getPostbackToken);
router.get('/config/token/', getPostbackToken);

// Handle both root of mounted route and /postback for maximum compatibility
router.get('/', handlePostback);
router.post('/', handlePostback);
router.get('/postback', handlePostback);
router.post('/postback', handlePostback);

export default router;