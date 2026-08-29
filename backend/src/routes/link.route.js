import { Router } from 'express';
import { createLink, getLinks,getLinkById, updateLink, deleteLink } from '../controllers/link.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/',authenticate, createLink);
router.get('/', authenticate, getLinks);
router.get('/:slug', authenticate, getLinkById);
router.put('/:slug', authenticate, updateLink);
router.delete('/:slug', authenticate, deleteLink);

export default router;