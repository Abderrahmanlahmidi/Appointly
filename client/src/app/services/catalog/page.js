"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import PageHeader from "../../../../components/ui/PageHeader";
import Button from "../../../../components/ui/Button";
import ServicesFilters from "../../../../components/sections/services/ServicesFilters";

const fetchServices = async () => {
  const { data } = await axios.get("/services");
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

const statusBadgeClasses = {
  ACTIVE: "border-[#C7E6CF] bg-[#F3FBF5] text-[#236B34]",
  INACTIVE: "border-[#F5C2C0] bg-[#FFF3F2] text-[#B42318]",
};

export default function ServicesCatalogPage() {
  const [visibleServices, setVisibleServices] = React.useState([]);
  const [hasActiveFilters, setHasActiveFilters] = React.useState(false);
  const [filtersInitialized, setFiltersInitialized] = React.useState(false);

  const {
    data: services = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["services-catalog"],
    queryFn: fetchServices,
  });

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["services-catalog-categories"],
    queryFn: fetchCategories,
  });

  const categoryNameById = React.useMemo(
    () =>
      new Map(
        categories.map((category) => [String(category.id), category.name ?? ""])
      ),
    [categories]
  );

  const servicesToRender = filtersInitialized ? visibleServices : services;

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-12">
        <PageHeader
          title="Service catalog"
          subtitle="Explore all available services and narrow results with filters."
        />

        {isLoading ? (
          <div className="rounded-2xl border-2 border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            Loading services...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border-2 border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
            {error?.message ?? "Unable to load services."}
          </div>
        ) : (
          <>
            <ServicesFilters
              services={services}
              categories={categories}
              categoriesLoading={isCategoriesLoading}
              onFilteredChange={({ services: nextServices, hasActiveFilters }) => {
                setVisibleServices(nextServices);
                setHasActiveFilters(hasActiveFilters);
                setFiltersInitialized(true);
              }}
            />

            <div className="text-sm text-[#4B4B4B]">
              Showing {servicesToRender.length} of {services.length} services
            </div>

            {servicesToRender.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {servicesToRender.map((service) => {
                  const categoryName =
                    categoryNameById.get(String(service.categoryId)) ||
                    "Uncategorized";
                  const status = String(service.status ?? "ACTIVE").toUpperCase();

                  return (
                    <article
                      key={service.id}
                      className="flex h-full flex-col rounded-2xl border-2 border-[#E0E0E0] bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-[var(--font-display)] text-lg font-semibold text-[#0F0F0F]">
                          {service.title}
                        </h2>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                            statusBadgeClasses[status] ??
                            "border-[#E0E0E0] bg-[#F7F7F7] text-[#4B4B4B]"
                          }`}
                        >
                          {status}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-[#4B4B4B]">
                        {service.description || "No description provided."}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-3">
                          <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                            Duration
                          </div>
                          <div className="text-sm font-semibold text-[#0F0F0F]">
                            {service.duration} min
                          </div>
                        </div>
                        <div className="rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-3">
                          <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
                            Price
                          </div>
                          <div className="text-sm font-semibold text-[#0F0F0F]">
                            {formatPrice(service.price)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="inline-flex rounded-full border border-[#E0E0E0] bg-[#FAFAFA] px-3 py-1 text-xs font-medium text-[#4B4B4B]">
                          {categoryName}
                        </span>
                        <Button
                          href={`/services/catalog/${service.id}`}
                          variant="soft"
                          size="sm"
                        >
                          Details
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-[#E0E0E0] bg-white p-8 text-center text-sm text-[#4B4B4B]">
                {hasActiveFilters
                  ? "No services match the selected filters."
                  : "No services available yet."}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
