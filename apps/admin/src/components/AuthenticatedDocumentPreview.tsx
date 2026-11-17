import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2, AlertCircle, ShieldCheck, ExternalLink } from 'lucide-react';
import { downloadAdminOriginalDocument, fetchAdminDocumentBlob, API_BASE_URL, getStoredAuth } from '../services/api';

export interface AuthenticatedDocumentPreviewProps {
  documentId?: string;
  fileUrl?: string;
  fileName?: string;
  originalMimeType?: string;
  originalFileSize?: number;
  checksum?: string;
  title?: string;
  maxHeightClass?: string;
}

export const AuthenticatedDocumentPreview: React.FC<AuthenticatedDocumentPreviewProps> = ({
  documentId,
  fileUrl,
  fileName,
  originalMimeType,
  originalFileSize,
  checksum,
  title,
  maxHeightClass = 'max-h-[340px]'
}) => {
  const isImage =
    Boolean(originalMimeType?.startsWith('image/')) ||
    Boolean(fileName?.match(/\.(jpeg|jpg|png|webp|gif|svg)$/i)) ||
    Boolean(fileUrl?.startsWith('data:image/'));
  const isPdf =
    originalMimeType === 'application/pdf' ||
    Boolean(fileName?.toLowerCase().endsWith('.pdf')) ||
    Boolean(fileUrl?.startsWith('data:application/pdf')) ||
    Boolean(fileUrl?.toLowerCase().includes('.pdf'));
  const isText =
    originalMimeType === 'text/plain' || Boolean(fileName?.toLowerCase().endsWith('.txt'));

  const [variant, setVariant] = useState<'preview' | 'original'>('preview');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawFileUrl = (fileUrl || '').trim();
  const resolvedUrl =
    rawFileUrl.startsWith('http://') ||
    rawFileUrl.startsWith('https://') ||
    rawFileUrl.startsWith('data:') ||
    rawFileUrl.startsWith('blob:')
      ? rawFileUrl
      : rawFileUrl
      ? `${API_BASE_URL}${rawFileUrl.startsWith('/') ? '' : '/'}${rawFileUrl}`
      : '';

  const effectiveDocId =
    documentId ||
    (rawFileUrl ? rawFileUrl.match(/\/documents\/([A-Za-z0-9_-]+)/)?.[1] : undefined);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;
    setLoading(true);
    setError(null);
    setTextContent(null);

    if (effectiveDocId) {
      fetchAdminDocumentBlob(effectiveDocId, {
        variant: isImage ? variant : 'original',
        action: 'view'
      })
        .then(async (res) => {
          if (!active) {
            URL.revokeObjectURL(res.blobUrl);
            return;
          }
          createdUrl = res.blobUrl;
          setBlobUrl(res.blobUrl);
          if (isText) {
            const text = await res.blob.text();
            if (active) setTextContent(text);
          }
        })
        .catch((err: any) => {
          if (active) setError(err?.message || 'Unable to load private document.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else if (resolvedUrl) {
      if (resolvedUrl.startsWith('data:') || resolvedUrl.startsWith('blob:')) {
        setBlobUrl(resolvedUrl);
        setLoading(false);
      } else {
        const auth = getStoredAuth();
        fetch(resolvedUrl, {
          headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
        })
          .then(async (res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            if (!active) return;
            const bUrl = URL.createObjectURL(blob);
            createdUrl = bUrl;
            setBlobUrl(bUrl);
            if (isText) {
              const text = await blob.text();
              if (active) setTextContent(text);
            }
          })
          .catch(() => {
            // If fetch fails (e.g. cross-origin), use resolvedUrl directly
            if (active) setBlobUrl(resolvedUrl);
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      }
    } else {
      setLoading(false);
      setError('No document source URL provided.');
    }

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
      setBlobUrl(null);
    };
  }, [effectiveDocId, resolvedUrl, variant, isImage, isText]);

  const handleDownloadOriginal = async () => {
    if (effectiveDocId) {
      setDownloading(true);
      try {
        await downloadAdminOriginalDocument(effectiveDocId, fileName);
      } catch (err: any) {
        setError(err?.message || 'Download failed.');
      } finally {
        setDownloading(false);
      }
    } else if (blobUrl || resolvedUrl) {
      const targetUrl = blobUrl || resolvedUrl;
      const a = document.createElement('a');
      a.href = targetUrl;
      a.download = fileName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const activeDisplayUrl = blobUrl || resolvedUrl;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading document securely from vault...</p>
      </div>
    );
  }

  if (error && !activeDisplayUrl) {
    return (
      <div className="p-6 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-center space-y-2">
        <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
        <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">{error}</p>
        <p className="text-[11px] text-slate-400">Document may require elevated admin permissions.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2.5">
      {/* Toolbar: Preview status & Download */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] px-1">
        <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>
            {effectiveDocId ? 'Private Vault Asset' : 'Verified Document Asset'}
            {originalFileSize ? ` (${(originalFileSize / 1024).toFixed(1)} KB)` : ''}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {effectiveDocId && isImage && (
            <div className="inline-flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setVariant('preview')}
                className={`px-2 py-1 rounded-md font-semibold transition-all ${
                  variant === 'preview'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Fast Preview
              </button>
              <button
                type="button"
                onClick={() => setVariant('original')}
                className={`px-2 py-1 rounded-md font-semibold transition-all ${
                  variant === 'original'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Original
              </button>
            </div>
          )}

          {activeDisplayUrl && (
            <a
              href={activeDisplayUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Open in New Tab</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleDownloadOriginal}
            disabled={downloading}
            className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Document Render Area */}
      <div className="flex items-center justify-center p-2 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 min-h-[300px]">
        {isImage && activeDisplayUrl ? (
          <img
            src={activeDisplayUrl}
            alt={title || fileName || 'Document'}
            className={`${maxHeightClass} w-auto max-w-full object-contain rounded-xl shadow-sm`}
          />
        ) : isPdf && activeDisplayUrl ? (
          <iframe
            src={activeDisplayUrl}
            title={title || fileName || 'PDF Preview'}
            className="w-full h-[520px] md:h-[620px] rounded-xl border-0 shadow-xs"
          />
        ) : isText && textContent ? (
          <pre className="p-4 w-full bg-slate-950 text-slate-100 rounded-xl overflow-auto text-xs font-mono max-h-[500px]">
            {textContent}
          </pre>
        ) : (
          <div className="text-center p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {fileName || 'Document File'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {originalMimeType || 'Binary Document'}
              </p>
            </div>
            {activeDisplayUrl && (
              <button
                type="button"
                onClick={handleDownloadOriginal}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Document File</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
