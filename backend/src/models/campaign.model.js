    import { Schema, model } from 'mongoose';

const campaignSchema = new Schema(
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
    status: {
      type: String,
      enum: ['active', 'paused', 'archived'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

export const Campaign = model('Campaign', campaignSchema);