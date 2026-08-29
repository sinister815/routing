import mongoose from 'mongoose';

const clickSchema = new mongoose.Schema(
  {
    // Unique tracking identifier generated per click
    clickId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Relational references
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Target',
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
      index: true,
    },
    // Visitor & Geo details
    ip: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      default: 'UNKNOWN',
      uppercase: true,
      trim: true,
      index: true,
    },
    device: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'desktop',
      index: true,
    },
    ua: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We use explicit 'timestamp' to match the queued Redis payload
  }
);

// Compound Index 1: Fast filtering for campaign analytics by date
clickSchema.index({ campaignId: 1, timestamp: -1 });

// Compound Index 2: Fast GEO & Device breakdown reports per campaign
clickSchema.index({ campaignId: 1, country: 1, device: 1 });

// Optional TTL Index: Automatically purge click logs older than 90 days to control disk usage
// Remove or modify expireAfterSeconds based on your data retention policy
clickSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export const Click = mongoose.models.Click || mongoose.model('Click', clickSchema);