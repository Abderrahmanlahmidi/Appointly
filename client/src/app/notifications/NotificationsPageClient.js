"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../../../lib/axios";
import Button from "../../../components/ui/Button";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useToast } from "../../../components/ui/Toast";
import { formatDateTime } from "../../../lib/domain";

const fetchNotifications = async () => {
  const { data } = await axios.get("/notifications");
  return data;
};

export default function NotificationsPageClient() {
  const queryClient = useQueryClient();
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

  const unreadCount = notifications.filter((item) => !item.isRead).length;

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
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-2xl border p-5 ${
                  notification.isRead
                    ? "border-[#E0E0E0] bg-white"
                    : "border-[#CFE2FF] bg-[#F8FBFF]"
                }`}
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
                    </div>
                    <p className="mt-3 text-sm text-[#4B4B4B]">
                      {notification.message}
                    </p>
                    <div className="mt-3 text-xs text-[#7A7A7A]">
                      {formatDateTime(notification.createdAt)}
                    </div>
                  </div>

                  {!notification.isRead ? (
                    <Button
                      type="button"
                      variant="soft"
                      size="sm"
                      disabled={markReadMutation.isPending}
                      onClick={() => markReadMutation.mutate(notification.id)}
                    >
                      Mark as read
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
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
