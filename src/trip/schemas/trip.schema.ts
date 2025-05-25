import { Schema } from 'mongoose';

export const FlagshipSchema = new Schema(
  {
    // userId: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'User',
    //   required: true,
    // },
    destination: {
      type: String,
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    seats: {
      type: Number,
      required: true,
    },
    status: { type: String, required: false, enum: ['live', 'completed'] },
    flagshipName: {
      type: String,
      required: true,
    },
    startingDate: {
      type: Date,
      requierd: true,
    },
    endingDate: {
      type: Date,
      requierd: true,
    },
    packages: { type: [Object], required: false },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);
