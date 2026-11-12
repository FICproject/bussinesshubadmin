import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { rowVariants } from '../../utils/animations';
import { SkeletonTable } from '../../components/Skeleton';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/payments?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const data = await apiFetch(url);
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <CreditCard className="w-5 h-5" />
            </span>
            <span>Payments & Subscriptions</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit Razorpay Test Mode orders, ₹99 intro fees, ₹5,999 renewals, wallet top-ups, HMAC signatures, and webhook confirmations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPayments()}
            placeholder="Search member, pay_*, order_*, ref..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Payments</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">S.No</th>
                <th className="px-5 py-3.5">Member / Business</th>
                <th className="px-5 py-3.5">Amount & Purpose</th>
                <th className="px-5 py-3.5">Razorpay Refs & Order</th>
                <th className="px-5 py-3.5">Method & Verification</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <SkeletonTable rows={5} cols={8} />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400 text-xs">
                    No payments found.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {payments.map((p, idx) => (
                    <motion.tr
                      key={p._id}
                      variants={rowVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150"
                    >
                      <td className="px-4 py-4 text-center font-mono text-xs font-bold text-slate-400 dark:text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {p.memberId?.name || 'Customer'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {p.memberId?.email}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                          {(p.purpose || p.paymentType || '').replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs font-mono text-slate-800 dark:text-slate-200">
                          {p.razorpayPaymentId || p.gatewayTransactionId}
                        </div>
                        {p.razorpayOrderId && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Order: {p.razorpayOrderId}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                            {p.paymentMethod || p.gatewayProvider || 'RAZORPAY'}
                          </span>
                          {p.signatureVerified && (
                            <span
                              title="HMAC-SHA256 signature verified"
                              className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>HMAC</span>
                            </span>
                          )}
                          {p.webhookVerified && (
                            <span
                              title="Razorpay Webhook Verified"
                              className="inline-flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-bold"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>WH</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'SUCCESS'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : p.status === 'PENDING'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.status === 'FAILED' && p.failureReason && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 max-w-[180px] truncate" title={p.failureReason}>
                            {p.failureReason}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(p)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 font-semibold"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Transaction Detail Modal */}
      {selectedPayment && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPayment(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Razorpay Payment Audit Record
                </h3>
                <p className="text-xs text-slate-500">
                  Mode: {selectedPayment.mode || 'TEST'} · {selectedPayment.gatewayProvider}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block">Member</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedPayment.memberId?.name || 'Customer'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Amount</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  ₹{Number(selectedPayment.amount || 0).toLocaleString('en-IN')} ({selectedPayment.currency || 'INR'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Internal Order ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 break-all">
                  {selectedPayment.internalOrderId || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Razorpay Order ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 break-all">
                  {selectedPayment.razorpayOrderId || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Razorpay Payment ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 break-all">
                  {selectedPayment.razorpayPaymentId || selectedPayment.gatewayTransactionId || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Payment Method</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase">
                  {selectedPayment.paymentMethod || selectedPayment.gatewayProvider}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Signature Verified</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedPayment.signatureVerified ? 'Yes (HMAC-SHA256)' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Webhook Verified</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">
                  {selectedPayment.webhookVerified ? 'Yes (X-Razorpay-Signature)' : 'Not received / N/A'}
                </span>
              </div>
              {selectedPayment.failureReason && (
                <div className="col-span-2 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{selectedPayment.failureReason}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
