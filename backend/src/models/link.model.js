import { Schema, model } from 'mongoose';

const targetSchema = new Schema(
  {
    offerId: {
      
      default: null,
      type: Schema.Types.ObjectId,
      ref: 'Offer',
      required: true,
    },
    landerId: {
      type: Schema.Types.ObjectId,
      ref: 'Lander',
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 100,
    },
    // Upper-case ISO 2-letter country codes (e.g. ["US", "IN"])
    geo: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],
    // Lower-case device categories (e.g. ["mobile", "desktop", "tablet"])
    device: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],
  },
  { _id: true }
);

const linkSchema = new Schema(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true, // Critical for fast cache-miss DB fallbacks
    },
    targets: {
      type: [targetSchema],
      validate: [
        (val) => val.length > 0,
        'At least one target rule is required for a link.',
      ],
    },
  },
  { timestamps: true }
);

export const Link = model('Link', linkSchema);