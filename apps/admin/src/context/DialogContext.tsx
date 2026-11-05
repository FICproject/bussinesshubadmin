import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

type DialogType = 'alert' | 'confirm' | 'prompt';
type Severity = 'info' | 'success' | 'warning' | 'danger';

interface DialogOptions {
  title?: string;
  message: string;
  severity?: Severity;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}

interface DialogState extends DialogOptions {
  isOpen: boolean;
  type: DialogType;
  resolve?: (value: any) => void;
}

interface DialogContextType {
  showAlert: (message: string, options?: Omit<DialogOptions, 'message'>) => Promise<void>;
  showConfirm: (message: string, options?: Omit<DialogOptions, 'message'>) => Promise<boolean>;
  showPrompt: (message: string, options?: Omit<DialogOptions, 'message'>) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DialogState>({
    isOpen: false,
    type: 'alert',
    message: '',
  });

  const [promptInput, setPromptInput] = useState('');
  const [inputError, setInputError] = useState('');

  const showAlert = useCallback(
    (message: string, options?: Omit<DialogOptions, 'message'>): Promise<void> => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          type: 'alert',
          message,
          title: options?.title || 'Notification',
          severity: options?.severity || 'info',
          confirmText: options?.confirmText || 'Understood',
          resolve,
        });
      });
    },
    []
  );

  const showConfirm = useCallback(
    (message: string, options?: Omit<DialogOptions, 'message'>): Promise<boolean> => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          type: 'confirm',
          message,
          title: options?.title || 'Confirm Action',
          severity: options?.severity || 'warning',
          confirmText: options?.confirmText || 'Confirm',
          cancelText: options?.cancelText || 'Cancel',
          resolve,
        });
      });
    },
    []
  );

  const showPrompt = useCallback(
    (message: string, options?: Omit<DialogOptions, 'message'>): Promise<string | null> => {
      setPromptInput(options?.defaultValue || '');
      setInputError('');
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          type: 'prompt',
          message,
          title: options?.title || 'Required Input',
          severity: options?.severity || 'warning',
          confirmText: options?.confirmText || 'Submit',
          cancelText: options?.cancelText || 'Cancel',
          placeholder: options?.placeholder || 'Enter text here...',
          required: options?.required !== false,
          resolve,
        });
      });
    },
    []
  );

  const handleClose = (result: any) => {
    if (state.type === 'prompt' && result !== null && state.required && !promptInput.trim()) {
      setInputError('This field cannot be empty');
      return;
    }
    setState((prev) => ({ ...prev, isOpen: false }));
    if (state.resolve) {
      if (state.type === 'prompt') {
        state.resolve(result !== null ? promptInput.trim() : null);
      } else {
        state.resolve(result);
      }
    }
  };

  const getSeverityIcon = () => {
    switch (state.severity) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      default:
        return <Info className="w-6 h-6 text-indigo-500" />;
    }
  };

  const getSeverityTheme = () => {
    switch (state.severity) {
      case 'danger':
        return {
          iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-500',
          btnPrimary: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20 shadow-md',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
          btnPrimary: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20 shadow-md',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
          btnPrimary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-md',
        };
      default:
        return {
          iconBg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
          btnPrimary: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/20 shadow-md',
        };
    }
  };

  const theme = getSeverityTheme();

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}

      <AnimatePresence>
        {state.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleClose(state.type === 'prompt' ? null : false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6"
            >
              {/* Header row: Icon + Title + Close button */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${theme.iconBg} flex-shrink-0 flex items-center justify-center`}>
                    {getSeverityIcon()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                      {state.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleClose(state.type === 'prompt' ? null : false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body: Message & Input */}
              <div className="mt-4">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {state.message}
                </p>

                {/* Prompt text input */}
                {state.type === 'prompt' && (
                  <div className="mt-3.5">
                    <textarea
                      rows={3}
                      value={promptInput}
                      onChange={(e) => {
                        setPromptInput(e.target.value);
                        if (inputError) setInputError('');
                      }}
                      placeholder={state.placeholder}
                      autoFocus
                      className="w-full text-sm p-3.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent resize-none transition-all"
                    />
                    {inputError && (
                      <p className="mt-1.5 text-xs text-rose-500 font-medium">{inputError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer: Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3">
                {state.type !== 'alert' && (
                  <button
                    type="button"
                    onClick={() => handleClose(state.type === 'prompt' ? null : false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold transition-all active:scale-95"
                  >
                    {state.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleClose(state.type === 'confirm' ? true : true)}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${theme.btnPrimary}`}
                >
                  {state.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

