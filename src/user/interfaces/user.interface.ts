import { Document } from 'mongoose';

interface VerificationSubSchema {
  verificationID?: string;
  encodedVideo?: string;
  referralIDs?: string[];
  status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  videoLink?: string;
  videoStorageKey?: string;
  verificationDate?: Date;
  VerificationRequestDate?: Date;
  RequestCall: boolean;
}

export interface User extends Document {
  _id: string;
  fullName: string;
  email?: string;
  password?: string;
  googleId?: string;
  phone: string;
  referralID?: string;
  gender: 'male' | 'female' | 'other';
  cnic?: string;
  university?: string;
  socialLink?: string;
  dateOfBirth?: string;
  working?: boolean;
  city?: string;
  heardFrom?: string;
  roles: [string];
  emailVerified: boolean;
  verification?: VerificationSubSchema;
}
