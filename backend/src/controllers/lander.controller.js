import { Lander } from '../models/lander.model.js';
import { syncLanderLinksToRedis } from '../services/cacheSync.js';

/**
 * Create a new Lander
 * POST /api/landers
 */
export const createLander = async (req, res) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({ success: false, error: 'Name and landing page URL are required.' });
    }

    const lander = await Lander.create({
      ownerId: req.user.id,
      name,
      url,
    });

    return res.status(201).json({ success: true, data: lander });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to create lander.',
      details: error.message,
    });
  }
};

/**
 * Get all Landers for the authenticated user
 * GET /api/landers
 */
export const getLanders = async (req, res) => {
  try {
    const landers = await Lander.find({ ownerId: req.user.id }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: landers.length, data: landers });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch landers.', details: error.message });
  }
};

/**
 * Get a single Lander by ID
 * GET /api/landers/:id
 */
export const getLanderById = async (req, res) => {
  try {
    const lander = await Lander.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!lander) {
      return res.status(404).json({ success: false, error: 'Lander not found.' });
    }

    return res.status(200).json({ success: true, data: lander });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch lander.', details: error.message });
  }
};

/**
 * Update an existing Lander
 * PUT /api/landers/:id
 */
export const updateLander = async (req, res) => {
  try {
    const { name, url } = req.body;

    const lander = await Lander.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      { $set: { ...(name && { name }), ...(url && { url }) } },
      { new: true, runValidators: true }
    );

    if (!lander) {
      return res.status(404).json({ success: false, error: 'Lander not found or unauthorized.' });
    }

    // Re-sync all link rules in Redis referencing this lander
    await syncLanderLinksToRedis(lander._id);

    return res.status(200).json({ success: true, data: lander });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update lander.', details: error.message });
  }
};

/**
 * Delete a Lander
 * DELETE /api/landers/:id
 */
export const deleteLander = async (req, res) => {
  try {
    const lander = await Lander.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.id,
    });

    if (!lander) {
      return res.status(404).json({ success: false, error: 'Lander not found or unauthorized.' });
    }

    // Re-sync links that had this lander
    await syncLanderLinksToRedis(req.params.id);

    return res.status(200).json({ success: true, message: 'Lander deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete lander.', details: error.message });
  }
};