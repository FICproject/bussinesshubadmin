import mongoose, { Schema, Document } from 'mongoose';

export type InvestmentPoolStatus = 'OPEN' | 'FUNDED' | 'DISBURSED' | 'REPAID' | 'CLOSED';

export interface IPoolInvestor {
  memberId: mongoose.Types.ObjectId;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  investedAmount: number; // Principal invested by the user
  investedAt: Date;
  expectedInterest: number; // (investedAmount * annualYieldPercent * tenureMonths) / 1200
  totalMaturityAmount: number; // Principal + expectedInterest
  repaidAmount?: number;
  interestPaid?: number;
  payoutStatus: 'PENDING' | 'DISBURSED' | 'COMPLETED';
  payoutDate?: Date;
  transactionReference?: string;
}

export interface IInvestmentPool extends Document {
  poolCode: string; // e.g. "POOL-AGRI-101"
  title: string;
  description: string;
  industryCategory: string;

  // Target collection & terms
  targetAmount: number; // Total target amount to collect from users (e.g. ₹10,00,000)
  collectedAmount: number; // Sum of user investments so far
  minInvestmentPerUser: number; // e.g. ₹10,000
  maxInvestmentPerUser?: number; // e.g. ₹5,00,000

  investorAnnualYieldPercent: number; // What users/investors get (e.g. 10% annual return)
  tenureMonths: number; // e.g. 12 months

  status: InvestmentPoolStatus;

  // Linked Startup / Requester Proposal
  linkedProposalId?: mongoose.Types.ObjectId;
  borrowerName?: string;
  borrowerBusinessName?: string;
  borrowerInterestRateAnnual?: number; // What FIC charges the borrower (e.g. 14% annual)
  ficMarginPercent?: number; // Spread profit kept by platform (e.g. 4%)

  // Investors participation ledger
  investors: IPoolInvestor[];

  // Timeline & Repayment
  openedAt: Date;
  closedAt?: Date;
  disbursedToBorrowerAt?: Date;
  borrowerRepaymentReceivedAt?: Date;
  totalInvestorInterestPaid: number;
  totalInvestorPrincipalReturned: number;

  createdByAdminId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PoolInvestorSchema = new Schema<IPoolInvestor>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
    memberName: { type: String, required: true },
    memberEmail: { type: String, required: true, lowercase: true },
    memberPhone: { type: String },
    investedAmount: { type: Number, required: true },
    investedAt: { type: Date, default: Date.now },
    expectedInterest: { type: Number, required: true },
    totalMaturityAmount: { type: Number, required: true },
    repaidAmount: { type: Number, default: 0 },
    interestPaid: { type: Number, default: 0 },
    payoutStatus: {
      type: String,
      enum: ['PENDING', 'DISBURSED', 'COMPLETED'],
      default: 'PENDING',
    },
    payoutDate: { type: Date },
    transactionReference: { type: String },
  },
  { _id: true }
);

const InvestmentPoolSchema = new Schema<IInvestmentPool>(
  {
    poolCode: { type: String, required: true, unique: true, uppercase: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    industryCategory: { type: String, required: true },

    targetAmount: { type: Number, required: true },
    collectedAmount: { type: Number, default: 0 },
    minInvestmentPerUser: { type: Number, default: 10000 },
    maxInvestmentPerUser: { type: Number },

    investorAnnualYieldPercent: { type: Number, required: true, default: 10 },
    tenureMonths: { type: Number, required: true, default: 12 },

    status: {
      type: String,
      enum: ['OPEN', 'FUNDED', 'DISBURSED', 'REPAID', 'CLOSED'],
      default: 'OPEN',
    },

    linkedProposalId: { type: Schema.Types.ObjectId, ref: 'FundingApplication' },
    borrowerName: { type: String },
    borrowerBusinessName: { type: String },
    borrowerInterestRateAnnual: { type: Number, default: 14 },
    ficMarginPercent: { type: Number, default: 4 },

    investors: [PoolInvestorSchema],

    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    disbursedToBorrowerAt: { type: Date },
    borrowerRepaymentReceivedAt: { type: Date },
    totalInvestorInterestPaid: { type: Number, default: 0 },
    totalInvestorPrincipalReturned: { type: Number, default: 0 },

    createdByAdminId: { type: Schema.Types.ObjectId, ref: 'AdminUser' },
  },
  { timestamps: true }
);

export const InvestmentPoolModel = mongoose.model<IInvestmentPool>(
  'InvestmentPool',
  InvestmentPoolSchema
);

