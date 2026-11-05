# FIC BUSINESS HUB

## Complete Project Blueprint & Development Specification

**Document type:** Consolidated BRD + PRD + SRS + Solution
Architecture + Technical Design + UX Specification + Data/API Design +
Security + QA + Deployment + Roadmap\
**Version:** 1.0\
**Status:** Draft for stakeholder review\
**Prepared for:** FIC Business Hub\
**Technology direction:** MERN + TypeScript + Turborepo + pnpm\
**Date:** 31 October 2026

------------------------------------------------------------------------

# Document Control

  Field                  Details
  ---------------------- ----------------------------------------------------------
  Project                FIC Business Hub
  Document               Complete Project Blueprint
  Version                1.0
  Status                 Draft -- requires business, legal and technical approval
  Owner                  FIC
  Primary applications   Member Website, Admin Portal
  Backend                One shared API
  Primary database       MongoDB
  Architecture           Turborepo + pnpm monorepo; modular monolith initially

## How to use this document

This is the consolidated baseline specification for planning and
building FIC Business Hub. It combines the key content normally
maintained in separate BRD, PRD, SRS, architecture, database, API,
security, testing and deployment documents.

Treat confirmed decisions as requirements. Treat recommendations as
proposals until FIC approves them. Do not silently convert assumptions
or illustrative examples into production business rules.

Before implementation: 1. Review the open decisions in Section 25. 2.
Obtain business-owner approval for pricing, membership terms, service
workflows and investment-related operating boundaries. 3. Obtain
legal/CA/regulatory review for applicable Indian compliance matters. 4.
Validate the technical architecture and acceptance criteria. 5. Baseline
and version this document.

------------------------------------------------------------------------

# 1. Executive Summary

FIC Business Hub is a membership-based business, professional and
opportunity ecosystem. It is intended to bring eligible individuals and
organizations into one platform so they can discover services, offer
services, submit business ideas, request business development support,
express investment interest, seek funding connections, build
partnerships and participate in networking.

The platform is not merely a business directory or a conventional
e-commerce marketplace. FIC acts as the central coordinator/intermediary
for member-to-member business introductions and service requests.

The platform has exactly two websites: 1. **FIC Business Hub Website:**
public landing page, registration, login, member experience,
category-specific dashboard and universal marketplace. 2. **FIC Admin
Portal:** Super Admin, Admin and Verification Executive workspaces.

Both websites use one shared backend API and a shared MongoDB database.

The member experience is dynamically configured. A member selects one
primary main category, then the relevant subcategory or subcategories,
completes a configuration-driven details form, pays the membership fee
and submits category-specific KYC. Full dashboard access is granted only
after payment, KYC approval, active membership and active account
status.

The service marketplace is universal: an eligible member can discover
approved services from every category, regardless of the member's own
primary category. Public listings must not reveal provider identity or
private contact details. Requests are routed to FIC, which coordinates
with the requester and provider.

------------------------------------------------------------------------

# 2. Business Requirements Document (BRD)

## 2.1 Business vision

**Vision:** Bring every eligible individual into one trusted ecosystem
and help them discover, offer and access business opportunities through
FIC.

**Suggested positioning statement:**\
"One Platform. Unlimited Business Opportunities."

## 2.2 Business objectives

-   Build a broad membership ecosystem for people aged 18 and above.
-   Allow members to both offer services and request services.
-   Make approved services discoverable across all member categories.
-   Enable FIC-mediated business introductions and service coordination.
-   Support business idea submission and business development requests.
-   Enable private expression of investment readiness and funding
    requirements.
-   Facilitate partnerships, tie-ups and networking.
-   Provide category- and subcategory-configured member experiences.
-   Create an operational platform for FIC staff to review, coordinate
    and monitor requests.
-   Establish a scalable foundation for future categories and modules.

## 2.3 Target audiences

The platform must not be limited to the examples below. Categories and
subcategories must be configurable.

-   Business owners and entrepreneurs
-   Startup founders and business idea owners
-   Manufacturers, textile and garment businesses
-   Retailers, wholesalers, distributors and traders
-   Investors and funding seekers
-   Freelancers, developers and IT professionals
-   Students, teachers, mentors and trainers
-   Consultants and professional service providers
-   Agriculture and allied-business participants
-   Healthcare and wellness professionals
-   Creative and media professionals
-   Job seekers, unemployed individuals and retired professionals
-   Skilled workers and other eligible individuals

## 2.4 Business model

### Membership pricing -- current approved direction

  Membership period                   Fee
  --------------------- -----------------
  First year                          ₹99
  Second year onwards     ₹5,999 per year

-   The same membership fee applies across categories.
-   The first-year ₹99 offer must be clearly described as a first-year
    introductory offer.
-   Do not show fake crossed-out prices, fake savings or countdown
    timers.
-   Final tax treatment, GST display, invoice format, refunds,
    cancellation, renewal reminders and auto-renewal policy require FIC
    approval.
-   Payment does not itself activate full dashboard access.
-   KYC resubmission after rejection or additional-document request must
    not trigger a second membership charge.

### Potential future revenue

Membership fees are the currently defined revenue model. Other models
such as sponsored listings, premium promotion, business consultancy fees
or transaction fees must not be enabled until FIC defines pricing,
terms, operational ownership and legal treatment.

## 2.5 FIC intermediary model

FIC coordinates member-to-member requests. Public members see service
information but not provider identity or private contact information. A
member submits a request to FIC. FIC reviews the request, collects
requirements, identifies suitable providers internally, contacts the
provider and coordinates next steps.

The product must clearly explain what FIC does and does not guarantee. A
request, introduction or meeting must not be represented as a guarantee
of service delivery, funding, investment, partnership or business
success.

## 2.6 Business scope

### In scope for the planned product

-   Public landing page and information pages
-   Signup, login and age eligibility validation
-   Dynamic main category and subcategory selection
-   Dynamic registration forms
-   Membership payment and renewal management
-   Category-specific KYC
-   Admin KYC review and resubmission
-   Dynamic member dashboard
-   Universal service discovery
-   Service listing submission and approval
-   FIC-mediated service requests
-   Business ideas and opportunities
-   Business development and scaling requests
-   Private investment-readiness and funding-interest workflows
-   Business tie-ups and partnerships
-   Business networking
-   Mentoring operations
-   Admin operations, reporting and audit trails
-   Notifications and member communication

### Out of scope until separately approved

-   Direct member-to-member contact disclosure
-   Unmoderated public member directory
-   Direct student-to-mentor payments
-   FIC custody of investment funds
-   Securities trading, public investment exchange or deposit-taking
-   Lending, investment solicitation or regulated financial activities
    without required legal approvals
-   Guaranteed funding, guaranteed returns or guaranteed business
    outcomes
-   Automatic legal, tax or investment advice
-   Any unapproved payment split, escrow or wallet model

## 2.7 Business success measures

Proposed metrics, not guaranteed targets: - Registration completion
rate - Payment success rate - KYC submission and approval turnaround
time - Active paid members - Membership renewal rate - Number of
approved service listings - Service request volume -
Request-to-provider-match rate - Request completion rate - Business
development requests handled - Partnership/networking introductions -
Member satisfaction and complaint rate - Mentor session completion and
feedback metrics

Metric definitions and reporting windows must be documented before
dashboards are treated as authoritative.

------------------------------------------------------------------------

# 3. Product Requirements Document (PRD)

## 3.1 Product structure

### Website 1: FIC Business Hub

Suggested domain: `www.ficapp.in`

Contains: - Public landing and informational pages - Get Started
introduction - Signup and login - Dynamic registration - Membership
checkout - KYC upload and application tracking - Member dashboard -
Universal marketplace - Service request experience - Business ideas and
business development - Investment and funding interest - Partnerships
and networking - Mentoring - Notifications, profile and support

### Website 2: FIC Admin Portal

Suggested domain: `admin.ficapp.in`

Contains: - Super Admin workspace - Admin workspace - Verification
Executive workspace - Category and subcategory management - Dynamic form
and dashboard configuration - Member and membership operations - KYC
verification - Service listing moderation - Request and opportunity
management - Investment/funding request review - Mentor operations -
Reports, complaints and audit logs

### Shared backend

Suggested domain: `api.ficapp.in`

