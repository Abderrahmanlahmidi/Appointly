"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";

const variants = {
  info: {
    icon: Info,
    border: "border-[#E0E0E0]",
    background: "bg-[#F6F6F6]",
    accent: "text-[#0F0F0F]",
  },
  success: {
    icon: CheckCircle2,
    border: "border-[#CDE9D5]",
    background: "bg-[#F1FBF4]",
    accent: "text-[#037347]",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-[#F6D8A8]",
    background: "bg-[#FFF7E8]",
    accent: "text-[#B45309]",
  },
  error: {
    icon: XCircle,
    border: "border-[#F6C3C0]",
    background: "bg-[#FFF1F1]",
    accent: "text-[#EA3A30]",
  },
};

export default function Alert({
  variant = "info",
  title,
  message,
  onClose,
  className = "",
}) {
  const config = variants[variant] || variants.info;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={[
        "flex items-start gap-3 rounded-xl border px-4 py-3",
        config.border,
        config.background,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className={`mt-0.5 h-4 w-4 ${config.accent}`} />
      <div className="flex-1">
        {title ? (
          <p className="text-sm font-semibold text-[#0F0F0F]">{title}</p>
        ) : null}
        {message ? (
          <p className={`text-sm text-[#4B4B4B] ${title ? "mt-1" : ""}`}>
            {message}
          </p>
        ) : null}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="text-[#4B4B4B] hover:text-[#0F0F0F]"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
