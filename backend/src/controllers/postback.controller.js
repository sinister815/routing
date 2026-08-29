// import { redisClient } from '../config/redis.js';
// import { Conversion } from '../models/conversion.model.js';
// import { Click } from '../models/click.model.js';

// export const handlePostback = async (req, res) => {
//   try {
//     const params = { ...req.query, ...req.body };
//     const clickId = params.click_id || params.clickId;
//     const rawPayout = params.payout ?? 0;
//     const token = params.token;
//     const status = params.status || 'approved';
//     const currency = (params.currency || 'USD').toUpperCase();
//     const networkName = params.network || params.networkName || 'generic';
//     const transactionId = params.txid || params.transaction_id || params.transactionId || '';

//     // 1. Security token verification if configured
//     if (process.env.POSTBACK_SECRET && token !== process.env.POSTBACK_SECRET) {
//       return res.status(401).json({ success: false, message: 'Unauthorized: invalid or missing security token' });
//     }

//     if (!clickId) {
//       return res.status(400).json({ success: false, message: 'Missing required click_id parameter' });
//     }

//     const payoutAmount = Number(rawPayout);
//     if (!Number.isFinite(payoutAmount) || payoutAmount < 0) {
//       return res.status(400).json({ success: false, message: 'Invalid payout amount' });
//     }

//     // 2. Fetch metadata saved during the redirect from Redis (Hot path)
//     let meta = null;
//     const metaRaw = await redisClient.get(`click:meta:${clickId}`);
//     if (metaRaw) {
//       try {
//         meta = JSON.parse(metaRaw);
//       } catch (e) {
//         meta = null;
//       }
//     }

//     // 3. Fallback: If expired in Redis, look up the original click in MongoDB (Cold path)
//     if (!meta) {
//       const clickDoc = await Click.findOne({ clickId }).lean();
//       if (clickDoc) {
//         meta = {
//           linkId: clickDoc.linkId,
//           campaignId: clickDoc.campaignId,
//           offerId: clickDoc.offerId,
//         };
//       }
//     }

//     if (!meta) {
//       return res.status(404).json({ success: false, message: 'Click expired or not found' });
//     }

//     // 4. Save conversion to MongoDB (idempotent via unique clickId index)
//     try {
//       const conversion = await Conversion.create({
//         clickId,
//         campaignId: meta.campaignId,
//         offerId: meta.offerId,
//         linkId: meta.linkId,
//         payout: payoutAmount,
//         currency,
//         status: ['approved', 'pending', 'rejected'].includes(status.toLowerCase()) ? status.toLowerCase() : 'approved',
//         networkName,
//         transactionId,
//         receivedAt: new Date(),
//       });

//       // 5. Update daily stats counters in Redis
//       if (meta.campaignId) {
//         const today = new Date().toISOString().split('T')[0];
//         await redisClient.incr(`counter:conversions:${meta.campaignId}:${today}`);
//         await redisClient.incrbyfloat(`counter:revenue:${meta.campaignId}:${today}`, payoutAmount);
//       }

//       return res.status(200).json({
//         success: true,
//         message: 'Conversion recorded successfully',
//         data: {
//           conversionId: conversion._id,
//           clickId,
//           campaignId: meta.campaignId,
//           payout: payoutAmount,
//           currency,
//         },
//       });
//     } catch (err) {
//       // MongoDB duplicate key error handles idempotency automatically
//       if (err.code === 11000) {
//         return res.status(200).json({
//           success: true,
//           message: 'Postback already processed (Idempotent)',
//           clickId,
//         });
//       }
//       throw err;
//     }
//   } catch (error) {
//     console.error('[Postback Error]:', error);
//     return res.status(500).json({ success: false, message: 'Internal server error processing postback' });
//   }
// };


import { redisClient } from '../config/redis.js';
import { Conversion } from '../models/conversion.model.js';
import { Click } from '../models/click.model.js';

// Get active postback secret token for the frontend simulator
export const getPostbackToken = async (req, res) => {
  try {
    const token = process.env.POSTBACK_SECRET || '';
    return res.status(200).json({
      success: true,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch postback token',
    });
  }
};

// Handle incoming S2S postback webhooks
export const handlePostback = async (req, res) => {
  try {
    const params = { ...req.query, ...req.body };
    const clickId = params.click_id || params.clickId;
    const rawPayout = params.payout ?? 0;
    const token = params.token;
    const status = params.status || 'approved';
    const currency = (params.currency || 'USD').toUpperCase();
    const networkName = params.network || params.networkName || 'generic';
    const transactionId = params.txid || params.transaction_id || params.transactionId || '';

    // 1. Security token verification if configured
    if (process.env.POSTBACK_SECRET && token !== process.env.POSTBACK_SECRET) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized: invalid or missing security token' 
      });
    }

    if (!clickId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required click_id parameter' 
      });
    }

    const payoutAmount = Number(rawPayout);
    if (!Number.isFinite(payoutAmount) || payoutAmount < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payout amount' 
      });
    }

    // 2. Fetch metadata saved during the redirect from Redis (Hot path)
    let meta = null;
    const metaRaw = await redisClient.get(`click:meta:${clickId}`);
    if (metaRaw) {
      try {
        meta = JSON.parse(metaRaw);
      } catch (e) {
        meta = null;
      }
    }

    // 3. Fallback: If expired in Redis, look up the original click in MongoDB (Cold path)
    if (!meta) {
      const clickDoc = await Click.findOne({ clickId }).lean();
      if (clickDoc) {
        meta = {
          linkId: clickDoc.linkId,
          campaignId: clickDoc.campaignId,
          offerId: clickDoc.offerId,
        };
      }
    }

    if (!meta) {
      return res.status(404).json({ 
        success: false, 
        message: 'Click expired or not found' 
      });
    }

    // 4. Save conversion to MongoDB (idempotent via unique clickId index)
    try {
      const conversion = await Conversion.create({
        clickId,
        campaignId: meta.campaignId,
        offerId: meta.offerId,
        linkId: meta.linkId,
        payout: payoutAmount,
        currency,
        status: ['approved', 'pending', 'rejected'].includes(status.toLowerCase()) ? status.toLowerCase() : 'approved',
        networkName,
        transactionId,
        receivedAt: new Date(),
      });

      // 5. Update daily stats counters in Redis
      if (meta.campaignId) {
        const today = new Date().toISOString().split('T')[0];
        await redisClient.incr(`counter:conversions:${meta.campaignId}:${today}`);
        await redisClient.incrbyfloat(`counter:revenue:${meta.campaignId}:${today}`, payoutAmount);
      }

      return res.status(200).json({
        success: true,
        message: 'Conversion recorded successfully',
        data: {
          conversionId: conversion._id,
          clickId,
          campaignId: meta.campaignId,
          payout: payoutAmount,
          currency,
        },
      });
    } catch (err) {
      // MongoDB duplicate key error handles idempotency automatically
      if (err.code === 11000) {
        return res.status(200).json({
          success: true,
          message: 'Postback already processed (Idempotent)',
          clickId,
        });
      }
      throw err;
    }
  } catch (error) {
    console.error('[Postback Error]:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error processing postback' 
    });
  }
};