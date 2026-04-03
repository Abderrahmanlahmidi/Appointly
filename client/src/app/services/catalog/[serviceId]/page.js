"use client";

import React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import axios from "../../../../../lib/axios";
import Button from "../../../../../components/ui/Button";
import PageHeader from "../../../../../components/ui/PageHeader";
import StatusBadge from "../../../../../components/ui/StatusBadge";
import { formatDateTime, formatPrice, formatSlot } from "../../../../../lib/domain";

const fetchServiceDetails = async (serviceId) => {
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
  if (Array.isArray(value)) return Number(value[0]);
  return Number(value);
};

export default function ServiceDetailsPage() {
  const params = useParams();
  const { data: session } = useSession();
  const serviceId = parseServiceId(params?.serviceId);
  const hasValidServiceId = Number.isFinite(serviceId) && serviceId > 0;

  const {
    data: service,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["service-details", serviceId],
    queryFn: () => fetchServiceDetails(serviceId),
    enabled: hasValidServiceId,
  });

  const {
    data: availabilities = [],
    isLoading: slotsLoading,
  } = useQuery({
    queryKey: ["service-details-availabilities", serviceId],
    queryFn: () => fetchAvailabilities(serviceId),
    enabled: hasValidServiceId,
  });

  const createdBy = service?.createdBy;
  const creatorFullName = createdBy?.name || "Unknown provider";
  const currentUserId = Number(session?.user?.id);
  const currentRole = String(session?.user?.role ?? "")
    .trim()
    .toUpperCase();
  const isOwnService =
    currentUserId > 0 && currentUserId === Number(createdBy?.id);
  const canMessageProvider =
    Boolean(createdBy?.id) &&
    currentRole === "USER" &&
    !isOwnService;
  const messageProviderHref = session?.user?.id
    ? `/messages?serviceId=${serviceId}`
    : `/login?callbackUrl=${encodeURIComponent(
        `/messages?serviceId=${serviceId}`
      )}`;
  const bookServiceHref = session?.user?.id
    ? `/appointments/create?serviceId=${service?.id}`
    : `/login?callbackUrl=${encodeURIComponent(
        `/appointments/create?serviceId=${service?.id}`
      )}`;

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-12">
        <PageHeader
          title="Service details"
          subtitle="Review service details and pick a time slot when you’re ready."
          actions={
            <Button href="/services/catalog" variant="soft" size="sm">
              Back to catalog
            </Button>
          }
        />

        {!hasValidServiceId ? (
          <div className="rounded-2xl border-2 border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
            Invalid service id.
          </div>
        ) : isLoading ? (
          <div className="rounded-2xl border-2 border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            Loading service details...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border-2 border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
            {error?.response?.data?.message ||
              error?.message ||
              "Unable to load service details."}
          </div>
        ) : (
          <>
            <article className="rounded-2xl border-2 border-[#E0E0E0] bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[#0F0F0F]">
                    {service?.title}
                  </h1>
                  <p className="mt-2 text-sm text-[#4B4B4B]">
                    {service?.description || "No description provided."}
                  </p>
                </div>
                <StatusBadge value={service?.status} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-4">
                  <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                    Price
                  </div>
                  <div className="text-sm font-semibold text-[#0F0F0F]">
                    {formatPrice(service?.price)}
                  </div>
                </div>

                <div className="rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-4">
                  <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                    Duration
                  </div>
                  <div className="text-sm font-semibold text-[#0F0F0F]">
                    {service?.duration} min
                  </div>
                </div>

                <div className="rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-4">
                  <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                    Category
                  </div>
                  <div className="text-sm font-semibold text-[#0F0F0F]">
                    {service?.categoryName || "Uncategorized"}
                  </div>
                </div>

                <div className="rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-4">
                  <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                    Updated
                  </div>
                  <div className="text-sm font-semibold text-[#0F0F0F]">
                    {formatDateTime(service?.updatedAt)}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                    Provider
                  </div>
                  {createdBy ? (
                    canMessageProvider ? (
                      <Button href={messageProviderHref} variant="outline" size="sm">
                        Message provider
                      </Button>
                    ) : !session?.user?.id ? (
                      <Button href={messageProviderHref} variant="soft" size="sm">
                        Sign in to message
                      </Button>
                    ) : null
                  ) : null}
                </div>

                {createdBy ? (
                  <div className="mt-3 flex items-center gap-3">
                    {createdBy.image ? (
                      <Image
                        src={createdBy.image}
                        alt={creatorFullName}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F0F0F] text-sm font-semibold text-white">
                        {creatorFullName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-[#0F0F0F]">
                        {creatorFullName}
                      </div>
                      <div className="text-xs text-[#4B4B4B]">
                        Service provider
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-[#4B4B4B]">
                    Creator information is unavailable.
                  </div>
                )}
              </div>
            </article>

            <section className="rounded-2xl border-2 border-[#E0E0E0] bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Available slots</h2>
                  <p className="text-sm text-[#4B4B4B]">
                    Pick one of the next open slots or continue to the booking page.
                  </p>
                </div>
                {isOwnService ? (
                  <div className="rounded-xl border border-[#F5C2C0] bg-white px-4 py-3 text-sm text-[#B42318]">
                    You cannot book your own service.
                  </div>
                ) : (
                  <Button href={bookServiceHref}>
                    {session?.user?.id ? "Book this service" : "Sign in to book"}
                  </Button>
                )}
              </div>

              {slotsLoading ? (
                <div className="mt-4 rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-4 text-sm text-[#4B4B4B]">
                  Loading available slots...
                </div>
              ) : availabilities.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {availabilities.slice(0, 4).map((availability) => (
                    <div
                      key={availability.id}
                      className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-4"
                    >
                      <div className="text-sm font-semibold text-[#0F0F0F]">
                        {formatSlot(
                          availability.date,
                          availability.startTime,
                          availability.endTime
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-[#E0E0E0] bg-[#FAFAFA] p-4 text-sm text-[#4B4B4B]">
                  No slots are available for this service right now.
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
