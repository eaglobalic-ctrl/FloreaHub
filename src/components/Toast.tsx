"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: string; message: string; type: ToastType };

const ICONS = { success: Check, error: AlertCircle, info: Info };
const COLORS = {
  success: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "text-emerald-600", text: "text-emerald-900" },
  error:   { bg: "bg-red-50",     border: "border-red-200",     icon: "text-red-500",     text: "text-red-900" },
  info:    { bg: "bg-blue-50",    border: "border-blue-200",    icon: "text-blue-600",    text: "text-blue-900" },
};

let addToast: (msg: string, type?: ToastType) => void = () => {};
export const toast = {
  success: (msg: string) => addToast(msg, "success"),
  error:   (msg: string) => addToast(msg, "error"),
  info:    (msg: string) => addToast(msg, "info"),
};

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToast = (message, type = "success") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts(t => [...t, { id, message, type }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map(({ id, message, type }) => {
          const Icon = ICONS[type];
          const c = COLORS[type];
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto ${c.bg} ${c.border}`}
            >
              <Icon size={16} className={`flex-shrink-0 ${c.icon}`} strokeWidth={2.5} />
              <p className={`text-sm font-medium flex-1 ${c.text}`}>{message}</p>
              <button onClick={() => setToasts(t => t.filter(x => x.id !== id))} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
