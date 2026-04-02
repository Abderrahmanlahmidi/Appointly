"use client";

import React from "react";
import { formatStatusLabel, statusToneMap } from "../../lib/domain";

export default function StatusBadge({ value, toneMap = {}, className = "" }) {
  const normalized = String(value ?? "").trim().toUpperCase();
  const resolvedClassName =
    toneMap[normalized] ??
    statusToneMap[normalized] ??
    "border-[#E0E0E0] bg-[#F7F7F7] text-[#4B4B4B]";

  return (
    <span
      className={[
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        resolvedClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {formatStatusLabel(normalized)}
    </span>
  );
}
