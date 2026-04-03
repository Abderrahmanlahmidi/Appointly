"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import axios from "../../../../lib/axios";
import {
  fetchAdminAppointments,
  sortAdminAppointments,
} from "../../../../lib/admin";
import { formatPrice, formatSlot } from "../../../../lib/domain";
import Button from "../../../../components/ui/Button";
import DataTable from "../../../../components/ui/DataTable";
import PageHeader from "../../../../components/ui/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { useToast } from "../../../../components/ui/Toast";

const parseSearchParamId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export default function AdminAppointmentsPageClient() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredAppointments, setFilteredAppointments] = React.useState([]);

  const highlightedAppointmentId = parseSearchParamId(
    searchParams.get("appointmentId")
  );

  const {
    data: appointments = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "appointments"],
    queryFn: fetchAdminAppointments,
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

  const sortedAppointments = React.useMemo(
    () => sortAdminAppointments(appointments),
    [appointments]
  );

  const searchedAppointments = searchTerm.trim().length
    ? filteredAppointments
    : sortedAppointments;

  const visibleAppointments = React.useMemo(() => {
    if (!highlightedAppointmentId) {
      return searchedAppointments;
    }

    const highlightedAppointment = searchedAppointments.find(
      (appointment) => appointment.id === highlightedAppointmentId
    );

    if (!highlightedAppointment) {
      return searchedAppointments;
    }

    return [
      highlightedAppointment,
      ...searchedAppointments.filter(
        (appointment) => appointment.id !== highlightedAppointmentId
      ),
    ];
  }, [highlightedAppointmentId, searchedAppointments]);

  const confirmedAppointments = appointments.filter(
    (item) => item.status === "CONFIRMED"
  ).length;
  const pendingAppointments = appointments.filter(
    (item) => item.status === "PENDING"
  ).length;
  const cancelledAppointments = appointments.filter(
    (item) => item.status === "CANCELLED"
  ).length;

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
        <PageHeader
          title="Appointments"
          subtitle="Monitor platform bookings in a separate admin page and intervene without keeping the main dashboard crowded."
          actions={
            <Button href="/admin/dashboard" variant="soft">
              Back to overview
            </Button>
          }
        />
      </section>

      {highlightedAppointmentId ? (
        <div className="rounded-2xl border border-[#F7E2B5] bg-[#FFFBEA] p-4 text-sm text-[#7A4B00]">
          Opened from a notification. The matching appointment is highlighted
          below when it is available in this list.
        </div>
      ) : null}

      <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[#7A7A7A]">
            Pending
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#0F0F0F]">
            {pendingAppointments}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[#7A7A7A]">
            Confirmed
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#0F0F0F]">
            {confirmedAppointments}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[#7A7A7A]">
            Cancelled
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#0F0F0F]">
            {cancelledAppointments}
          </div>
        </div>
      </section>

      <SearchInput
        data={sortedAppointments}
        fields={[
          "serviceTitle",
          "categoryName",
          "clientName",
          "clientEmail",
          "providerName",
          "providerEmail",
          "status",
          "note",
        ]}
        onResults={(results, query) => {
          setFilteredAppointments(results);
          setSearchTerm(query);
        }}
        placeholder="Search appointments..."
        className="w-full"
      />

      {isLoading ? (
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
          Loading appointments...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
          Unable to load appointments.
        </div>
      ) : (
        <DataTable
          columns={appointmentColumns}
          data={visibleAppointments}
          rowClassName={(appointment) =>
            appointment.id === highlightedAppointmentId ? "bg-[#FFFBEA]" : ""
          }
          emptyMessage={
            searchTerm.trim().length
              ? "No appointments match your search."
              : "No appointments found."
          }
        />
      )}
    </div>
  );
}
