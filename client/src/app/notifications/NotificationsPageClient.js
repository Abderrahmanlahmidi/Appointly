"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "../../../lib/axios";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useToast } from "../../../components/ui/Toast";
import { formatDateTime } from "../../../lib/domain";
import {
  fetchNotifications,
  getNotificationHref,
  getNotificationState,
  getNotificationTargetLabel,
  getUnreadNotificationCount,
} from "../../../lib/notifications";

const getNotificationCardClassName = (notification, state) => {
  if (state === "CONFIRMED") {
    return notification.isRead
      ? "border-[#BDE5D3] bg-white"
      : "border-[#BDE5D3] bg-[#F0FBF5]";
  }

  if (state === "CANCELLED") {
    return notification.isRead
      ? "border-[#F5C2C0] bg-white"
      : "border-[#F5C2C0] bg-[#FFF5F4]";
  }

  return notification.isRead
    ? "border-[#E0E0E0] bg-white"
    : "border-[#CFE2FF] bg-[#F8FBFF]";
};

export default function NotificationsPageClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { toast } = useToast();

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.patch(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to update notification."
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.patch("/notifications/read-all");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read.");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to update notifications."
      );
    },
  });

  const unreadCount = getUnreadNotificationCount(notifications);

  const handleNotificationNavigation = async (notification, href) => {
    if (!href) return;

    if (!notification.isRead) {
      try {
        await markReadMutation.mutateAsync(notification.id);
      } catch {
        // The mutation toast already explains the failure.
      }
    }

    router.push(href);
  };

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-12">
        <PageHeader
          title="Notifications"
          subtitle="Automatic alerts are created when appointments are booked, updated, or cancelled."
          actions={
            <Button
              type="button"
              variant="soft"
              disabled={!unreadCount || markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
            >
              Mark all as read
            </Button>
          }
        />

        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
            Unread notifications
          </div>
          <div className="mt-2 text-2xl font-semibold">{unreadCount}</div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            Loading notifications...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#EA3A30]">
            {error?.message || "Unable to load notifications."}
          </div>
        ) : notifications.length ? (
          <div className="grid gap-4">
            {notifications.map((notification) => {
              const notificationState = getNotificationState(notification);
              const notificationHref = getNotificationHref(
                notification,
                session?.user?.role
              );
              const notificationTargetLabel =
                getNotificationTargetLabel(notificationHref);

              return (
                <article
                  key={notification.id}
                  className={[
                    "rounded-2xl border p-5",
                    getNotificationCardClassName(notification, notificationState),
                    notificationHref
                      ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-sm"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  role={notificationHref ? "button" : undefined}
                  tabIndex={notificationHref ? 0 : undefined}
                  onClick={() =>
                    notificationHref
                      ? void handleNotificationNavigation(
                          notification,
                          notificationHref
                        )
                      : undefined
                  }
                  onKeyDown={(event) => {
                    if (
                      !notificationHref ||
                      (event.key !== "Enter" && event.key !== " ")
                    ) {
                      return;
                    }

                    event.preventDefault();
                    void handleNotificationNavigation(notification, notificationHref);
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-[#0F0F0F]">
                          {notification.title}
                        </h2>
                        <StatusBadge
                          value={notification.isRead ? "READ" : "UNREAD"}
                          toneMap={{
                            READ: "border-[#E0E0E0] bg-[#F7F7F7] text-[#4B4B4B]",
                            UNREAD:
                              "border-[#CFE2FF] bg-[#EEF4FF] text-[#1F4ED8]",
                          }}
                        />
                        {notificationState ? (
                          <StatusBadge value={notificationState} />
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm text-[#4B4B4B]">
                        {notification.message}
                      </p>
                      <div className="mt-3 text-xs text-[#7A7A7A]">
                        {formatDateTime(notification.createdAt)}
                      </div>
                      {notificationTargetLabel ? (
                        <div className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#0F0F0F]">
                          {notificationTargetLabel}
                        </div>
                      ) : null}
                    </div>

                    {!notification.isRead ? (
                      <Button
                        type="button"
                        variant="soft"
                        size="sm"
                        disabled={markReadMutation.isPending}
                        onClick={(event) => {
                          event.stopPropagation();
                          markReadMutation.mutate(notification.id);
                        }}
                        onKeyDown={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        Mark as read
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            You do not have any notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}
