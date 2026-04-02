"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import Button from "../../../../components/ui/Button";
import PageHeader from "../../../../components/ui/PageHeader";
import { useToast } from "../../../../components/ui/Toast";
import { formatPrice, formatSlot } from "../../../../lib/domain";

const fetchService = async (serviceId) => {
  const { data } = await axios.get(`/services/${serviceId}/details`);
  return data;
};

const fetchAvailabilities = async (serviceId) => {
  const { data } = await axios.get("/availabilities", {
    params: { serviceId },
  });
  return data;
};

const parseServiceId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export default function CreateAppointmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const serviceId = parseServiceId(searchParams.get("serviceId"));
  const [selectedAvailabilityId, setSelectedAvailabilityId] = React.useState("");
  const [note, setNote] = React.useState("");

  const {
    data: service,
    isLoading: serviceLoading,
    isError: serviceError,
    error: serviceQueryError,
  } = useQuery({
    queryKey: ["appointment-service", serviceId],
    queryFn: () => fetchService(serviceId),
    enabled: Boolean(serviceId),
  });

  const {
    data: availabilities = [],
    isLoading: availabilitiesLoading,
    isError: availabilitiesError,
    error: availabilitiesQueryError,
  } = useQuery({
    queryKey: ["appointment-availabilities", serviceId],
    queryFn: () => fetchAvailabilities(serviceId),
    enabled: Boolean(serviceId),
  });

  React.useEffect(() => {
    if (!availabilities.length) {
      setSelectedAvailabilityId("");
      return;
    }

    const stillExists = availabilities.some(
      (item) => String(item.id) === String(selectedAvailabilityId)
    );

    if (!stillExists) {
      setSelectedAvailabilityId(String(availabilities[0].id));
    }
  }, [availabilities, selectedAvailabilityId]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post("/appointments", {
        serviceId,
        availabilityId: Number(selectedAvailabilityId),
        note: note.trim() || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["appointment-availabilities", serviceId],
      });
      toast.success("Appointment created.");
      router.push("/appointments");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to create appointment."
      );
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!selectedAvailabilityId) {
      toast.error("Please select an available time slot.");
      return;
    }

    createMutation.mutate();
  };

  const backHref = serviceId
    ? `/services/catalog/${serviceId}`
    : "/services/catalog";

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-12">
        <PageHeader
          title="Book appointment"
          subtitle="Choose an available time slot and submit your booking request."
          actions={
            <Button href={backHref} variant="soft" size="sm">
              Back to service
            </Button>
          }
        />

        {!serviceId ? (
          <div className="rounded-2xl border-2 border-[#F5C2C0] bg-white p-4 text-sm text-[#B42318]">
            Missing service id. Please select a service first.
          </div>
        ) : serviceLoading ? (
          <div className="rounded-2xl border-2 border-[#E0E0E0] bg-white p-4 text-sm text-[#4B4B4B]">
            Loading selected service...
          </div>
        ) : serviceError ? (
          <div className="rounded-2xl border-2 border-[#F5C2C0] bg-white p-4 text-sm text-[#B42318]">
            {serviceQueryError?.response?.data?.message ||
              "Unable to load selected service."}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-[#E0E0E0] bg-[#FAFAFA] p-5">
            <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
              Selected service
            </div>
            <div className="mt-2 text-lg font-semibold text-[#0F0F0F]">
              {service?.title}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#4B4B4B]">
              <span>{service?.categoryName || "Uncategorized"}</span>
              <span>{service?.duration} min</span>
              <span>{formatPrice(service?.price)}</span>
              <span>{service?.createdBy?.name || "Unknown provider"}</span>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border-2 border-[#E0E0E0] bg-white p-6"
        >
          <div>
            <h2 className="text-lg font-semibold">Available slots</h2>
            <p className="mt-1 text-sm text-[#4B4B4B]">
              Availability updates in real time, so a slot may become unavailable
              if someone books it first.
            </p>
          </div>

          {availabilitiesLoading ? (
            <div className="mt-4 rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-4 text-sm text-[#4B4B4B]">
              Loading available slots...
            </div>
          ) : availabilitiesError ? (
            <div className="mt-4 rounded-2xl border border-[#F5C2C0] bg-white p-4 text-sm text-[#B42318]">
              {availabilitiesQueryError?.response?.data?.message ||
                "Unable to load available slots."}
            </div>
          ) : availabilities.length ? (
            <div className="mt-4 grid gap-3">
              {availabilities.map((availability) => {
                const isSelected =
                  String(availability.id) === String(selectedAvailabilityId);

                return (
                  <button
                    key={availability.id}
                    type="button"
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#0F0F0F] bg-[#0F0F0F] text-white"
                        : "border-[#E0E0E0] bg-white text-[#0F0F0F] hover:border-[#0F0F0F]"
                    }`}
                    onClick={() => setSelectedAvailabilityId(String(availability.id))}
                  >
                    <div className="text-sm font-semibold">
                      {formatSlot(
                        availability.date,
                        availability.startTime,
                        availability.endTime
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[#E0E0E0] bg-[#FAFAFA] p-4 text-sm text-[#4B4B4B]">
              No available slots for this service right now.
            </div>
          )}

          <div className="mt-6">
            <label className="text-xs font-medium text-[#2D2D2D]" htmlFor="note">
              Note for the provider
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Optional note"
              rows={4}
              className="mt-2 w-full rounded-xl border-2 border-[#E0E0E0] bg-white p-3 text-sm text-[#0F0F0F] placeholder:text-[#9c9c9c] focus:border-[#0F0F0F] focus:outline-none focus:ring-4 focus:ring-black/10"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={!availabilities.length || createMutation.isPending}
            >
              {createMutation.isPending ? "Booking..." : "Book appointment"}
            </Button>
            <Button type="button" href={backHref} variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
