"use client";

import React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "../../../../../lib/axios";
import Button from "../../../../../components/ui/Button";
import PageHeader from "../../../../../components/ui/PageHeader";

const fetchServiceDetails = async (serviceId) => {
  const { data } = await axios.get(`/services/${serviceId}/details`);
  return data;
};

const fetchCategories = async () => {
  const { data } = await axios.get("/categories");
  return data;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

const formatPrice = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price)) return "$0.00";
  return currencyFormatter.format(price);
};

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const parseServiceId = (value) => {
  if (Array.isArray(value)) return Number(value[0]);
  return Number(value);
};

const statusClasses = {
  ACTIVE: "border-[#C7E6CF] bg-[#F3FBF5] text-[#236B34]",
  INACTIVE: "border-[#F5C2C0] bg-[#FFF3F2] text-[#B42318]",
};

export default function ServiceDetailsPage() {
  const params = useParams();
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

  const { data: categories = [] } = useQuery({
    queryKey: ["service-details-categories"],
    queryFn: fetchCategories,
    enabled: hasValidServiceId,
  });

  const categoryNameById = React.useMemo(
    () =>
      new Map(
        categories.map((category) => [String(category.id), category.name ?? ""])
      ),
    [categories]
  );

  const categoryName =
    categoryNameById.get(String(service?.categoryId)) || "Uncategorized";
  const normalizedStatus = String(service?.status ?? "ACTIVE").toUpperCase();
  const createdBy = service?.createdBy;
  const creatorFullName =
    `${createdBy?.firstName ?? ""} ${createdBy?.lastName ?? ""}`.trim() ||
    createdBy?.name ||
    "Unknown provider";

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-12">
        <PageHeader
          title="Service details"
          subtitle="All details for the selected service."
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
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  statusClasses[normalizedStatus] ??
                  "border-[#E0E0E0] bg-[#F7F7F7] text-[#4B4B4B]"
                }`}
              >
                {normalizedStatus}
              </span>
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
                  {categoryName}
                </div>
              </div>

              <div className="rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-4">
                <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                  Created at
                </div>
                <div className="text-sm font-semibold text-[#0F0F0F]">
                  {formatDate(service?.createdAt)}
                </div>
              </div>

              <div className="rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-4">
                <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                  Updated at
                </div>
                <div className="text-sm font-semibold text-[#0F0F0F]">
                  {formatDate(service?.updatedAt)}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-4">
              <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                Created by
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
                      {createdBy.email || "No email provided"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-[#4B4B4B]">
                  Creator information is unavailable.
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button href={`/appointments/create?serviceId=${service?.id}`}>
                Create appointment
              </Button>
              <Button href="/services/catalog" variant="outline">
                Back
              </Button>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
