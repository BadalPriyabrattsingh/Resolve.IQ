import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  onInputChange?: (val: string) => void;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  inputLabel,
  inputPlaceholder,
  inputValue,
  onInputChange,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isSuccess = variant === 'success';
  const isWarning = variant === 'warning';

  const confirmBtnClass = isDanger
    ? 'bg-red-600 hover:bg-red-500 text-white font-bold border-red-600 shadow-xs'
    : isSuccess
    ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold border-emerald-600 shadow-xs'
    : isWarning
    ? 'bg-amber-600 hover:bg-amber-500 text-white font-bold border-amber-600 shadow-xs'
    : 'bg-teal-600 hover:bg-teal-500 text-white font-bold border-teal-600 shadow-xs';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-[#121820] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
              isDanger
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                : isSuccess
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : isWarning
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400'
            }`}
          >
            {isDanger && <AlertTriangle className="w-5 h-5" />}
            {isSuccess && <CheckCircle2 className="w-5 h-5" />}
            {isWarning && <AlertTriangle className="w-5 h-5" />}
            {variant === 'primary' && <Info className="w-5 h-5" />}
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-sans">{description}</p>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optional text input */}
        {inputLabel && (
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-mono text-slate-600 dark:text-slate-400 block">{inputLabel}</label>
            <textarea
              rows={2}
              value={inputValue || ''}
              onChange={(e) => onInputChange?.(e.target.value)}
              placeholder={inputPlaceholder}
              disabled={isLoading}
              className="w-full bg-slate-50 dark:bg-[#0C1015] border border-slate-200 dark:border-white/[0.08] rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-mono rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-1.5 text-xs font-mono font-bold rounded-md border shadow transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer ${confirmBtnClass}`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
