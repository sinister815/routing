import { Router } from 'express';
import { createLink, getLinks,getLinkById, updateLink, deleteLink } from '../controllers/link.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/',authenticate, createLink);
router.get('/', authenticate, getLinks);
router.get('/:id', authenticate, getLinkById);
router.put('/:id', authenticate, updateLink);
router.delete('/:id', authenticate, deleteLink);

export default router;
