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
            className={["text-2xl font-semibold", titleClassName]
              .filter(Boolean)
              .join(" ")}
          >
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p
            className={["text-sm text-[#4B4B4B]", subtitleClassName]
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
