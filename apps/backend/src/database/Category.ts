import mongoose, { Schema, Document } from 'mongoose';
import { DynamicFieldDefinition, KycDocumentRequirement, Subcategory } from '@fic/shared-types';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  allowMultipleSubcategories: boolean;
  subcategories: Subcategory[];
  customFields: DynamicFieldDefinition[];
  kycRequirements: KycDocumentRequirement[];
  createdAt: Date;
  updatedAt: Date;
}

const SubcategorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const DynamicFieldSchema = new Schema(
  {
    fieldKey: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, required: true },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    placeholder: { type: String },
    helperText: { type: String },
  },
  { _id: false }
);

const KycRequirementSchema = new Schema(
  {
    docKey: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    required: { type: Boolean, default: true },
    allowedExtensions: [{ type: String, default: ['pdf', 'jpg', 'png'] }],
    maxSizeMB: { type: Number, default: 5 },
  },
  { _id: false }
);

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
    allowMultipleSubcategories: { type: Boolean, default: true },
    subcategories: [SubcategorySchema],
    customFields: [DynamicFieldSchema],
    kycRequirements: [KycRequirementSchema],
  },
  { timestamps: true }
);

export const CategoryModel = mongoose.model<ICategory>('Category', CategorySchema);