One backend serves both websites. Do not create separate backend
applications for each category.

## 3.2 Landing page

### Hero section

Suggested headline: **One Platform. Unlimited Business Opportunities.**

Suggested supporting copy:\
"Connect with business opportunities, discover professional services,
explore investments, build partnerships and grow your business with
FIC."

Primary CTA: **Get Started**\
Secondary CTA: **Explore Opportunities**

### Landing page sections

1.  Hero
2.  About FIC Business Hub
3.  Who Can Join?
4.  Business Ideas and Opportunities
5.  Business Development and Scaling
6.  Services Marketplace
7.  Investment and Funding Connections
8.  Business Tie-ups and Partnerships
9.  Networking
10. How FIC Works
11. Membership
12. FAQs
13. Contact and Support
14. Footer and legal links

Design must be professional, clear, responsive and accessible. Avoid
presenting every feature in the hero area.

## 3.3 Get Started introduction page

When a visitor clicks Get Started, show a simple, pleasant introduction
page before registration.

Suggested heading: "Welcome to FIC Business Hub"\
Suggested supporting copy: "Your next business opportunity starts here."

Explain briefly: - Join the business ecosystem. - Discover services and
opportunities. - Share your business requirements. - Connect through
FIC. - Explore partnerships and investment opportunities.

Display: - First-year membership: ₹99 - Renewal from second year
onwards: ₹5,999/year - Validity and renewal terms - Applicable tax
treatment - Refund/cancellation terms - Support and legal links

CTA: **Continue Registration**

## 3.4 Registration journey

1.  Basic account details.
2.  Verify age eligibility (18+).
3.  Select exactly one primary main category.
4.  Load subcategories for that category.
5.  Select permitted subcategory/subcategories.
6.  Load the dynamic details form.
7.  Validate and save registration details.
8.  Collect first-year membership payment.
9.  Verify payment server-side.
10. Present dynamic KYC requirements.
11. Submit KYC application.
12. Show application tracking.
13. Admin reviews documents.
14. Member supplies corrections/additional documents if requested.
15. Once all access conditions are met, activate the member dashboard.

The final UX may split these into screens or steps, but the business
sequence and state rules must remain consistent.

## 3.5 Initial main categories

The initial ten categories are:

1.  Business & Entrepreneurship
2.  Manufacturing & Industrial
3.  Technology & Digital
4.  Education & Knowledge
5.  Professional & Personal Services
6.  Agriculture & Natural Resources
7.  Investment & Finance
8.  Healthcare & Wellness
9.  Creative, Media & Lifestyle
10. Employment, Community & Social Development

Examples of subcategories:

  -----------------------------------------------------------------------
  Main category                       Illustrative subcategories
  ----------------------------------- -----------------------------------
  Business & Entrepreneurship         Business owner, startup founder,
                                      entrepreneur, retailer, wholesaler,
                                      distributor, trader, franchise
                                      owner, business idea owner

  Manufacturing & Industrial          Textile manufacturer, garment
                                      manufacturer, factory owner,
                                      industrial supplier, machinery
                                      manufacturer, food processor

  Technology & Digital                Software developer, IT
                                      professional, freelancer, AI
                                      professional, cybersecurity,
                                      digital marketing, technology
                                      startup

  Education & Knowledge               Student, teacher, professor,
                                      mentor, trainer, tutor, researcher,
                                      educational consultant

  Professional & Personal Services    Consultant, lawyer, accountant,
                                      architect, designer, photographer,
                                      mechanic, electrician, technician,
                                      skilled professional

  Agriculture & Natural Resources     Farmer, landowner, dairy,
                                      fisheries, livestock,
                                      agri-business, agri-consultant

  Investment & Finance                Investor, startup investor, funding
                                      seeker, financial consultant,
                                      investment professional

  Healthcare & Wellness               Doctor, nurse, clinic, hospital,
                                      healthcare professional, wellness
                                      and fitness professional

  Creative, Media & Lifestyle         Artist, musician, actor, content
                                      creator, fashion designer, event
                                      organizer, writer

  Employment, Community & Social      Job seeker, fresher, unemployed
  Development                         individual, retired professional,
                                      volunteer, NGO, social worker
  -----------------------------------------------------------------------

These are seed records, not hardcoded application enums. Admin must be
able to add, edit, deactivate and reorder categories and subcategories.

A user has exactly one primary main category. Multiple subcategories may
be allowed only within that same category when configuration permits.

## 3.6 Dynamic details forms

Forms must be configuration-driven.

Example fields: - Textile manufacturer: business name, manufacturing
type, products, capacity, experience, location, applicable
registrations. - Student: education level, institution, course, skills,
career interests and mentoring needs. - Investor: preferred sectors,
investment range, investment readiness and preferred business stage. -
Freelancer: skills, experience, portfolio, services and availability.

Supported field types: - Text and textarea - Number and currency range -
Email, phone and URL - Date - Single-select dropdown - Multi-select -
Radio - Checkbox - File upload - Address/location fields - Conditional
sections - Repeatable groups, if needed

Every field configuration should support: - Stable field key - Label and
help text - Field type - Required/optional - Validation rules - Options
or option source - Conditional visibility - Display order -
Sensitive-data classification - Version and publication state

Do not execute arbitrary JavaScript from database form configurations.
Use a safe, predefined rule schema.

## 3.7 Membership and KYC

Payment statuses: - PENDING - PAID - FAILED - REFUNDED -
PARTIALLY_REFUNDED, only if provider and policy support it

Membership statuses: - PENDING - ACTIVE - EXPIRED - CANCELLED -
SUSPENDED

KYC statuses: - NOT_STARTED - PENDING - UNDER_REVIEW -
ADDITIONAL_DOCUMENT_REQUIRED - APPROVED - REJECTED

Account statuses: - ACTIVE - SUSPENDED - BLOCKED

Full access requires: - Account ACTIVE - Payment PAID - KYC APPROVED -
Membership ACTIVE

A renewal must not bypass an account block, suspension or revoked KYC
decision. Define how an approved KYC application is rechecked if
documents expire or a material profile change occurs.

## 3.8 Member dashboard

One reusable dashboard renderer; not ten separate codebases.

Common dashboard areas may include: - Overview - Profile - Membership -
My Services - Discover Services - Business Opportunities - Business
Development Requests - Investment and Funding - Partnerships -
Networking - My Requests - FIC Communications - Notifications - Support

Menus and widgets are selected through configuration and permissions. A
member's category controls their dashboard experience but must not
restrict universal service discovery.

## 3.9 Universal services marketplace

Every eligible member can discover all approved, active services,
regardless of their primary category.

Only listings that satisfy the required provider account, membership,
KYC and listing-approval conditions may be visible.

Public listing fields: - Service title - Description - Category and
subcategory - Approved images/portfolio - Capabilities - Privacy-safe
location if enabled - Verification indicator if appropriate - Request
Service action

Never expose provider personal name, company name, private phone,
private email or direct contact links in public listing responses.

Backend must enforce field-level privacy. Do not fetch sensitive fields
and merely hide them in the UI.

Search/filter examples: - Service category - Subcategory - Keywords -
Skills/capabilities - Privacy-safe location - Availability -
Verification status

## 3.10 Service request workflow

Suggested statuses: - SUBMITTED - UNDER_REVIEW -
REQUIREMENTS_COLLECTED - ASSIGNED_TO_PROVIDER - PROVIDER_CONTACTED -
PROPOSAL_SHARED - ACCEPTED - IN_PROGRESS - COMPLETED - REJECTED -
CANCELLED - DISPUTED

Workflow: 1. Member selects a service. 2. Member submits a requirement.
3. FIC receives the request. 4. FIC contacts requester and collects
details. 5. Authorized staff identify and contact provider. 6. FIC
coordinates proposal and next steps. 7. Request status and
communications are tracked. 8. Completion, cancellation or dispute is
recorded.

Provider identity and contact details are available only to authorized
FIC personnel and only for legitimate operational purposes.

## 3.11 Business ideas and development

Members may: - Submit a business idea. - Request help validating or
developing an idea. - Express interest in starting a business. - Explore
FIC-published opportunities. - Request a consultation or meeting.

Business development request examples: - Business planning - Business
setup guidance - Market research - Branding and marketing - Technology
development - Operational improvement - Business expansion and scaling -
Consultancy

