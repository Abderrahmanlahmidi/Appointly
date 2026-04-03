import axios from "./axios";
import { formatPrice, formatStatusLabel } from "./domain";

export const fetchAdminCategories = async () => {
  const { data } = await axios.get("/categories", {
    params: { scope: "all" },
  });
  return Array.isArray(data) ? data : [];
};

export const fetchAdminServices = async () => {
  const { data } = await axios.get("/services", {
    params: { scope: "all" },
  });
  return Array.isArray(data) ? data : [];
};

export const fetchAdminAppointments = async () => {
  const { data } = await axios.get("/appointments");
  return Array.isArray(data) ? data : [];
};

export const fetchAdminUsers = async () => {
  const { data } = await axios.get("/users");
  return Array.isArray(data) ? data : [];
};

export const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const percentage = (value, total) => {
  if (!total) return 0;
  return Math.round((value / total) * 100);
};

export const createdAtValue = (value) => {
  const date = new Date(value ?? 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

export const weekdayIndex = (dateValue) => {
  if (!dateValue) return -1;
  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return -1;
  return (parsed.getDay() + 6) % 7;
};

export const localDayKey = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatChartDayLabel = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleDateString("en-US", { weekday: "short" });
};

export const formatChartDayMeta = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const formatCompactPrice = (value) => {
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

export const priorityValue = (value) =>
  ({
    PENDING: 0,
    REJECTED: 1,
    APPROVED: 2,
    CANCELLED: 0,
    CONFIRMED: 1,
    ACTIVE: 1,
    INACTIVE: 2,
    PROVIDER: 1,
    USER: 2,
    ADMIN: 3,
  })[String(value ?? "").toUpperCase()] ?? 9;

export const statusTone = {
  APPROVED: "bg-[#037347]",
  CONFIRMED: "bg-[#037347]",
  PENDING: "bg-[#D68C1F]",
  REJECTED: "bg-[#B42318]",
  CANCELLED: "bg-[#B42318]",
  ACTIVE: "bg-[#0F0F0F]",
  INACTIVE: "bg-[#7A7A7A]",
  ADMIN: "bg-[#1E5B9E]",
  PROVIDER: "bg-[#037347]",
  USER: "bg-[#7A7A7A]",
};

export const sortAdminCategories = (categories = []) =>
  [...categories].sort((left, right) => {
    const priorityDiff = priorityValue(left.status) - priorityValue(right.status);
    if (priorityDiff !== 0) return priorityDiff;
    return createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
  });

export const sortAdminServices = (services = []) =>
  [...services].sort((left, right) => {
    const priorityDiff =
      priorityValue(left.approvalStatus) - priorityValue(right.approvalStatus);
    if (priorityDiff !== 0) return priorityDiff;
    return createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
  });

export const sortAdminAppointments = (appointments = []) =>
  [...appointments].sort(
    (left, right) => createdAtValue(right.createdAt) - createdAtValue(left.createdAt)
  );

export const sortAdminUsers = (users = []) =>
  [...users].sort((left, right) => {
    const priorityDiff = priorityValue(left.role) - priorityValue(right.role);
    if (priorityDiff !== 0) return priorityDiff;
    return createdAtValue(right.createdAt) - createdAtValue(left.createdAt);
  });

export const buildAdminAnalyticsModel = ({
  categories = [],
  services = [],
  appointments = [],
  users = [],
} = {}) => {
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

  const adminUsers = users.filter((item) => item.role === "ADMIN").length;
  const providerUsers = users.filter((item) => item.role === "PROVIDER").length;
  const standardUsers = users.filter((item) => item.role === "USER").length;

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
  const revenueByDay = Object.fromEntries(
    recentTimeline.map((item) => [item.key, 0])
  );

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

  const roleMix = [
    {
      label: "Admins",
      value: adminUsers,
      caption: "Platform operators and policy owners",
      barClassName: "bg-[#1E5B9E]",
    },
    {
      label: "Providers",
      value: providerUsers,
      caption: "Service owners publishing supply",
      barClassName: "bg-[#037347]",
    },
    {
      label: "Clients",
      value: standardUsers,
      caption: "Standard users booking and messaging",
      barClassName: "bg-[#0F0F0F]",
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
    ...users.map((item) => ({
      id: `user-${item.id}`,
      label: "User account",
      title: item.name || item.email || "Unknown user",
      detail: `${item.email || "No email"} • ${formatStatusLabel(item.role)}`,
      createdAt: item.createdAt,
      status: item.role,
    })),
  ]
    .sort((left, right) => createdAtValue(right.createdAt) - createdAtValue(left.createdAt))
    .slice(0, 10);

  return {
    pendingCategories,
    approvedCategories,
    rejectedCategories,
    pendingServices,
    approvedServices,
    rejectedServices,
    confirmedAppointments,
    cancelledAppointments,
    pendingAppointments,
    adminUsers,
    providerUsers,
    standardUsers,
    totalRevenue,
    averageTicket,
    activeProviders,
    activityTrend,
    revenueTrend,
    weekdayVolume,
    approvalMix,
    categoryMix,
    appointmentStatusMix,
    roleMix,
    recentFeed,
  };
};
