"use client";

import React from "react";
import { formatCompactPrice, percentage } from "../../lib/admin";

export function DashboardPanel({
  title,
  description,
  actions,
  children,
  className = "",
}) {
  return (
    <section
      className={[
        "min-w-0 overflow-hidden rounded-2xl border border-[#E0E0E0] bg-white p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-[#0F0F0F]">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4B4B4B]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  description,
  tone,
}) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-[#E0E0E0] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A7A7A]">
          {label}
        </div>
        <div
          className={[
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            tone,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="mt-5 text-3xl font-semibold tracking-tight text-[#0F0F0F]">
        {value}
      </div>
      {trend ? (
        <div className="mt-2 break-words text-sm font-medium text-[#0F0F0F]">
          {trend}
        </div>
      ) : null}
      {description ? (
        <p className="mt-3 break-words text-sm leading-6 text-[#4B4B4B]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function DistributionChart({ items }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="grid min-w-0 gap-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[#0F0F0F]">
              {item.label}
            </div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A7A7A]">
              {item.value}
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-[#EDEDED]">
            <div
              className={[
                "h-2.5 rounded-full",
                item.barClassName ?? "bg-[#0F0F0F]",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                width: `${Math.max(10, (item.value / maxValue) * 100)}%`,
              }}
            />
          </div>
          {item.caption ? (
            <div className="mt-2 text-xs text-[#7A7A7A]">{item.caption}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function TrendLineChart({ data, series }) {
  const chartWidth = 640;
  const chartHeight = 220;
  const paddingX = 24;
  const paddingY = 20;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;
  const maxValue = Math.max(
    ...series.flatMap((entry) => data.map((item) => item[entry.key] ?? 0)),
    1
  );
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

  const getPoint = (index, value) => {
    const x = paddingX + stepX * index;
    const y = paddingY + innerHeight - (value / maxValue) * innerHeight;
    return { x, y };
  };

  const gridLines = Array.from({ length: 4 }, (_, index) => {
    const ratio = index / 3;
    return paddingY + innerHeight - ratio * innerHeight;
  });

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap gap-3">
        {series.map((entry) => (
          <div
            key={entry.key}
            className="flex items-center gap-2 rounded-full border border-[#E0E0E0] bg-[#FAFAFA] px-3 py-1.5 text-xs font-semibold text-[#4B4B4B]"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.label}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-4">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-56 w-full"
          preserveAspectRatio="none"
        >
          {gridLines.map((y) => (
            <line
              key={y}
              x1={paddingX}
              y1={y}
              x2={chartWidth - paddingX}
              y2={y}
              stroke="#E0E0E0"
              strokeDasharray="4 6"
            />
          ))}

          {series.map((entry) => {
            const path = data
              .map((item, index) => {
                const point = getPoint(index, item[entry.key] ?? 0);
                return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
              })
              .join(" ");

            return (
              <g key={entry.key}>
                <path
                  d={path}
                  fill="none"
                  stroke={entry.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((item, index) => {
                  const point = getPoint(index, item[entry.key] ?? 0);

                  return (
                    <circle
                      key={`${entry.key}-${item.key}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill={entry.color}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {data.map((item) => (
            <div key={item.key} className="text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0F0F0F]">
                {item.label}
              </div>
              <div className="mt-1 text-[11px] text-[#7A7A7A]">{item.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RevenueBarChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid h-56 grid-cols-7 items-end gap-3">
        {data.map((item) => {
          const height = item.value
            ? Math.max(14, Math.round((item.value / maxValue) * 100))
            : 10;

          return (
            <div key={item.key} className="flex h-full flex-col items-center">
              <div className="mb-2 text-[11px] font-semibold text-[#7A7A7A]">
                {formatCompactPrice(item.value)}
              </div>
              <div className="flex h-full w-full items-end justify-center rounded-3xl bg-[#F7F7F7] px-2 py-3">
                <div
                  className="w-full rounded-2xl bg-[#1E5B9E]"
                  style={{ height: `${height}%` }}
                />
              </div>
              <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#0F0F0F]">
                {item.label}
              </div>
              <div className="mt-1 text-[11px] text-[#7A7A7A]">{item.meta}</div>
            </div>
          );
        })}
      </div>
      <div className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#4B4B4B]">
        Revenue is grouped by booking record creation date over the last 7
        days.
      </div>
    </div>
  );
}

export function StatusMixChart({ items, total, caption }) {
  const normalizedTotal = total || 1;

  return (
    <div className="grid min-w-0 gap-4">
      <div className="overflow-hidden rounded-full bg-[#EDEDED]">
        <div className="flex h-4 w-full">
          {items.map((item) => (
            <div
              key={item.label}
              className={item.barClassName}
              style={{
                width: `${item.value ? (item.value / normalizedTotal) * 100 : 0}%`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3"
          >
            <div className="flex items-center gap-3 text-sm text-[#4B4B4B]">
              <span className={`h-2.5 w-2.5 rounded-full ${item.barClassName}`} />
              {item.label}
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-[#0F0F0F]">
                {item.value}
              </div>
              <div className="text-[11px] text-[#7A7A7A]">
                {percentage(item.value, total)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm leading-6 text-[#4B4B4B]">{caption}</div>
    </div>
  );
}

export function WeekdayBarChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid h-56 grid-cols-7 items-end gap-3">
        {data.map((item) => {
          const height = item.value
            ? Math.max(18, Math.round((item.value / maxValue) * 100))
            : 10;

          return (
            <div key={item.label} className="flex h-full flex-col items-center">
              <div className="mb-2 text-xs font-semibold text-[#7A7A7A]">
                {item.value}
              </div>
              <div className="flex h-full w-full items-end justify-center rounded-3xl bg-[#F7F7F7] px-2 py-3">
                <div
                  className="w-full rounded-2xl bg-[#0F0F0F]"
                  style={{ height: `${height}%` }}
                />
              </div>
              <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7A7A7A]">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CircularMeter({
  label,
  value,
  total,
  caption,
  ringClassName = "stroke-[#0F0F0F]",
}) {
  const normalizedTotal = total || 1;
  const ratio = Math.min(Math.max(value / normalizedTotal, 0), 1);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  return (
    <div className="flex min-w-0 flex-col items-center gap-4 rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-6">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A7A7A]">
        {label}
      </div>
      <div className="relative flex h-36 w-36 items-center justify-center">
        <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={ringClassName}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: dashOffset,
            }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-3xl font-semibold tracking-tight text-[#0F0F0F]">
            {percentage(value, total)}%
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[#7A7A7A]">
            {value}/{total || 0}
          </div>
        </div>
      </div>
      <div className="text-center text-sm leading-6 text-[#4B4B4B]">
        {caption}
      </div>
    </div>
  );
}
