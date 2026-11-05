import mongoose, { Schema, Document } from 'mongoose';
import { ServiceListingStatus } from '@fic/shared-types';

export interface IServiceListing extends Document {
  title: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  description: string;
  providerId: mongoose.Types.ObjectId;
  providerPrivateName: string;
  providerEmail: string;
  locationState?: string;
  pricingEstimate?: string;
  status: ServiceListingStatus;
  rejectionReason?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceListingSchema = new Schema<IServiceListing>(
  {
    title: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryName: { type: String, required: true },
    description: { type: String, required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    providerPrivateName: { type: String, required: true },
    providerEmail: { type: String, required: true },
    locationState: { type: String },
    pricingEstimate: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING_APPROVAL',
      required: true,
    },
    rejectionReason: { type: String },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

export const ServiceListingModel = mongoose.model<IServiceListing>('ServiceListing', ServiceListingSchema);

