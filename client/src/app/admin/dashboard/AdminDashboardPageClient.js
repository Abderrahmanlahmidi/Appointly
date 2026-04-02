"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  FolderKanban,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import axios from "../../../../lib/axios";
import Button from "../../../../components/ui/Button";
import DataTable from "../../../../components/ui/DataTable";
import PageHeader from "../../../../components/ui/PageHeader";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { useToast } from "../../../../components/ui/Toast";
import {
  formatDate,
  formatPrice,
  formatSlot,
  formatStatusLabel,
} from "../../../../lib/domain";

const fetchCategories = async () => {
  const { data } = await axios.get("/categories", {
    params: { scope: "all" },
  });
  return data;
};

const fetchServices = async () => {
  const { data } = await axios.get("/services", {
    params: { scope: "all" },
  });
  return data;
};

const fetchAppointments = async () => {
  const { data } = await axios.get("/appointments");
  return data;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const percentage = (value, total) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

const createdAtValue = (value) => {
  const date = new Date(value ?? 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const weekdayIndex = (dateValue) => {
  if (!dateValue) return -1;
  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return -1;
  return (parsed.getDay() + 6) % 7;
};

const localDayKey = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatChartDayLabel = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleDateString("en-US", { weekday: "short" });
};

const formatChartDayMeta = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatCompactPrice = (value) => {
  const amount = Number(value ?? 0);

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return formatPrice(amount);
  }
};

const priorityValue = (value) =>
  ({
    PENDING: 0,
    REJECTED: 1,
    APPROVED: 2,
    CANCELLED: 0,
    CONFIRMED: 1,
    ACTIVE: 1,
    INACTIVE: 2,
  })[String(value ?? "").toUpperCase()] ?? 9;

const statusTone = {
  APPROVED: "bg-[#037347]",
  CONFIRMED: "bg-[#037347]",
  PENDING: "bg-[#D68C1F]",
  REJECTED: "bg-[#B42318]",
  CANCELLED: "bg-[#B42318]",
  ACTIVE: "bg-[#0F0F0F]",
  INACTIVE: "bg-[#7A7A7A]",
};

function DashboardPanel({
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

function MetricCard({ icon: Icon, label, value, trend, description, tone }) {
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
      <div className="mt-2 break-words text-sm font-medium text-[#0F0F0F]">
        {trend}
      </div>
      <p className="mt-3 break-words text-sm leading-6 text-[#4B4B4B]">
        {description}
      </p>
    </div>
  );
}

function DistributionChart({ items }) {
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

function TrendLineChart({ data, series }) {
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

function RevenueBarChart({ data }) {
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

function StatusMixChart({ items, total, caption }) {
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

function WeekdayBarChart({ data }) {
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

function CircularMeter({
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

function ModuleCard({ title, href, description, meta, icon: Icon }) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E0E0E0] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FAFAFA] text-[#0F0F0F]">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-[#E0E0E0] bg-[#FAFAFA] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#7A7A7A]">
          {meta}
        </span>
      </div>
      <div className="mt-5 text-lg font-semibold tracking-tight text-[#0F0F0F]">
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-[#4B4B4B]">{description}</p>
      <div className="mt-5">
        <Button href={href} variant="soft" className="w-full justify-between">
          Open module
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminDashboardPageClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: fetchCategories,
  });

  const {
    data: services = [],
    isLoading: servicesLoading,
    isError: servicesError,
  } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: fetchServices,
  });

  const {
    data: appointments = [],
    isLoading: appointmentsLoading,
    isError: appointmentsError,
  } = useQuery({
    queryKey: ["admin", "appointments"],
    queryFn: fetchAppointments,
  });

  const moderateCategoryMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await axios.patch(`/categories/${id}/moderate`, {
        status,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category moderation updated.");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to moderate category."
      );
    },
  });

  const moderateServiceMutation = useMutation({
    mutationFn: async ({ id, approvalStatus }) => {
      const response = await axios.patch(`/services/${id}/moderate`, {
        approvalStatus,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service moderation updated.");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to moderate service."
      );
    },
  });

  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await axios.patch(`/appointments/${id}/status`, {
        status,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Appointment updated.");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to update appointment."
      );
    },
  });

  const sortedCategories = [...categories].sort((left, right) => {
    const priorityDiff = priorityValue(left.status) - priorityValue(right.status);
    if (priorityDiff !== 0) return priorityDiff;
    return createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
  });

  const sortedServices = [...services].sort((left, right) => {
    const priorityDiff =
      priorityValue(left.approvalStatus) - priorityValue(right.approvalStatus);
    if (priorityDiff !== 0) return priorityDiff;
    return createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
  });

  const sortedAppointments = [...appointments].sort(
    (left, right) => createdAtValue(right.createdAt) - createdAtValue(left.createdAt)
  );

  const pendingCategories = categories.filter(
    (item) => item.status === "PENDING"
  ).length;
  const approvedCategories = categories.filter(
    (item) => item.status === "APPROVED"
  ).length;
  const rejectedCategories = categories.filter(
    (item) => item.status === "REJECTED"
  ).length;

  const pendingServices = services.filter(
    (item) => item.approvalStatus === "PENDING"
  ).length;
  const approvedServices = services.filter(
    (item) => item.approvalStatus === "APPROVED"
  ).length;
  const rejectedServices = services.filter(
    (item) => item.approvalStatus === "REJECTED"
  ).length;

  const confirmedAppointments = appointments.filter(
    (item) => item.status === "CONFIRMED"
  ).length;
  const cancelledAppointments = appointments.filter(
    (item) => item.status === "CANCELLED"
  ).length;
  const pendingAppointments = appointments.filter(
    (item) => item.status === "PENDING"
  ).length;

  const totalRevenue = appointments.reduce(
    (sum, item) => sum + Number(item.totalPrice ?? 0),
    0
  );
  const averageTicket = appointments.length
    ? totalRevenue / appointments.length
    : 0;
  const activeProviders = new Set(
    services.map((service) => service.providerId).filter(Boolean)
  ).size;

  const recentTimeline = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    return {
      key: localDayKey(date),
      label: formatChartDayLabel(date),
      meta: formatChartDayMeta(date),
    };
  });

  const categoryActivityByDay = Object.fromEntries(
    recentTimeline.map((item) => [item.key, 0])
  );
  const serviceActivityByDay = Object.fromEntries(
    recentTimeline.map((item) => [item.key, 0])
  );
  const appointmentActivityByDay = Object.fromEntries(
    recentTimeline.map((item) => [item.key, 0])
  );
  const revenueByDay = Object.fromEntries(recentTimeline.map((item) => [item.key, 0]));

  categories.forEach((item) => {
    const key = localDayKey(item.createdAt);
    if (key && key in categoryActivityByDay) {
      categoryActivityByDay[key] += 1;
    }
  });

  services.forEach((item) => {
    const key = localDayKey(item.createdAt);
    if (key && key in serviceActivityByDay) {
      serviceActivityByDay[key] += 1;
    }
  });

  appointments.forEach((item) => {
    const key = localDayKey(item.createdAt);
    if (key && key in appointmentActivityByDay) {
      appointmentActivityByDay[key] += 1;
      revenueByDay[key] += Number(item.totalPrice ?? 0);
    }
  });

  const activityTrend = recentTimeline.map((item) => ({
    ...item,
    categories: categoryActivityByDay[item.key] ?? 0,
    services: serviceActivityByDay[item.key] ?? 0,
    appointments: appointmentActivityByDay[item.key] ?? 0,
  }));

  const revenueTrend = recentTimeline.map((item) => ({
    ...item,
    value: revenueByDay[item.key] ?? 0,
  }));

  const weekdayVolume = weekdayLabels.map((label, index) => ({
    label,
    value: appointments.filter((appointment) => weekdayIndex(appointment.date) === index)
      .length,
  }));

  const approvalMix = [
    {
      label: "Approved supply",
      value: approvedServices,
      caption: `${percentage(approvedServices, services.length)}% of published services`,
      barClassName: "bg-[#037347]",
    },
    {
      label: "Pending review",
      value: pendingServices,
      caption: "Awaiting administrative approval",
      barClassName: "bg-[#D68C1F]",
    },
    {
      label: "Rejected",
      value: rejectedServices,
      caption: "Needs correction before going live",
      barClassName: "bg-[#B42318]",
    },
  ];

  const categoryMix = [
    {
      label: "Approved categories",
      value: approvedCategories,
      caption: "Available across the public catalog",
      barClassName: "bg-[#0F0F0F]",
    },
    {
      label: "Pending category requests",
      value: pendingCategories,
      caption: "Needs review from the moderation queue",
      barClassName: "bg-[#D68C1F]",
    },
    {
      label: "Rejected requests",
      value: rejectedCategories,
      caption: "Require revision before reuse",
      barClassName: "bg-[#B42318]",
    },
  ];

  const appointmentStatusMix = [
    {
      label: "Confirmed",
      value: confirmedAppointments,
      barClassName: "bg-[#037347]",
    },
    {
      label: "Pending",
      value: pendingAppointments,
      barClassName: "bg-[#D68C1F]",
    },
    {
      label: "Cancelled",
      value: cancelledAppointments,
      barClassName: "bg-[#B42318]",
    },
  ];

  const recentFeed = [
    ...categories.map((item) => ({
      id: `category-${item.id}`,
      label: "Category request",
      title: item.name,
      detail: `${item.ownerName || "Unknown user"} submitted a ${formatStatusLabel(
        item.status
      )} category.`,
      createdAt: item.createdAt,
      status: item.status,
    })),
    ...services.map((item) => ({
      id: `service-${item.id}`,
      label: "Service submission",
      title: item.title,
      detail: `${item.providerName || "Unknown provider"} has a ${formatStatusLabel(
        item.approvalStatus
      )} service review.`,
      createdAt: item.createdAt,
      status: item.approvalStatus,
    })),
    ...appointments.map((item) => ({
      id: `appointment-${item.id}`,
      label: "Appointment",
      title: item.serviceTitle || "Booking record",
      detail: `${item.clientName || "Unknown client"} → ${
        item.providerName || "Unknown provider"
      } • ${formatStatusLabel(item.status)}`,
      createdAt: item.createdAt,
      status: item.status,
    })),
  ]
    .sort((left, right) => createdAtValue(right.createdAt) - createdAtValue(left.createdAt))
    .slice(0, 8);

  const moduleCards = [
    {
      title: "Analytics",
      href: "/admin/analytics",
      description:
        "Prepare deeper demand, conversion, and retention visualizations.",
      meta: "Growth",
      icon: BarChart3,
    },
    {
      title: "Reports",
      href: "/admin/reports",
      description:
        "House executive exports, operational summaries, and compliance packs.",
      meta: "Exports",
      icon: Layers3,
    },
    {
      title: "Activity",
      href: "/admin/activity",
      description:
        "Review audit history, operational events, and intervention timelines.",
      meta: "Audit",
      icon: Activity,
    },
    {
      title: "Management",
      href: "/admin/management",
      description:
        "Expand into user ops, support tooling, and platform interventions.",
      meta: "Ops",
      icon: FolderKanban,
    },
  ];

  const categoryColumns = [
    {
      key: "name",
      header: "Category",
      cell: (category) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {category.name}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {category.description || "No description"}
          </div>
        </div>
      ),
    },
    {
      key: "ownerName",
      header: "Requested by",
      cell: (category) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {category.ownerName}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {category.ownerEmail || "No email"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (category) => <StatusBadge value={category.status} />,
    },
    {
      key: "moderationNote",
      header: "Admin note",
      cell: (category) => (
        <span className="text-sm text-[#4B4B4B]">
          {category.moderationNote || "No note"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (category) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="soft"
            size="sm"
            disabled={moderateCategoryMutation.isPending}
            onClick={() =>
              moderateCategoryMutation.mutate({
                id: category.id,
                status: "APPROVED",
              })
            }
          >
            Approve
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={moderateCategoryMutation.isPending}
            onClick={() =>
              moderateCategoryMutation.mutate({
                id: category.id,
                status: "PENDING",
              })
            }
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#EA3A30] text-[#EA3A30] hover:bg-[#EA3A30] hover:text-white"
            disabled={moderateCategoryMutation.isPending}
            onClick={() =>
              moderateCategoryMutation.mutate({
                id: category.id,
                status: "REJECTED",
              })
            }
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const serviceColumns = [
    {
      key: "title",
      header: "Service",
      cell: (service) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {service.title}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {service.categoryName || "Uncategorized"}
          </div>
        </div>
      ),
    },
    {
      key: "providerName",
      header: "Provider",
      cell: (service) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {service.providerName}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {service.providerEmail || "No email"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Visibility",
      cell: (service) => <StatusBadge value={service.status} />,
    },
    {
      key: "approvalStatus",
      header: "Approval",
      cell: (service) => <StatusBadge value={service.approvalStatus} />,
    },
    {
      key: "price",
      header: "Price",
      cell: (service) => (
        <span className="text-sm text-[#0F0F0F]">
          {formatPrice(service.price)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (service) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="soft"
            size="sm"
            disabled={moderateServiceMutation.isPending}
            onClick={() =>
              moderateServiceMutation.mutate({
                id: service.id,
                approvalStatus: "APPROVED",
              })
            }
          >
            Approve
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={moderateServiceMutation.isPending}
            onClick={() =>
              moderateServiceMutation.mutate({
                id: service.id,
                approvalStatus: "PENDING",
              })
            }
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#EA3A30] text-[#EA3A30] hover:bg-[#EA3A30] hover:text-white"
            disabled={moderateServiceMutation.isPending}
            onClick={() =>
              moderateServiceMutation.mutate({
                id: service.id,
                approvalStatus: "REJECTED",
              })
            }
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const appointmentColumns = [
    {
      key: "serviceTitle",
      header: "Service",
      cell: (appointment) => (
        <div className="text-sm font-semibold text-[#0F0F0F]">
          {appointment.serviceTitle || "Unknown service"}
        </div>
      ),
    },
    {
      key: "slot",
      header: "Slot",
      cell: (appointment) => (
        <span className="text-sm text-[#0F0F0F]">
          {formatSlot(appointment.date, appointment.startTime, appointment.endTime)}
        </span>
      ),
    },
    {
      key: "clientName",
      header: "Client",
      cell: (appointment) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {appointment.clientName || "Unknown client"}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {appointment.clientEmail || "No email"}
          </div>
        </div>
      ),
    },
    {
      key: "providerName",
      header: "Provider",
      cell: (appointment) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {appointment.providerName || "Unknown provider"}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {appointment.providerEmail || "No email"}
          </div>
        </div>
      ),
    },
    {
      key: "totalPrice",
      header: "Total",
      cell: (appointment) => (
        <span className="text-sm text-[#0F0F0F]">
          {formatPrice(appointment.totalPrice)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (appointment) => <StatusBadge value={appointment.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (appointment) => (
        <div className="flex flex-wrap justify-end gap-2">
          {appointment.status === "PENDING" ? (
            <Button
              type="button"
              variant="soft"
              size="sm"
              disabled={updateAppointmentStatusMutation.isPending}
              onClick={() =>
                updateAppointmentStatusMutation.mutate({
                  id: appointment.id,
                  status: "CONFIRMED",
                })
              }
            >
              Confirm
            </Button>
          ) : null}
          {appointment.status !== "CANCELLED" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-[#EA3A30] text-[#EA3A30] hover:bg-[#EA3A30] hover:text-white"
              disabled={updateAppointmentStatusMutation.isPending}
              onClick={() =>
                updateAppointmentStatusMutation.mutate({
                  id: appointment.id,
                  status: "CANCELLED",
                })
              }
            >
              Cancel
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="rounded-2xl border border-[#E0E0E0] bg-white p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#7A7A7A]">
              <Sparkles className="h-3.5 w-3.5" />
              Executive Overview
            </div>
            <PageHeader
              className="mt-3"
              title="Admin dashboard"
              subtitle="A single operating surface for platform health, moderation, booking flow, and the admin modules that will grow with the product."
              titleClassName="text-3xl tracking-tight"
              subtitleClassName="max-w-3xl text-[#4B4B4B]"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/admin/analytics" variant="soft" className="gap-2">
              Analytics
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/admin/management" className="gap-2">
              Open management
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A7A7A]">
              Moderation load
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#0F0F0F]">
              {pendingCategories + pendingServices}
            </div>
            <div className="mt-2 text-sm text-[#4B4B4B]">
              {pendingCategories} categories and {pendingServices} services are
              waiting for review.
            </div>
          </div>
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A7A7A]">
              Booking pressure
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#0F0F0F]">
              {pendingAppointments}
            </div>
            <div className="mt-2 text-sm text-[#4B4B4B]">
              Pending appointments that may need intervention or follow-up.
            </div>
          </div>
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A7A7A]">
              Approval rate
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#0F0F0F]">
              {percentage(approvedServices, services.length)}%
            </div>
            <div className="mt-2 text-sm text-[#4B4B4B]">
              Share of services currently approved for public visibility.
            </div>
          </div>
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A7A7A]">
              Cancellation rate
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#0F0F0F]">
              {percentage(cancelledAppointments, appointments.length)}%
            </div>
            <div className="mt-2 text-sm text-[#4B4B4B]">
              Portion of bookings that were cancelled after creation.
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <MetricCard
          icon={DollarSign}
          label="Gross booking value"
          value={formatPrice(totalRevenue)}
          trend={`${appointments.length} total appointments`}
          description={`Average ticket ${formatPrice(averageTicket)} across all recorded bookings.`}
          tone="bg-[#0F0F0F]"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Pending moderation"
          value={pendingCategories + pendingServices}
          trend={`${pendingCategories} categories • ${pendingServices} services`}
          description="The live review queue that currently needs admin attention."
          tone="bg-[#A65E00]"
        />
        <MetricCard
          icon={Users}
          label="Active providers"
          value={activeProviders}
          trend={`${approvedServices} approved services live`}
          description="Unique providers represented in the current service catalog."
          tone="bg-[#037347]"
        />
        <MetricCard
          icon={CalendarClock}
          label="Confirmed bookings"
          value={`${percentage(confirmedAppointments, appointments.length)}%`}
          trend={`${confirmedAppointments} confirmed appointments`}
          description="Share of bookings that successfully moved into confirmed state."
          tone="bg-[#1E5B9E]"
        />
        <MetricCard
          icon={FolderKanban}
          label="Approved categories"
          value={approvedCategories}
          trend={`${categories.length} total category records`}
          description="Approved catalog structure available for providers and clients."
          tone="bg-[#5B3FD0]"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr] 2xl:grid-cols-[1.4fr_1fr_1fr]">
        <DashboardPanel
          title="Platform activity trend"
          description="Daily creation volume across categories, services, and bookings for the last 7 days."
        >
          <TrendLineChart
            data={activityTrend}
            series={[
              {
                key: "appointments",
                label: "Bookings",
                color: "#0F0F0F",
              },
              {
                key: "services",
                label: "Services",
                color: "#037347",
              },
              {
                key: "categories",
                label: "Categories",
                color: "#1E5B9E",
              },
            ]}
          />
        </DashboardPanel>

        <DashboardPanel
          title="Revenue intake"
          description="Booking value created over the last 7 days."
        >
          <RevenueBarChart data={revenueTrend} />
        </DashboardPanel>

        <DashboardPanel
          title="Appointment status mix"
          description="A stacked operational view of booking states across the platform."
        >
          <StatusMixChart
            items={appointmentStatusMix}
            total={appointments.length}
            caption={`${appointments.length} booking records are currently tracked in the admin workspace.`}
          />
        </DashboardPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <DashboardPanel
          title="Demand by weekday"
          description="A quick booking distribution chart to show where activity clusters through the week."
        >
          <WeekdayBarChart data={weekdayVolume} />
        </DashboardPanel>

        <div className="grid gap-4">
          <DashboardPanel
            title="Booking outcome"
            description="Confirmation rate across all recorded appointments."
          >
            <CircularMeter
              label="Confirmed bookings"
              value={confirmedAppointments}
              total={appointments.length}
              caption="Confirmed appointments indicate the healthiest booking flow."
              ringClassName="stroke-[#037347]"
            />
          </DashboardPanel>
          <DashboardPanel
            title="Operational watchlist"
            description="Key signals that should stay visible during daily admin review."
          >
            <div className="grid gap-3">
              {[
                {
                  label: "Pending category requests",
                  value: pendingCategories,
                },
                {
                  label: "Pending service approvals",
                  value: pendingServices,
                },
                {
                  label: "Cancelled appointments",
                  value: cancelledAppointments,
                },
                {
                  label: "Average ticket",
                  value: formatPrice(averageTicket),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3"
                >
                  <span className="text-sm text-[#4B4B4B]">{item.label}</span>
                  <span className="text-sm font-semibold text-[#0F0F0F]">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <DashboardPanel
          title="Category review health"
          description="Visibility into category request volume and review output."
        >
          <DistributionChart items={categoryMix} />
        </DashboardPanel>
        <DashboardPanel
          title="Service approval pipeline"
          description="Where supply is landing inside the moderation pipeline."
        >
          <DistributionChart items={approvalMix} />
        </DashboardPanel>
        <DashboardPanel
          title="Recent platform activity"
          description="A lightweight operational feed across categories, services, and bookings."
        >
          <div className="grid gap-3">
            {recentFeed.length ? (
              recentFeed.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#EDEDED] bg-[#FAFAFA] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A7A7A]">
                      {item.label}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#7A7A7A]">
                      <span
                        className={[
                          "h-2.5 w-2.5 rounded-full",
                          statusTone[item.status] ?? "bg-[#7A7A7A]",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      />
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-[#0F0F0F]">
                    {item.title}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-[#4B4B4B]">
                    {item.detail}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-5 text-sm text-[#4B4B4B]">
                No platform activity has been recorded yet.
              </div>
            )}
          </div>
        </DashboardPanel>
      </section>

      <DashboardPanel
        title="Admin modules"
        description="A scalable control-panel structure for future administrative tooling, reports, and settings."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4">
          {moduleCards.map((item) => (
            <ModuleCard key={item.href} {...item} />
          ))}
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Category moderation"
        description="Review custom category requests and keep the platform taxonomy clean."
        actions={
          <div className="rounded-full border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7A7A7A]">
            {pendingCategories} waiting review
          </div>
        }
      >
        {categoriesLoading ? (
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            Loading categories...
          </div>
        ) : categoriesError ? (
          <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#EA3A30]">
            Unable to load categories.
          </div>
        ) : (
          <DataTable
            columns={categoryColumns}
            data={sortedCategories}
            emptyMessage="No category requests found."
          />
        )}
      </DashboardPanel>

      <DashboardPanel
        title="Service moderation"
        description="Approve or reject provider services before they become public-facing."
        actions={
          <div className="rounded-full border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7A7A7A]">
            {pendingServices} awaiting decision
          </div>
        }
      >
        {servicesLoading ? (
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            Loading services...
          </div>
        ) : servicesError ? (
          <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#EA3A30]">
            Unable to load services.
          </div>
        ) : (
          <DataTable
            columns={serviceColumns}
            data={sortedServices}
            emptyMessage="No services found."
          />
        )}
      </DashboardPanel>

      <DashboardPanel
        title="System appointments"
        description="Monitor bookings across the entire platform and intervene when statuses need correction."
        actions={
          <div className="rounded-full border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7A7A7A]">
            {appointments.length} total records
          </div>
        }
      >
        {appointmentsLoading ? (
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            Loading appointments...
          </div>
        ) : appointmentsError ? (
          <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#EA3A30]">
            Unable to load appointments.
          </div>
        ) : (
          <DataTable
            columns={appointmentColumns}
            data={sortedAppointments}
            emptyMessage="No appointments found."
          />
        )}
      </DashboardPanel>

      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F0F0F] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">
                Governance
              </div>
              <div className="text-sm text-[#4B4B4B]">
                Policy and moderation readiness
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#4B4B4B]">
            Static admin pages for analytics, reports, activity, settings, and
            management are now wired so the control panel can grow without route
            churn.
          </p>
        </div>
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#037347] text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">
                Supply control
              </div>
              <div className="text-sm text-[#4B4B4B]">
                Services and categories under review
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#4B4B4B]">
            The moderation tables below remain the operational center for live
            category and service approvals.
          </p>
        </div>
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E5B9E] text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">
                Operational visibility
              </div>
              <div className="text-sm text-[#4B4B4B]">
                Booking oversight and trend awareness
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#4B4B4B]">
            Appointments, booking value, cancellation rate, and activity feed
            give admins one place to monitor core platform movement.
          </p>
        </div>
      </section>
    </div>
  );
}
