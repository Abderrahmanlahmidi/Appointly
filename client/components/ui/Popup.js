"use client";
import React from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

export default function Popup({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmVariant = "primary",
  confirmClassName = "",
}) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        onCancel?.();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#E0E0E0] bg-white p-6 shadow-xl"
      >
        {title ? (
          <h2 className="text-lg font-semibold text-[#0F0F0F]">{title}</h2>
        ) : null}
        {description ? (
          <p className="mt-2 text-sm text-[#4B4B4B]">{description}</p>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="soft" className="w-full sm:w-auto" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            className={["w-full sm:w-auto", confirmClassName]
              .filter(Boolean)
              .join(" ")}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
