"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import axios from "../../lib/axios";
import Button from "../../../components/ui/Button";
import DataTable from "../../../components/ui/DataTable";
import OverlayForm from "../../../components/ui/OverlayForm";
import PageHeader from "../../../components/ui/PageHeader";
import SearchInput from "../../../components/ui/SearchInput";
import { useToast } from "../../../components/ui/Toast";
import Popup from "../../../components/ui/Popup";

const fetchCategories = async (userId) => {
  const { data } = await axios.get("/categories", {
    params: { userId },
  });
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
    queryKey: ["categories", hasUserId ? userId : null],
    queryFn: () => fetchCategories(userId),
    enabled: hasUserId,
  });

  const createMutation = useMutation({
    mutationFn: async (values) => {
      if (!hasUserId) {
        throw new Error("Missing user id.");
      }
      const response = await axios.post("/categories", {
        ...values,
        userId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully.");
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
      if (!hasUserId) {
        throw new Error("Missing user id.");
      }
      const response = await axios.patch(`/categories/${id}`, values, {
        params: { userId },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated successfully.");
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
      if (!hasUserId) {
        throw new Error("Missing user id.");
      }
      const response = await axios.delete(`/categories/${id}`, {
        params: { userId },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
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
    if (!hasUserId) {
      toast.error("Please sign in to delete categories.");
      closeDeleteConfirm();
      return;
    }
    if (!categoryToDelete?.id) return;
    deleteMutation.mutate(categoryToDelete.id);
    closeDeleteConfirm();
  };

  const handleSubmit = (values, mode) => {
    if (!hasUserId) {
      toast.error("Please sign in to manage categories.");
      return;
    }
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
    formMode === "update"
      ? updateMutation.isPending
      : createMutation.isPending;

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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-12">
        <PageHeader
          title="Categories"
          subtitle="Manage your service categories."
          actions={
            <Button type="button" onClick={openCreate}>
              New category
            </Button>
          }
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            data={categories}
            fields={["name", "description"]}
            onResults={(results, query) => {
              setFilteredCategories(results);
              setSearchTerm(query);
            }}
            placeholder="Search categories..."
            className="w-full"
          />
        </div>

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
                ? "No categories match your search."
                : "No categories yet. Create your first one."
            }
          />
        )}
      </div>

      <OverlayForm
        open={overlayOpen}
        mode={formMode}
        title={formMode === "update" ? "Update category" : "Create category"}
        description="Fill in the category details below."
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
            placeholder: "e.g. Haircuts",
            rules: { required: "Name is required" },
          },
          {
            name: "description",
            label: "Description",
            placeholder: "Optional description",
          },
        ]}
      />

      <Popup
        open={deleteConfirmOpen}
        title="Delete category?"
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
