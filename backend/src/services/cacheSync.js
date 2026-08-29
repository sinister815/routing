import { Link } from '../models/link.model.js';
import { redisClient } from '../config/redis.js';

/**
 * Resolves a Link document into flat routing rules suitable for fast in-memory Redis evaluation.
 */
export const resolveLinkRules = (link) => {
  if (!link) return null;

  const resolvedTargets = (link.targets || []).map((target) => ({
    targetId: target._id ? target._id.toString() : '',
    weight: typeof target.weight === 'number' ? target.weight : 100,
    geo: target.geo || [],
    device: target.device || [],
    offerId: target.offerId?._id ? target.offerId._id.toString() : (target.offerId?.toString() || null),
    offerUrl: target.offerId?.url || '',
    landerId: target.landerId?._id ? target.landerId._id.toString() : (target.landerId?.toString() || null),
    landerUrl: target.landerId?.url || null,
  }));

  return {
    linkId: link._id.toString(),
    campaignId: link.campaignId?._id ? link.campaignId._id.toString() : (link.campaignId?.toString() || ''),
    campaignStatus: link.campaignId?.status || 'active',
    slug: link.slug,
    targets: resolvedTargets,
  };
};

/**
 * Fetch and sync a single link's pre-resolved rules to Redis by linkId
 */
export const syncLinkToRedis = async (linkId) => {
  try {
    const link = await Link.findById(linkId)
      .populate('campaignId', 'status')
      .populate({
        path: 'targets.offerId',
        select: 'url name payout currency',
      })
      .populate({
        path: 'targets.landerId',
        select: 'url name',
      })
      .lean();

    if (!link) return null;

    const rules = resolveLinkRules(link);
    await redisClient.set(`link:rules:${rules.slug}`, JSON.stringify(rules));
    return rules;
  } catch (error) {
    console.error(`[CacheSync Error] Failed to sync link ${linkId}:`, error.message);
    return null;
  }
};

/**
 * Fetch and sync a single link's pre-resolved rules to Redis by slug (Cache-Aside Fallback)
 */
export const syncLinkBySlugToRedis = async (slug) => {
  try {
    const link = await Link.findOne({ slug: slug.trim().toLowerCase() })
      .populate('campaignId', 'status')
      .populate({
        path: 'targets.offerId',
        select: 'url name payout currency',
      })
      .populate({
        path: 'targets.landerId',
        select: 'url name',
      })
      .lean();

    if (!link) return null;

    const rules = resolveLinkRules(link);
    await redisClient.set(`link:rules:${rules.slug}`, JSON.stringify(rules));
    return rules;
  } catch (error) {
    console.error(`[CacheSync Error] Failed to sync link slug ${slug}:`, error.message);
    return null;
  }
};

/**
 * Invalidate/Re-sync all links associated with a Campaign
 */
export const syncCampaignLinksToRedis = async (campaignId) => {
  try {
    const links = await Link.find({ campaignId });
    await Promise.all(links.map((link) => syncLinkToRedis(link._id)));
  } catch (error) {
    console.error(`[CacheSync Error] Failed to sync campaign links ${campaignId}:`, error.message);
  }
};

/**
 * Invalidate/Re-sync all links associated with an Offer
 */
export const syncOfferLinksToRedis = async (offerId) => {
  try {
    const links = await Link.find({ 'targets.offerId': offerId });
    await Promise.all(links.map((link) => syncLinkToRedis(link._id)));
  } catch (error) {
    console.error(`[CacheSync Error] Failed to sync offer links ${offerId}:`, error.message);
  }
};

/**
 * Invalidate/Re-sync all links associated with a Lander
 */
export const syncLanderLinksToRedis = async (landerId) => {
  try {
    const links = await Link.find({ 'targets.landerId': landerId });
    await Promise.all(links.map((link) => syncLinkToRedis(link._id)));
  } catch (error) {
    console.error(`[CacheSync Error] Failed to sync lander links ${landerId}:`, error.message);
  }
};
