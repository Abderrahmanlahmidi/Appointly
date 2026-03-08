"use client";

import { createContext, useContext, useState } from "react";
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
          className: `${baseClasses} text-[#EA3A30] bg-[#FFF5F4] border-[#F5C2C0]`,
          icon: <AlertCircle className="shrink-0 h-5 w-5 text-[#EA3A30]" />,
          buttonClass: "text-[#EA3A30]",
        };
      case "success":
        return {
          className: `${baseClasses} text-[#037347] bg-[#F0FBF5] border-[#BDE5D3]`,
          icon: <CheckCircle2 className="shrink-0 h-5 w-5 text-[#037347]" />,
          buttonClass: "text-[#037347]",
        };
      case "warning":
        return {
          className: `${baseClasses} text-[#9A5B00] bg-[#FFF7E6] border-[#F7E2B5]`,
          icon: (
            <AlertTriangle className="shrink-0 h-5 w-5 text-[#9A5B00]" />
          ),
          buttonClass: "text-[#9A5B00]",
        };
      default:
        return {
          className: `${baseClasses} text-[#1F4ED8] bg-[#EEF4FF] border-[#CFE2FF]`,
          icon: <Info className="shrink-0 h-5 w-5 text-[#1F4ED8]" />,
          buttonClass: "text-[#1F4ED8]",
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
          <div className="text-sm font-medium text-[#0F0F0F]">{message}</div>
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

  const showToast = (message, type = "info", duration = 5000) => {
    const id = Date.now().toString();
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