FIC reviews, gathers requirements, assigns appropriate internal staff or
external support and tracks progress. Meeting scheduling and provider
introductions must be recorded.

## 3.12 Investment and funding interest

Members may privately indicate: - Willingness/readiness to invest -
Available investment range - Preferred sectors - Preferred business
stage - Investment interests and conditions

Funding seekers may privately submit: - Funding amount/range required -
Purpose - Business/project information - Business stage - Proposal and
supporting documents

Only authorized FIC personnel can view sensitive financial information.
Do not publicly expose exact amounts, identity or financial documents.

This module initially records and manages interest and FIC-coordinated
introductions. It must not perform investment-money transfers, hold
funds, operate a securities marketplace, offer regulated financial
products or make investment recommendations until the legal and
regulatory model has been approved.

## 3.13 Partnerships and networking

Support requests for: - Business collaboration - Manufacturing
partnerships - Distribution relationships - Franchise opportunities -
Vendor relationships - Joint ventures - Strategic partnerships -
Professional introductions - Industry networking - Meetings

FIC coordinates introductions and records consent, status and outcomes.

## 3.14 Mentoring

Support business, career, technical and professional mentoring.

Student-to-mentor direct payment is not part of the approved model. FIC
pays eligible mentors from its approved company budget, subject to
completed sessions, attendance, feedback, quality checks, complaint
review, approval and payout processing.

Commission percentages, score weightages, payout timing and eligibility
remain configurable and require approval. Do not invent fixed production
values.

------------------------------------------------------------------------

# 4. Software Requirements Specification (SRS)

## 4.1 Actors

-   Visitor
-   Applicant/member
-   Super Admin
-   Admin
-   Verification Executive
-   Service provider (a member with approved service listings)
-   Investor-interest member
-   Funding-seeker member
-   Mentor
-   Student/mentee
-   FIC operations staff

A person may act as a service requester and provider through the same
member account. These capabilities are not separate system roles unless
permissions require them.

## 4.2 Functional requirements

  -----------------------------------------------------------------------
  ID                                  Requirement
  ----------------------------------- -----------------------------------
  FR-001                              The system shall provide a public
                                      FIC landing page.

  FR-002                              Get Started shall open the
                                      registration introduction page.

  FR-003                              The system shall enforce minimum
                                      age eligibility of 18 years.

  FR-004                              A member shall have exactly one
                                      primary main category.

  FR-005                              Subcategories shall load
                                      dynamically from the selected
                                      category.

  FR-006                              Registration detail forms shall be
                                      configuration-driven.

  FR-007                              The system shall display the
                                      approved membership price and
                                      terms.

  FR-008                              Payment shall be verified
                                      server-side.

  FR-009                              The system shall support
                                      category-specific KYC requirements.

  FR-010                              Full dashboard access shall require
                                      all activation conditions.

  FR-011                              Members shall be able to track KYC
                                      status and resubmit documents.

  FR-012                              Admin users shall review and decide
                                      KYC applications according to
                                      permissions.

  FR-013                              Super Admin shall manage categories
                                      and subcategories.

  FR-014                              Authorized admins shall configure
                                      registration forms and dashboards.

  FR-015                              The dashboard shall render from
                                      published configuration.

  FR-016                              Eligible members shall discover
                                      approved services across all
                                      categories.

  FR-017                              Public service APIs shall not
                                      expose provider identity/contact
                                      details.

  FR-018                              Members shall submit service
                                      requests to FIC.

  FR-019                              FIC staff shall coordinate requests
                                      with providers.

  FR-020                              Members shall submit business ideas
                                      and development requests.

  FR-021                              Members shall submit private
                                      investment-readiness information.

  FR-022                              Members shall submit private
                                      funding requests.

  FR-023                              FIC staff shall review and
                                      coordinate partnership/networking
                                      requests.

  FR-024                              Mentoring shall support session,
                                      attendance, feedback and payout
                                      workflows.

  FR-025                              The system shall provide
                                      notifications and status history.

  FR-026                              The system shall maintain audit
                                      records for sensitive
                                      administrative actions.

  FR-027                              Membership renewal shall not
                                      override account suspension/block
                                      or revoked eligibility.

  FR-028                              The system shall support
                                      configurable membership reminders.

  FR-029                              The system shall provide reporting
                                      for membership, KYC, services and
                                      requests.

  FR-030                              The system shall support
                                      configuration versioning and
                                      controlled publication.
  -----------------------------------------------------------------------

## 4.3 Non-functional requirements

These are proposed engineering targets and must be validated against
budget, hosting and expected traffic.

  -----------------------------------------------------------------------
  ID                                  Requirement
  ----------------------------------- -----------------------------------
  NFR-001                             Responsive design for mobile,
                                      tablet and desktop.

  NFR-002                             Target monthly availability: 99.9%,
                                      subject to infrastructure and
                                      support model.

  NFR-003                             Target p95 normal read API latency
                                      below 500 ms under agreed load.

  NFR-004                             Secure transport using HTTPS in all
                                      deployed environments.

  NFR-005                             Sensitive documents must be private
                                      and access-controlled.

  NFR-006                             Payment webhooks must be
                                      signature-verified and idempotent.

  NFR-007                             Public APIs must enforce data
                                      minimization and field-level
                                      access.

  NFR-008                             Administrative actions must be
                                      auditable.

  NFR-009                             System must support backup and
                                      tested recovery procedures.

  NFR-010                             UI should target WCAG 2.2 AA
                                      accessibility practices.

  NFR-011                             APIs must use pagination and
                                      bounded query parameters.

  NFR-012                             Logs must avoid passwords, OTPs,
                                      payment secrets and unnecessary
                                      sensitive data.

  NFR-013                             Configuration publication must be
                                      versioned and reversible where
                                      feasible.

  NFR-014                             Application must support automated
                                      unit, integration and end-to-end
                                      tests.
  -----------------------------------------------------------------------

## 4.4 Business rules

1.  Only users aged 18 or above may register.
2.  One account has exactly one primary main category.
3.  Subcategories must belong to the selected main category.
4.  Main categories and subcategories are database/configuration-driven.
5.  Membership first-year fee is ₹99; subsequent annual renewal fee is
    ₹5,999, subject to approved tax and terms.
6.  Payment does not grant full dashboard access by itself.
7.  KYC approval is mandatory for full access.
8.  KYC resubmission does not require another membership payment.
9.  Only active, approved and eligible service listings appear in the
    marketplace.
10. Marketplace discovery is universal across member categories.
11. Provider identity/contact details are not public.
12. Service and business introductions are coordinated through FIC.
13. Investment/funding information is restricted to authorized FIC
    personnel.
14. Student-to-mentor direct payment is not supported.
15. Membership renewal does not bypass account suspension/block or
    revoked KYC.
16. Configuration changes must not silently alter historical
    submissions.
17. Every sensitive status change must record actor, timestamp, reason
    and prior/new state.

## 4.5 Access decision logic

Full dashboard access:

`accountStatus == ACTIVE`\
AND `paymentStatus == PAID`\
AND `kycStatus == APPROVED`\
AND `membershipStatus == ACTIVE`

The backend must enforce this rule for protected APIs. Frontend route
guards are supplementary only.

## 4.6 State management

Keep account, payment, KYC, membership and listing states separate. Do
not compress them into one generic status.

Example: - Account: ACTIVE / SUSPENDED / BLOCKED - Payment: PENDING /
PAID / FAILED / REFUNDED - KYC: NOT_STARTED / PENDING / UNDER_REVIEW /
ADDITIONAL_DOCUMENT_REQUIRED / APPROVED / REJECTED - Membership: PENDING
/ ACTIVE / EXPIRED / CANCELLED / SUSPENDED - Service listing: DRAFT /
PENDING / APPROVED / REJECTED / SUSPENDED / ARCHIVED

Define allowed transitions and actor permissions in implementation.

------------------------------------------------------------------------

# 5. User Roles and Permissions

## 5.1 Super Admin

-   Platform-wide monitoring
-   Create/manage Admin accounts
-   Configure role permissions
-   Manage categories and subcategories
-   Configure membership plans and pricing
-   Configure registration forms and KYC requirements
-   Configure dashboard templates and widgets
-   Configure service categories
-   Manage system settings
-   View financial and operational reports
-   Review audit logs
-   Suspend/block accounts according to policy

