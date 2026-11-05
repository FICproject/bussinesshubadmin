import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  title: string;
  category: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  reference: string;
  date: string;
  description: string;
}

export interface IMemberWallet extends Document {
  memberId: mongoose.Types.ObjectId;
  memberEmail: string;
  balance: number;
  currency: string;
  currencySymbol: string;
  status: 'ACTIVE' | 'FROZEN';
  lastSyncedAt: Date;
  transactions: IWalletTransaction[];
}

const WalletTransactionSchema = new Schema<IWalletTransaction>({
  id: { type: String, required: true },
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['SUCCESS', 'PENDING', 'FAILED'], default: 'SUCCESS' },
  reference: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String, required: true },
});

const MemberWalletSchema = new Schema<IMemberWallet>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, unique: true },
    memberEmail: { type: String, required: true, lowercase: true },
    balance: { type: Number, default: 50000 },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    status: { type: String, enum: ['ACTIVE', 'FROZEN'], default: 'ACTIVE' },
    lastSyncedAt: { type: Date, default: Date.now },
    transactions: [WalletTransactionSchema],
  },
  { timestamps: true }
);

export const MemberWalletModel = mongoose.model<IMemberWallet>('MemberWallet', MemberWalletSchema);

