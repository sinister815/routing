import {Router} from 'express';
import { redirect } from '../controllers/redirect.controller.js';

const router = Router();
router.get('/go/:slug', redirect);
export default router;