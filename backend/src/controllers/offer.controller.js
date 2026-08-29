import { Offer } from '../models/offer.model.js';
import { syncOfferLinksToRedis } from '../services/cacheSync.js';

/**
 * Create a new Offer
 * POST /api/offers
 */
export const createOffer = async (req, res) => {
  try {
    const { name, url, advertiserName, payout, currency } = req.body;

    if (!name || !url) {
      return res.status(400).json({ success: false, error: 'Name and destination URL are required.' });
    }

    const offer = await Offer.create({
      ownerId: req.user.id,
      name,
      url,
      advertiserName: advertiserName || '',
      payout: Number(payout) || 0,
      currency: currency || 'USD',
    });

    return res.status(201).json({ success: true, data: offer });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to create offer.',
      details: error.message,
    });
  }
};

/**
 * Get all Offers for the authenticated user
 * GET /api/offers
 */
export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ ownerId: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: offers.length, data: offers });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch offers.', details: error.message });
  }
};

/**
 * Get a single Offer by ID
 * GET /api/offers/:id
 */
export const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found.' });
    }

    return res.status(200).json({ success: true, data: offer });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch offer.', details: error.message });
  }
};

/**
 * Update an existing Offer
 * PUT /api/offers/:id
 */
export const updateOffer = async (req, res) => {
  try {
    const { name, url, advertiserName, payout, currency } = req.body;

    const offer = await Offer.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      {
        $set: {
          ...(name && { name }),
          ...(url && { url }),
          ...(advertiserName !== undefined && { advertiserName }),
          ...(payout !== undefined && { payout: Number(payout) }),
          ...(currency && { currency }),
        },
      },
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found or unauthorized.' });
    }

    // Re-sync all link rules in Redis referencing this offer
    await syncOfferLinksToRedis(offer._id);

    return res.status(200).json({ success: true, data: offer });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update offer.', details: error.message });
  }
};

/**
 * Delete an Offer
 * DELETE /api/offers/:id
 */
export const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!offer) {
      return res.status(404).json({ success: false, error: 'Offer not found or unauthorized.' });
    }

    // Re-sync links that had this offer
    await syncOfferLinksToRedis(req.params.id);

    return res.status(200).json({ success: true, message: 'Offer deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete offer.', details: error.message });
  }
};