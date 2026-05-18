"use client";

import React from "react";

export default function PageHeader({
  title,
  subtitle,
  actions,
  className = "",
  titleClassName = "",
  subtitleClassName = "",
}) {
  return (
    <div
      className={[
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        {title ? (
          <h1
            className={[
              "font-[var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--color-foreground)]",
              titleClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p
            className={[
              "text-sm text-[var(--color-muted)]",
              subtitleClassName,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