## 5.2 Admin

-   Manage member operations
-   Review member profiles
-   Handle KYC according to assigned permissions
-   Approve/reject service listings
-   Manage service requests
-   Handle business development requests
-   Review investment/funding interest
-   Coordinate partnerships and networking
-   Manage mentor operations and payout workflow
-   Handle complaints and support
-   Manage renewals and membership operations
-   View permitted reports

## 5.3 Verification Executive

-   View assigned KYC cases
-   Inspect permitted documents
-   Approve, reject or request additional documents according to granted
    permissions
-   Add internal notes
-   Record verification reasons
-   Track assigned workload

No financial configuration, staff administration or Super Admin settings
unless explicitly granted.

## 5.4 Member

-   Manage own profile
-   View membership and payment history
-   Submit KYC and corrections
-   Create/manage own service listings
-   Discover all approved services
-   Submit service requests
-   Submit business ideas and development requests
-   Express investment interest or submit funding requirements
-   Request networking and partnerships
-   Use mentoring features where eligible
-   Communicate with FIC
-   Track own requests and notifications

## 5.5 RBAC principles

-   Deny by default.
-   Enforce permissions in backend middleware/service layer.
-   Scope member access to their own records unless an explicit FIC
    workflow grants access.
-   Separate system role from business category.
-   Audit privileged access and sensitive document views.
-   Do not trust role or user identifiers sent by the browser without
    server-side verification.

------------------------------------------------------------------------

# 6. Solution Architecture

## 6.1 Architecture style

Use a **modular monolith** initially. Keep domain modules separated
inside one backend deployment. Do not begin with microservices unless
scale, team ownership or operational needs justify them.

## 6.2 Monorepo structure

``` text
fic-business-hub/
├── apps/
│   ├── web/                         # Website 1: public + member
│   │   ├── public/
│   │   └── src/
│   │       ├── app/
│   │       ├── assets/
│   │       ├── components/
│   │       ├── features/
│   │       │   ├── landing/
│   │       │   ├── auth/
│   │       │   ├── registration/
│   │       │   ├── membership/
│   │       │   ├── kyc/
│   │       │   ├── dashboard/
│   │       │   ├── marketplace/
│   │       │   ├── services/
│   │       │   ├── business-development/
│   │       │   ├── investment/
│   │       │   ├── partnerships/
│   │       │   ├── networking/
│   │       │   ├── mentoring/
│   │       │   ├── notifications/
│   │       │   └── profile/
│   │       ├── hooks/
│   │       ├── layouts/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── state/
│   │       ├── styles/
│   │       └── utils/
│   ├── admin/                        # Website 2: admin portal
│   │   └── src/
│   │       ├── app/
│   │       ├── components/
│   │       ├── features/
│   │       │   ├── dashboard/
│   │       │   ├── members/
│   │       │   ├── kyc/
│   │       │   ├── categories/
│   │       │   ├── configuration-builder/
│   │       │   ├── memberships/
│   │       │   ├── payments/
│   │       │   ├── services/
│   │       │   ├── requests/
│   │       │   ├── business-opportunities/
│   │       │   ├── investment-funding/
│   │       │   ├── partnerships/
│   │       │   ├── networking/
│   │       │   ├── mentoring/
│   │       │   ├── complaints/
│   │       │   ├── reports/
│   │       │   ├── staff/
│   │       │   └── audit-logs/
│   │       ├── layouts/
│   │       ├── routes/
│   │       └── services/
│   └── backend/                      # Shared API
│       └── src/
│           ├── config/
│           ├── database/
│           ├── common/
│           │   ├── constants/
│           │   ├── errors/
│           │   ├── middleware/
│           │   ├── utils/
│           │   ├── validators/
│           │   └── types/
│           ├── modules/
│           │   ├── auth/
│           │   ├── users/
│           │   ├── profiles/
│           │   ├── categories/
│           │   ├── subcategories/
│           │   ├── category-configurations/
│           │   ├── registration/
│           │   ├── dashboard/
│           │   ├── membership/
│           │   ├── payments/
│           │   ├── kyc/
│           │   ├── services/
│           │   ├── products/
│           │   ├── marketplace/
│           │   ├── connections/
│           │   ├── communication/
│           │   ├── business-ideas/
│           │   ├── business-development/
│           │   ├── investment/
│           │   ├── funding/
│           │   ├── partnerships/
│           │   ├── networking/
│           │   ├── mentoring/
│           │   ├── notifications/
│           │   ├── complaints/
│           │   ├── admin/
│           │   ├── reports/
│           │   └── audit-logs/
│           ├── integrations/
│           │   ├── payment-provider/
│           │   ├── email/
│           │   ├── sms/
│           │   ├── object-storage/
│           │   └── analytics/
│           ├── jobs/
│           ├── routes/
│           ├── app.ts
│           └── server.ts
├── packages/
│   ├── ui/
│   ├── shared-types/
│   ├── validators/
│   ├── api-client/
│   ├── auth/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── tailwind-config/
├── infrastructure/
│   ├── docker/
│   ├── aws/
│   └── monitoring/
├── docs/
│   └── FIC_BUSINESS_HUB_COMPLETE_PROJECT_BLUEPRINT.md
├── .env.example
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
└── README.md
```

The structure is a recommended target. Create folders progressively as
modules are implemented; avoid empty folders being mistaken for
completed features.

## 6.3 Workspace configuration

`pnpm-workspace.yaml`:

``` yaml
packages:
  - "apps/*"
  - "packages/*"
```

Root `package.json` should: - Be private. - Pin the actual pnpm version
using the `packageManager` field. - Provide `dev`, `build`, `lint`,
`typecheck` and `clean` scripts. - Use a compatible Turborepo version.

Example root scripts:

``` json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "clean": "turbo clean"
  }
}
```

Example `turbo.json`:

``` json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

Use compatible, currently supported dependency versions at
implementation time. Do not blindly copy old version numbers from
examples.

## 6.4 Backend module pattern

Each backend domain module should follow a consistent structure where
appropriate:

``` text
module-name/
├── module-name.model.ts
├── module-name.types.ts
├── module-name.validation.ts
├── module-name.repository.ts
├── module-name.service.ts
├── module-name.controller.ts
├── module-name.routes.ts
├── module-name.permissions.ts
└── module-name.test.ts
```

Do not force every module to contain unnecessary files. Keep business
logic out of controllers and enforce authorization in
services/repositories as appropriate.

## 6.5 Environments and domains

Example: - Local web: `http://localhost:5173` - Local admin:
`http://localhost:5174` - Local API: `http://localhost:5000` -
Production web: `https://www.ficapp.in` - Production admin:
`https://admin.ficapp.in` - Production API: `https://api.ficapp.in`

Configure ports explicitly. Production deployment, DNS, TLS, CORS and
cookie domains require environment-specific configuration.

------------------------------------------------------------------------

# 7. Dynamic Configuration Architecture

## 7.1 Configuration-driven components

The following must be database/configuration-driven: - Main categories -
Subcategories - Registration fields - Conditional questions - KYC
document requirements - Dashboard menus - Dashboard widgets - Category
features - Subcategory feature variations - Service categories -
Relevant filters and metadata

## 7.2 Configuration lifecycle

Suggested states: - DRAFT - IN_REVIEW - PUBLISHED - ARCHIVED

Publishing creates an immutable configuration version. Existing
registrations should retain the version used at submission. Changes
should be migrated explicitly, not silently.

## 7.3 Dashboard renderer

The dashboard engine should: 1. Read the member's primary category and
permitted subcategories. 2. Resolve the published category
configuration. 3. Resolve applicable subcategory features. 4. Apply
member permissions and account state. 5. Render only supported, approved
widget types. 6. Fetch data through authorized APIs. 7. Display a
graceful fallback for disabled or unavailable widgets.

Do not allow arbitrary code execution from dashboard configuration. Use
a registry of approved widget components.

------------------------------------------------------------------------

# 8. Data Architecture and MongoDB Collections

