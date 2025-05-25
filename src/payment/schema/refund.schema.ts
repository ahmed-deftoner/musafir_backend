import { Schema } from 'mongoose';
import { Document, Types } from 'mongoose';

export interface Refund extends Document {
  registration: Types.ObjectId;
  bankDetails: string;
  reason: string;
  feedback: string;
  rating: number;
  status: 'pending' | 'cleared' | 'rejected';
}

export const RefundSchema = new Schema<Refund>(
  {
    registration: {
      type: Schema.Types.ObjectId,
      ref: 'Registration',
      required: true,
    },
    bankDetails: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'cleared', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
