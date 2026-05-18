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
    border: "border-[var(--color-border)]",
    background: "bg-[rgba(255,255,255,0.05)]",
    accent: "text-[#96cfff]",
  },
  success: {
    icon: CheckCircle2,
    border: "border-[rgba(17,255,153,0.22)]",
    background: "bg-[rgba(17,255,153,0.1)]",
    accent: "text-[#8affc7]",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-[rgba(255,197,61,0.24)]",
    background: "bg-[rgba(255,197,61,0.1)]",
    accent: "text-[#ffd98a]",
  },
  error: {
    icon: XCircle,
    border: "border-[rgba(255,32,71,0.24)]",
    background: "bg-[rgba(255,32,71,0.1)]",
    accent: "text-[#ff95a9]",
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
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            {title}
          </p>
        ) : null}
        {message ? (
          <p
            className={`text-sm text-[var(--color-muted)] ${title ? "mt-1" : ""}`}
          >
            {message}
          </p>
        ) : null}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
