import { Link } from '../models/link.model.js';
import { Campaign } from '../models/campaign.model.js';
import { redisClient } from '../config/redis.js';
import { syncLinkToRedis } from '../services/cacheSync.js';

export { syncLinkToRedis };

/**
 * Create a new Link
 * POST /api/links
 */
export const createLink = async (req, res) => {
  try {
    const { campaignId, slug, targets } = req.body;

    // 1. Validation
    if (!campaignId || !slug || !targets || !Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'campaignId, unique slug, and at least one target rule are required.',
      });
    }

    // 2. Ensure Campaign exists and belongs to user
    const campaign = await Campaign.findOne({ _id: campaignId, ownerId: req.user.id });
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found or unauthorized.' });
    }

    // 3. Create Link in MongoDB
    const link = await Link.create({
      campaignId,
      slug: slug.trim().toLowerCase(),
      targets,
    });

    // 4. Pre-resolve URLs and push flat JSON rules to Redis (Hot Path Preparation)
    await syncLinkToRedis(link._id);

    return res.status(201).json({ success: true, data: link });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Slug already exists. Pick a unique slug.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create link.', details: error.message });
  }
};

/**
 * Get all Links for a specific campaign or user
 * GET /api/links?campaignId=xxx
 */
export const getLinks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.campaignId) {
      filter.campaignId = req.query.campaignId;
    }

    const links = await Link.find(filter)
      .populate('campaignId', 'name status ownerId')
      .populate('targets.offerId', 'name url payout currency')
      .populate('targets.landerId', 'name url')
      .sort({ createdAt: -1 });

    // Filter out links that don't belong to the logged-in user
    const userLinks = links.filter(
      (link) => link.campaignId && link.campaignId.ownerId.toString() === req.user.id
    );

    return res.status(200).json({ success: true, count: userLinks.length, data: userLinks });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch links.', details: error.message });
  }
};

/**
 * Get single Link by ID
 * GET /api/links/:id
 */
export const getLinkById = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id)
      .populate('campaignId', 'name status ownerId')
      .populate('targets.offerId', 'name url payout currency')
      .populate('targets.landerId', 'name url');

    if (!link || link.campaignId?.ownerId.toString() !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Link not found or unauthorized.' });
    }

    return res.status(200).json({ success: true, data: link });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch link.', details: error.message });
  }
};

/**
 * Update an existing Link
 * PUT /api/links/:id
 */
export const updateLink = async (req, res) => {
  try {
    const { slug, targets } = req.body;

    // 1. Fetch current link to verify ownership and existing slug
    const existingLink = await Link.findById(req.params.id).populate('campaignId');
    if (!existingLink || existingLink.campaignId?.ownerId.toString() !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Link not found or unauthorized.' });
    }

    const oldSlug = existingLink.slug;
    const newSlug = slug ? slug.trim().toLowerCase() : oldSlug;

    // 2. Update Link document in MongoDB
    const updatedLink = await Link.findByIdAndUpdate(
      req.params.id,
      { $set: { slug: newSlug, ...(targets && { targets }) } },
      { new: true, runValidators: true }
    );

    // 3. If slug changed, purge old Redis key
    if (oldSlug !== newSlug) {
      await redisClient.del(`link:rules:${oldSlug}`);
    }

    // 4. Re-resolve URLs and re-populate hot cache in Redis
    await syncLinkToRedis(updatedLink._id);

    return res.status(200).json({ success: true, data: updatedLink });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update link.', details: error.message });
  }
};

/**
 * Delete a Link
 * DELETE /api/links/:id
 */
export const deleteLink = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id).populate('campaignId');

    if (!link || link.campaignId?.ownerId.toString() !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Link not found or unauthorized.' });
    }

    // 1. Delete from MongoDB
    await Link.findByIdAndDelete(req.params.id);

    // 2. Purge key from Redis cache
    await redisClient.del(`link:rules:${link.slug}`);

    return res.status(200).json({ success: true, message: 'Link deleted and cache purged.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete link.', details: error.message });
  }
};