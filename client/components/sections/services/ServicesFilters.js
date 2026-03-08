"use client";

import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import Input from "../../ui/Input";

const STATUS_OPTIONS = [
  { label: "All statuses", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const SORT_OPTIONS = [
  { label: "Newest first", value: "RECENT" },
  { label: "Price: low to high", value: "PRICE_ASC" },
  { label: "Price: high to low", value: "PRICE_DESC" },
  { label: "Duration: short to long", value: "DURATION_ASC" },
];

const selectClasses =
  "w-full rounded-xl border-2 border-[#E0E0E0] bg-white px-3 py-3 text-sm text-[#0F0F0F] focus:border-[#0F0F0F] focus:outline-none focus:ring-4 focus:ring-black/10 disabled:cursor-not-allowed disabled:bg-[#F6F6F6]";

const normalize = (value) => String(value ?? "").trim().toLowerCase();

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function ServicesFilters({
  services = [],
  categories = [],
  categoriesLoading = false,
  onFilteredChange,
}) {
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("ALL");
  const [categoryId, setCategoryId] = React.useState("ALL");
  const [sortBy, setSortBy] = React.useState("RECENT");

  const categoryNameById = React.useMemo(
    () =>
      new Map(
        categories.map((category) => [String(category.id), category.name ?? ""])
      ),
    [categories]
  );

  const filteredServices = React.useMemo(() => {
    const term = normalize(search);
    const normalizedStatus = normalize(status);
    const normalizedCategoryId = normalize(categoryId);

    let next = Array.isArray(services) ? [...services] : [];

    if (term) {
      next = next.filter((service) => {
        const serviceCategoryName = categoryNameById.get(
          String(service?.categoryId)
        );

        const haystack = [
          service?.title,
          service?.description,
          service?.status,
          serviceCategoryName,
        ]
          .map(normalize)
          .join(" ");

        return haystack.includes(term);
      });
    }

    if (normalizedStatus !== "all") {
      next = next.filter(
        (service) => normalize(service?.status) === normalizedStatus
      );
    }

    if (normalizedCategoryId !== "all") {
      next = next.filter(
        (service) => String(service?.categoryId) === normalizedCategoryId
      );
    }

    next.sort((first, second) => {
      if (sortBy === "PRICE_ASC") {
        return toNumber(first?.price) - toNumber(second?.price);
      }

      if (sortBy === "PRICE_DESC") {
        return toNumber(second?.price) - toNumber(first?.price);
      }

      if (sortBy === "DURATION_ASC") {
        return toNumber(first?.duration) - toNumber(second?.duration);
      }

      return (
        new Date(second?.createdAt ?? 0).getTime() -
        new Date(first?.createdAt ?? 0).getTime()
      );
    });

    return next;
  }, [categoryId, categoryNameById, search, services, sortBy, status]);

  const hasActiveFilters =
    normalize(search).length > 0 || status !== "ALL" || categoryId !== "ALL";

  React.useEffect(() => {
    onFilteredChange?.({
      services: filteredServices,
      hasActiveFilters,
      total: filteredServices.length,
    });
  }, [filteredServices, hasActiveFilters, onFilteredChange]);

  const resetFilters = () => {
    setSearch("");
    setStatus("ALL");
    setCategoryId("ALL");
    setSortBy("RECENT");
  };

  return (
    <section className="rounded-2xl border-2 border-[#E0E0E0] bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </div>
        <button
          type="button"
          onClick={resetFilters}
          disabled={!hasActiveFilters}
          className="text-xs font-semibold text-[#4B4B4B] underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, status or category"
          icon={Search}
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className={selectClasses}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className={selectClasses}
          disabled={categoriesLoading}
        >
          <option value="ALL">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={String(category.id)}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className={selectClasses}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
