"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../../../lib/axios";
import Button from "../../../components/ui/Button";
import DataTable from "../../../components/ui/DataTable";
import OverlayForm from "../../../components/ui/OverlayForm";
import PageHeader from "../../../components/ui/PageHeader";
import Popup from "../../../components/ui/Popup";
import SearchInput from "../../../components/ui/SearchInput";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useToast } from "../../../components/ui/Toast";
import { formatSlot } from "../../../lib/domain";

const fetchAvailabilities = async () => {
  const { data } = await axios.get("/availabilities", {
    params: { scope: "owned" },
  });
  return data;
};

const fetchServices = async () => {
  const { data } = await axios.get("/services", {
    params: { scope: "owned" },
  });
  return data;
};

const sortSlots = (items) =>
  [...items].sort((first, second) =>
    `${first.date} ${first.startTime}`.localeCompare(
      `${second.date} ${second.startTime}`
    )
  );

export default function AvailabilityPageClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [overlayOpen, setOverlayOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState("create");
  const [selectedAvailability, setSelectedAvailability] = React.useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [availabilityToDelete, setAvailabilityToDelete] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredAvailabilities, setFilteredAvailabilities] = React.useState([]);

  const {
    data: services = [],
    isLoading: isServicesLoading,
    isError: isServicesError,
  } = useQuery({
    queryKey: ["services", "owned"],
    queryFn: fetchServices,
  });

  const {
    data: availabilities = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["availabilities", "owned"],
    queryFn: fetchAvailabilities,
  });

  const sortedAvailabilities = React.useMemo(
    () => sortSlots(availabilities),
    [availabilities]
  );

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["availabilities"] });
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
  };

  const createMutation = useMutation({
    mutationFn: async (values) => {
      const response = await axios.post("/availabilities", {
        ...values,
        serviceId: Number(values.serviceId),
      });
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("Availability slot created.");
      setOverlayOpen(false);
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to create availability."
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }) => {
      const response = await axios.patch(`/availabilities/${id}`, {
        ...values,
        serviceId: Number(values.serviceId),
      });
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("Availability slot updated.");
      setOverlayOpen(false);
      setSelectedAvailability(null);
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to update availability."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/availabilities/${id}`);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("Availability slot deleted.");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to delete availability."
      );
    },
  });

  const openCreate = () => {
    setFormMode("create");
    setSelectedAvailability(null);
    setOverlayOpen(true);
  };

  const openUpdate = (availability) => {
    setFormMode("update");
    setSelectedAvailability(availability);
    setOverlayOpen(true);
  };

  const openDeleteConfirm = (availability) => {
    setAvailabilityToDelete(availability);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setAvailabilityToDelete(null);
  };

  const handleDelete = () => {
    if (!availabilityToDelete?.id) return;
    deleteMutation.mutate(availabilityToDelete.id);
    closeDeleteConfirm();
  };

  const handleSubmit = (values, mode) => {
    if (mode === "update" && selectedAvailability?.id) {
      updateMutation.mutate({
        id: selectedAvailability.id,
        values,
      });
      return;
    }
    createMutation.mutate(values);
  };

  const defaultValues =
    formMode === "update" && selectedAvailability
      ? {
          serviceId: String(selectedAvailability.serviceId ?? ""),
          date: selectedAvailability.date ?? "",
          startTime: selectedAvailability.startTime ?? "",
          endTime: selectedAvailability.endTime ?? "",
        }
      : {
          serviceId: services[0]?.id ? String(services[0].id) : "",
          date: "",
          startTime: "",
          endTime: "",
        };

  const isSaving =
    formMode === "update" ? updateMutation.isPending : createMutation.isPending;

  const columns = [
    {
      key: "serviceTitle",
      header: "Service",
      cell: (availability) => (
        <div className="text-sm font-semibold text-[#0F0F0F]">
          {availability.serviceTitle}
        </div>
      ),
    },
    {
      key: "slot",
      header: "Slot",
      cell: (availability) => (
        <span className="text-sm text-[#0F0F0F]">
          {formatSlot(
            availability.date,
            availability.startTime,
            availability.endTime
          )}
        </span>
      ),
    },
    {
      key: "appointmentStatus",
      header: "Booking",
      cell: (availability) =>
        availability.appointmentStatus ? (
          <StatusBadge value={availability.appointmentStatus} />
        ) : (
          <span className="inline-flex rounded-full border border-[#BDE5D3] bg-[#F0FBF5] px-2.5 py-1 text-xs font-semibold text-[#037347]">
            Open
          </span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (availability) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() => openUpdate(availability)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#EA3A30] text-[#EA3A30] hover:bg-[#EA3A30] hover:text-white"
            disabled={deleteMutation.isPending}
            onClick={() => openDeleteConfirm(availability)}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-12">
        <PageHeader
          title="Availability"
          subtitle="Define the time slots clients can book for your services."
          actions={
            <div className="flex flex-wrap gap-3">
              <Button href="/services" variant="soft">
                Manage services
              </Button>
              <Button
                type="button"
                onClick={openCreate}
                disabled={!services.length}
              >
                New slot
              </Button>
            </div>
          }
        />

        {!services.length && !isServicesLoading && !isServicesError ? (
          <div className="rounded-2xl border border-dashed border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            Create at least one service before adding availability slots.
          </div>
        ) : null}

        <SearchInput
          data={sortedAvailabilities}
          fields={["serviceTitle", "date", "startTime", "endTime", "appointmentStatus"]}
          onResults={(results, query) => {
            setFilteredAvailabilities(sortSlots(results));
            setSearchTerm(query);
          }}
          placeholder="Search availability..."
          className="w-full"
        />

        {isLoading ? (
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            Loading availability slots...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#EA3A30]">
            {error?.message || "Unable to load availability slots."}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredAvailabilities}
            emptyMessage={
              searchTerm.trim().length
                ? "No availability slots match your search."
                : "No availability slots yet."
            }
          />
        )}
      </div>

      <OverlayForm
        open={overlayOpen}
        mode={formMode}
        title={formMode === "update" ? "Update slot" : "Create slot"}
        description="Each slot can only be booked once. Overlapping slots are blocked automatically."
        onCancel={() => {
          setOverlayOpen(false);
          setSelectedAvailability(null);
        }}
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        loading={isSaving}
        fields={[
          {
            name: "serviceId",
            label: "Service",
            type: "select",
            placeholder: isServicesLoading
              ? "Loading services..."
              : "Select a service",
            options: services.map((service) => ({
              label: service.title,
              value: service.id,
            })),
            rules: { required: "Service is required" },
            disabled: isServicesLoading || !services.length,
          },
          {
            name: "date",
            label: "Date",
            type: "date",
            rules: { required: "Date is required" },
          },
          {
            name: "startTime",
            label: "Start time",
            type: "time",
            rules: { required: "Start time is required" },
          },
          {
            name: "endTime",
            label: "End time",
            type: "time",
            rules: { required: "End time is required" },
          },
        ]}
      />

      <Popup
        open={deleteConfirmOpen}
        title="Delete availability slot?"
        description={
          availabilityToDelete
            ? `Delete the slot on ${formatSlot(
                availabilityToDelete.date,
                availabilityToDelete.startTime,
                availabilityToDelete.endTime
              )}?`
            : "This action cannot be undone."
        }
        confirmText={deleteMutation.isPending ? "Deleting..." : "Delete"}
        confirmVariant="outline"
        confirmClassName="border-[#EA3A30] text-[#EA3A30] hover:bg-[#EA3A30] hover:text-white"
        onCancel={closeDeleteConfirm}
        onConfirm={handleDelete}
      />
    </div>
  );
}
