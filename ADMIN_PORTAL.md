# FIC Business Hub - Admin & Operations Portal

Comprehensive technical documentation, architecture overview, role-based workflows, and deployment guide for the **Forge India Connect (FIC) Business Hub Admin Portal**.

---

## 1. Project Overview & Architecture

The **FIC Business Hub Admin Portal** is an enterprise management cockpit engineered to oversee B2B marketplace operations, compliance verification, financial subscriptions, and member matching workflows across Indian business clusters.

### System Architecture
The repository is organized as a high-performance **Turborepo monorepo** with PNPM:

```
hub2/
├── apps/
│   ├── admin/             # Vite + React 18 + Tailwind CSS + Framer Motion
│   └── backend/           # Node.js + Express + TypeScript + Mongoose (MongoDB)
├── packages/
│   ├── shared-types/      # Centralized TypeScript definitions & interfaces
│   └── typescript-config/ # Unified tsconfig compiler baselines
└── docs/                  # Architecture & operational documentation
```

---

## 2. Key Modules & Workflows

### 1. Executive Operations Dashboard (`/`)
- **Revenue Snapshot**: Displays total collected revenue (Intro fee ₹99 + Annual renewals ₹5,999), Monthly Recurring Revenue (MRR), and pending receivables with auto-formatted INR currency.
- **Quick Action Toolbar**: One-click access to schedule meetings, provision staff accounts, and trigger CSV downloads of the audit ledger.
- **System Health Diagnostics**: Real-time polling of API response latency, active background workers, and MongoDB connection status.
- **Global Lookup Bar**: Centralized 300ms debounced search scanning across Members, Services, and FIC Requests simultaneously.
- **Live Audit Stream**: Real-time view of recent administrative actions with timestamps and operator signatures.

### 2. KYC Verification Desk (`/kyc`)
- **Document Inspector**: Review identity (Aadhaar/PAN), business registrations (GSTIN/Udyam), and category-specific trade licenses.
- **Review Workflow**: Multi-state decision engine with actions for **Approve**, **Reject** (with reason prompt), and **Resubmission Requested**.
- **Interactive Document Modal**: In-browser document viewer for quick verification.

### 3. Categories & Dynamic Rules (`/categories`)
- **Hierarchical Taxonomies**: Manage parent business categories (e.g., *Business Owners & Entrepreneurs*, *Freelancers & IT Professionals*) and dynamic subcategories.
- **KYC Requirement Rules**: Configure category-specific mandatory verification documents.

### 4. Members Directory (`/members`)
- **Directory Table**: Real-time listing with filter tabs (All, Active, Under Review, Blocked).
- **Comprehensive Profile Modal**: Tabbed drawer showing Registration Profile, Marketplace Services, and Digital Wallet transactions.
- **Access Control**: Instant account blocking and activation toggles.

### 5. Payments & Subscriptions (`/payments`)
- **Fee Management**: Tracks ₹99 introductory membership fees and ₹5,999 annual renewals.
- **Real-Time Payment Tracking**: Tracks ₹99 intro fees and ₹5,999 annual renewals with automatic gateway synchronization.
- **Gateway Log & Receipts**: Searchable gateway transaction references (Razorpay/PhonePe) and direct invoice links.

