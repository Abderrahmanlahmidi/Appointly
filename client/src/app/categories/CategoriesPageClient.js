"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import axios from "../../../lib/axios";
import Button from "../../../components/ui/Button";
import DataTable from "../../../components/ui/DataTable";
import OverlayForm from "../../../components/ui/OverlayForm";
import PageHeader from "../../../components/ui/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import StatusBadge from "../../../components/ui/StatusBadge";
import { useToast } from "../../../components/ui/Toast";
import Popup from "../../../components/ui/Popup";
import { formatDate } from "../../../lib/domain";

const fetchMyCategories = async () => {
  const { data } = await axios.get("/categories", {
    params: { scope: "mine" },
  });
  return data;
};

const fetchApprovedCategories = async () => {
  const { data } = await axios.get("/categories");
  return data;
};

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const [overlayOpen, setOverlayOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState("create");
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [categoryToDelete, setCategoryToDelete] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredCategories, setFilteredCategories] = React.useState([]);
  const { toast } = useToast();

  const userId = Number(session?.user?.id);
  const hasUserId = Number.isFinite(userId) && userId > 0;

  const {
    data: categories = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["categories", "mine"],
    queryFn: fetchMyCategories,
    enabled: hasUserId,
  });

  const { data: approvedCategories = [] } = useQuery({
    queryKey: ["categories", "approved"],
    queryFn: fetchApprovedCategories,
    enabled: hasUserId,
  });

  const invalidateCategoryQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["services"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const createMutation = useMutation({
    mutationFn: async (values) => {
      const response = await axios.post("/categories", values);
      return response.data;
    },
    onSuccess: () => {
      invalidateCategoryQueries();
      toast.success("Category request submitted.");
      setOverlayOpen(false);
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to create category."
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }) => {
      const response = await axios.patch(`/categories/${id}`, values);
      return response.data;
    },
    onSuccess: () => {
      invalidateCategoryQueries();
      toast.success("Category updated and sent for review.");
      setOverlayOpen(false);
      setSelectedCategory(null);
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to update category."
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      invalidateCategoryQueries();
      toast.success("Category deleted.");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to delete category."
      );
    },
  });

  const openCreate = () => {
    setFormMode("create");
    setSelectedCategory(null);
    setOverlayOpen(true);
  };

  const openUpdate = (category) => {
    setFormMode("update");
    setSelectedCategory(category);
    setOverlayOpen(true);
  };

  const openDeleteConfirm = (category) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setCategoryToDelete(null);
  };

  const handleDelete = () => {
    if (!categoryToDelete?.id) return;
    deleteMutation.mutate(categoryToDelete.id);
    closeDeleteConfirm();
  };

  const handleSubmit = (values, mode) => {
    if (mode === "update" && selectedCategory?.id) {
      updateMutation.mutate({ id: selectedCategory.id, values });
      return;
    }
    createMutation.mutate(values);
  };

  const defaultValues =
    formMode === "update" && selectedCategory
      ? {
          name: selectedCategory.name ?? "",
          description: selectedCategory.description ?? "",
        }
      : { name: "", description: "" };

  const isSaving =
    formMode === "update" ? updateMutation.isPending : createMutation.isPending;

  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (category) => (
        <div className="text-sm font-semibold text-[#0F0F0F]">
          {category.name}
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (category) => (
        <p className="text-sm text-[#4B4B4B]">
          {category.description || "No description."}
        </p>
      ),
    },
    {
      key: "status",
      header: "Review",
      cell: (category) => <StatusBadge value={category.status} />,
    },
    {
      key: "moderationNote",
      header: "Admin Note",
      cell: (category) => (
        <p className="text-sm text-[#4B4B4B]">
          {category.moderationNote || "No admin note yet."}
        </p>
      ),
    },
    {
      key: "createdAt",
      header: "Submitted",
      cell: (category) => (
        <span className="text-sm text-[#4B4B4B]">
          {formatDate(category.createdAt)}
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
            onClick={() => openUpdate(category)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#EA3A30] text-[#EA3A30] hover:bg-[#EA3A30] hover:text-white"
            disabled={deleteMutation.isPending}
            onClick={() => openDeleteConfirm(category)}
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
          title="Categories"
          subtitle="Request custom categories and track moderation status."
          actions={
            <Button type="button" onClick={openCreate}>
              Request category
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
            <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
              Your submissions
            </div>
            <div className="mt-2 text-2xl font-semibold">{categories.length}</div>
          </div>
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
            <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
              Approved categories
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {approvedCategories.length}
            </div>
          </div>
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
            <div className="text-xs uppercase tracking-wide text-[#7A7A7A]">
              Pending review
            </div>
            <div className="mt-2 text-2xl font-semibold">
              {categories.filter((category) => category.status === "PENDING").length}
            </div>
          </div>
        </div>

        <SearchInput
          data={categories}
          fields={["name", "description", "status", "moderationNote"]}
          onResults={(results, query) => {
            setFilteredCategories(results);
            setSearchTerm(query);
          }}
          placeholder="Search your category requests..."
          className="w-full"
        />

        {isLoading ? (
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            Loading categories...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#EA3A30]">
            {error?.message || "Unable to load categories."}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredCategories}
            emptyMessage={
              searchTerm.trim().length
                ? "No category requests match your search."
                : "You have not submitted any categories yet."
            }
          />
        )}
      </div>

      <OverlayForm
        open={overlayOpen}
        mode={formMode}
        title={formMode === "update" ? "Update category" : "Request a category"}
        description="Describe the category you want added to the service catalog."
        onCancel={() => {
          setOverlayOpen(false);
          setSelectedCategory(null);
        }}
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        loading={isSaving}
        fields={[
          {
            name: "name",
            label: "Category name",
            placeholder: "e.g. Pet grooming",
            rules: { required: "Name is required" },
          },
          {
            name: "description",
            label: "Description",
            placeholder: "Add context for the admin review",
          },
        ]}
      />

      <Popup
        open={deleteConfirmOpen}
        title="Delete category request?"
        description={
          categoryToDelete?.name
            ? `Delete "${categoryToDelete.name}"? This cannot be undone.`
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
