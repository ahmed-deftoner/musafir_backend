import { Schema } from 'mongoose';
import * as validator from 'validator';
import * as bcrypt from 'bcrypt';

function transformValue(doc, ret: { [key: string]: any }) {
  delete ret.password;
  delete ret.__v;
  return ret;
}

interface VerificationSchema {
  VerificationID?: string;
  EncodedVideo?: string;
  ReferralIDs?: string[];
  Status?: string;
  VideoLink?: string;
  videoStorageKey?: string;
  VerificationDate?: Date;
  VerificationRequestDate?: Date;
  RequestCall: boolean;
}

const VerificationSchema = new Schema<VerificationSchema>({
  VerificationID: { type: String, required: false },
  EncodedVideo: { type: String, required: false },
  ReferralIDs: [{ type: String, required: false }],
  Status: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified',
  },
  RequestCall: { type: Boolean, required: false },
  VideoLink: { type: String, required: false },
  videoStorageKey: { type: String, required: false },
  VerificationDate: { type: Date, required: false },
  VerificationRequestDate: { type: Date, required: false },
});

export const UserSchema = new Schema(
  {
    fullName: { type: String, required: false },

    profileImg: { type: String, required: false },

    email: {
      type: String,
      lowercase: true,
      validate: validator.isEmail,
      required: true,
    },

    password: { type: String, required: false },

    googleId: { type: String, required: false },

    phone: { type: String, required: false },

    referralID: { type: String, required: true },

    gender: {
      type: String,
      required: false,
      enum: ['male', 'female', 'other'],
    },

    cnic: { type: String, required: false },

    university: { type: String, required: false },

    socialLink: { type: String, required: false },

    dateOfBirth: { type: String, required: false },

    working: { type: Boolean, required: false },

    city: { type: String, required: false },

    heardFrom: { type: String, required: false },

    roles: { type: [String], default: ['musafir'] },

    emailVerified: { type: Boolean, required: false, default: false },

    verification: { type: Object, required: false, default: {} },
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

UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }
    if (!this.password) {
      return next(new Error('Password not set'));
    }
    if (!this.password || typeof this.password !== 'string') {
      throw new Error('Invalid or missing password');
    }
    const hashed = await bcrypt.hash(this['password'], 10);
    this['password'] = hashed;
    return next();
  } catch (err) {
    return next(err);
  }
});
