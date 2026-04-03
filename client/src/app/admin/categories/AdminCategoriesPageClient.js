"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import {
  fetchAdminCategories,
  sortAdminCategories,
} from "../../../../lib/admin";
import Button from "../../../../components/ui/Button";
import DataTable from "../../../../components/ui/DataTable";
import PageHeader from "../../../../components/ui/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { useToast } from "../../../../components/ui/Toast";

export default function AdminCategoriesPageClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredCategories, setFilteredCategories] = React.useState([]);

  const {
    data: categories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: fetchAdminCategories,
  });

  const moderateCategoryMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await axios.patch(`/categories/${id}/moderate`, {
        status,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category moderation updated.");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to moderate category."
      );
    },
  });

  const sortedCategories = React.useMemo(
    () => sortAdminCategories(categories),
    [categories]
  );

  const visibleCategories = searchTerm.trim().length
    ? filteredCategories
    : sortedCategories;

  const pendingCategories = categories.filter(
    (item) => item.status === "PENDING"
  ).length;
  const approvedCategories = categories.filter(
    (item) => item.status === "APPROVED"
  ).length;
  const rejectedCategories = categories.filter(
    (item) => item.status === "REJECTED"
  ).length;

  const categoryColumns = [
    {
      key: "name",
      header: "Category",
      cell: (category) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {category.name}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {category.description || "No description"}
          </div>
        </div>
      ),
    },
    {
      key: "ownerName",
      header: "Requested by",
      cell: (category) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {category.ownerName}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {category.ownerEmail || "No email"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (category) => <StatusBadge value={category.status} />,
    },
    {
      key: "moderationNote",
      header: "Admin note",
      cell: (category) => (
        <span className="text-sm text-[#4B4B4B]">
          {category.moderationNote || "No note"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (category) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="soft"
            size="sm"
            disabled={moderateCategoryMutation.isPending}
            onClick={() =>
              moderateCategoryMutation.mutate({
                id: category.id,
                status: "APPROVED",
              })
            }
          >
            Approve
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={moderateCategoryMutation.isPending}
            onClick={() =>
              moderateCategoryMutation.mutate({
                id: category.id,
                status: "PENDING",
              })
            }
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#EA3A30] text-[#EA3A30] hover:bg-[#EA3A30] hover:text-white"
            disabled={moderateCategoryMutation.isPending}
            onClick={() =>
              moderateCategoryMutation.mutate({
                id: category.id,
                status: "REJECTED",
              })
            }
          >
            Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="rounded-2xl border border-[#E0E0E0] bg-white p-6">
        <PageHeader
          title="Categories"
          subtitle="Review category requests in a dedicated moderation table instead of mixing them into the dashboard."
          actions={
            <Button href="/admin/dashboard" variant="soft">
              Back to overview
            </Button>
          }
        />
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[#7A7A7A]">
            Pending
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#0F0F0F]">
            {pendingCategories}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[#7A7A7A]">
            Approved
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#0F0F0F]">
            {approvedCategories}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[#7A7A7A]">
            Rejected
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#0F0F0F]">
            {rejectedCategories}
          </div>
        </div>
      </section>

      <SearchInput
        data={sortedCategories}
        fields={["name", "description", "ownerName", "ownerEmail", "status"]}
        onResults={(results, query) => {
          setFilteredCategories(results);
          setSearchTerm(query);
        }}
        placeholder="Search categories..."
        className="w-full"
      />

      {isLoading ? (
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
          Loading categories...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
          Unable to load categories.
        </div>
      ) : (
        <DataTable
          columns={categoryColumns}
          data={visibleCategories}
          emptyMessage={
            searchTerm.trim().length
              ? "No categories match your search."
              : "No category requests found."
          }
        />
      )}
    </div>
  );
}
