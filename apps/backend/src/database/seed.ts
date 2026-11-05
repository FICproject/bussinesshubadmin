import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { AdminUserModel } from './AdminUser';
import { CategoryModel } from './Category';
import { MemberModel } from './Member';
import { KycSubmissionModel } from './KycSubmission';
import { ServiceListingModel } from './ServiceListing';
import { FicRequestModel } from './FicRequest';
import { PaymentModel } from './Payment';
import { AuditLogModel } from './AuditLog';
import { MeetingModel } from './Meeting';
import { SupportTicketModel } from './SupportTicket';
import { ReferralConfigModel, ReferralRecordModel } from './Referral';
import { FundingApplicationModel } from './FundingApplication';
import { InvestmentPoolModel } from './InvestmentPool';
import { config } from '../config/env';

export async function seedDatabase() {
  try {
    const adminCount = await AdminUserModel.countDocuments();
    let superAdminUser: any;
    if (adminCount === 0) {
      console.log('Seeding initial Super Admin and Operations Admin...');
      const superAdminPassword = await bcrypt.hash(config.seed.superAdminPassword, config.bcryptSaltRounds);
      const adminPassword = await bcrypt.hash(config.seed.adminPassword, config.bcryptSaltRounds);
      const admins = await AdminUserModel.create([
        {
          name: 'FIC Super Administrator',
          email: config.seed.superAdminEmail.toLowerCase(),
          passwordHash: superAdminPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
          permissions: ['*'],
        },
        {
          name: 'FIC Operations Admin',
          email: config.seed.adminEmail.toLowerCase(),
          passwordHash: adminPassword,
          role: 'ADMIN',
          isActive: true,
          permissions: ['MEMBER_MANAGEMENT', 'SERVICE_MODERATION', 'REQUESTS', 'KYC_VERIFICATION'],
        },
      ]);
      superAdminUser = admins[0];
    } else {
      superAdminUser = await AdminUserModel.findOne({ role: 'SUPER_ADMIN' });
    }

    const categoryCount = await CategoryModel.countDocuments();
    let catBusiness: any;
    let catTech: any;

    if (categoryCount === 0) {
      console.log('Seeding baseline FIC categories & KYC requirements...');
      catBusiness = await CategoryModel.create({
        name: 'Business Owners & Entrepreneurs',
        slug: 'business-owners-entrepreneurs',
        description: 'Entrepreneurs, founders, traders, wholesalers, and manufacturers.',
        icon: 'Briefcase',
        allowMultipleSubcategories: true,
        subcategories: [
          { name: 'Manufacturing & Garments', slug: 'manufacturing-garments', isActive: true },
          { name: 'Retail & Wholesale', slug: 'retail-wholesale', isActive: true },
          { name: 'Import / Export', slug: 'import-export', isActive: true },
        ],
        customFields: [
          { fieldKey: 'gstin', label: 'GSTIN Number', type: 'text', required: false, placeholder: '22AAAAA0000A1Z5' },
          { fieldKey: 'businessType', label: 'Entity Type', type: 'select', required: true, options: ['Proprietorship', 'Partnership', 'Private Limited', 'LLP'] },
        ],
        kycRequirements: [
          { docKey: 'id_proof', title: 'Director / Owner Aadhaar/PAN', required: true, allowedExtensions: ['pdf', 'jpg', 'png'], maxSizeMB: 5 },
          { docKey: 'business_reg', title: 'Business Registration / Udyam / GST Certificate', required: true, allowedExtensions: ['pdf', 'jpg', 'png'], maxSizeMB: 10 },
        ],
      });

      catTech = await CategoryModel.create({
        name: 'Freelancers & IT Professionals',
        slug: 'freelancers-it-professionals',
        description: 'Software developers, designers, cloud architects, and tech consultants.',
        icon: 'Code',
        allowMultipleSubcategories: true,
        subcategories: [
          { name: 'Web & Mobile App Development', slug: 'web-mobile-app-development', isActive: true },
          { name: 'Cloud & DevOps Engineering', slug: 'cloud-devops', isActive: true },
          { name: 'UI/UX Design', slug: 'ui-ux-design', isActive: true },
        ],
        kycRequirements: [
          { docKey: 'pan_card', title: 'Individual PAN Card', required: true, allowedExtensions: ['pdf', 'jpg', 'png'], maxSizeMB: 5 },
          { docKey: 'portfolio_or_id', title: 'National ID / Aadhaar', required: true, allowedExtensions: ['pdf', 'jpg'], maxSizeMB: 5 },
        ],
      });
    } else {
      catBusiness = await CategoryModel.findOne({ slug: 'business-owners-entrepreneurs' });
      catTech = await CategoryModel.findOne({ slug: 'freelancers-it-professionals' });
    }

    const memberCount = await MemberModel.countDocuments();
    if (memberCount === 0 && catBusiness && catTech) {
      console.log('Seeding sample members and KYC submissions...');
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const member1 = await MemberModel.create({
        name: 'Rajesh Textiles Pvt Ltd (Rajesh Kumar)',
        email: 'rajesh@texhub.example.com',
        phone: '+91 98765 43210',
        primaryCategory: catBusiness._id,
        primaryCategoryName: catBusiness.name,
        subcategories: ['Manufacturing & Garments'],
        status: 'UNDER_REVIEW',
        membershipPlan: 'FIRST_YEAR_INTRO',
        membershipFeePaid: 99,
        paymentStatus: 'PAID',
        kycStatus: 'SUBMITTED',
        membershipExpiresAt: expiryDate,
      });

      await KycSubmissionModel.create({
        memberId: member1._id,
        memberName: member1.name,
        memberEmail: member1.email,
        memberPhone: member1.phone,
        categoryId: catBusiness._id,
        categoryName: catBusiness.name,
        status: 'SUBMITTED',
        documents: [
          {
            docKey: 'id_proof',
            title: 'Owner PAN Card',
            fileName: 'pan_rajesh_kumar.pdf',
            fileUrl: 'https://placehold.co/600x400/png?text=PAN+Document+Rajesh+Kumar',
            uploadedAt: new Date().toISOString(),
            status: 'PENDING',
          },
          {
            docKey: 'business_reg',
            title: 'Udyam Registration Certificate',
            fileName: 'udyam_texhub_2026.pdf',
            fileUrl: 'https://placehold.co/600x400/png?text=Udyam+Registration+Certificate',
            uploadedAt: new Date().toISOString(),
            status: 'PENDING',
          },
        ],
      });

      const member2 = await MemberModel.create({
        name: 'Ananya Roy (Senior Fullstack Architect)',
        email: 'ananya.dev@example.com',
        phone: '+91 91234 56789',
        primaryCategory: catTech._id,
        primaryCategoryName: catTech.name,
        subcategories: ['Web & Mobile App Development'],
        status: 'ACTIVE',
        membershipPlan: 'FIRST_YEAR_INTRO',
        membershipFeePaid: 99,
        paymentStatus: 'PAID',
        kycStatus: 'APPROVED',
        membershipExpiresAt: expiryDate,
      });

      await KycSubmissionModel.create({
        memberId: member2._id,
        memberName: member2.name,
        memberEmail: member2.email,
        memberPhone: member2.phone,
        categoryId: catTech._id,
        categoryName: catTech.name,
        status: 'APPROVED',
        verifiedAt: new Date(),
        reviewerNotes: 'Verified via national identity and MCA portal.',
        documents: [
          {
            docKey: 'pan_card',
            title: 'Individual PAN Card',
            fileName: 'pan_ananya_roy.pdf',
            fileUrl: 'https://placehold.co/600x400/png?text=PAN+Card+-+Ananya+Roy',
            uploadedAt: new Date().toISOString(),
            status: 'VERIFIED',
          },
          {
            docKey: 'national_id',
            title: 'Aadhaar / National ID Proof',
            fileName: 'aadhaar_ananya_roy.pdf',
            fileUrl: 'https://placehold.co/600x400/png?text=National+ID+-+Ananya+Roy',
            uploadedAt: new Date().toISOString(),
            status: 'VERIFIED',
          },
        ],
      });

      const member3 = await MemberModel.create({
        name: 'Kavitha Ramachandran (FinTech Compliance Advisor)',
        email: 'kavitha.finlegal@example.com',
        phone: '+91 94432 78901',
        primaryCategory: catBusiness._id,
        primaryCategoryName: catBusiness.name,
        subcategories: ['Import / Export', 'Retail & Wholesale'],
        status: 'ACTIVE',
        membershipPlan: 'STANDARD_ANNUAL',
        membershipFeePaid: 5999,
        paymentStatus: 'PAID',
        kycStatus: 'APPROVED',
        membershipExpiresAt: expiryDate,
      });

      await KycSubmissionModel.create({
        memberId: member3._id,
        memberName: member3.name,
        memberEmail: member3.email,
        memberPhone: member3.phone,
        categoryId: catBusiness._id,
        categoryName: catBusiness.name,
        status: 'APPROVED',
        verifiedAt: new Date(),
        reviewerNotes: 'Verified via Bar Council & RBI Regulatory Practitioner ID.',
        documents: [
          {
            docKey: 'id_proof',
            title: 'Director Aadhaar / PAN Card',
            fileName: 'pan_kavitha_ramachandran.pdf',
            fileUrl: 'https://placehold.co/600x400/png?text=PAN+Card+-+Kavitha+R',
            uploadedAt: new Date().toISOString(),
            status: 'VERIFIED',
          },
          {
            docKey: 'business_reg',
            title: 'Professional Practice Certificate',
            fileName: 'practice_cert_kavitha.pdf',
            fileUrl: 'https://placehold.co/600x400/png?text=Practice+Certificate',
            uploadedAt: new Date().toISOString(),
            status: 'VERIFIED',
          },
        ],
      });

      const serviceListing = await ServiceListingModel.create({
        title: 'Custom Enterprise Cloud & MERN Architecture Setup',
        categoryId: catTech._id,
        categoryName: catTech.name,
        description: 'Scalable multi-tenant Node.js + React cloud setup with CI/CD deployment on AWS.',
        providerId: member2._id,
        providerPrivateName: member2.name,
        providerEmail: member2.email,
        locationState: 'Karnataka',
        pricingEstimate: '₹25,000 - ₹80,000',
        status: 'APPROVED',
      });

      await ServiceListingModel.create({
        title: 'FinTech Legal Compliance & Audit Advisory',
        categoryId: catBusiness._id,
        categoryName: catBusiness.name,
        description: 'Corporate governance, RBI regulatory checks, ROC filings, and cross-border commercial compliance.',
        providerId: member3._id,
        providerPrivateName: member3.name,
        providerEmail: member3.email,
        locationState: 'Tamil Nadu',
        pricingEstimate: '₹15,000 - ₹50,000',
        status: 'APPROVED',
      });

      await FicRequestModel.create({
        type: 'SERVICE_INQUIRY',
        title: 'Need Enterprise Cloud Setup for Textile ERP',
        description: 'Looking to hire verified architect through FIC for upgrading legacy inventory ERP to cloud.',
        requesterId: member1._id,
        requesterName: member1.name,
        requesterEmail: member1.email,
        targetServiceId: undefined,
        targetProviderId: undefined,
        status: 'NEW',
        internalNotes: ['FIC Desk: Verified requester is an active business member. Waiting for admin to assign service provider.'],
      });

      // Seed mock payments
      const paymentCount = await PaymentModel.countDocuments();
      if (paymentCount === 0) {
        await PaymentModel.create([
          {
            memberId: member1._id,
            amount: 99,
            currency: 'INR',
            paymentType: 'INTRO_FEE',
            status: 'SUCCESS',
            gatewayPaymentId: 'pay_fic_intro_9921',
            invoiceNumber: 'INV-2026-001',
            paidAt: new Date(),
          },
          {
            memberId: member2._id,
            amount: 99,
            currency: 'INR',
            paymentType: 'INTRO_FEE',
            status: 'SUCCESS',
            gatewayPaymentId: 'pay_fic_intro_9922',
            invoiceNumber: 'INV-2026-002',
            paidAt: new Date(),
          },
          {
            memberId: member1._id,
            amount: 5999,
            currency: 'INR',
            paymentType: 'ANNUAL_RENEWAL',
            status: 'PENDING',
            invoiceNumber: 'INV-2026-003',
          },
        ]);
      }

      // Seed mock audit logs
      const auditCount = await AuditLogModel.countDocuments();
      if (auditCount === 0 && superAdminUser) {
        await AuditLogModel.create([
          {
            adminId: superAdminUser._id,
            adminName: superAdminUser.name,
            adminRole: superAdminUser.role,
            action: 'VERIFY_KYC',
            entityType: 'Member',
            entityId: member2._id.toString(),
            details: { message: 'Approved fullstack architect onboarding' },
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
          },
          {
            adminId: superAdminUser._id,
            adminName: superAdminUser.name,
            adminRole: superAdminUser.role,
            action: 'MODERATE_SERVICE',
            entityType: 'ServiceListing',
            entityId: serviceListing._id.toString(),
            details: { message: 'Pending verification check' },
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
          },
          {
            adminId: superAdminUser._id,
            adminName: superAdminUser.name,
            adminRole: superAdminUser.role,
            action: 'DISBURSE_PAYMENT',
            entityType: 'Payment',
            entityId: member1._id.toString(),
            details: { message: 'Intro fee acknowledged' },
            timestamp: new Date(Date.now() - 1000 * 60 * 90),
          },
        ]);
      }

      // Seed mock Meetings
      const meetingCount = await MeetingModel.countDocuments();
      if (meetingCount === 0 && superAdminUser) {
        console.log('Seeding mock Meetings...');
        await MeetingModel.create([
          {
            title: 'FIC Membership Onboarding & Enterprise Consultation',
            description: 'Introductory orientation call regarding enterprise marketplace listing and export compliance.',
            hostAdminId: superAdminUser._id,
            participantMemberIds: [member1._id],
            scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
            durationMinutes: 45,
            meetingLink: 'https://meet.google.com/fic-demo-onboard',
            status: 'SCHEDULED',
            notificationSent: true,
          },
          {
            title: 'Technical Diligence & Product Pitch Review',
            description: 'Architecture review for Cloud ERP service offering.',
            hostAdminId: superAdminUser._id,
            participantMemberIds: [member2._id],
            scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            durationMinutes: 30,
            meetingLink: 'https://meet.google.com/fic-tech-review',
            status: 'COMPLETED',
            notificationSent: true,
          },
        ]);
      }

      // Seed mock Support Tickets
      const ticketCount = await SupportTicketModel.countDocuments();
      if (ticketCount === 0) {
        console.log('Seeding mock Support Tickets...');
        await SupportTicketModel.create([
          {
            ticketNumber: 'TKT-2026-1042',
            memberId: member1._id,
            subject: 'Assistance with GST Tax Invoice for ₹99 Intro Fee',
            category: 'PAYMENT_ISSUE',
            priority: 'HIGH',
            status: 'OPEN',
            messages: [
              {
                sender: 'MEMBER',
                senderId: member1._id,
                message: 'Hello FIC Team, I completed my intro fee payment but require a formal B2B GST tax invoice for accounting.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
              },
              {
                sender: 'ADMIN',
                senderId: superAdminUser?._id,
                message: 'Hi Rajesh, our finance department has generated your GST invoice and attached it to your registered email.',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
              },
            ],
          },
          {
            ticketNumber: 'TKT-2026-1043',
            memberId: member2._id,
            subject: 'Inquiry regarding Cloud Architecture marketplace listing visibility',
            category: 'GENERAL_INQUIRY',
            priority: 'MEDIUM',
            status: 'IN_PROGRESS',
            messages: [
              {
                sender: 'MEMBER',
                senderId: member2._id,
                message: 'I have submitted my service listing. Could you confirm the expected turnaround time for compliance approval?',
                timestamp: new Date(Date.now() - 1000 * 60 * 120),
              },
            ],
          },
        ]);
      }

      // Seed mock Referral Config & Referral Records
      const refCount = await ReferralRecordModel.countDocuments();
      if (refCount === 0) {
        console.log('Seeding mock Referral Bonus records...');
        await ReferralConfigModel.findOneAndUpdate(
          { key: 'DEFAULT_CONFIG' },
          {
            key: 'DEFAULT_CONFIG',
            bonusPerReferral: 500,
            currency: 'INR',
            minimumPayoutAmount: 1000,
            isActive: true,
            updatedBy: superAdminUser?.name || 'Super Admin',
          },
          { upsert: true, new: true }
        );

        await ReferralRecordModel.create([
          {
            referrerMemberId: member2._id,
            referrerName: member2.name,
            referrerEmail: member2.email,
            referredMemberId: member1._id,
            referredName: member1.name,
            referredEmail: member1.email,
            bonusAmount: 500,
            status: 'APPROVED',
            notes: 'Referred member paid registration fee and completed profile.',
          },
          {
            referrerMemberId: member3._id,
            referrerName: member3.name,
            referrerEmail: member3.email,
            referredMemberId: member2._id,
            referredName: member2.name,
            referredEmail: member2.email,
            bonusAmount: 500,
            status: 'PAID',
            payoutDate: new Date(Date.now() - 1000 * 60 * 60 * 48),
            payoutReference: 'REF_PAY_982143',
            notes: 'Disbursed via direct NEFT wallet transfer.',
          },
        ]);
      }

      // Seed mock Funding Applications
      const fundingCount = await FundingApplicationModel.countDocuments();
      if (fundingCount === 0) {
        console.log('Seeding mock FIC Funding Desk applications...');
        await FundingApplicationModel.create([
          {
            applicantName: 'Vikramaditya Singhania',
            applicantEmail: 'vikram.singhania@indialogistics.tech',
            applicantPhone: '+91 98112 44332',
            businessName: 'NextGen Cold-Chain IoT Logistics',
            industryCategory: 'Business Owners & Entrepreneurs',
            businessPitch: 'AI-assisted cold storage temperature sensor telemetry and rapid perishable logistics chain connecting tier-2 agricultural hubs.',
            pitchDeckUrl: 'https://placehold.co/800x600/png?text=IoT+Pitch+Deck',
            requestedAmount: 1500000,
            approvedPrincipal: 1500000,
            interestRateAnnual: 12,
            tenureMonths: 12,
            expectedTotalInterest: 180000,
            repaidAmount: 250000,
            accruedInterestCollected: 30000,
            stage: 'FUNDED',
            meetingScheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
            meetingLink: 'https://meet.google.com/fic-pitch-singhania',
            diligenceNotes: 'Passed primary compliance check, solid 3-year audited financials and working POC in Gujarat corridor.',
            disbursementDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
            disbursementReference: 'FIC-FUND-2026-004',
          },
          {
            applicantName: 'Sneha Kulkarni',
            applicantEmail: 'sneha@agritechharvest.in',
            applicantPhone: '+91 97654 32190',
            businessName: 'GreenSprout Autonomous Drones',
            industryCategory: 'Freelancers & IT Professionals',
            businessPitch: 'Solar-powered agricultural inspection drones delivering precision fertilizer micro-spraying with 40% reduction in water waste.',
            pitchDeckUrl: 'https://placehold.co/800x600/png?text=GreenSprout+Drones',
            requestedAmount: 800000,
            approvedPrincipal: 800000,
            interestRateAnnual: 10,
            tenureMonths: 18,
            expectedTotalInterest: 120000,
            repaidAmount: 0,
            accruedInterestCollected: 0,
            stage: 'REVIEW',
            meetingScheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 48), // in 2 days
            meetingLink: 'https://meet.google.com/fic-drone-review',
            diligenceNotes: 'Reviewing hardware Bill of Materials and commercial pilot testimonials.',
          },
          {
            applicantName: 'Arjun Mehta',
            applicantEmail: 'arjun@solarpulse.io',
            applicantPhone: '+91 99887 66554',
            businessName: 'SolarPulse Microgrid Solutions',
            industryCategory: 'Business Owners & Entrepreneurs',
            businessPitch: 'Decentralized rooftop battery swapping and localized micro-grid storage for small businesses.',
            requestedAmount: 500000,
            interestRateAnnual: 11,
            tenureMonths: 12,
            repaidAmount: 0,
            accruedInterestCollected: 0,
            stage: 'USER_REQUEST',
            diligenceNotes: 'Recently submitted proposal awaiting admin initial review.',
          },
        ]);
      }

      // Seed Investment Collection Pools if empty
      const poolCount = await InvestmentPoolModel.countDocuments();
      if (poolCount === 0) {
        console.log('Seeding mock Investment Collection Pools...');
        const members = await MemberModel.find().limit(3);
        const mem1 = members[0];
        const mem2 = members[1];

        await InvestmentPoolModel.create([
          {
            poolCode: 'POOL-AGRI-2026',
            title: 'AgriTech Cold-Chain Infrastructure Pool',
            description: 'Community crowdfunded capital pool backing cold-chain storage and IoT sensor distribution hubs across Tamil Nadu & Karnataka.',
            industryCategory: 'Agri-Tech / Supply Chain',
            targetAmount: 1500000,
            collectedAmount: 950000,
            minInvestmentPerUser: 10000,
            maxInvestmentPerUser: 500000,
            investorAnnualYieldPercent: 10.5,
            tenureMonths: 18,
            status: 'OPEN',
            borrowerName: 'Vikramaditya Rao',
            borrowerBusinessName: 'AgriTech Next Innovations',
            borrowerInterestRateAnnual: 13.5,
            ficMarginPercent: 3.0,
            investors: mem1 && mem2 ? [
              {
                memberId: mem1._id,
                memberName: mem1.name,
                memberEmail: mem1.email,
                memberPhone: mem1.phone,
                investedAmount: 500000,
                investedAt: new Date(Date.now() - 86400000 * 5),
                expectedInterest: Math.round((500000 * 10.5 * 1.5) / 100),
                totalMaturityAmount: 500000 + Math.round((500000 * 10.5 * 1.5) / 100),
                payoutStatus: 'PENDING',
              },
              {
                memberId: mem2._id,
                memberName: mem2.name,
                memberEmail: mem2.email,
                memberPhone: mem2.phone,
                investedAmount: 450000,
                investedAt: new Date(Date.now() - 86400000 * 2),
                expectedInterest: Math.round((450000 * 10.5 * 1.5) / 100),
                totalMaturityAmount: 450000 + Math.round((450000 * 10.5 * 1.5) / 100),
                payoutStatus: 'PENDING',
              },
            ] : [],
          },
          {
            poolCode: 'POOL-CLOUD-2026',
            title: 'FinTech DevOps Cloud Microgrid Pool',
            description: 'Capital pool powering enterprise failover systems and multi-tenant data architecture for mid-market payment aggregators.',
            industryCategory: 'IT & Cloud Infrastructure',
            targetAmount: 1200000,
            collectedAmount: 1200000,
            minInvestmentPerUser: 25000,
            maxInvestmentPerUser: 600000,
            investorAnnualYieldPercent: 11,
            tenureMonths: 12,
            status: 'DISBURSED',
            borrowerName: 'Karthik Balakrishnan',
            borrowerBusinessName: 'CloudHyper DevOps Hub',
            borrowerInterestRateAnnual: 14,
            ficMarginPercent: 3.0,
            disbursedToBorrowerAt: new Date(Date.now() - 86400000 * 45),
            investors: mem1 ? [
              {
                memberId: mem1._id,
                memberName: mem1.name,
                memberEmail: mem1.email,
                memberPhone: mem1.phone,
                investedAmount: 1200000,
                investedAt: new Date(Date.now() - 86400000 * 60),
                expectedInterest: Math.round((1200000 * 11 * 1.0) / 100),
                totalMaturityAmount: 1200000 + Math.round((1200000 * 11 * 1.0) / 100),
                payoutStatus: 'DISBURSED',
              },
            ] : [],
          },
        ]);
      }
    }
  } catch (err) {
    console.error('Error during seeding:', err);
  }
}

