import mongoose, { Schema, Document } from 'mongoose';
import { KycStatus, MemberStatus } from '@fic/shared-types';

export interface IMember extends Document {
  name: string;
  email: string;
  phone: string;
  primaryCategory: mongoose.Types.ObjectId;
  primaryCategoryName: string;
  subcategories: string[];
  status: MemberStatus;
  membershipPlan: 'FIRST_YEAR_INTRO' | 'STANDARD_ANNUAL';
  membershipFeePaid: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  kycStatus: KycStatus;
  registeredAt: Date;
  membershipExpiresAt?: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    primaryCategory: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    primaryCategoryName: { type: String, required: true },
    subcategories: [{ type: String }],
    status: {
      type: String,
      enum: ['PENDING_REGISTRATION', 'PENDING_PAYMENT', 'PENDING_KYC', 'UNDER_REVIEW', 'ACTIVE', 'SUSPENDED', 'BLOCKED'],
      default: 'PENDING_KYC',
    },
    membershipPlan: { type: String, enum: ['FIRST_YEAR_INTRO', 'STANDARD_ANNUAL'], default: 'FIRST_YEAR_INTRO' },
    membershipFeePaid: { type: Number, default: 99 },
    paymentStatus: { type: String, enum: ['PAID', 'PENDING', 'FAILED'], default: 'PAID' },
    kycStatus: {
      type: String,
      enum: ['NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED'],
      default: 'SUBMITTED',
    },
    registeredAt: { type: Date, default: Date.now },
    membershipExpiresAt: { type: Date },
  },
  { timestamps: true }
);

export const MemberModel = mongoose.model<IMember>('Member', MemberSchema);

