import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  ShieldCheck,
  CreditCard,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  Wallet,
  ExternalLink,
  Layers,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  QrCode,
  Landmark,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../services/api';
import { AuthenticatedDocumentPreview } from './AuthenticatedDocumentPreview';

interface MemberDetailModalProps {
  memberId: string | null;
  onClose: () => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ memberId, onClose }) => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'REGISTRATION' | 'SERVICES' | 'WALLET' | 'BANK_DETAILS'>('REGISTRATION');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [showAllTransactionsModal, setShowAllTransactionsModal] = useState(false);

  useEffect(() => {
    if (memberId) {
      loadDetails();
    }
  }, [memberId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/members/${memberId}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load member profile details', err);
    } finally {
      setLoading(false);
    }
  };

  if (!memberId) return null;

  const member = data?.member;
  const services = data?.services || [];
  const wallet = data?.wallet;
  const bankDetails = data?.bankDetails;
  const kyc = data?.kycSubmission;
  const uploadedDocuments = kyc?.documents || [];
  const transactions: any[] = wallet?.transactions || [];

  // Expiry Date Formatting
  const expiryDate = member?.membershipExpiresAt
    ? new Date(member.membershipExpiresAt)
    : member?.registeredAt
    ? new Date(new Date(member.registeredAt).setFullYear(new Date(member.registeredAt).getFullYear() + 1))
    : new Date(new Date().setFullYear(new Date().getFullYear() + 1));

  const formatRegDate = (d: any) => {
    if (!d) return 'Recently Active';
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? 'Active' : parsed.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                  {loading ? 'Loading Member...' : member?.name}
                </h3>
                {wallet && (
                  <button
                    onClick={() => setActiveTab('WALLET')}
                    className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>₹{(wallet.balance ?? 0).toLocaleString('en-IN')}</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {member?.primaryCategoryName || member?.primaryCategory?.name || 'FIC Ecosystem Member'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection with Animated Sliding Pill */}
        <div className="flex bg-slate-100/80 dark:bg-slate-800 p-1 rounded-xl space-x-1 my-4">
          <button
            onClick={() => setActiveTab('REGISTRATION')}
            className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors z-10 flex items-center space-x-1.5 ${
              activeTab === 'REGISTRATION'
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activeTab === 'REGISTRATION' && (
              <motion.div
                layoutId="activeMemberTabPill"
                className="absolute inset-0 bg-sky-600 rounded-lg shadow-sm -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <User className="w-3.5 h-3.5" />
            <span>Registration Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('SERVICES')}
            className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors z-10 flex items-center space-x-1.5 ${
              activeTab === 'SERVICES'
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activeTab === 'SERVICES' && (
              <motion.div
                layoutId="activeMemberTabPill"
                className="absolute inset-0 bg-sky-600 rounded-lg shadow-sm -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Briefcase className="w-3.5 h-3.5" />
            <span>Marketplace Services ({services.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('WALLET')}
            className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors z-10 flex items-center space-x-1.5 ${
              activeTab === 'WALLET'
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activeTab === 'WALLET' && (
              <motion.div
                layoutId="activeMemberTabPill"
                className="absolute inset-0 bg-sky-600 rounded-lg shadow-sm -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Wallet className="w-3.5 h-3.5" />
            <span>Digital Wallet</span>
          </button>

          <button
            onClick={() => setActiveTab('BANK_DETAILS')}
            className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors z-10 flex items-center space-x-1.5 ${
              activeTab === 'BANK_DETAILS'
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {activeTab === 'BANK_DETAILS' && (
              <motion.div
                layoutId="activeMemberTabPill"
                className="absolute inset-0 bg-sky-600 rounded-lg shadow-sm -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <Landmark className="w-3.5 h-3.5" />
            <span>Bank Details</span>
          </button>
        </div>

        {/* Modal Body Content with Smooth Fade & Slide Tab Transition */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
              Fetching member records, KYC proofs, and wallet ledger...
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* TAB 1: REGISTRATION DETAILS */}
              {activeTab === 'REGISTRATION' && (
                <motion.div
                  key="tab_registration"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="space-y-4"
                >
                  {/* Personal & Business Credentials */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Contact & Business Credentials
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{member?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{member?.phone || 'Not Provided'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                        <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Category: {member?.primaryCategoryName || member?.primaryCategory?.name || 'General'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Registered: {formatRegDate(member?.registeredAt)}</span>
                      </div>

                      {/* Company / Registered Entity Name */}
                      {(member?.companyName || member?.dynamicProfile?.businessName || member?.dynamicProfile?.companyName || member?.dynamicProfile?.institutionName) && (
                        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            Company / Entity:{' '}
                            <strong className="font-semibold text-slate-900 dark:text-slate-100">
                              {member.companyName || member.dynamicProfile?.businessName || member.dynamicProfile?.companyName || member.dynamicProfile?.institutionName}
                            </strong>
                          </span>
                        </div>
                      )}

                      {/* Company Revenue / Annual Turnover */}
                      {(member?.companyRevenue || member?.dynamicProfile?.annualTurnover || member?.dynamicProfile?.companyRevenue || member?.dynamicProfile?.revenue) && (
                        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>
                            Company Revenue:{' '}
                            <strong className="font-semibold text-emerald-700 dark:text-emerald-400">
                              {member.companyRevenue || member.dynamicProfile?.annualTurnover || member.dynamicProfile?.companyRevenue || member.dynamicProfile?.revenue}
                            </strong>
                          </span>
                        </div>
                      )}

                      {/* Operating Stage */}
                      {(member?.businessStage || member?.dynamicProfile?.businessStage) && (
                        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                          <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            Stage:{' '}
                            <strong className="font-medium">
                              {member.businessStage || member.dynamicProfile?.businessStage}
                            </strong>
                          </span>
                        </div>
                      )}

                      {/* Industry Sector */}
                      {(member?.industrySector || member?.dynamicProfile?.industrySector) && (
                        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                          <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            Industry:{' '}
                            <strong className="font-medium">
                              {member.industrySector || member.dynamicProfile?.industrySector}
                            </strong>
                          </span>
                        </div>
                      )}

                      {member?.dob && (
                        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>DOB: {member.dob}</span>
                        </div>
                      )}

                      {/* Additional Category-Specific Registration Fields */}
                      {member?.dynamicProfile &&
                        Object.entries(member.dynamicProfile)
                          .filter(([key, val]) => {
                            if (!val || typeof val === 'object') return false;
                            const lower = key.toLowerCase();
                            return (
                              !lower.includes('businessname') &&
                              !lower.includes('companyname') &&
                              !lower.includes('institutionname') &&
                              !lower.includes('turnover') &&
                              !lower.includes('revenue') &&
                              !lower.includes('stage') &&
                              !lower.includes('industrysector')
                            );
                          })
                          .map(([key, val]: [string, any]) => {
                            const formattedKey = key
                              .replace(/([A-Z])/g, ' $1')
                              .replace(/^./, (str) => str.toUpperCase());
                            return (
                              <div key={key} className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                                <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>
                                  {formattedKey}: <strong className="font-medium">{String(val)}</strong>
                                </span>
                              </div>
                            );
                          })}

                      {member?.address && (
                        <div className="sm:col-span-2 flex items-start space-x-2 text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            Address:{' '}
                            {typeof member.address === 'string'
                              ? member.address
                              : `${member.address.addressLine1 || ''} ${member.address.addressLine2 || ''}, ${member.address.city || ''}, ${member.address.state || ''} - ${member.address.pinCode || ''}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registration Source & Referral Attribution */}
                  <div className="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-bold text-purple-900 dark:text-purple-300 block">
                        Registration Source: {member?.referralInfo?.source === 'REFERRAL' ? 'Referral' : 'Direct Registration'}
                      </span>
                      {member?.referralInfo?.source === 'REFERRAL' ? (
                        <span className="text-[11px] text-purple-700 dark:text-purple-400 font-mono">
                          Referred By: <strong className="font-semibold">{member.referralInfo.referredByName || 'Referrer'}</strong> • Referral Code: <strong className="font-semibold">{member.referralInfo.referralCode}</strong>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Organic registration directly via FIC Business Hub
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 uppercase font-mono">
                      {member?.referralInfo?.source === 'REFERRAL' ? 'REFERRED' : 'DIRECT'}
                    </span>
                  </div>

                  {/* Selected Subcategories */}
                  {member?.subcategories && member.subcategories.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase block mb-1.5">
                        Selected Subcategories
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {member.subcategories.map((sub: string, i: number) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-xs rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wallet Overview Quick Access Card */}
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/60 dark:from-slate-800 dark:to-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide block">
                          Member Digital Wallet
                        </span>
                        <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                          ₹{(wallet?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('WALLET')}
                      className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      View Wallet Ledger &rarr;
                    </button>
                  </div>

                  {/* KYC Compliance & Membership Validity Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* KYC Box */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          KYC Compliance Status
                        </span>
                        <div className="flex items-center space-x-2 mt-1.5">
                          <ShieldCheck
                            className={`w-4 h-4 ${
                              member?.kycStatus === 'APPROVED' ? 'text-emerald-500' : 'text-amber-500'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {member?.kycStatus}
                          </span>
                        </div>
                      </div>
                      {kyc?.verifiedAt && (
                        <p className="text-[11px] text-slate-400 mt-2">
                          Verified on: {new Date(kyc.verifiedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Membership State & Expiry Date Box */}
                    <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide block">
                          Membership Status & Fee
                        </span>
                        <div className="flex items-center space-x-2 mt-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                            ₹{member?.membershipFeePaid} ({member?.paymentStatus}) — First Year Offer
                          </span>
                        </div>
                      </div>

                      {/* Explicit Membership End Date Display */}
                      <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Membership Ends:</span>
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                          {expiryDate ? expiryDate.toLocaleDateString() : 'N/A (1 Year)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded KYC Proof Documents Section */}
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase block mb-2 flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>Uploaded KYC Verification Documents ({uploadedDocuments.length})</span>
                    </span>

                    {uploadedDocuments.length === 0 ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                        No verification proofs uploaded yet by this member.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {uploadedDocuments.map((doc: any, i: number) => (
                          <div
                            key={i}
                            className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
                          >
                            <div className="flex items-center space-x-3 truncate pr-2">
                              <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-2xs">
                                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                  {doc.title}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  File: {doc.fileName} • Status:{' '}
                                  <span
                                    className={`font-semibold ${
                                      doc.status === 'VERIFIED'
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-amber-600'
                                    }`}
                                  >
                                    {doc.status}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center space-x-1 transition-all active:scale-95 shadow-2xs"
                            >
                              <span>View Proof</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: PROVIDED SERVICES */}
              {activeTab === 'SERVICES' && (
                <motion.div
                  key="tab_services"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="space-y-3"
                >
                  {services.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      This member has not published any marketplace services yet.
                    </div>
                  ) : (
                    services.map((svc: any) => (
                      <div
                        key={svc._id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-xs">{svc.title}</h4>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {svc.categoryName || svc.categoryId?.name || 'Business Sector'}
                              {svc.subcategoryName ? ` • ${svc.subcategoryName}` : ''}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              svc.status === 'APPROVED'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : svc.status === 'REJECTED'
                                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            }`}
                          >
                            {svc.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {svc.description}
                        </p>
                        {svc.servicesOffered && svc.servicesOffered.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-400 font-medium">Offered Deliverables:</span>
                            {svc.servicesOffered.map((deliv: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] rounded border border-sky-200 dark:border-sky-800/50 font-medium">
                                ✓ {deliv}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-400">
                          <span>Coverage: {svc.coverageArea || 'Pan India'} • Mode: {svc.deliveryMode || 'On-Site / Plant'}</span>
                          {svc.pricingEstimate && (
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Estimate: {svc.pricingEstimate}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {/* TAB 3: WALLET CARD WITH LIVE CREDIT/DEBIT TRANSACTIONS */}
              {activeTab === 'WALLET' && (
                <motion.div
                  key="tab_wallet"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="space-y-4"
                >
                  {/* Digital Wallet Card */}
                  <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>FIC Member Ledger Wallet</span>
                        </span>
                        <h4 className="text-xs font-medium text-slate-300 mt-1">{member?.name}</h4>
                      </div>
                      <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                        <Wallet className="w-6 h-6 text-amber-400" />
                      </div>
                    </div>

                    <div className="my-5">
                      <span className="text-xs text-slate-400 block font-sans">Available Balance</span>
                      <p className="text-3xl font-extrabold text-white tracking-tight mt-0.5">
                        ₹{(wallet?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-white/10 pt-3">
                      <span>Status: {wallet?.status || 'Active'}</span>
                      <span className="text-sky-300 font-mono">Currency: {wallet?.currency || 'INR'}</span>
                    </div>
                  </div>

                  {/* Transaction History Section */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-tight flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                          <span>Recent Wallet Transactions</span>
                        </h5>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">Showing last 4 transactions</p>
                      </div>

                      {/* Transaction History Button to open centralized modal */}
                      <button
                        onClick={() => setShowAllTransactionsModal(true)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span>Transaction History ({transactions.length})</span>
                      </button>
                    </div>

                    {/* 3-5 Recent Transactions List */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {transactions.slice(0, 4).map((txn) => {
                        const isCredit = txn.type === 'CREDIT';
                        return (
                          <div
                            key={txn.id}
                            className="py-2.5 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-slate-800/70 px-2 rounded-xl transition-colors"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div
                                className={`p-2 rounded-xl shrink-0 ${
                                  isCredit
                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300/40'
                                    : 'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-300/40'
                                }`}
                              >
                                {isCredit ? (
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                                  {txn.title}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono truncate">
                                  {new Date(txn.date).toLocaleDateString('en-IN', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}{' '}
                                  • Ref: {txn.reference}
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0 pl-3">
                              <span
                                className={`font-extrabold text-xs font-mono block ${
                                  isCredit
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-rose-600 dark:text-rose-400'
                                }`}
                              >
                                {isCredit ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                              </span>
                              <span
                                className={`text-[9px] font-bold uppercase font-mono px-1.5 py-0.2 rounded ${
                                  isCredit
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                }`}
                              >
                                {txn.type}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: BANK DETAILS (UPI-First Settlement View) */}
              {activeTab === 'BANK_DETAILS' && (
                <motion.div
                  key="tab_bank_details"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="space-y-4"
                >
                  {/* Digital Payment & UPI Settlement Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white shadow-xl border border-sky-900/40 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2.5 bg-sky-500/20 rounded-xl border border-sky-400/30 text-sky-300">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 font-mono">
                            Digital Settlement Protocol
                          </span>
                          <h4 className="text-base font-bold text-white mt-0.5">
                            Transactions Handled via UPI
                          </h4>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        UPI ENABLED
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      Platform transactions, membership fees, and ecosystem settlements are processed digitally via verified UPI and payment gateways, bypassing manual bank account records.
                    </p>
                  </div>

                  {/* Verified UPI & Gateway Transaction Records */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      Verified UPI & Payment Records
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                        <span className="text-[10px] text-slate-400 block font-medium">Virtual Payment Address (UPI)</span>
                        <p className="font-bold text-sky-600 dark:text-sky-400 font-mono mt-1 flex items-center gap-1.5 text-sm">
                          <QrCode className="w-4 h-4 shrink-0" />
                          <span>{bankDetails?.upiId || `${member?.email?.split('@')[0]}@upi`}</span>
                        </p>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                        <span className="text-[10px] text-slate-400 block font-medium">Payment Channel</span>
                        <p className="font-bold text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5 text-sm">
                          <CreditCard className="w-4 h-4 text-sky-500 shrink-0" />
                          <span>{bankDetails?.membershipPayment?.paymentMethod || 'Razorpay UPI Gateway'}</span>
                        </p>
                      </div>

                      {bankDetails?.membershipPayment?.referenceId && (
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                          <span className="text-[10px] text-slate-400 block font-medium">Gateway Payment Ref</span>
                          <p className="font-bold text-slate-900 dark:text-slate-100 font-mono mt-1 text-xs truncate" title={bankDetails.membershipPayment.referenceId}>
                            {bankDetails.membershipPayment.referenceId}
                          </p>
                        </div>
                      )}

                      {bankDetails?.membershipPayment?.razorpayOrderId && (
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                          <span className="text-[10px] text-slate-400 block font-medium">Gateway Order ID</span>
                          <p className="font-bold text-slate-900 dark:text-slate-100 font-mono mt-1 text-xs truncate" title={bankDetails.membershipPayment.razorpayOrderId}>
                            {bankDetails.membershipPayment.razorpayOrderId}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Membership Fee Payment Proof */}
                    {bankDetails?.membershipPayment && (
                      <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 rounded-lg shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-slate-100">
                              Membership Fee Paid via UPI ({bankDetails.membershipPayment.paidFrom || 'UPI Gateway'})
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Paid on: {new Date(bankDetails.membershipPayment.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <span className="font-extrabold text-xs text-emerald-700 dark:text-emerald-300 font-mono block">
                            ₹{bankDetails.membershipPayment.amount}
                          </span>
                          <span className="text-[9px] font-bold uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                            {bankDetails.membershipPayment.status}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200/80 dark:border-sky-800/50 text-[11px] text-sky-800 dark:text-sky-300 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
                      <span>
                        Transactions and fee settlements are verified directly via UPI gateway. Manual bank account statements are not stored or required.
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
          >
            Close Profile
          </button>
        </div>
      </motion.div>

      {/* Proof Preview Modal - Nested on top of MemberDetailModal with elevated z-index */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewDoc(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="relative z-[110] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full p-5 border border-slate-200 dark:border-slate-800 max-h-[88vh] flex flex-col"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{previewDoc.title}</h4>
                    <p className="text-[11px] text-slate-400 font-mono">{previewDoc.fileName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 flex-1 overflow-auto flex items-center justify-center bg-slate-950/5 dark:bg-slate-950/80 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800">
                <AuthenticatedDocumentPreview
                  documentId={previewDoc.documentId}
                  fileUrl={previewDoc.fileUrl}
                  fileName={previewDoc.fileName}
                  originalMimeType={previewDoc.originalMimeType}
                  originalFileSize={previewDoc.originalFileSize}
                  checksum={previewDoc.checksum}
                  title={previewDoc.title}
                  maxHeightClass="max-h-[55vh]"
                />
              </div>

              <div className="mt-4 flex justify-between items-center text-xs">
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Status: {previewDoc.status || 'Verified Document'}</span>
                </span>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Close Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Centralized Full Wallet Transactions History Modal */}
      <AnimatePresence>
        {showAllTransactionsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllTransactionsModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative z-[110] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col"
            >
              {/* Centralized Modal Header */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-200 dark:border-sky-800">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      Complete Wallet Transaction History
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Member: {member?.name} • Ledger ID: {wallet?.status || 'Active'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllTransactionsModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Transactions Ledger List */}
              <div className="my-3 flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 pr-1">
                {transactions.map((txn) => {
                  const isCredit = txn.type === 'CREDIT';
                  return (
                    <div
                      key={txn.id}
                      className="py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                            isCredit
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300/40'
                              : 'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-300/40'
                          }`}
                        >
                          {isCredit ? (
                            <ArrowDownLeft className="w-4 h-4" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {txn.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {txn.description}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                            <span>
                              {new Date(txn.date).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>•</span>
                            <span>Ref: {txn.reference}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-3">
                        <span
                          className={`font-extrabold text-sm font-mono block ${
                            isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isCredit ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase font-mono px-2 py-0.5 rounded-full ${
                            isCredit
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {txn.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Centralized Modal Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="font-mono text-slate-400 text-[11px]">
                  Total Transactions: {transactions.length}
                </span>
                <button
                  onClick={() => setShowAllTransactionsModal(false)}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl font-bold transition-all"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