The following is a logical collection inventory. Final schema details,
indexes and retention rules must be reviewed before production.

  -----------------------------------------------------------------------
  Collection                          Purpose
  ----------------------------------- -----------------------------------
  users                               Authentication identity, account
                                      state, primary category reference

  memberProfiles                      Member profile and permitted
                                      business/professional details

  categories                          Main category records

  subcategories                       Subcategories linked to main
                                      categories

  categoryConfigurations              Versioned category behavior
                                      configuration

  registrationFormConfigurations      Dynamic form definitions and
                                      versions

  registrationSubmissions             Submitted form answers and config
                                      version

  dashboardConfigurations             Dashboard layouts and versions

  kycConfigurations                   Category/subcategory KYC rules

  kycApplications                     KYC case, status and decision
                                      history

  kycDocuments                        Private document metadata and
                                      storage references

  membershipPlans                     Membership pricing and terms
                                      versions

  memberships                         Member membership period and status

  payments                            Payment provider references and
                                      financial state

  paymentWebhookEvents                Idempotent webhook event records

  serviceListings                     Provider service listings and
                                      moderation status

  productListings                     Product listings, if enabled in
                                      approved scope

  businessIdeas                       Submitted business ideas

  businessDevelopmentRequests         Business support and scaling
                                      requests

  investmentProfiles                  Private investment readiness and
                                      preferences

  fundingRequests                     Private funding requirements

  investmentConnectionRequests        FIC-reviewed potential
                                      introductions

  partnershipRequests                 Business tie-up requests

  networkingRequests                  Networking and introduction
                                      requests

  connectionRequests                  Generic FIC-coordinated
                                      service/connection request records,
                                      if useful

  conversations                       FIC-mediated conversation threads

  messages                            Messages and moderation metadata

  mentoringSessions                   Scheduled/managed mentoring
                                      sessions

  sessionAttendance                   Attendance and completion evidence

  studentReviews                      Student feedback and ratings

  mentorPerformance                   Performance snapshots and
                                      evaluation evidence

  mentorCommissionRules               Configurable payout rules

  mentorCommissionTransactions        Calculated and approved commission
                                      ledger

  mentorPayouts                       Payout execution and reconciliation

  notifications                       In-app and delivery notification
                                      records

  complaints                          Complaints and dispute handling

  auditLogs                           Security and administrative audit
                                      records
  -----------------------------------------------------------------------

Avoid duplicating the same request across multiple collections without a
clear domain reason. Decide whether to use a shared request model with
typed payloads or separate domain collections based on query, privacy
and lifecycle needs.

## 8.1 User record principles

A user should contain: - Stable user ID - Authentication identifiers -
Account status - Primary category ID - Permitted subcategory IDs -
Registration/configuration version references - Membership/KYC
references or derived state - Created/updated timestamps

Do not store a `categories` array that allows multiple primary
categories. `primaryCategoryId` must be singular. Subcategories must be
validated against it.

## 8.2 Indexing

Plan indexes for: - Unique normalized email/mobile where policy
requires - Primary category and subcategory references -
Account/KYC/membership statuses - Membership expiry dates - Listing
status/category/search fields - Request status/assigned staff/created
date - Payment provider transaction IDs and webhook event IDs - Audit
actor/resource/timestamp - Notification recipient/read status

Use compound indexes based on actual query patterns. Validate index
impact with production-like data.

## 8.3 File storage

Store KYC and sensitive proposal documents in private object storage,
not public static folders. MongoDB should store metadata and object
references, not necessarily file bytes.

Use: - Encryption in transit and at rest - Short-lived signed URLs -
MIME/type and size validation - Malware scanning where feasible - Access
audit logs - Retention and deletion policies - Restricted staff access

------------------------------------------------------------------------

# 9. API Specification

Use versioned REST APIs under `/api/v1`. Publish OpenAPI documentation.
All endpoints require explicit authentication and authorization
decisions.

## 9.1 Public and authentication APIs

  ------------------------------------------------------------------------------------------------
  Method                  Endpoint                                         Purpose
  ----------------------- ------------------------------------------------ -----------------------
  GET                     `/api/v1/public/config`                          Public site
                                                                           configuration

  GET                     `/api/v1/categories`                             List published
                                                                           categories

  GET                     `/api/v1/categories/:categoryId/subcategories`   List subcategories

  GET                     `/api/v1/registration-form`                      Resolve form
                                                                           configuration

  POST                    `/api/v1/auth/register`                          Create
                                                                           account/application

  POST                    `/api/v1/auth/login`                             Login

  POST                    `/api/v1/auth/verify-otp`                        Verify OTP if enabled

  POST                    `/api/v1/auth/refresh`                           Refresh session/token

  POST                    `/api/v1/auth/logout`                            End session
  ------------------------------------------------------------------------------------------------

## 9.2 Registration, membership and KYC

  ------------------------------------------------------------------------------------------
  Method                  Endpoint                                   Purpose
  ----------------------- ------------------------------------------ -----------------------
  POST                    `/api/v1/registration-submissions`         Submit dynamic
                                                                     registration

  GET                     `/api/v1/registration-submissions/me`      View own submission

  GET                     `/api/v1/membership/plans`                 View published plans

  POST                    `/api/v1/membership/checkout`              Create payment order

  POST                    `/api/v1/payments/webhooks/:provider`      Verified payment
                                                                     webhook

  GET                     `/api/v1/payments/me`                      Own payment history

  POST                    `/api/v1/kyc/applications`                 Submit KYC

  GET                     `/api/v1/kyc/applications/me`              View KYC status

  POST                    `/api/v1/kyc/applications/:id/documents`   Add/correct documents
  ------------------------------------------------------------------------------------------

## 9.3 Dashboard and marketplace

  --------------------------------------------------------------------------------------
  Method                  Endpoint                               Purpose
  ----------------------- -------------------------------------- -----------------------
  GET                     `/api/v1/dashboard/my-configuration`   Resolve dashboard
                                                                 configuration

  GET                     `/api/v1/dashboard/my-summary`         Member dashboard
                                                                 summary

  GET                     `/api/v1/marketplace/services`         Universal service
                                                                 discovery

  GET                     `/api/v1/marketplace/services/:id`     Privacy-safe service
                                                                 detail

  POST                    `/api/v1/services`                     Submit own service
                                                                 listing

  GET                     `/api/v1/services/me`                  Manage own listings

  POST                    `/api/v1/connections`                  Submit FIC-mediated
                                                                 service request
  --------------------------------------------------------------------------------------

## 9.4 Business opportunity APIs

  --------------------------------------------------------------------------------------------
  Method                  Endpoint                                     Purpose
  ----------------------- -------------------------------------------- -----------------------
  POST                    `/api/v1/business-ideas`                     Submit idea

  GET                     `/api/v1/business-ideas/me`                  Own ideas

  POST                    `/api/v1/business-development-requests`      Request development
                                                                       support

  GET                     `/api/v1/business-development-requests/me`   Own requests

  POST                    `/api/v1/investment-profiles`                Submit private
                                                                       investment interest

  POST                    `/api/v1/funding-requests`                   Submit private funding
                                                                       need

  POST                    `/api/v1/partnership-requests`               Submit partnership
                                                                       request

  POST                    `/api/v1/networking-requests`                Submit networking
                                                                       request
  --------------------------------------------------------------------------------------------

## 9.5 Admin APIs

Examples: - `/api/v1/admin/members` - `/api/v1/admin/kyc` -
`/api/v1/admin/categories` - `/api/v1/admin/subcategories` -
`/api/v1/admin/configurations` -
`/api/v1/admin/dashboard-configurations` -
`/api/v1/admin/service-listings` - `/api/v1/admin/requests` -
`/api/v1/admin/investment` - `/api/v1/admin/funding` -
`/api/v1/admin/partnerships` - `/api/v1/admin/networking` -
`/api/v1/admin/mentoring` - `/api/v1/admin/reports` -
`/api/v1/admin/audit-logs`

These are endpoint groups, not a complete contract. For each implemented
endpoint define: - Method and path - Authentication requirement -
Permission - Request schema - Response schema - Validation and error
codes - Pagination/filter/sort - Idempotency where required - Audit
behavior - Rate limits

Never expose sensitive provider identity or investment details from
public endpoints.

------------------------------------------------------------------------

# 10. UI/UX Specification

## 10.1 Design principles

