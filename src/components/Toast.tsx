import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  timestamp: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  removeToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newToast: ToastItem = { id, type, title, message, timestamp: Date.now() };

    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div
        id="toast-container"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          const borderBgClass = isSuccess
            ? 'bg-[#0D151C] border-teal-500/50 shadow-teal-950/40 text-[#2dd4bf]'
            : isError
            ? 'bg-[#0D151C] border-[#e07a5f]/50 shadow-black/40 text-[#fca5a5]'
            : isWarning
            ? 'bg-[#0D151C] border-amber-500/50 shadow-amber-950/40 text-amber-300'
            : 'bg-[#0D151C] border-teal-500/50 shadow-teal-950/40 text-teal-300';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${borderBgClass}`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#2dd4bf]" />}
                {isError && <XCircle className="w-4 h-4 text-[#e07a5f]" />}
                {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-[#2dd4bf]" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono font-bold text-slate-100 leading-tight">
                  {toast.title}
                </div>
                {toast.message && (
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5 leading-snug">
                    {toast.message}
                  </div>
                )}
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors p-0.5 -mr-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
