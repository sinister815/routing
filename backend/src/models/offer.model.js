import { Schema, model } from 'mongoose';

const offerSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    advertiserName: {
      type: String,
      trim: true,
    },
    payout: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Offer = model('Offer', offerSchema);