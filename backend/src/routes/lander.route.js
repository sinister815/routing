import {Router} from 'express';
import { createLander, getLanders, getLanderById, updateLander, deleteLander } from '../controllers/lander.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/',authenticate, createLander);
router.get('/', authenticate, getLanders);
router.get('/:id', authenticate, getLanderById);
router.put('/:id', authenticate, updateLander);
router.delete('/:id', authenticate, deleteLander);

export default router;