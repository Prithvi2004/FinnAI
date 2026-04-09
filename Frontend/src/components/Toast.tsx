import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, JSX.Element> = {
  success: <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />,
  error:   <XCircle     className="w-5 h-5 text-red-400 shrink-0" />,
  info:    <Info        className="w-5 h-5 text-blue-400 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />,
};

const borders: Record<ToastType, string> = {
  success: "border-green-500/30",
  error:   "border-red-500/30",
  info:    "border-blue-500/30",
  warning: "border-yellow-500/30",
};

const glows: Record<ToastType, string> = {
  success: "shadow-green-500/10",
  error:   "shadow-red-500/10",
  info:    "shadow-blue-500/10",
  warning: "shadow-yellow-500/10",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Stack */}
      <div className="fixed top-6 right-4 sm:right-6 z-[999] flex flex-col gap-3 pointer-events-none w-[calc(100vw-2rem)] sm:w-[360px]">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl
                bg-charcoal-900/90 backdrop-blur-xl border ${borders[toast.type]}
                shadow-2xl ${glows[toast.type]}`}
            >
              {/* Icon */}
              <div className="mt-0.5">{icons[toast.type]}</div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-warmGrey-100 leading-snug">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-warmGrey-400 mt-0.5 leading-relaxed">{toast.message}</p>
                )}
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl overflow-hidden">
                <motion.div
                  initial={{ scaleX: 1, originX: 0 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: 4, ease: "linear" }}
                  className={`h-full ${
                    toast.type === "success" ? "bg-green-400" :
                    toast.type === "error"   ? "bg-red-400"   :
                    toast.type === "warning" ? "bg-yellow-400" :
                                              "bg-blue-400"
                  }`}
                />
              </div>

              {/* Close */}
              <button
                onClick={() => dismiss(toast.id)}
                className="text-warmGrey-500 hover:text-warmGrey-200 transition-colors mt-0.5"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Hook for consuming
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
