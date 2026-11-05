import mongoose, { Schema, Document } from 'mongoose';
import { MeetingStatus } from '@fic/shared-types';

export interface IMeetingParticipantInfo {
  name: string;
  email: string;
  phone?: string;
  roleOrCompany?: string;
}

export interface IMeeting extends Document {
  title: string;
  description?: string;
  hostAdminId: mongoose.Types.ObjectId;
  participantMemberIds: mongoose.Types.ObjectId[];
  externalParticipants?: IMeetingParticipantInfo[];
  meetingType?: 'MEMBER_CALL' | 'FUNDING_PITCH' | 'CONSULTATION';
  relatedFundingApplicationId?: mongoose.Types.ObjectId;
  scheduledAt: Date;
  durationMinutes: number;
  meetingLink?: string;
  status: MeetingStatus;
  notificationSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    hostAdminId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true },
    participantMemberIds: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
    externalParticipants: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        roleOrCompany: { type: String },
      },
    ],
    meetingType: {
      type: String,
      enum: ['MEMBER_CALL', 'FUNDING_PITCH', 'CONSULTATION'],
      default: 'MEMBER_CALL',
    },
    relatedFundingApplicationId: { type: Schema.Types.ObjectId, ref: 'FundingApplication' },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30 },
    meetingLink: { type: String, trim: true },
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      required: true,
    },
    notificationSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MeetingModel = mongoose.model<IMeeting>('Meeting', MeetingSchema);

