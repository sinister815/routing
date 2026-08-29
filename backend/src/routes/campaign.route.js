import {Router} from 'express';
import { createCampaign,getCampaigns, getCampaignById, updateCampaign, deleteCampaign } from '../controllers/campaign.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', authenticate, createCampaign);
router.get('/', authenticate, getCampaigns);
router.get('/:id', authenticate, getCampaignById);
router.put('/:id', authenticate, updateCampaign);
router.delete('/:id', authenticate, deleteCampaign);

export default router;