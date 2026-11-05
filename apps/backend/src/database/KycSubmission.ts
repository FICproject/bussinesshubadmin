import mongoose, { Schema, Document } from 'mongoose';
import { KycDocumentItem, KycStatus } from '@fic/shared-types';

export interface IKycSubmission extends Document {
  memberId: mongoose.Types.ObjectId;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  status: KycStatus;
  documents: KycDocumentItem[];
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

