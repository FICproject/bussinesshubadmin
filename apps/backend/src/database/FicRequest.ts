import mongoose, { Schema, Document } from 'mongoose';
import { RequestStatus, RequestType } from '@fic/shared-types';

export interface IFicRequest extends Document {
  type: RequestType;
  title: string;
  description: string;
  requesterId: mongoose.Types.ObjectId;
  requesterName: string;
  requesterEmail: string;
  targetServiceId?: mongoose.Types.ObjectId;
  targetProviderId?: mongoose.Types.ObjectId;
  status: RequestStatus;
  assignedStaffId?: mongoose.Types.ObjectId;
  assignedStaffName?: string;
  providerNotifiedAt?: Date;
  providerResponse?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  providerResponseAt?: Date;
  scheduledMeetingId?: mongoose.Types.ObjectId;
  internalNotes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FicRequestSchema = new Schema<IFicRequest>(
  {
    type: {
      type: String,
      enum: ['SERVICE_INQUIRY', 'BUSINESS_DEVELOPMENT', 'INVESTMENT_INTEREST', 'PARTNERSHIP'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    requesterId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    requesterName: { type: String, required: true },
    requesterEmail: { type: String, required: true },
    targetServiceId: { type: Schema.Types.ObjectId, ref: 'ServiceListing' },
    targetProviderId: { type: Schema.Types.ObjectId, ref: 'Member' },
    status: {
      type: String,
      enum: ['NEW', 'UNDER_REVIEW', 'PROVIDER_CONTACTED', 'MEETING_SCHEDULED', 'COMPLETED', 'CANCELLED'],
      default: 'NEW',
      required: true,
    },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
    assignedStaffName: { type: String },
    providerNotifiedAt: { type: Date },
    providerResponse: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
      default: 'PENDING',
    },
    providerResponseAt: { type: Date },
    scheduledMeetingId: { type: Schema.Types.ObjectId, ref: 'Meeting' },
    internalNotes: [{ type: String }],
  },
  { timestamps: true }
);

export const FicRequestModel = mongoose.model<IFicRequest>('FicRequest', FicRequestSchema);

