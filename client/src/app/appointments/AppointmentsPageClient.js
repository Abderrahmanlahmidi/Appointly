"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import axios from "../../../lib/axios";
import Button from "../../../components/ui/Button";
import DataTable from "../../../components/ui/DataTable";
import PageHeader from "../../../components/ui/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useToast } from "../../../components/ui/Toast";
import { formatPrice, formatSlot, normalizeRole } from "../../../lib/domain";

const fetchAppointments = async () => {
  const { data } = await axios.get("/appointments");
  return data;
};

export default function AppointmentsPageClient() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredAppointments, setFilteredAppointments] = React.useState([]);

  const role = normalizeRole(session?.user?.role);

  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await axios.patch(`/appointments/${id}/status`, {
        status,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(
        variables.status === "CONFIRMED"
          ? "Appointment confirmed."
          : variables.status === "CANCELLED"
            ? "Appointment cancelled."
            : "Appointment updated."
      );
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to update appointment."
      );
    },
  });

  const handleStatusUpdate = (appointment, status) => {
    updateStatusMutation.mutate({
      id: appointment.id,
      status,
    });
  };

  const participantColumns =
    role === "ADMIN"
      ? [
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
        ]
      : [
          {
            key: role === "PROVIDER" ? "clientName" : "providerName",
            header: role === "PROVIDER" ? "Client" : "Provider",
            cell: (appointment) => (
              <div>
                <div className="text-sm font-semibold text-[#0F0F0F]">
                  {role === "PROVIDER"
                    ? appointment.clientName || "Unknown client"
                    : appointment.providerName || "Unknown provider"}
                </div>
                <div className="text-xs text-[#4B4B4B]">
                  {role === "PROVIDER"
                    ? appointment.clientEmail || "No email"
                    : appointment.providerEmail || "No email"}
                </div>
              </div>
            ),
          },
        ];

  const columns = [
    {
      key: "serviceTitle",
      header: "Service",
      cell: (appointment) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {appointment.serviceTitle || "Unknown service"}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {appointment.categoryName || "Uncategorized"}
          </div>
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
    ...participantColumns,
    {
      key: "status",
      header: "Status",
      cell: (appointment) => <StatusBadge value={appointment.status} />,
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
      key: "note",
      header: "Note",
      cell: (appointment) => (
        <p className="text-sm text-[#4B4B4B]">
          {appointment.note || "No note provided."}
        </p>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (appointment) => {
        const canConfirm =
          role !== "USER" && appointment.status === "PENDING";
        const canCancel = appointment.status !== "CANCELLED";

        if (!canConfirm && !canCancel) {
          return <span className="text-sm text-[#4B4B4B]">No actions</span>;
        }

        return (
          <div className="flex flex-wrap justify-end gap-2">
            {canConfirm ? (
              <Button
                type="button"
                variant="soft"
                size="sm"
                disabled={updateStatusMutation.isPending}
                onClick={() => handleStatusUpdate(appointment, "CONFIRMED")}
              >
                Confirm
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#EA3A30] text-[#EA3A30] hover:bg-[#EA3A30] hover:text-white"
                disabled={updateStatusMutation.isPending}
                onClick={() => handleStatusUpdate(appointment, "CANCELLED")}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ];

  const subtitle =
    role === "PROVIDER"
      ? "Review booking requests, confirm appointments, and handle cancellations."
      : role === "ADMIN"
        ? "Monitor every appointment and intervene when needed."
        : "Track the status of your bookings and cancel when necessary.";

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-12">
        <PageHeader title="Appointments" subtitle={subtitle} />

        <SearchInput
          data={appointments}
          fields={[
            "serviceTitle",
            "categoryName",
            "clientName",
            "providerName",
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
          <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#EA3A30]">
            {error?.message || "Unable to load appointments."}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredAppointments}
            emptyMessage={
              searchTerm.trim().length
                ? "No appointments match your search."
                : "No appointments yet."
            }
          />
        )}
      </div>
    </div>
  );
}
