import {Router} from 'express';
import {createOffer,getOffers,getOfferById,updateOffer,deleteOffer} from '../controllers/offer.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authenticate, createOffer);
router.get('/', authenticate, getOffers);
router.get('/:id', authenticate, getOfferById);
router.put('/:id', authenticate, updateOffer);
router.delete('/:id', authenticate, deleteOffer);

export default router;