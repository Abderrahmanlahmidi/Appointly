"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import {
  fetchNotifications,
  getUnreadNotificationCount,
} from "../../lib/notifications";

export default function NotificationBellButton({
  userId,
  className = "",
  badgeClassName = "",
}) {
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: Boolean(userId),
  });

  const unreadCount = getUnreadNotificationCount(notifications);
  const unreadLabel = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <Link
      href="/notifications"
      className={[
        "relative inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#0F0F0F] text-[#0F0F0F] transition hover:bg-[#0F0F0F] hover:text-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={
        unreadCount
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
    >
      <Bell className="h-5 w-5" />
      {unreadCount ? (
        <span
          className={[
            "absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#EA3A30] px-1 text-[11px] font-semibold leading-none text-white",
            badgeClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {unreadLabel}
        </span>
      ) : null}
    </Link>
  );
}