-   Premium, modern, trustworthy business-focused interface.
-   Simple and pleasant registration.
-   Clear progress indicator.
-   Consistent typography, spacing and component behavior.
-   Responsive desktop, tablet and mobile.
-   Accessible labels, keyboard navigation and contrast.
-   Clear loading, empty, error and success states.
-   No misleading promotional patterns.
-   Explain why sensitive information is requested.
-   Avoid overwhelming users with every module at once.

## 10.2 Suggested member navigation

Navigation must be configuration-driven. Possible common sections: -
Overview - My Profile - Membership - My Services - Discover Services -
Business Opportunities - Business Development - Investment/Funding -
Partnerships - Networking - My Requests - FIC Messages - Notifications -
Help & Support

## 10.3 Suggested admin navigation

-   Overview
-   Members
-   KYC Verification
-   Categories
-   Subcategories
-   Form Builder
-   Dashboard Builder
-   Memberships
-   Payments
-   Service Listings
-   Service Requests
-   Business Ideas
-   Business Development
-   Investment Interest
-   Funding Requests
-   Partnerships
-   Networking
-   Mentoring
-   Complaints
-   Reports
-   Staff & Permissions
-   Audit Logs
-   Settings

Navigation visibility must be permission-controlled.

------------------------------------------------------------------------

# 11. Key Business Workflows

## 11.1 Registration and activation

``` mermaid
flowchart TD
 A[Visitor opens landing page] --> B[Get Started]
 B --> C[Registration introduction and membership terms]
 C --> D[Basic registration]
 D --> E{Age 18 or above?}
 E -- No --> F[Stop registration]
 E -- Yes --> G[Select one main category]
 G --> H[Load subcategories]
 H --> I[Select permitted subcategory]
 I --> J[Load dynamic details form]
 J --> K[Submit registration details]
 K --> L[Create membership payment order]
 L --> M{Payment verified?}
 M -- No --> N[Show payment pending or failed]
 M -- Yes --> O[Create membership record]
 O --> P[Load dynamic KYC requirements]
 P --> Q[Submit KYC documents]
 Q --> R[Admin review]
 R --> S{KYC approved?}
 S -- No --> T[Request correction or reject]
 T --> Q
 S -- Yes --> U{Account and membership active?}
 U -- No --> V[Keep restricted status]
 U -- Yes --> W[Activate dynamic dashboard]
```

## 11.2 Universal service request

``` mermaid
flowchart TD
 A[Member browses all approved services] --> B[Select service]
 B --> C[Submit requirements]
 C --> D[FIC receives request]
 D --> E[FIC reviews and contacts requester]
 E --> F[Collect complete requirements]
 F --> G[Identify provider internally]
 G --> H[Contact provider]
 H --> I{Provider can proceed?}
 I -- No --> J[Find alternative or close request]
 I -- Yes --> K[Coordinate proposal]
 K --> L[Share next steps with requester]
 L --> M[Track progress]
 M --> N[Complete, cancel or dispute]
```

## 11.3 Investment/funding interest

``` mermaid
flowchart TD
 A[Member submits private investment or funding interest] --> B[Store restricted record]
 B --> C[Authorized FIC review]
 C --> D[Collect missing requirements]
 D --> E[Assess suitability and legal permissions]
 E --> F{Permitted introduction?}
 F -- No --> G[Hold, decline or request compliance review]
 F -- Yes --> H[Obtain appropriate consent]
 H --> I[Coordinate introduction]
 I --> J[Track outcome without handling funds unless separately approved]
```

## 11.4 KYC review

``` mermaid
flowchart TD
 A[Member submits KYC] --> B[Create review case]
 B --> C[Assign Verification Executive]
 C --> D[Document review]
 D --> E{Decision}
 E -- Approved --> F[Mark KYC approved]
 E -- More documents --> G[Notify member]
 G --> H[Member resubmits]
 H --> C
 E -- Rejected --> I[Record reason and notify member]
```

------------------------------------------------------------------------

# 12. Security and Privacy Requirements

## 12.1 Authentication and authorization

-   Hash passwords using a suitable modern password-hashing algorithm.
-   Use secure session or access/refresh-token architecture.
-   Protect cookies appropriately if cookie-based sessions are selected.
-   Add login, OTP and sensitive-action rate limits.
-   Use RBAC and deny-by-default authorization.
-   Validate all input on the server.
-   Apply secure headers and CORS allowlists.
-   Protect against common OWASP risks.
-   Avoid logging secrets, OTPs or full sensitive document contents.

## 12.2 Identity privacy

Public marketplace responses must be constructed using explicit
allowlisted fields. Do not serialize complete member documents and
attempt to remove private fields afterward.

Private provider identity should be available only to authorized FIC
staff who need it for a request.

Member-to-member messages and uploaded content may contain phone
numbers, emails or external links. Absolute prevention cannot be
guaranteed. Use: - Clear policy and warnings - Detection and moderation
where feasible - Restricted message visibility - Staff review and
reporting - Enforcement and audit process

FIC must still publish its own legitimate business identity, support and
legally required grievance contact details.

## 12.3 Financial and payment security

-   Use a compliant payment provider.
-   Do not store card credentials.
-   Verify webhook signatures.
-   Make webhook processing idempotent.
-   Reconcile provider events with internal payment records.
-   Keep immutable provider transaction references.
-   Separate payment success from KYC approval and dashboard activation.
-   Define refund, cancellation and chargeback handling.
-   Do not enable investment money custody or transfer without an
    approved legal and technical model.

## 12.4 Sensitive files

-   Private object storage.
-   Encryption at rest and in transit.
-   Short-lived signed download links.
-   Role-checked access.
-   Malware scanning where feasible.
-   File size/type validation.
-   Audit document access.
-   Retention and secure deletion policy.

------------------------------------------------------------------------

# 13. Indian Legal and Compliance Review

This section is a review checklist, not legal advice or a declaration of
compliance.

Obtain qualified Indian legal, CA and regulatory advice before launch.

Review applicability of: - Digital Personal Data Protection Act, 2023
and rules/commencement requirements applicable at launch - Information
Technology Act and applicable rules - Consumer Protection Act and
E-Commerce Rules, where applicable - GST registration, tax treatment,
invoicing and accounting - Payment aggregator/provider contractual and
regulatory requirements - KYC and record-retention obligations
applicable to FIC's actual business activities - Sector-specific
requirements for finance, healthcare, education and other regulated
areas - Investment solicitation, securities, lending, collective
investment, deposit-taking and financial-advisory boundaries -
Employment, contractor, mentor and service-provider agreements -
Grievance handling, refunds, cancellations and dispute resolution

Do not assume that describing FIC as an intermediary automatically
exempts it from legal responsibilities. Legal classification depends on
actual activities, contracts, money flows, representations and control.

------------------------------------------------------------------------

# 14. Mentoring and FIC-Funded Commission

## 14.1 Approved operating direction

-   Students request mentoring through FIC.
-   Students do not pay mentors directly.
-   FIC manages mentor selection, session tracking and quality
    evaluation.
-   FIC pays eligible mentors from an approved company budget.
-   Payout is subject to completed sessions, attendance, feedback,
    complaint checks, approval and reconciliation.

## 14.2 Suggested workflow

1.  Student requests mentoring.
2.  FIC reviews and assigns/coordinates mentor.
3.  Session is scheduled.
4.  Attendance and completion are recorded.
5.  Student submits feedback.
6.  FIC evaluates mentor performance.
7.  Eligible commission/payout is calculated using approved configurable
    rules.
8.  Authorized staff approve.
9.  Finance executes payout through approved provider/process.
10. Ledger and payout status are reconciled.

Commission percentages, score weights, payout rates and budget amounts
are not finalized. Store them as effective-dated configuration, with
approval history.

------------------------------------------------------------------------

# 15. Notifications and Communication

Support notification channels as configured: - In-app notifications -
Email - SMS - Other approved channels

Events may include: - Registration created - Payment success/failure -
KYC submitted - KYC additional documents requested - KYC
approved/rejected - Dashboard activated - Membership expiry reminders -
Service listing approved/rejected - Service request status changed -
Business request update - Meeting scheduled - Networking/partnership
update - Mentor session update - Complaint update

Use notification templates with versioning. Do not expose sensitive
information in notification previews. Provide user preferences where
appropriate and honor required transactional communications.

