import mongoose, { Schema, Document } from 'mongoose';
import { KycDocumentItem, KycStatus } from '@fic/shared-types';

export interface IKycSubmission extends Document {
  memberId: mongoose.Types.ObjectId;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  memberDob?: string;
  subCategory?: string;
  address?: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    state?: string;
    pinCode?: string;
    country?: string;
  };
  dynamicProfile?: Record<string, any>;
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  status: KycStatus;
  documents: Array<{
    docKey: string;
    title: string;
    fileUrl: string;
    fileName: string;
    documentNumber?: string;
    uploadedAt: string;
    status: string;
    rejectionReason?: string;
  }>;
  assignedTo?: mongoose.Types.ObjectId;
  reviewerNotes?: string;
  rejectionReason?: string;
  submittedAt: Date;
  verifiedAt?: Date;
}

const KycDocumentItemSchema = new Schema(
  {
    docKey: { type: String, required: true },
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    documentNumber: { type: String },
    uploadedAt: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    rejectionReason: { type: String },
  },
  { _id: false }
);

const KycSubmissionSchema = new Schema<IKycSubmission>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    memberName: { type: String, required: true },
    memberEmail: { type: String, required: true },
    memberPhone: { type: String },
    memberDob: { type: String },
    subCategory: { type: String },
    address: {
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      district: { type: String },
      state: { type: String },
      pinCode: { type: String },
      country: { type: String, default: 'India' }
    },
    dynamicProfile: { type: Schema.Types.Mixed },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, required: true },
    status: {
      type: String,
      enum: ['NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED'],
      default: 'SUBMITTED',
      required: true,
    },
    documents: [KycDocumentItemSchema],
    assignedTo: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    reviewerNotes: { type: String },
    rejectionReason: { type: String },
    submittedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

export const KycSubmissionModel = mongoose.model<IKycSubmission>('KycSubmission', KycSubmissionSchema);

