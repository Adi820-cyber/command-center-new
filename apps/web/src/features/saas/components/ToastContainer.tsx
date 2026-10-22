import React from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

export interface ToastItem {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  message?: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  removeToast,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = "border-slate-200";
        let bgClass = "bg-white";
        let icon = <Info className="w-5 h-5 text-blue-600 shrink-0" />;

        if (toast.type === "success") {
          borderClass = "border-emerald-200 bg-emerald-50/95";
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
        } else if (toast.type === "warning") {
          borderClass = "border-amber-200 bg-amber-50/95";
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
        } else if (toast.type === "error") {
          borderClass = "border-rose-200 bg-rose-50/95";
          icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-lg backdrop-blur-sm flex items-start gap-3 transition-all animate-in slide-in-from-right-4 duration-300 ${borderClass} ${bgClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1 -mt-1 rounded-md cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