------------------------------------------------------------------------

# 16. Reporting and Analytics

## 16.1 Admin dashboard metrics

Potential KPIs: - Total registered members - Active members - Pending
KYC - Approved KYC - Expired memberships - Membership revenue - Payment
failures/refunds - Active service listings - Pending listing approvals -
Service requests by status - Business development requests -
Investment/funding interest counts - Partnership/networking requests -
Complaints and resolution time - Mentor sessions and payouts

Define each metric, filters, timezone, source of truth and calculation
before presenting it as a financial or operational fact.

## 16.2 Privacy

Reports must use role-appropriate aggregation. Restrict personally
identifiable and financial information. Export permissions must be
separately controlled and audited.

------------------------------------------------------------------------

# 17. Testing Strategy

## 17.1 Testing levels

-   Unit tests for business logic and validators
-   Integration tests for database and API modules
-   API contract tests
-   Frontend component tests
-   End-to-end user journeys
-   Role/permission tests
-   Security and privacy tests
-   Payment webhook tests
-   File upload tests
-   Performance/load tests
-   Backup and restore tests
-   Responsive and accessibility tests

## 17.2 Critical test scenarios

### Registration

-   Under-18 user cannot proceed.
-   User can select only one primary category.
-   Subcategories are limited to selected category.
-   Dynamic form changes correctly.
-   Required conditional fields validate correctly.
-   Configuration version is stored with submission.

### Payment

-   Successful provider webhook updates payment exactly once.
-   Duplicate webhook does not duplicate membership.
-   Frontend cannot forge payment success.
-   Failed payment does not activate membership.
-   KYC resubmission does not charge again.
-   Refund/chargeback updates access according to policy.

### KYC and access

-   Pending KYC cannot access protected dashboard APIs.
-   Approved KYC plus paid active membership grants access.
-   Suspended/blocked account cannot bypass restrictions.
-   Additional-document request allows resubmission.
-   Staff actions are audited.

### Marketplace privacy

-   Every eligible category can discover all approved services.
-   Inactive/unapproved services are hidden.
-   Public API never returns provider name/company/private contact.
-   Authorized FIC staff can access provider details for assigned work.
-   Search and filters do not leak hidden fields.

### Business and investment workflows

-   Requests are visible only to requester and authorized FIC staff.
-   Investment amounts are not exposed publicly.
-   Consent and staff actions are recorded.
-   No unapproved money-transfer functionality is available.

### Dashboard configuration

-   Correct category dashboard loads.
-   Subcategory features apply correctly.
-   Draft configuration is not public.
-   Published version is stable.
-   Old submissions remain associated with their original version.

## 17.3 Definition of Done

A feature is complete only when: - Requirements are documented. - UI and
backend are integrated. - Authorization is enforced. - Validation and
error handling exist. - Tests pass. - Privacy/security checks pass. -
Relevant API documentation is updated. - Acceptance criteria are met. -
No fake success or placeholder integration is represented as
production-ready.

------------------------------------------------------------------------

# 18. Deployment and Infrastructure

## 18.1 Suggested deployment topology

-   Member website: static/web hosting behind CDN
-   Admin website: separately deployed web application
-   Backend: managed application/container hosting
-   MongoDB: managed MongoDB deployment
-   Redis: managed Redis if background jobs or caching require it
-   Object storage: private bucket for KYC and sensitive files
-   CDN: public assets only; never publicly cache private KYC documents
-   Monitoring: centralized logs, metrics, uptime and error tracking

## 18.2 Environment separation

Maintain separate: - Local development - Development/test - Staging -
Production

Use separate databases, storage buckets, credentials and
payment-provider modes. Production secrets must never be committed to
Git.

## 18.3 Environment variables

Provide `.env.example` with variable names and safe placeholders, for
example:

``` env
NODE_ENV=development
PORT=5000
MONGODB_URI=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
WEB_ORIGIN=http://localhost:5173
ADMIN_ORIGIN=http://localhost:5174
PAYMENT_PROVIDER_KEY=
PAYMENT_PROVIDER_SECRET=
PAYMENT_WEBHOOK_SECRET=
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_REGION=
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=
EMAIL_PROVIDER_API_KEY=
SMS_PROVIDER_API_KEY=
```

Do not commit real values. Prefer a managed secret store in production.

## 18.4 CI/CD

Suggested pipeline: 1. Install dependencies using lockfile. 2. Lint. 3.
Typecheck. 4. Unit and integration tests. 5. Build all applications. 6.
Security/dependency checks. 7. Deploy to staging. 8. Run smoke tests. 9.
Obtain production approval. 10. Deploy production and verify health.

Use database migration/index rollout procedures and rollback plans.

------------------------------------------------------------------------

# 19. Implementation Roadmap

## Phase 0 -- Repository foundation

-   Inspect repository.
-   Create/validate Turborepo + pnpm.
-   Create apps/web, apps/admin and apps/backend.
-   Create shared packages.
-   Configure TypeScript, linting, formatting and environment files.
-   Ensure `pnpm install`, `pnpm dev`, build and typecheck work.

**Exit criteria:** Clean monorepo foundation with both websites and
backend booting independently.

## Phase 1 -- Product and UI foundation

-   Confirm design system.
-   Shared UI components.
-   Public landing page.
-   Get Started introduction page.
-   Membership offer presentation.
-   Responsive layouts.

**Exit criteria:** Approved public journey and visual foundation.

## Phase 2 -- Dynamic configuration foundation

-   Category/subcategory data model.
-   Configuration versioning.
-   Registration form builder.
-   Safe field renderer.
-   Conditional logic.
-   Admin draft/preview/publish.

**Exit criteria:** A new configured category and form can be published
without writing category-specific frontend code, within the supported
component system.

## Phase 3 -- Registration, membership and KYC

-   Basic account registration and age check.
-   Category/subcategory selection.
-   Dynamic details form.
-   Payment order and webhook.
-   Membership lifecycle.
-   KYC upload and review.
-   Application tracking and resubmission.
-   Access activation rules.

**Exit criteria:** End-to-end registration works with real test
payment-provider integration and KYC review.

## Phase 4 -- Dynamic dashboard engine

-   Shared dashboard renderer.
-   Category dashboard configurations.
-   Subcategory features.
-   Permission-aware menus and widgets.
-   Dashboard data APIs.

**Exit criteria:** Multiple category experiences render through one
engine.

## Phase 5 -- Universal marketplace

-   Service listing creation.
-   Admin moderation.
-   Universal discovery.
-   Search and filters.
-   Privacy-safe public API.
-   FIC-mediated service requests.
-   Request tracking and communication.

**Exit criteria:** Cross-category discovery and provider privacy pass
tests.

## Phase 6 -- Business ecosystem modules

-   Business ideas.
-   Business development/scaling.
-   Investment interest.
-   Funding requests.
-   Partnerships.
-   Networking.
-   FIC coordination workflows.

**Exit criteria:** Requests are securely submitted, reviewed, assigned
and tracked.

## Phase 7 -- Mentoring and operations

-   Mentor/student workflows.
-   Session scheduling and attendance.
-   Feedback and performance.
-   Configurable FIC-funded payout.
-   Admin reports and complaints.

**Exit criteria:** No student-to-mentor checkout; approved payout
workflow is auditable.

## Phase 8 -- Hardening and launch

-   Security testing.
-   Privacy audit.
-   Performance/load testing.
-   Accessibility.
-   Backup and restore.
-   Legal/compliance sign-off.
-   Staging UAT.
-   Production deployment.

**Exit criteria:** Business, legal, security and technical owners
approve launch readiness.

------------------------------------------------------------------------

# 20. Project Management and Governance

## 20.1 Required project artifacts

This consolidated document is the baseline. For larger teams, split it
into: - BRD.md - PRD.md - SRS.md - SYSTEM_ARCHITECTURE.md -
DATABASE_SCHEMA.md - API_DOCUMENTATION.md - UI_UX_SPECIFICATION.md -
SECURITY_AND_PRIVACY.md - TESTING_STRATEGY.md -
DEPLOYMENT_AND_INFRASTRUCTURE.md - IMPLEMENTATION_ROADMAP.md -
OPEN_DECISIONS.md

Maintain one documentation index and version consistency.

