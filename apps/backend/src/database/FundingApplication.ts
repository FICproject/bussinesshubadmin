import mongoose, { Schema, Document } from 'mongoose';

export type FundingStage =
  | 'USER_REQUEST'   // Step 1: Initial business proposal submitted
  | 'REVIEW'         // Step 2: Under diligence & pitch meeting scheduled/conducted
  | 'FUNDED'         // Step 3: Approved & principal disbursed
  | 'REPAID'         // Step 4: Fully settled with interest
  | 'REJECTED';      // Declined

export interface IFundingApplication extends Document {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  businessName: string;
  industryCategory: string;
  businessPitch: string;
  pitchDeckUrl?: string;

  // Financial terms
  requestedAmount: number; // Principal requested by applicant
  approvedPrincipal?: number; // Actual principal funded by FIC
  interestRateAnnual: number; // Superadmin interest rate % per year (e.g., 12%)
  tenureMonths: number; // e.g. 12 months
  expectedTotalInterest?: number; // Calculated interest yield
  repaidAmount: number; // Amount collected so far
  accruedInterestCollected: number; // Portion of interest realized

  // Workflow stage
  stage: FundingStage;

  // Meeting & Diligence details
  meetingScheduledAt?: Date;
  meetingLink?: string;
  diligenceNotes?: string;

  // Funding disbursement metadata
  disbursementDate?: Date;
  disbursementReference?: string;

  // Audit
  reviewedBy?: string;
  decisionDate?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FundingApplicationSchema = new Schema<IFundingApplication>(
  {
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true, lowercase: true },
    applicantPhone: { type: String, required: true },
    businessName: { type: String, required: true },
    industryCategory: { type: String, required: true },
    businessPitch: { type: String, required: true },
    pitchDeckUrl: { type: String },

    requestedAmount: { type: Number, required: true },
    approvedPrincipal: { type: Number },
    interestRateAnnual: { type: Number, default: 12 }, // 12% annual interest default
    tenureMonths: { type: Number, default: 12 },
    expectedTotalInterest: { type: Number },
    repaidAmount: { type: Number, default: 0 },
    accruedInterestCollected: { type: Number, default: 0 },

    stage: {
      type: String,
      enum: ['USER_REQUEST', 'REVIEW', 'FUNDED', 'REPAID', 'REJECTED'],
      default: 'USER_REQUEST',
    },

    meetingScheduledAt: { type: Date },
    meetingLink: { type: String },
    diligenceNotes: { type: String },

    disbursementDate: { type: Date },
    disbursementReference: { type: String },

    reviewedBy: { type: String },
    decisionDate: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

// Calculate expected interest helper before save
FundingApplicationSchema.pre('save', function (next) {
  const principal = this.approvedPrincipal || this.requestedAmount;
  if (principal && this.interestRateAnnual && this.tenureMonths) {
    // Simple Interest Formula: (P * R * T) / 100 where T is in years (tenureMonths / 12)
    const years = this.tenureMonths / 12;
    this.expectedTotalInterest = Math.round((principal * this.interestRateAnnual * years) / 100);
  }
  next();
});

export const FundingApplicationModel = mongoose.model<IFundingApplication>(
  'FundingApplication',
  FundingApplicationSchema
);

