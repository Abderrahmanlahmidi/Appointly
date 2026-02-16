"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const toneStyles = {
  success: "border-[#BDE5D3] text-[#037347]",
  error: "border-[#F5C2C0] text-[#EA3A30]",
  warning: "border-[#F7E2B5] text-[#9A5B00]",
  info: "border-[#CFE2FF] text-[#1F4ED8]",
};

const positionStyles = {
  "top-right": "top-6 right-6",
  "top-left": "top-6 left-6",
  "bottom-right": "bottom-6 right-6",
  "bottom-left": "bottom-6 left-6",
};

export function ToastContainer({
  toasts = [],
  onDismiss,
  position = "top-right",
  className = "",
}) {
  return (
    <div
      className={[
        "fixed z-50 flex w-full max-w-sm flex-col gap-3",
        positionStyles[position] ?? positionStyles["top-right"],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={[
              "rounded-2xl border bg-white px-4 py-3 shadow-lg",
              toneStyles[toast.type] ?? toneStyles.info,
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 text-sm">
                {toast.title ? (
                  <div className="font-semibold text-[#0F0F0F]">
                    {toast.title}
                  </div>
                ) : null}
                {toast.message ? (
                  <div className="text-[#4B4B4B]">{toast.message}</div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onDismiss?.(toast.id)}
                className="text-[#6B6B6B] transition hover:text-[#0F0F0F]"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
