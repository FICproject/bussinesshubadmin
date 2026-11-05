import mongoose, { Schema, Document } from 'mongoose';
import { AdminRole, AdminDepartment } from '@fic/shared-types';

export interface IAdminUser extends Document {
  name: string;
  email: string;
  phone?: string;
  countryCode?: string;
  avatarUrl?: string;
  passwordHash: string;
  role: AdminRole;
  department?: AdminDepartment;
  regionScope?: string;
  requirePasswordReset: boolean;
  isActive: boolean;
  permissions: string[];
  createdAt: Date;
  lastLoginAt?: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    countryCode: { type: String, default: '+91' },
    avatarUrl: { type: String },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN'],
      default: 'ADMIN',
      required: true,
    },
    department: {
      type: String,
      enum: ['KYC_COMPLIANCE', 'OPERATIONS', 'SUPPORT', 'MANAGEMENT'],
      default: 'OPERATIONS',
    },
    regionScope: { type: String, default: 'All Regions' },
    requirePasswordReset: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    permissions: [{ type: String }],
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const AdminUserModel = mongoose.model<IAdminUser>('AdminUser', AdminUserSchema);