## 20.2 Change control

Every material change should record: - Change ID - Requester - Reason -
Affected business rule - Affected UI/API/database/security/test areas -
Cost and schedule impact - Approval - Version and effective date

Do not change membership pricing, investment workflow, privacy policy or
KYC policy through an undocumented code change.

## 20.3 Traceability

Maintain a traceability matrix:

  ------------------------------------------------------------------------------------------------------
  Business       Product          API/data             UI                   Test case        Status
  requirement    requirement                                                                 
  -------------- ---------------- -------------------- -------------------- ---------------- -----------
  18+            Registration age Auth/registration    Signup               REG-AGE-001      Pending
  eligibility    check                                                                       

  One primary    Category         User/category        Signup               REG-CAT-001      Pending
  category       selection                                                                   

  Dynamic form   Configured       Form                 Registration         REG-FORM-001     Pending
                 fields           config/submission                                          

  Payment before Membership       Payment/membership   Checkout             PAY-001          Pending
  KYC            checkout                                                                    

  KYC approval   Activation gate  KYC/account          Tracking/dashboard   KYC-ACCESS-001   Pending
  for access                                                                                 

  Universal      Cross-category   Service listing      Marketplace          MKT-UNIV-001     Pending
  discovery      marketplace                                                                 

  Provider       Allowlisted      Marketplace API      Listing detail       PRIV-SVC-001     Pending
  privacy        response                                                                    

  FIC            Request workflow Requests/messages    Request tracking     REQ-FIC-001      Pending
  coordination                                                                               
  ------------------------------------------------------------------------------------------------------

Expand this matrix during detailed implementation.

------------------------------------------------------------------------

# 21. Acceptance Criteria -- Product-Level

The initial release is acceptable only when:

1.  A visitor can understand FIC's purpose and start registration.
2.  A person under 18 cannot register.
3.  A member can select exactly one primary category.
4.  Subcategories and details questions load dynamically.
5.  Admin can manage category and form configuration.
6.  The first-year ₹99 price and second-year ₹5,999 renewal are
    accurately disclosed according to approved tax/terms.
7.  Payment is verified server-side.
8.  KYC requirements are category/subcategory-aware.
9.  Full dashboard access is blocked until all activation conditions
    pass.
10. KYC correction does not create a duplicate membership charge.
11. A single dashboard engine renders different category experiences.
12. Members can discover approved services from all categories.
13. Public service APIs do not reveal provider identity/company/private
    contact details.
14. Service requests are routed through FIC.
15. Business development, investment interest, funding, partnership and
    networking requests can be securely submitted and tracked.
16. Investment and funding details remain private to authorized FIC
    staff.
17. Mentoring does not collect direct student-to-mentor payment.
18. Admin actions and sensitive data access are auditable.
19. Critical end-to-end, privacy and authorization tests pass.
20. Legal, tax, privacy and operational launch dependencies have been
    reviewed.

------------------------------------------------------------------------

# 22. Assumptions and Recommendations

These points are proposed unless explicitly approved by FIC:

-   The initial architecture is a modular monolith.
-   The first-year membership period begins on successful payment,
    subject to approved terms.
-   The member dashboard remains restricted while KYC is pending.
-   KYC rejection permits correction/resubmission without another
    membership charge.
-   Multiple subcategories may be allowed within one primary category if
    configured.
-   Service visibility requires provider eligibility, active membership,
    approved KYC and listing approval.
-   Service location is privacy-safe and configurable.
-   Category and dashboard configurations are versioned.
-   Investment/funding features initially manage private interest and
    introductions only.
-   Mentor payout rules are configurable and funded by FIC's approved
    budget.
-   Proposed uptime/performance/accessibility targets are engineering
    goals, not guarantees.

------------------------------------------------------------------------

# 23. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                    Impact                  Mitigation
  ----------------------- ----------------------- -----------------------
  Unclear business rules  Rework and disputes     Approve BRD and open
                                                  decisions before coding

  Dynamic engine          Delayed delivery        Build a safe, limited
  over-complexity                                 field/widget registry
                                                  first

  Privacy leakage         Legal and trust damage  Backend allowlists,
                                                  RBAC, privacy tests and
                                                  audit

  Investment regulatory   Severe legal risk       Limit initial feature
  exposure                                        to private interest
                                                  workflow pending advice

  Payment webhook errors  Incorrect membership    Signature verification,
                          state                   idempotency and
                                                  reconciliation

  KYC document exposure   Sensitive data breach   Private storage,
                                                  short-lived URLs and
                                                  access logs

  Configuration changes   Data corruption         Immutable versions and
  affect old users                                explicit migrations

  Uncontrolled scope      Cost and timeline       Phased roadmap and
                          growth                  change control

  Provider does not       Poor service experience SLA policy, escalation
  respond                                         and
                                                  alternative-provider
                                                  process

  Fake or misleading      Member harm             Moderation,
  listings                                        verification and
                                                  complaint workflow
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 24. Open Decisions Requiring FIC Approval

Do not invent answers to these questions. Record the final decision,
owner and approval date.

## Membership and finance

1.  Is ₹99 inclusive of GST or exclusive?
2.  Is ₹5,999 inclusive of GST or exclusive?
3.  Is renewal manual or automatic?
4.  What is the exact grace period after expiry?
5.  What is the refund/cancellation policy?
6.  What happens if payment succeeds but KYC is never completed?
7.  Are partial refunds or chargebacks supported?
8.  What invoice and accounting process will be used?

## Registration and KYC

9.  Which identity and business documents are mandatory for each
    subcategory?
10. Which categories require enhanced verification?
11. What is the expected KYC review SLA?
12. Can a member change their primary category later? If yes, what
    approval and migration process applies?
13. Are multiple subcategories allowed for every category or configured
    individually?

## Marketplace and service operations

14. Does FIC charge a coordination fee, service fee or commission? No
    fee should be assumed until approved.
15. What service-provider response SLA applies?
16. How are quotes, proposals, cancellation and disputes handled?
17. What information may be shared with the provider after requester
    consent?
18. Which locations may be displayed publicly?
19. What is the service listing validity and renewal policy?

## Investment and funding

20. What exact activities will FIC perform: interest collection,
    introductions, consultancy or regulated facilitation?
21. Will FIC ever receive, hold, transfer or disburse investment funds?
22. What legal/regulatory approvals and partner arrangements are
    required?
23. What suitability, consent, risk disclosure and record-retention
    process applies?
24. Can an investor's amount be shared with a potential funding seeker,
    and only under what consent?

## Mentoring

25. What is the mentor compensation model?
26. What are the approved performance measures and payout rules?
27. What is the review period and payout schedule?
28. Who approves mentor payouts and from which budget?

## Operations and technology

29. Which payment provider will be used?
30. Which email/SMS providers will be used?
31. Which cloud provider and region will host production data?
32. What are expected user volumes and launch geography?
33. What support hours and escalation SLA will FIC provide?
34. What languages are required at launch?
35. What data retention and deletion periods apply?

------------------------------------------------------------------------

# 25. Final Instruction to Antigravity / Development Team

Use this document as the baseline product and technical specification.

Before coding: 1. Inspect the existing repository. 2. Confirm the two
websites and one shared backend architecture. 3. Validate the monorepo
foundation. 4. Review this document with the FIC business owner. 5.
Resolve critical open decisions. 6. Produce a phased implementation plan
and traceability matrix.

Do not: - Build separate applications for each category. - Hardcode
category/subcategory lists into application logic. - Create separate
dashboard codebases for every category. - Restrict universal marketplace
visibility by a member's primary category. - Expose provider identity or
private contact details in public APIs. - Activate full dashboard access
based on payment alone. - Charge again for KYC resubmission. - Create
direct student-to-mentor payments. - Enable unapproved investment
transactions or money custody. - Claim that a feature is complete
without implementation and testing. - Replace existing working code
without inspection and approval.

Build incrementally, preserve existing work, use typed contracts,
validate at API boundaries, enforce authorization on the server, and
maintain tests and documentation.

**Product outcome:** A configurable, privacy-conscious FIC Business Hub
where eligible people can join, offer and discover services, submit
business opportunities, seek development support, express
investment/funding interest and build partnerships through FIC's
coordinated ecosystem.

**END OF DOCUMENT**
