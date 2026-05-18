"use client";

import { createContext, useContext, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

const ToastContext = createContext(null);

const ToastMessage = ({ message, type = "info", onDismiss }) => {
  const getToastStyles = () => {
    const baseClasses =
      "flex items-center p-4 mb-4 rounded-2xl shadow-lg border";

    switch (type) {
      case "error":
        return {
          className: `${baseClasses} text-[#ff95a9] bg-[rgba(255,32,71,0.1)] border-[rgba(255,32,71,0.24)]`,
          icon: <AlertCircle className="shrink-0 h-5 w-5 text-[#ff95a9]" />,
          buttonClass: "text-[#ff95a9]",
        };
      case "success":
        return {
          className: `${baseClasses} text-[#8affc7] bg-[rgba(17,255,153,0.1)] border-[rgba(17,255,153,0.22)]`,
          icon: <CheckCircle2 className="shrink-0 h-5 w-5 text-[#8affc7]" />,
          buttonClass: "text-[#8affc7]",
        };
      case "warning":
        return {
          className: `${baseClasses} text-[#ffd98a] bg-[rgba(255,197,61,0.1)] border-[rgba(255,197,61,0.24)]`,
          icon: (
            <AlertTriangle className="shrink-0 h-5 w-5 text-[#ffd98a]" />
          ),
          buttonClass: "text-[#ffd98a]",
        };
      default:
        return {
          className: `${baseClasses} text-[#96cfff] bg-[rgba(59,158,255,0.1)] border-[rgba(59,158,255,0.24)]`,
          icon: <Info className="shrink-0 h-5 w-5 text-[#96cfff]" />,
          buttonClass: "text-[#96cfff]",
        };
    }
  };

  const styles = getToastStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={styles.className}
      role="alert"
    >
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-3">
            {styles.icon}
          <div className="text-sm font-medium text-[var(--color-foreground)]">
            {message}
          </div>
          </div>
        <button
          type="button"
          className={`ml-4 inline-flex h-7 w-7 items-center justify-center rounded-lg p-1.5 ${styles.buttonClass}`}
          onClick={onDismiss}
          aria-label="Close"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextToastIdRef = useRef(0);

  const showToast = (message, type = "info", duration = 5000) => {
    nextToastIdRef.current += 1;
    const id = `toast-${nextToastIdRef.current}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration) {
      setTimeout(() => dismissToast(id), duration);
    }
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = {
    success: (message, duration) => showToast(message, "success", duration),
    error: (message, duration) => showToast(message, "error", duration),
    warning: (message, duration) => showToast(message, "warning", duration),
    info: (message, duration) => showToast(message, "info", duration),
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 w-full max-w-sm space-y-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastMessage
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onDismiss={() => dismissToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
