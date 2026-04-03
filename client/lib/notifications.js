import axios from "./axios";
import { normalizeRole } from "./domain";

export const fetchNotifications = async () => {
  const { data } = await axios.get("/notifications");
  return Array.isArray(data) ? data : [];
};

export const getUnreadNotificationCount = (notifications = []) =>
  notifications.filter((item) => !item?.isRead).length;

const getNotificationContent = (notification) =>
  `${notification?.title ?? ""} ${notification?.message ?? ""}`
    .trim()
    .toLowerCase();

export const getNotificationState = (notification) => {
  const content = getNotificationContent(notification);

  if (content.includes("confirmed")) {
    return "CONFIRMED";
  }

  if (content.includes("cancelled") || content.includes("canceled")) {
    return "CANCELLED";
  }

  return null;
};

export const getNotificationHref = (notification, role) => {
  const normalizedRole = normalizeRole(role);
  const content = getNotificationContent(notification);
  const appointmentId = Number(notification?.appointmentId);
  const appointmentsHref =
    normalizedRole === "ADMIN"
      ? "/admin/appointments"
      : "/appointments";

  if (Number.isFinite(appointmentId) && appointmentId > 0) {
    return `${appointmentsHref}?appointmentId=${appointmentId}`;
  }

  if (content.includes("appointment")) {
    return appointmentsHref;
  }

  if (
    content.includes("chat message") ||
    content.includes("sent you a message") ||
    content.includes("conversation")
  ) {
    return "/messages";
  }

  if (content.includes("category")) {
    return normalizedRole === "ADMIN" ? "/admin/categories" : "/categories";
  }

  if (content.includes("service")) {
    if (normalizedRole === "ADMIN") {
      return "/admin/services";
    }

    return normalizedRole === "PROVIDER" ? "/services" : "/services/catalog";
  }

  return null;
};

export const getNotificationTargetLabel = (href) => {
  if (!href) return null;
  if (href.startsWith("/appointments")) return "Open appointments";
  if (href.startsWith("/admin/appointments")) return "Open admin appointments";
  if (href.startsWith("/admin/categories")) return "Open admin categories";
  if (href.startsWith("/admin/services")) return "Open admin services";
  if (href.startsWith("/messages")) return "Open messages";
  if (href.startsWith("/categories")) return "Open categories";
  if (href.startsWith("/services/catalog")) return "Open services catalog";
  if (href.startsWith("/services")) return "Open services";
  if (href.startsWith("/admin/dashboard")) return "Open admin dashboard";
  return null;
};
