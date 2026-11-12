import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Receipt as ReceiptIcon,
  User,
  CreditCard,
  Calendar
} from 'lucide-react';
import { apiFetch } from '../../services/api';

interface ReceiptData {
  receiptNumber: string;
  recordId: string;
  paymentId: string | null;
  internalOrderId: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  transactionReference: string;
  gatewayProvider: string;
  paymentMethod: string;
  mode: string;
  status: string;
  rawStatus?: string;
  amount: number;
  currency: string;
  purpose: string;
  paymentType: string;
  description: string;
  signatureVerified: boolean;
  webhookVerified: boolean;
  failureReason: string | null;
  transactionDate: string;
  createdAt: string;
  member: {
    id: string;
    name: string;
    email: string;
    phone: string;
    category: string;
    subCategory?: string;
    address?: {
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      district?: string;
      state?: string;
      pinCode?: string;
      country?: string;
    } | null;
  };
  issuer: {
    organizationName: string;
    supportEmail: string;
  };
}

export const PaymentReceiptPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let active = true;
    const loadReceipt = async () => {
      if (!id) {
        setError('Invalid payment reference.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch(`/api/admin/payments/${encodeURIComponent(id)}/receipt`);
        if (active) {
          setReceipt(data);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || 'Unable to locate payment receipt for this transaction.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadReceipt();
    return () => {
      active = false;
    };
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    if (!receipt) return;
    const formattedDate = new Date(receipt.transactionDate || receipt.createdAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    const htmlContent = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Receipt ${receipt.receiptNumber}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 40px; }
  .box { max-width: 720px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; margin-bottom: 24px; }
  .title { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; }
  .muted { color: #64748b; font-size: 13px; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #e2e8f0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .label { font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
  .val { font-size: 14px; font-weight: 600; word-break: break-all; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  th { background: #f8fafc; font-size: 12px; text-transform: uppercase; color: #475569; }
  .total { font-size: 18px; font-weight: 700; text-align: right; }
</style>
</head>
<body>
  <div class="box">
    <div class="header">
      <div>
        <h1 class="title">${receipt.issuer?.organizationName || 'FIC Business Hub'}</h1>
        <div class="muted">Official Payment Receipt &middot; ${receipt.issuer?.supportEmail || ''}</div>
      </div>
      <div style="text-align:right">
        <div class="val">${receipt.receiptNumber}</div>
        <div class="muted">${formattedDate}</div>
        <div style="margin-top:6px"><span class="badge">${receipt.status}</span></div>
      </div>
    </div>
    <div class="grid">
      <div>
        <div class="label">Billed Member</div>
        <div class="val">${receipt.member?.name || 'FIC Member'}</div>
        <div class="muted">${receipt.member?.email || ''}</div>
        <div class="muted">${receipt.member?.phone || ''}</div>
      </div>
      <div>
        <div class="label">Transaction Details</div>
        <div class="val">Ref: ${receipt.transactionReference}</div>
        <div class="muted">Order: ${receipt.razorpayOrderId || receipt.internalOrderId || 'N/A'}</div>
        <div class="muted">Method: ${receipt.paymentMethod} (${receipt.gatewayProvider})</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${receipt.description}</td>
          <td style="text-align:right">&#8377;${Number(receipt.amount || 0).toLocaleString('en-IN')} ${receipt.currency}</td>
        </tr>
      </tbody>
    </table>
    <p class="total">Total Amount: &#8377;${Number(receipt.amount || 0).toLocaleString('en-IN')} ${receipt.currency}</p>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${receipt.receiptNumber || 'fic-receipt'}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 animate-pulse space-y-6">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          <div className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Payment Receipt Unavailable
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {error || 'No receipt record was found for the selected payment identifier.'}
          </p>
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/payments')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Payments & Subscriptions</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = receipt.status === 'SUCCESS';
  const isPending = receipt.status === 'PENDING';
  const formattedAddress = receipt.member?.address
    ? [
        receipt.member.address.addressLine1,
        receipt.member.address.addressLine2,
        receipt.member.address.city,
        receipt.member.address.state,
        receipt.member.address.pinCode
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => navigate('/payments')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payments & Subscriptions</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Receipt</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Printable Official Receipt Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden print:border-slate-300 print:shadow-none">
        {/* Header Band */}
        <div className="p-6 sm:p-8 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/30 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
              <ReceiptIcon className="w-3.5 h-3.5" />
              <span>Official Payment Receipt</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {receipt.issuer?.organizationName || 'Forge India Connect — FIC Business Hub'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {receipt.issuer?.supportEmail || 'support@ficbusinesshub.in'} · Gateway Mode: {receipt.mode || 'TEST'}
            </p>
          </div>

          <div className="sm:text-right space-y-1.5">
            <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">RECEIPT NO</div>
            <div className="text-base font-mono font-extrabold text-slate-900 dark:text-slate-100">
              {receipt.receiptNumber}
            </div>
            <div className="pt-1">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60'
                    : isPending
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/60'
                    : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300/60'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isPending ? (
                  <Clock className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                <span>{receipt.status}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Member & Transaction Metadata */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-3 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <User className="w-3.5 h-3.5" />
              <span>Member / Customer Details</span>
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-bold text-slate-900 dark:text-slate-100">{receipt.member?.name || 'FIC Member'}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{receipt.member?.email || '—'}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{receipt.member?.phone || '—'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sector: {receipt.member?.category || 'General Business'}
                {receipt.member?.subCategory ? ` (${receipt.member.subCategory})` : ''}
              </p>
              {formattedAddress && (
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">{formattedAddress}</p>
              )}
            </div>
          </div>

          <div className="space-y-3 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Transaction & Gateway Audit</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Transaction Reference:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100 break-all text-right">
                  {receipt.transactionReference}
                </span>
              </div>
              {receipt.razorpayOrderId && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Razorpay Order ID:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 break-all text-right">
                    {receipt.razorpayOrderId}
                  </span>
                </div>
              )}
              {receipt.internalOrderId && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-400">Internal Order ID:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 break-all text-right">
                    {receipt.internalOrderId}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Payment Method:</span>
                <span className="font-semibold uppercase text-slate-900 dark:text-slate-100">
                  {receipt.paymentMethod} ({receipt.gatewayProvider})
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500 dark:text-slate-400">Transaction Date:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {new Date(receipt.transactionDate || receipt.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Item Table */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase text-slate-500 dark:text-slate-400 font-bold">
                <tr>
                  <th className="px-5 py-3.5 text-left">Description</th>
                  <th className="px-5 py-3.5 text-left">Category / Purpose</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                <tr>
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                    {receipt.description}
                  </td>
                  <td className="px-5 py-4 text-xs font-mono uppercase text-slate-500 dark:text-slate-400">
                    {String(receipt.purpose || receipt.paymentType || '').replace(/_/g, ' ')}
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
                    ₹{Number(receipt.amount || 0).toLocaleString('en-IN')} {receipt.currency}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {receipt.signatureVerified && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>HMAC-SHA256 Verified</span>
                </span>
              )}
              {receipt.webhookVerified && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Webhook Confirmed</span>
                </span>
              )}
              {receipt.failureReason && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-medium">
                  <span>Note: {receipt.failureReason}</span>
                </span>
              )}
            </div>

            <div className="text-right">
              <div className="text-xs uppercase font-bold text-slate-400">Total Settled Amount</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                ₹{Number(receipt.amount || 0).toLocaleString('en-IN')}{' '}
                <span className="text-sm font-semibold text-slate-500">{receipt.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

