"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import Button from "../../../../components/ui/Button";
import Input from "../../../../components/ui/Input";
import PageHeader from "../../../../components/ui/PageHeader";
import { useToast } from "../../../../components/ui/Toast";

const fetchService = async (serviceId) => {
  const { data } = await axios.get(`/services/${serviceId}`);
  return data;
};

const parseServiceId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export default function CreateAppointmentPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const serviceId = parseServiceId(searchParams.get("serviceId"));

  const [form, setForm] = React.useState({
    fullName: "",
    email: "",
    date: "",
    time: "",
    note: "",
  });

  const {
    data: service,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["appointment-service", serviceId],
    queryFn: () => fetchService(serviceId),
    enabled: Boolean(serviceId),
  });

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    toast.warning(
      "Appointment API is not connected yet. UI is ready, backend endpoint is still pending."
    );
  };

  const backHref = serviceId
    ? `/services/catalog/${serviceId}`
    : "/services/catalog";

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-12">
        <PageHeader
          title="Create appointment"
          subtitle="Fill in the appointment request details."
          actions={
            <Button href={backHref} variant="soft" size="sm">
              Back to service
            </Button>
          }
        />

        {serviceId ? (
          isLoading ? (
            <div className="rounded-2xl border-2 border-[#E0E0E0] bg-white p-4 text-sm text-[#4B4B4B]">
              Loading selected service...
            </div>
          ) : isError ? (
            <div className="rounded-2xl border-2 border-[#F5C2C0] bg-white p-4 text-sm text-[#B42318]">
              Unable to load selected service.
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-[#E0E0E0] bg-[#FAFAFA] p-4">
              <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                Selected service
              </div>
              <div className="mt-1 text-sm font-semibold text-[#0F0F0F]">
                {service?.title}
              </div>
              <div className="mt-1 text-xs text-[#4B4B4B]">
                {service?.duration} min - ${service?.price}
              </div>
            </div>
          )
        ) : (
          <div className="rounded-2xl border-2 border-[#F5C2C0] bg-white p-4 text-sm text-[#B42318]">
            Missing service id. Please select a service first.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border-2 border-[#E0E0E0] bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              value={form.fullName}
              onChange={handleChange("fullName")}
              placeholder="Full name"
              required
            />
            <Input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="Email"
              required
            />
            <Input
              type="date"
              value={form.date}
              onChange={handleChange("date")}
              required
            />
            <Input
              type="time"
              value={form.time}
              onChange={handleChange("time")}
              required
            />
          </div>

          <div className="mt-4">
            <textarea
              value={form.note}
              onChange={handleChange("note")}
              placeholder="Optional note"
              rows={4}
              className="w-full rounded-xl border-2 border-[#E0E0E0] bg-white p-3 text-sm text-[#0F0F0F] placeholder:text-[#9c9c9c] focus:border-[#0F0F0F] focus:outline-none focus:ring-4 focus:ring-black/10"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button type="submit">Create appointment</Button>
            <Button type="button" href={backHref} variant="outline">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
