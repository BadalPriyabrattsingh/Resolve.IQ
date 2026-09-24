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
    ? 'bg-[#e07a5f] hover:bg-[#d46f55] text-[#080D11] font-bold border-[#e07a5f] shadow-lg shadow-coral-950/40'
    : isSuccess
    ? 'bg-[#2dd4bf] hover:bg-[#20b2aa] text-[#080D11] font-bold border-teal-400 shadow-lg shadow-teal-950/40'
    : isWarning
    ? 'bg-amber-500 hover:bg-amber-400 text-[#080D11] font-bold border-amber-400 shadow-lg shadow-amber-950/40'
    : 'bg-[#2dd4bf] hover:bg-[#20b2aa] text-[#080D11] font-bold border-teal-400 shadow-lg shadow-teal-950/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md rounded-xl bg-[#0D151C] border border-[#1A2833] shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
              isDanger
                ? 'bg-[#e07a5f]/15 border-[#e07a5f]/30 text-[#fca5a5]'
                : isSuccess
                ? 'bg-teal-500/15 border-teal-500/30 text-[#2dd4bf]'
                : isWarning
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-teal-500/15 border-teal-500/30 text-[#2dd4bf]'
            }`}
          >
            {isDanger && <AlertTriangle className="w-5 h-5" />}
            {isSuccess && <CheckCircle2 className="w-5 h-5" />}
            {isWarning && <AlertTriangle className="w-5 h-5" />}
            {variant === 'primary' && <Info className="w-5 h-5" />}
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold font-mono text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">{description}</p>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optional text input */}
        {inputLabel && (
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-mono text-slate-400 block">{inputLabel}</label>
            <textarea
              rows={2}
              value={inputValue || ''}
              onChange={(e) => onInputChange?.(e.target.value)}
              placeholder={inputPlaceholder}
              disabled={isLoading}
              className="w-full bg-[#070D12] border border-[#1A2833] rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-[#2dd4bf] transition-colors"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1A2833]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-mono rounded-md bg-[#101C25] hover:bg-[#182631] text-slate-300 border border-[#1A2833] transition-colors disabled:opacity-50 cursor-pointer"
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
