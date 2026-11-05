# FIC Business Hub — Admin & Operations System Documentation

**Project:** Forge India Connect (FIC) Business Hub  
**Subsystem:** Admin Portal & Shared Administrative Backend  
**Document Version:** 1.0  
**Specification Baseline:** `FIC_Business_Hub_Complete_Project_Blueprint (1).md`  
**Date:** 31 October 2026  

---

## 1. Executive Summary

This document specifies the architecture, implemented modules, database models, API endpoints, role-based access control (RBAC), and operating procedures for the **Admin & Operations Subsystem** of the FIC Business Hub.

The Admin Subsystem enables FIC personnel (Super Admins, Operations Admins, and Verification Executives) to manage the dynamic multi-category business ecosystem, verify compliance documents, moderate public marketplace services with privacy protection, coordinate member-to-member inquiries, and audit system activities.

---

## 2. Technology Stack & Monorepo Architecture

The subsystem is implemented as part of a **Turborepo + pnpm** monorepo:

```text
fic-business-hub/
├── apps/
│   ├── admin/               # React 18 + TypeScript + Vite + Tailwind CSS SPA
│   └── backend/             # Node.js + Express + TypeScript + Mongoose Modular Monolith
├── packages/
│   ├── shared-types/        # Canonical TypeScript types & interface contracts
│   └── typescript-config/   # Shared tsconfig base definitions
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

### Technology Matrix
- **Admin Portal UI (`apps/admin`)**:
  - React 18, TypeScript, Vite 6
  - Tailwind CSS, Lucide React icons
  - React Router DOM v6 with route guard protection
  - Custom API abstraction layer with JWT authorization header injection
- **Shared API (`apps/backend`)**:
  - Express.js, Node.js 20+, TypeScript
  - Mongoose (MongoDB ODM) with automatic in-memory fallback (`mongodb-memory-server`) for zero-dependency local execution
  - JWT session tokens (12-hour expiry)
  - Bcrypt password hashing (10 salt rounds)
  - Chronological audit logging middleware

---

## 3. Implemented Admin Modules & Features

### 3.1. Role-Based Access Control (RBAC) & Authentication
- **Roles Implemented**:
  1. `SUPER_ADMIN`: Complete platform authority, staff management, category/pricing configuration, audit log inspection, and global actions.
  2. `ADMIN`: Member management, service moderation, intermediary inquiry coordination, and reporting.
  3. `VERIFICATION_EXECUTIVE`: Dedicated KYC review desk, document inspection, and approve/reject/resubmit decision recording.
- **Route Guarding**: Frontend routes automatically block unauthorized access based on role permissions and redirect unauthenticated users to `/login`.

### 3.2. Executive Operations Dashboard (`/`)
- Real-time KPI summary widgets:
  - **Pending KYC Review Queue**: Submissions awaiting compliance check.
  - **Service Listings in Queue**: Services awaiting moderation before cross-category publishing.
  - **Active FIC Requests**: Intermediary introductions, inquiries, and funding leads.
  - **Total Enrolled Members**: Active members vs total registered accounts.
- **Activity Stream**: Live chronological audit event log showing recent administrator actions, actor names, and targeted entities.

### 3.3. KYC Verification Desk (`/kyc`)
- **Queue Management**: Filter applications by status (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `RESUBMISSION_REQUESTED`).
- **Document Inspector**: Side-by-side viewer inspecting uploaded government ID proofs (Aadhaar, PAN) and business registrations (Udyam, GST).
- **Three-Way Decision Console**:
  - `APPROVED`: Automatically transitions member status to `ACTIVE` (provided the ₹99 membership fee is paid).
  - `RESUBMISSION_REQUESTED`: Requests member to re-upload clear or missing documents without re-charging any fee.
  - `REJECTED`: Records mandatory reason for non-compliance and logs internal verification notes.

### 3.4. Category & Dynamic Configuration Builder (`/categories`)
- Dynamic category CRUD with slug generation.
- Dynamic subcategory assignment (allows multiple subcategories per member if enabled).
- Configurable KYC document requirements (custom allowed file extensions, file sizes, and requirement flags) per category.

### 3.5. Members Directory & Operations (`/members`)
- Directory table with search by member name, business name, or email.
- Real-time display of primary category, fee payment state (₹99 intro / ₹5,999 renewal), and KYC verification state.
- Account status controls: Immediate toggle for `ACTIVE`, `SUSPENDED`, or `BLOCKED`.

### 3.6. Services Moderation Desk (`/services`)
- Queue of service offerings submitted by members across all categories.
- **Blueprint Privacy Enforcement**: Obfuscates provider private identity in member-facing views, but grants Admins full visibility into internal provider details (name, email, phone, location, and estimate).
- Decision controls to `APPROVE` or `REJECT` (with mandatory reason capture).

### 3.7. FIC Intermediary Coordination Desk (`/requests`)
- Dedicated workspace for FIC's central coordinator model.
- Manages incoming member inquiries for services, business development scaling requests, and private funding/investment interest.
- Status workflow: `NEW` ➔ `UNDER_REVIEW` ➔ `PROVIDER_CONTACTED` ➔ `MEETING_SCHEDULED` ➔ `COMPLETED` / `CANCELLED`.
- Appendable coordination timeline logging timestamps and coordinator notes.

### 3.8. Staff Management (`/staff`) *(Super Admin Only)*
- Interface to provision staff accounts (`SUPER_ADMIN`, `ADMIN`, `VERIFICATION_EXECUTIVE`).
- Dynamic credential creation and account status toggle (`Active` / `Disabled`).

### 3.9. Security & Audit Trail (`/audit-logs`) *(Super Admin Only)*
- Immutable ledger capturing every administrative action (`action`, `actor`, `role`, `entityType`, `entityId`, `ipAddress`, and `timestamp`).

---

## 4. Backend Database Schemas

| Collection | Model File | Description |
| :--- | :--- | :--- |
| `adminusers` | [`AdminUser.ts`](file:///d:/fic%20project/hub2/apps/backend/src/database/AdminUser.ts) | Staff records, bcrypt hash, RBAC roles (`SUPER_ADMIN`, `ADMIN`, `VERIFICATION_EXECUTIVE`). |
| `categories` | [`Category.ts`](file:///d:/fic%20project/hub2/apps/backend/src/database/Category.ts) | Dynamic categories, subcategories, dynamic custom fields, and KYC document schemas. |
| `kycsubmissions` | [`KycSubmission.ts`](file:///d:/fic%20project/hub2/apps/backend/src/database/KycSubmission.ts) | Document file metadata, submission status, reviewer notes, and decision dates. |
| `members` | [`Member.ts`](file:///d:/fic%20project/hub2/apps/backend/src/database/Member.ts) | Member profiles, primary category, fee payment state, KYC state, and account status. |
| `servicelistings` | [`ServiceListing.ts`](file:///d:/fic%20project/hub2/apps/backend/src/database/ServiceListing.ts) | Service offerings, internal provider metadata, moderation state, and rejection reasons. |
| `ficrequests` | [`FicRequest.ts`](file:///d:/fic%20project/hub2/apps/backend/src/database/FicRequest.ts) | FIC-mediated inquiries, coordinator notes list, target provider/service references. |
| `auditlogs` | [`AuditLog.ts`](file:///d:/fic%20project/hub2/apps/backend/src/database/AuditLog.ts) | Immutable administrative activity logs with actor metadata and IP addresses. |

---

## 5. API Reference Summary

All administrative endpoints require `Authorization: Bearer <JWT>` header (except login).

### Authentication & Staff (`/api/admin/auth`)
- `POST /api/admin/auth/login`: Authenticates staff and returns 12h JWT token + user profile.
- `GET /api/admin/auth/me`: Validates token and returns current admin context.
- `GET /api/admin/auth/staff`: *(Super Admin)* Returns list of staff members.
- `POST /api/admin/auth/staff`: *(Super Admin)* Creates new staff account.
- `PATCH /api/admin/auth/staff/:id/status`: *(Super Admin)* Updates role or toggles active status.

### Dashboard & Analytics (`/api/admin/dashboard`)
- `GET /api/admin/dashboard/stats`: Returns aggregated KPI counters and latest 10 audit logs.
- `GET /api/admin/dashboard/audit-logs`: Returns chronological audit records (up to 100).

### Category Management (`/api/admin/categories`)
- `GET /api/admin/categories`: Lists all categories with subcategories and KYC rules.
- `POST /api/admin/categories`: Creates category with dynamic configuration.
- `PUT /api/admin/categories/:id`: Updates category fields, subcategories, or KYC requirements.
- `DELETE /api/admin/categories/:id`: Soft-deactivates category.

### KYC Compliance (`/api/admin/kyc`)
- `GET /api/admin/kyc?status=<STATUS>`: Lists submissions filtered by review status.
- `GET /api/admin/kyc/:id`: Retrieves individual submission with populated member and category data.
- `PATCH /api/admin/kyc/:id/review`: Records decision (`APPROVED`, `REJECTED`, `RESUBMISSION_REQUESTED`), logs audit entry, and updates member's account status.

### Members (`/api/admin/members`)
- `GET /api/admin/members?status=<STATUS>&search=<QUERY>`: Searchable member directory.
- `GET /api/admin/members/:id`: Member detail view.
- `PATCH /api/admin/members/:id/status`: Updates account status (`ACTIVE`, `SUSPENDED`, `BLOCKED`).

### Services Moderation (`/api/admin/services`)
- `GET /api/admin/services?status=<STATUS>`: Service queue with internal provider details.
- `PATCH /api/admin/services/:id/moderate`: Sets status (`APPROVED`, `REJECTED`) and captures reason.

### Intermediary Coordination Desk (`/api/admin/requests`)
- `GET /api/admin/requests?type=<TYPE>&status=<STATUS>`: Lists FIC coordination inquiries.
- `PATCH /api/admin/requests/:id`: Updates status, assigns staff, and appends coordinator notes.

---

## 6. Pre-Configured Seed Accounts

When the backend starts up for the first time, it seeds default test accounts:

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@ficapp.in` | `admin123` | Full access: All workspaces, staff management, audit log explorer |
| **Operations Admin** | `admin@ficapp.in` | `admin123` | KYC desk, member operations, service moderation, request coordination |
| **Verification Executive** | `priya.verify@ficapp.in` | `admin123` | KYC verification queue and document inspection |

---

## 7. Developer Execution Instructions

### Starting the Monorepo
```bash
# 1. Install dependencies from root
pnpm install

# 2. Build shared packages and apps
pnpm build

# 3. Start Backend API (Port 5000)
cd apps/backend
pnpm dev

# 4. Start Admin Portal UI (Port 3002)
cd apps/admin
pnpm dev
```

### URLs
- **Admin Portal**: [http://localhost:3002](http://localhost:3002)
- **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

