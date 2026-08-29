import express from 'express';
import maxmind from 'maxmind';
import { UAParser } from 'ua-parser-js';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { fileURLToPath } from 'url';
import { redisClient } from '../config/redis.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let geoLookup = null;

(async () => {
  try {
    const possiblePaths = [
      path.resolve(__dirname, '../../data/GeoLite2-Country.mmdb'),
      path.resolve(process.cwd(), 'data/GeoLite2-Country.mmdb'),
      path.resolve(process.cwd(), 'backend/data/GeoLite2-Country.mmdb'),
    ];
    const dbPath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0];
    geoLookup = await maxmind.open(dbPath);
    console.log('[GeoLite2] Binary database loaded into memory successfully.');
  } catch (err) {
    console.error('[GeoLite2] Failed to load binary database:', err.message);
  }
})();


const normalizeIp = (rawIp = '') => {
  let ip = String(rawIp).trim();

  if (!ip) return '';
  if (ip.startsWith('::ffff:')) {
    ip = ip.slice(7);
  }
  if (ip.startsWith('[') && ip.includes(']')) {
    ip = ip.slice(1, ip.indexOf(']'));
  }
  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.split(':')[0];
  }

  return net.isIP(ip) ? ip : '';
};

const isPrivateIp = (ip) => {
  if (!ip) return true;

  if (net.isIP(ip) === 4) {
    return (
      ip.startsWith('10.') ||
      ip.startsWith('127.') ||
      ip.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
    );
  }

  if (net.isIP(ip) === 6) {
    return ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:');
  }

  return true;
};

const getClientIp = (req) => {
  const candidates = [
    req.headers['cf-connecting-ip'],
    req.headers['x-real-ip'],
    ...(req.headers['x-forwarded-for']
      ? String(req.headers['x-forwarded-for']).split(',')
      : []),
    req.socket?.remoteAddress,
    req.ip,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeIp(candidate);
    if (normalized && !isPrivateIp(normalized)) {
      return normalized;
    }
  }

  for (const candidate of candidates) {
    const normalized = normalizeIp(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return '';
};

const getDeviceType = (userAgentString) => {
  if (!userAgentString) return 'desktop';
  const parser = new UAParser(userAgentString);
  const device = parser.getDevice();
  
  if (device.type === 'mobile') return 'mobile';
  if (device.type === 'tablet') return 'tablet';
  return 'desktop';
};

/** Get ISO 2-letter country code from in-memory MMDB lookup */
const getCountryCode = (ip) => {
  if (!geoLookup || !ip) return 'UNKNOWN';
  try {
    const result = geoLookup.get(ip);
    return result?.country?.iso_code || 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
};


const selectTarget = (targets, country, device) => {
  if (!targets || targets.length === 0) return null;

  // Step 1: Filter targets by Geo & Device constraints
  const matchedTargets = targets.filter((target) => {
    const geoMatch = !target.geo?.length || target.geo.includes(country);
    const deviceMatch = !target.device?.length || target.device.includes(device);
    return geoMatch && deviceMatch;
  });

  // Fallback to all targets if no specific target satisfies filters
  const pool = matchedTargets.length > 0 ? matchedTargets : targets;

  // Step 2: Cumulative Weighted Random Selection
  const totalWeight = pool.reduce((sum, t) => sum + (t.weight || 0), 0);
  if (totalWeight <= 0) return pool[0];

  let randomNum = Math.random() * totalWeight;
  for (const target of pool) {
    randomNum -= target.weight || 0;
    if (randomNum <= 0) {
      return target;
    }
  }

  return pool[0];
};


import { syncLinkBySlugToRedis } from '../services/cacheSync.js';

export async function redirect(req, res) {
  try {
    const { slug } = req.params;
    const cleanSlug = (slug || '').trim().toLowerCase();

    // 1. Fetch pre-resolved rules from Redis cache (In-memory hot path)
    let rules = null;
    const rawRules = await redisClient.get(`link:rules:${cleanSlug}`);

    if (rawRules) {
      rules = JSON.parse(rawRules);
    } else {
      // Cache-Aside Fallback: If Redis missed (e.g. after Redis restart), load from DB & re-populate Redis
      rules = await syncLinkBySlugToRedis(cleanSlug);
    }

    if (!rules) {
      return res.status(404).send('Link not found or inactive.');
    }

    if (rules.campaignStatus !== 'active') {
      return res.status(404).send('Campaign is currently paused.');
    }

    // 2. Fast synchronous parsing (Memory-only)
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const device = getDeviceType(userAgent);
    const country = getCountryCode(ip);

    // 3. Match Target
    const selectedTarget = selectTarget(rules.targets, country, device);
    if (!selectedTarget) {
      return res.status(404).send('No active routing destination available.');
    }

    // 4. Generate Click ID & metadata
    const clickId = nanoid(16);
    const destinationUrl = selectedTarget.landerUrl || selectedTarget.offerUrl;
    if (!destinationUrl) {
      return res.status(404).send('No valid routing destination available.');
    }

    const today = new Date().toISOString().split('T')[0];

    // 5. Fire-and-Forget: Push metadata to Redis (Zero await on MongoDB)
    const clickEvent = {
      clickId,
      linkId: rules.linkId,
      campaignId: rules.campaignId,
      targetId: selectedTarget.targetId,
      offerId: selectedTarget.offerId,
      ip,
      country,
      device,
      ua: userAgent,
      timestamp: new Date().toISOString(),
    };

    // LPUSH click to batch queue
    redisClient.lpush('clicks:queue', JSON.stringify(clickEvent));

    // Cache metadata for fast S2S postback attribution (30-day TTL)
    redisClient.setex(
      `click:meta:${clickId}`,
      86400 * 30,
      JSON.stringify({
        linkId: rules.linkId,
        campaignId: rules.campaignId,
        offerId: selectedTarget.offerId,
      })
    );

    // Increment today's live click counter for this campaign
    if (rules.campaignId) {
      redisClient.incr(`counter:clicks:${rules.campaignId}:${today}`);
    }

    const separator = destinationUrl.includes('?') ? '&' : '?';
    const redirectUrl = `${destinationUrl}${separator}click_id=${clickId}`;

    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('[Redirect Engine Error]:', error);
    return res.status(500).send('Internal routing error.');
  }
}


