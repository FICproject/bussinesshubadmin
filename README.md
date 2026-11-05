# FIC Business Hub - Admin Portal & Shared Backend

This repository houses the full **Admin Part** and **Shared API** for the FIC Business Hub project, built according to the blueprint specifications.

## Architecture

- **`apps/admin`**: The Admin & Operations Portal built with React 18, Vite, TypeScript, Tailwind CSS, and Lucide Icons.
- **`apps/backend`**: Shared modular monolith backend built with Node.js, Express, TypeScript, and MongoDB (Mongoose).
- **`packages/shared-types`**: TypeScript schemas for RBAC roles, Categories, KYC submissions, Member statuses, Services, and FIC Requests.
- **`packages/typescript-config`**: Shared base TSConfig.

---

## Getting Started

### 1. Prerequisites
- Node.js >= 20
- pnpm >= 10 (`pnpm -v`)
- MongoDB (local running at `mongodb://127.0.0.1:27017/fic_business_hub` or MongoDB Atlas URI)

### 2. Environment Setup
Create a `.env` file in `apps/backend/`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/fic_business_hub
JWT_SECRET=fic_hub_secret_jwt_key_2026
```

### 3. Build the Monorepo
```bash
pnpm build
```

### 4. Running the Development Servers
In separate terminals or using turbo:
```bash
# Start backend
cd apps/backend
pnpm dev

# Start admin portal
cd apps/admin
pnpm dev
```
- Admin Portal: `http://localhost:3001`
- Backend API: `http://localhost:5000`

---

## Seed Accounts (Pre-configured)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@ficapp.in` | `admin123` |
| **Admin** | `admin@ficapp.in` | `admin123` |
| **Verification Executive** | `priya.verify@ficapp.in` | `admin123` |

---

## Implemented Admin Workspaces

1. **Executive Operations Dashboard**: KPI counters for pending KYC, service moderation queue, pending intermediary inquiries, and live audit feed.
2. **KYC Verification Desk**: List submissions, inspect uploaded proofs (PAN, Udyam, etc.), approve, request resubmission with reason notes, or reject.
3. **Category & Dynamic Config Builder**: Manage ecosystem categories, dynamic subcategories, and mandatory category KYC document proofs.
4. **Member Operations**: Directory of registered members, membership fee status (₹99 first-year intro / ₹5,999 renewal), KYC states, and account status (Active/Suspended/Blocked).
5. **Services Moderation Desk**: Review provider service offerings before cross-category publishing; inspect internal provider identity while preserving member privacy.
6. **FIC Intermediary Coordination Desk**: Manage FIC-mediated service inquiries, business ideas, and investment requests; schedule meetings, record coordinator notes, and advance statuses.
7. **Staff & RBAC Administration**: Super Admin console to create, assign roles, and toggle access for Admin and Verification Executive accounts.
8. **Security & Audit Logs**: Immutable chronological record of administrative actions, decisions, and target entities.

