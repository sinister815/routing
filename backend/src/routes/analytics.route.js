import { Router } from 'express';
import {
  getOverviewStats,
  getTimeSeriesAnalytics,
  getCampaignPerformance,
  getGeoAnalytics,
  getDeviceAnalytics,
  getRecentClicks,
  getRecentConversions,
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/overview', authenticate, getOverviewStats);
router.get('/timeseries', authenticate, getTimeSeriesAnalytics);
router.get('/campaigns', authenticate, getCampaignPerformance);
router.get('/geo', authenticate, getGeoAnalytics);
router.get('/device', authenticate, getDeviceAnalytics);
router.get('/clicks', authenticate, getRecentClicks);
router.get('/conversions', authenticate, getRecentConversions);

export default router;
