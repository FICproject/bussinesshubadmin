// Staff / Admin Roles
export type AdminRole = 'SUPER_ADMIN' | 'ADMIN';

export type AdminDepartment = 'KYC_COMPLIANCE' | 'OPERATIONS' | 'SUPPORT' | 'MANAGEMENT';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  countryCode?: string;
  avatarUrl?: string;
  role: AdminRole;
  department?: AdminDepartment;
  regionScope?: string;
  requirePasswordReset?: boolean;
  isActive: boolean;
  permissions?: string[];
  createdAt: string;
  lastLoginAt?: string;
}

// Category & Dynamic Form Configuration
export interface DynamicFieldDefinition {
  fieldKey: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'date' | 'file';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helperText?: string;
}

export interface KycDocumentRequirement {
  docKey: string;
  title: string;
  description?: string;
  required: boolean;
  allowedExtensions: string[];
  maxSizeMB: number;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  allowMultipleSubcategories: boolean;
  subcategories: Subcategory[];
  customFields?: DynamicFieldDefinition[];
  kycRequirements: KycDocumentRequirement[];
  createdAt: string;
  updatedAt: string;
}

// Member & KYC
export type MemberStatus = 'PENDING_REGISTRATION' | 'PENDING_PAYMENT' | 'PENDING_KYC' | 'UNDER_REVIEW' | 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
export type KycStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED';

export interface KycDocumentItem {
  docKey: string;
  title: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
}

export interface KycSubmission {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  categoryId: string;
  categoryName: string;
  status: KycStatus;
  documents: KycDocumentItem[];
  submittedAt: string;
  assignedTo?: string; // staff ID
  reviewerNotes?: string;
  rejectionReason?: string;
  verifiedAt?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  primaryCategoryId: string;
  primaryCategoryName: string;
  subcategoryIds: string[];
  status: MemberStatus;
  membershipPlan: 'FIRST_YEAR_INTRO' | 'STANDARD_ANNUAL';
  membershipFeePaid: number;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  kycStatus: KycStatus;
  registeredAt: string;
  membershipExpiresAt?: string;
}

// Services Moderation
export type ServiceListingStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface ServiceListing {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  description: string;
  providerId: string;
  providerPrivateName: string; // obfuscated in member view, visible in admin
  providerEmail: string;
  locationState?: string;
  pricingEstimate?: string;
  status: ServiceListingStatus;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

// FIC Requests & Coordination Desk
export type RequestType = 'SERVICE_INQUIRY' | 'BUSINESS_DEVELOPMENT' | 'INVESTMENT_INTEREST' | 'PARTNERSHIP';
export type RequestStatus = 'NEW' | 'UNDER_REVIEW' | 'PROVIDER_CONTACTED' | 'MEETING_SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface FicRequest {
  id: string;
  type: RequestType;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  targetServiceId?: string;
  targetProviderId?: string;
  status: RequestStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  internalNotes?: string[];
  createdAt: string;
  updatedAt: string;
}

// Audit Log
export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: AdminRole;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Meetings & Customer Calls
export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  hostAdminId: string;
  hostAdminName?: string;
  participantMemberIds: string[];
  participantMembers?: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    primaryCategoryName?: string;
  }>;
  scheduledAt: string;
  durationMinutes: number;
  meetingLink?: string;
  status: MeetingStatus;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

// Payments & Transactions
export type PaymentType = 'INTRO_FEE' | 'ANNUAL_RENEWAL' | 'MANUAL_OVERRIDE';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentRecord {
  id: string;
  memberId: string;
  memberName?: string;
  memberEmail?: string;
  amount: number;
  currency: string;
  paymentType: PaymentType;
  status: PaymentStatus;
  gatewayProvider: string;
  gatewayTransactionId: string;
  invoiceUrl?: string;
  createdAt: string;
}

// Lead Distribution
export type LeadStatus = 'DISPATCHED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface LeadDistributionRecord {
  id: string;
  leadId: string;
  leadTitle?: string;
  assignedMemberId: string;
  assignedMemberName?: string;
  matchingScore: number;
  tierRuleApplied: string;
  status: LeadStatus;
  createdAt: string;
}

// Support & Ticketing
export type TicketCategory = 'PAYMENT_ISSUE' | 'KYC_QUERY' | 'TECHNICAL_BUG' | 'GENERAL_INQUIRY';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TicketMessage {
  sender: 'MEMBER' | 'ADMIN';
  senderId?: string;
  senderName?: string;
  message: string;
  timestamp: string;
}

export interface SupportTicketRecord {
  id: string;
  ticketNumber: string;
  memberId: string;
  memberName?: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

// API Responses
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