### 6. Meetings & Calls Scheduler (`/meetings`)
- **Meeting Orchestration**: Schedule 1-on-1 or multi-party video conferences and in-person calls between members and FIC managers.
- **Call States**: Manage meeting states (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- **Automated Invitations**: Dispatches notifications and invite links to participating members.

### 7. Service Listing Moderation (`/services`)
- **Provider Listings Queue**: Review B2B services submitted by enrolled members.
- **Internal Identity Privacy**: Displays member contact credentials strictly within administrative views while keeping public listings anonymized.
- **Approval Actions**: Instant listing approval or rejection with mandatory feedback.

### 8. FIC Requests Desk (`/requests`)
- **Mediation Console**: Manage high-value buyer inquiries, service requests, and partnership proposals.
- **Staff Assignment**: Route requests to specific operations coordinators with internal case notes.

### 9. Support Helpdesk (`/support`)
- **Ticketing Workspace**: Prioritized ticket queue (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) across Payment, KYC, Technical, and General inquiries.
- **Live Chat Console**: Real-time reply thread between administrators and members with status progression (`OPEN` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED`).

### 10. Staff & Roles Administration (`/staff`) *(Super Admin Only)*
- **Personnel Provisioning**:
  - Full Name & Work Email.
  - Phone / WhatsApp with international dial code for 2FA and escalation alerts.
  - Role selection: `ADMIN` (Operations Manager) or `SUPER_ADMIN` (Full Authority).
  - Desk / Department routing: *KYC Compliance Desk*, *Operations Desk*, *B2B Support Desk*, or *Management*.
  - Operational Region Scope: *Bangalore Zone*, *Karnataka State*, *South India*, *All Regions*.
  - Temporary password with *"Require password change on first login"*.
- **Access Management**: One-click staff access enable/disable toggle.

### 11. Security & Audit Logs (`/audit-logs`) *(Super Admin Only)*
- **Immutable Ledger**: Cryptographically logged audit trail of all staff decisions, KYC approvals, membership blocks, and category updates.
- **Data Capture**: Records timestamp, actor name, actor role, entity type, entity ID, and client IP address.

---

## 3. UI/UX & Design System (Powered by Inspo MCP)

- **Aesthetic Direction**: High-density B2B SaaS Studio / Feature Stack design system.
- **Typography**: **Plus Jakarta Sans** for crisp headings & body; **JetBrains Mono** for monetary figures, IDs, and audit streams.
- **Color Tokens**:
  - Paper Base: Deep obsidian canvas (`#070b12` dark / `#f8fafc` light).
  - Elevation: Frosted acrylic panels (`bg-white/90 dark:bg-[#0e1726]/90 border-slate-200/80 dark:border-slate-800/80`).
  - Brand Accents: Primary Sky Blue (`#0284c7`, `#38bdf8`), Emerald operational badges, and Amber alerts.
- **Page & Tab Transitions**: Powered by **Framer Motion** with spring-loaded layout indicator pills and smooth route exits.
- **Loading UX**: Responsive **Skeleton Loading Placeholders** across all tables, metric cards, and lists.

---

## 4. Default Seed Credentials

When starting the backend with an empty database or the automated in-memory fallback, the following baseline administrative accounts are seeded automatically:

| Role | Name | Email | Password | Assigned Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | FIC Super Administrator | `superadmin@ficapp.in` | `admin123` | Full Authority (`*`) |
| **Admin** | FIC Operations Admin | `admin@ficapp.in` | `admin123` | Members, KYC, Services, Requests |

---

## 5. Development & Running Locally

### Prerequisites
- Node.js `v18+`
- PNPM `v8+`

### Installation
```bash
# Install monorepo dependencies
pnpm install
```

### Starting Development Servers
```bash
# Run both Frontend and Backend concurrently
pnpm dev

# Or run services individually:
pnpm --filter @fic/backend dev   # Runs on http://localhost:5000
pnpm --filter @fic/admin dev     # Runs on http://localhost:3001
```

> **Note**: If a local MongoDB instance (`mongodb://127.0.0.1:27017`) is not running, the backend automatically boots an **embedded in-memory MongoDB instance** (`mongodb-memory-server`) and seeds all baseline data automatically.

### Production Build
```bash
# Build all packages and applications
pnpm build

# Build admin portal only
pnpm --filter @fic/admin build
```

---

## 6. API Reference Summary

### Authentication & Staff
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/me` - Authenticated admin profile
- `GET /api/admin/auth/staff` - List staff members
- `POST /api/admin/auth/staff` - Provision new staff user
- `PATCH /api/admin/auth/staff/:id/status` - Toggle staff active status

### Dashboard & Analytics
- `GET /api/admin/dashboard/stats` - Metric counts & recent audit logs
- `GET /api/admin/dashboard/financial-stats` - Revenue, MRR, pending volume
- `GET /api/admin/dashboard/system-health` - Latency & database diagnostic
- `GET /api/admin/dashboard/export-audit-logs` - CSV audit trail export
- `GET /api/admin/global-search?q=` - Cross-collection global lookup

### Members & Verification
- `GET /api/admin/members` - Member directory
- `GET /api/admin/members/:id` - Detailed profile with services & wallet
- `PATCH /api/admin/members/:id/status` - Update member status
- `GET /api/admin/kyc/submissions` - KYC queue
- `PATCH /api/admin/kyc/:id/review` - Approve or reject KYC

### Payments & Operations
- `GET /api/admin/payments` - Transaction history
- `GET /api/admin/meetings` - Scheduled calls & meetings
- `POST /api/admin/meetings` - Schedule new meeting
- `PATCH /api/admin/meetings/:id/status` - Update meeting status
- `GET /api/admin/services` - Service listing moderation queue
- `PATCH /api/admin/services/:id/moderate` - Approve/reject service
- `GET /api/admin/requests` - FIC mediation desk requests
- `PATCH /api/admin/requests/:id` - Route and annotate request
- `GET /api/admin/support/tickets` - Support helpdesk queue
- `POST /api/admin/support/tickets/:id/reply` - Send reply & update status
- `GET /api/admin/notifications` - Real-time alerts stream
