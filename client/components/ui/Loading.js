"use client";

import React from "react";

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
};

const dotSizeMap = {
  sm: "h-1.5 w-1.5",
  md: "h-2 w-2",
  lg: "h-2.5 w-2.5",
  xl: "h-3 w-3",
};

export default function Loading({
  label = "Loading...",
  size = "md",
  variant = "spinner",
  inline = false,
  className = "",
  labelClassName = "",
}) {
  const spinnerSize = sizeMap[size] || sizeMap.md;
  const dotSize = dotSizeMap[size] || dotSizeMap.md;

  const content =
    variant === "dots" ? (
      <div className="flex items-center gap-1">
        <span
          className={`inline-block ${dotSize} animate-bounce rounded-full bg-[var(--color-orange-10)] [animation-delay:-0.2s]`}
        />
        <span
          className={`inline-block ${dotSize} animate-bounce rounded-full bg-[var(--color-blue-10)] [animation-delay:-0.1s]`}
        />
        <span
          className={`inline-block ${dotSize} animate-bounce rounded-full bg-[var(--color-green-4)]`}
        />
      </div>
    ) : (
      <span
        className={`inline-block ${spinnerSize} animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-foreground)]`}
      />
    );

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        inline ? "inline-flex" : "flex",
        "items-center gap-2 text-sm text-[var(--color-muted)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {content}
      {label ? (
        <span className={labelClassName}>{label}</span>
      ) : null}
    </div>
  );
}
