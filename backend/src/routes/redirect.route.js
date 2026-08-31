import {Router} from 'express';
import { redirect, getClientIp, getCountryCode, isGeoLookupLoaded } from '../controllers/redirect.controller.js';

const router = Router();
router.get('/go/:slug', redirect);

router.get('/debug/geoip', (req, res) => {
  const ip = getClientIp(req);
  const country = getCountryCode(ip);
  res.json({
    ip,
    country,
    geoLookupLoaded: isGeoLookupLoaded(),
    headers: {
      'x-forwarded-for': req.headers['x-forwarded-for'] || null,
      'x-real-ip': req.headers['x-real-ip'] || null,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;