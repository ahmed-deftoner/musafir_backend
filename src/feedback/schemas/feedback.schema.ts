import { Schema } from 'mongoose';

function transformValue(doc, ret: { [key: string]: any }) {
  delete ret.password;
  delete ret.__v;
  return ret;
}

export const FeedbackSchema = new Schema(
  {
    travellerType: { type: String, required: true },
    experience: { type: String, required: true },
    rating: { type: Number, required: true },
    likeAboutTrip: { type: String, required: false },
    improvements: { type: String, required: false },
    teamResponseRating: { type: Number, required: false },
    talkedTo: { type: String, required: false },
    enjoyableActivities: { type: String, required: false },
    leastEnjoyableActivities: { type: String, required: false },
    whistleblowing: { type: String, required: false },
    contactInfo: { type: String, required: false },
    registrationId: { type: Schema.Types.ObjectId, ref: 'Registration', required: true },
  },
  {
    toJSON: {
      virtuals: false,
      transform: transformValue,
    },
    versionKey: false,
    timestamps: true,
  },
);
