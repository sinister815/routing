import mongoose from 'mongoose';
import { Click } from '../models/click.model.js';
import { Conversion } from '../models/conversion.model.js';
import { Campaign } from '../models/campaign.model.js';
import { Link } from '../models/link.model.js';
import { Offer } from '../models/offer.model.js';
import { Lander } from '../models/lander.model.js';
import { redisClient } from '../config/redis.js';

const getOwnedCampaignIds = async (userId, campaignId = null) => {
  const filter = { ownerId: new mongoose.Types.ObjectId(userId) };

  if (campaignId) {
    filter._id = campaignId;
  }

  const campaigns = await Campaign.find(filter).select('_id status').lean();

  return campaigns;
};

/**
 * Get high-level overview metrics & KPIs for the authenticated user
 * GET /api/analytics/overview
 */
export const getOverviewStats = async (req, res) => {
  try {
    // Fetch user's campaigns
    const userCampaigns = await getOwnedCampaignIds(req.user.id);
    const campaignIds = userCampaigns.map((c) => c._id);

    if (campaignIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalClicks: 0,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          epc: 0,
          totalCampaigns: 0,
          activeCampaigns: 0,
          totalOffers: 0,
          totalLanders: 0,
          totalLinks: 0,
          todayClicks: 0,
          todayConversions: 0,
          todayRevenue: 0,
        },
      });
    }

    // Counts of entities
    const [totalOffers, totalLanders, totalLinks] = await Promise.all([
      Offer.countDocuments({ ownerId: userId }),
      Lander.countDocuments({ ownerId: userId }),
      Link.countDocuments({ campaignId: { $in: campaignIds } }),
    ]);

    // Aggregate lifetime Clicks
    const clickCountPromise = Click.countDocuments({ campaignId: { $in: campaignIds } });

    // Aggregate lifetime Conversions & Revenue
    const conversionAggPromise = Conversion.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      {
        $group: {
          _id: null,
          totalConversions: { $sum: 1 },
          totalRevenue: { $sum: '$payout' },
        },
      },
    ]);

    // Today's date in YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date(todayStr);

    const todayClicksPromise = Click.countDocuments({
      campaignId: { $in: campaignIds },
      timestamp: { $gte: todayStart },
    });

    const todayConvAggPromise = Conversion.aggregate([
      {
        $match: {
          campaignId: { $in: campaignIds },
          receivedAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          todayConversions: { $sum: 1 },
          todayRevenue: { $sum: '$payout' },
        },
      },
    ]);

    const [totalClicks, convStats, todayClicks, todayConvStats] = await Promise.all([
      clickCountPromise,
      conversionAggPromise,
      todayClicksPromise,
      todayConvAggPromise,
    ]);

    const totalConversions = convStats[0]?.totalConversions || 0;
    const totalRevenue = convStats[0]?.totalRevenue || 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const epc = totalClicks > 0 ? totalRevenue / totalClicks : 0;

    const todayConversions = todayConvStats[0]?.todayConversions || 0;
    const todayRevenue = todayConvStats[0]?.todayRevenue || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalClicks,
        totalConversions,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        epc: Number(epc.toFixed(4)),
        totalCampaigns: userCampaigns.length,
        activeCampaigns: userCampaigns.filter((c) => c.status === 'active').length,
        totalOffers,
        totalLanders,
        totalLinks,
        todayClicks,
        todayConversions,
        todayRevenue: Number(todayRevenue.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('[Analytics Error - Overview]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get time-series breakdown for charts (Clicks, Conversions, Revenue by date)
 * GET /api/analytics/timeseries?days=7
 */
export const getTimeSeriesAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days || '7', 10);
    const campaignId = req.query.campaignId || null;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const userCampaigns = await getOwnedCampaignIds(req.user.id, campaignId);
    const campaignIds = userCampaigns.map((c) => c._id);

    if (campaignIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Aggregate clicks per day
    const clicksPerDay = await Click.aggregate([
      {
        $match: {
          campaignId: { $in: campaignIds },
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          clicks: { $sum: 1 },
        },
      },
    ]);

    // Aggregate conversions and revenue per day
    const convsPerDay = await Conversion.aggregate([
      {
        $match: {
          campaignId: { $in: campaignIds },
          receivedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } },
          conversions: { $sum: 1 },
          revenue: { $sum: '$payout' },
        },
      },
    ]);

    // Build complete date map
    const dateMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dateMap[key] = {
        date: key,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ctr: 0,
      };
    }

    clicksPerDay.forEach((item) => {
      if (dateMap[item._id]) {
        dateMap[item._id].clicks = item.clicks;
      }
    });

    convsPerDay.forEach((item) => {
      if (dateMap[item._id]) {
        dateMap[item._id].conversions = item.conversions;
        dateMap[item._id].revenue = Number(item.revenue.toFixed(2));
      }
    });

    const series = Object.values(dateMap).map((d) => ({
      ...d,
      ctr: d.clicks > 0 ? Number(((d.conversions / d.clicks) * 100).toFixed(2)) : 0,
    }));

    return res.status(200).json({ success: true, data: series });
  } catch (error) {
    console.error('[Analytics Error - TimeSeries]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Breakdown analytics per campaign
 * GET /api/analytics/campaigns
 */
export const getCampaignPerformance = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ ownerId: req.user.id }).lean();

    if (campaigns.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const campaignIds = campaigns.map((c) => c._id);

    // Clicks per campaign
    const clicksAgg = await Click.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: '$campaignId', clicks: { $sum: 1 } } },
    ]);

    // Conversions and Revenue per campaign
    const convsAgg = await Conversion.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      {
        $group: {
          _id: '$campaignId',
          conversions: { $sum: 1 },
          revenue: { $sum: '$payout' },
        },
      },
    ]);

    // Link counts per campaign
    const linksAgg = await Link.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      { $group: { _id: '$campaignId', linkCount: { $sum: 1 } } },
    ]);

    const clickMap = new Map(clicksAgg.map((i) => [i._id.toString(), i.clicks]));
    const convMap = new Map(convsAgg.map((i) => [i._id.toString(), i]));
    const linkMap = new Map(linksAgg.map((i) => [i._id.toString(), i.linkCount]));

    const performance = campaigns.map((c) => {
      const cId = c._id.toString();
      const clicks = clickMap.get(cId) || 0;
      const convData = convMap.get(cId) || { conversions: 0, revenue: 0 };
      const conversions = convData.conversions || 0;
      const revenue = convData.revenue || 0;
      const linkCount = linkMap.get(cId) || 0;
      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const epc = clicks > 0 ? revenue / clicks : 0;

      return {
        campaignId: cId,
        name: c.name,
        status: c.status,
        createdAt: c.createdAt,
        linkCount,
        clicks,
        conversions,
        revenue: Number(revenue.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        epc: Number(epc.toFixed(4)),
      };
    });

    return res.status(200).json({ success: true, data: performance });
  } catch (error) {
    console.error('[Analytics Error - Campaigns]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Breakdown analytics by Country/Geo
 * GET /api/analytics/geo
 */
export const getGeoAnalytics = async (req, res) => {
  try {
    const campaignId = req.query.campaignId || null;
    const campaigns = await getOwnedCampaignIds(req.user.id, campaignId);
    const campaignIds = campaigns.map((c) => c._id);

    if (campaignIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const clicksByGeo = await Click.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      {
        $group: {
          _id: '$country',
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
      { $limit: 20 },
    ]);

    const formatted = clicksByGeo.map((item) => ({
      country: item._id || 'UNKNOWN',
      clicks: item.clicks,
    }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('[Analytics Error - Geo]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Breakdown analytics by Device
 * GET /api/analytics/device
 */
export const getDeviceAnalytics = async (req, res) => {
  try {
    const campaignId = req.query.campaignId || null;
    const campaigns = await getOwnedCampaignIds(req.user.id, campaignId);
    const campaignIds = campaigns.map((c) => c._id);

    if (campaignIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const clicksByDevice = await Click.aggregate([
      { $match: { campaignId: { $in: campaignIds } } },
      {
        $group: {
          _id: '$device',
          clicks: { $sum: 1 },
        },
      },
      { $sort: { clicks: -1 } },
    ]);

    const formatted = clicksByDevice.map((item) => ({
      device: item._id || 'desktop',
      clicks: item.clicks,
    }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('[Analytics Error - Device]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get recent live click logs
 * GET /api/analytics/clicks?limit=50
 */
export const getRecentClicks = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const campaignId = req.query.campaignId || null;

    const campaigns = await getOwnedCampaignIds(req.user.id, campaignId);
    const campaignIds = campaigns.map((c) => c._id);

    if (campaignIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const clicks = await Click.find({ campaignId: { $in: campaignIds } })
      .populate('campaignId', 'name')
      .populate('linkId', 'slug')
      .populate('offerId', 'name')
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, data: clicks });
  } catch (error) {
    console.error('[Analytics Error - Recent Clicks]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get recent conversions logs
 * GET /api/analytics/conversions?limit=50
 */
export const getRecentConversions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const campaignId = req.query.campaignId || null;

    const campaigns = await getOwnedCampaignIds(req.user.id, campaignId);
    const campaignIds = campaigns.map((c) => c._id);

    if (campaignIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const conversions = await Conversion.find({ campaignId: { $in: campaignIds } })
      .populate('campaignId', 'name')
      .populate('offerId', 'name')
      .populate('linkId', 'slug')
      .sort({ receivedAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ success: true, data: conversions });
  } catch (error) {
    console.error('[Analytics Error - Recent Conversions]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
