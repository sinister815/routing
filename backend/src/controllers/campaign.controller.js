import { Campaign } from '../models/campaign.model.js';
import { Link } from '../models/link.model.js';
import { redisClient } from '../config/redis.js';
import { syncCampaignLinksToRedis } from '../services/cacheSync.js';

/**
 * Create a new Campaign
 * POST /api/campaigns
 */
export const createCampaign = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Campaign name is required.' });
    }

    const campaign = await Campaign.create({
      ownerId: req.user.id,
      name,
      status: status || 'active',
    });

    return res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to create campaign.',
      details: error.message,
    });
  }
};

/**
 * Get all Campaigns for the authenticated user
 * GET /api/campaigns
 */
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ ownerId: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch campaigns.', details: error.message });
  }
};

/**
 * Get a single Campaign by ID (with associated Links)
 * GET /api/campaigns/:id
 */
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found.' });
    }

    // Fetch associated links for this campaign overview
    const links = await Link.find({ campaignId: campaign._id })
      .populate('targets.offerId', 'name url')
      .populate('targets.landerId', 'name url');

    return res.status(200).json({
      success: true,
      data: {
        ...campaign.toObject(),
        links,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch campaign.', details: error.message });
  }
};

/**
 * Update an existing Campaign
 * PUT /api/campaigns/:id
 */
export const updateCampaign = async (req, res) => {
  try {
    const { name, status } = req.body;

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      { $set: { ...(name && { name }), ...(status && { status }) } },
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found or unauthorized.' });
    }

    // Immediately re-sync all links under this campaign to Redis cache
    await syncCampaignLinksToRedis(campaign._id);

    return res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update campaign.', details: error.message });
  }
};

/**
 * Delete a Campaign
 * DELETE /api/campaigns/:id
 */
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found or unauthorized.' });
    }

    // Clean up associated links and remove their Redis hot-cache keys
    const links = await Link.find({ campaignId: req.params.id }).select('slug').lean();
    const redisKeys = links.map((link) => `link:rules:${link.slug}`);
    if (redisKeys.length > 0) {
      await redisClient.del(...redisKeys);
    }
    await Link.deleteMany({ campaignId: req.params.id });

    return res.status(200).json({ success: true, message: 'Campaign and associated links deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete campaign.', details: error.message });
  }
};
