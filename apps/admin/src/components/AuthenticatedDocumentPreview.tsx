import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2, AlertCircle, ShieldCheck, ExternalLink } from 'lucide-react';
import { downloadAdminOriginalDocument, fetchAdminDocumentBlob } from '../services/api';

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
    Boolean(fileName?.match(/\.(jpeg|jpg|png|webp)$/i)) ||
    Boolean(fileUrl?.startsWith('data:image/'));
  const isPdf =
    originalMimeType === 'application/pdf' ||
    Boolean(fileName?.toLowerCase().endsWith('.pdf')) ||
    Boolean(fileUrl?.startsWith('data:application/pdf'));
  const isText =
    originalMimeType === 'text/plain' || Boolean(fileName?.toLowerCase().endsWith('.txt'));

  const [variant, setVariant] = useState<'preview' | 'original'>('preview');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!documentId) return;

    let active = true;
    let createdUrl: string | null = null;
    setLoading(true);
    setError(null);
    setTextContent(null);

    fetchAdminDocumentBlob(documentId, {
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

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
      setBlobUrl(null);
    };
  }, [documentId, variant, isImage, isText]);

  const handleDownloadOriginal = async () => {
    if (!documentId) return;
    setDownloading(true);
    try {
      await downloadAdminOriginalDocument(documentId, fileName);
    } catch (err: any) {
      setError(err?.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  if (!documentId) {
    // Legacy non-DocumentAsset fallback
    if (isImage && fileUrl) {
      return (
        <img
          src={fileUrl}
          alt={title || 'KYC Document'}
          className={`${maxHeightClass} w-auto max-w-full object-contain rounded-lg shadow-sm border border-slate-200 dark:border-slate-800`}
        />
      );
    }
    if (isPdf && fileUrl) {
      return (
        <iframe
          src={fileUrl}
          title={title || 'KYC Document'}
          className="w-full h-[320px] rounded-lg border border-slate-200 dark:border-slate-800"
        />
      );
    }
    return (
      <div className="text-center p-6 space-y-2">
        <FileText className="w-8 h-8 text-slate-400 mx-auto" />
        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
          {fileName || 'Attached document file'}
        </p>
        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
          >
            <span>Open File</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-2.5">
      {/* Toolbar: Optimized Preview vs Exact Original + Download Original */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span>
            Private Vault · Original Preserved
            {originalFileSize ? ` (${(originalFileSize / 1024).toFixed(1)} KB)` : ''}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {isImage && (
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
                Exact Original
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleDownloadOriginal}
            disabled={downloading}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            <span>Download Original</span>
          </button>
        </div>
      </div>

      {/* Rendered Content Stage */}
      <div className="flex items-center justify-center min-h-[140px]">
        {loading ? (
          <div className="flex items-center space-x-2 text-xs text-slate-500 py-8">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading authenticated document...</span>
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-lg border border-rose-200 dark:border-rose-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : isImage && blobUrl ? (
          <img
            src={blobUrl}
            alt={title || fileName || 'Document'}
            className={`${maxHeightClass} w-auto max-w-full object-contain rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 bg-white`}
          />
        ) : isPdf && blobUrl ? (
          <iframe
            src={blobUrl}
            title={title || fileName || 'PDF Document'}
            className="w-full h-[320px] rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
          />
        ) : isText && textContent !== null ? (
          <pre className="w-full max-h-[300px] overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono">
            {textContent}
          </pre>
        ) : (
          <div className="text-center p-4 space-y-2">
            <FileText className="w-8 h-8 text-indigo-500 mx-auto" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {fileName || 'Original Document'}
            </p>
            <p className="text-[11px] text-slate-400">
              Exact original binary preserved. Click Download Original above to inspect locally.
            </p>
          </div>
        )}
      </div>

      {checksum && (
        <div className="text-[10px] font-mono text-slate-400 truncate text-right">
          SHA-256: {checksum}
        </div>
      )}
    </div>
  );
};

