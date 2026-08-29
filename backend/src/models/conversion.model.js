import mongoose from 'mongoose';

const conversionSchema = new mongoose.Schema(
  {
    // The unique click identifier passed during the original redirect
    clickId: {
      type: String,
      required: true,
      unique: true, // Guarantees idempotency (prevents duplicate postback processing)
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
      index: true,
    },
    linkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      index: true,
    },
    // Financial details
    payout: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    // Status tracking (e.g., approved, pending, rejected)
    status: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved',
      index: true,
    },
    // Optional affiliate network metadata
    networkName: {
      type: String,
      trim: true,
      default: 'generic',
    },
    transactionId: {
      type: String, // External transaction ID sent by the affiliate network
      trim: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt
  }
);

// Compound index for fast time-series aggregation reports (e.g., Campaign Revenue per day)
conversionSchema.index({ campaignId: 1, createdAt: -1 });

export const Conversion = mongoose.model('Conversion', conversionSchema);