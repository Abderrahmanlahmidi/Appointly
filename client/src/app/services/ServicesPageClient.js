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
import { formatPrice } from "../../../lib/domain";

const fetchServices = async () => {
  const { data } = await axios.get("/services", {
    params: { scope: "owned" },
  });
  return data;
};

const fetchCategories = async () => {
  const { data } = await axios.get("/categories", {
    params: { scope: "service-options" },
  });
  return data;
};

const normalizePayload = (values, mode) => {
  const payload = {
    title: values.title?.trim(),
    description: values.description?.trim() || undefined,
    duration: values.duration,
    price: values.price,
    status: values.status?.trim() || undefined,
    categoryId:
      values.categoryId === "" || values.categoryId === undefined
        ? mode === "update"
          ? null
          : undefined
        : Number(values.categoryId),
  };

  if (mode === "create") {
    return payload;
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [overlayOpen, setOverlayOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState("create");
  const [selectedService, setSelectedService] = React.useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [serviceToDelete, setServiceToDelete] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredServices, setFilteredServices] = React.useState([]);

  const providerId = Number(session?.user?.id);
  const hasProviderId = Number.isFinite(providerId) && providerId > 0;

  const {
    data: services = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["services", "owned"],
    queryFn: fetchServices,
    enabled: hasProviderId,
  });

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories", "service-options"],
    queryFn: fetchCategories,
    enabled: hasProviderId,
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["services"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const createMutation = useMutation({
    mutationFn: async (values) => {
      const response = await axios.post("/services", values);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("Service created and sent for review.");
      setOverlayOpen(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Unable to create service.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }) => {
      const response = await axios.patch(`/services/${id}`, values);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("Service updated and sent for review.");
      setOverlayOpen(false);
      setSelectedService(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Unable to update service.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.delete(`/services/${id}`);
      return response.data;
    },
    onSuccess: () => {
      invalidateQueries();
      toast.success("Service deleted.");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Unable to delete service.");
    },
  });

  const openCreate = () => {
    setFormMode("create");
    setSelectedService(null);
    setOverlayOpen(true);
  };

  const openUpdate = (service) => {
    setFormMode("update");
    setSelectedService(service);
    setOverlayOpen(true);
  };

  const openDeleteConfirm = (service) => {
    setServiceToDelete(service);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setServiceToDelete(null);
  };

  const handleDelete = () => {
    if (!serviceToDelete?.id) return;
    deleteMutation.mutate(serviceToDelete.id);
    closeDeleteConfirm();
  };

  const handleSubmit = (values, mode) => {
    const payload = normalizePayload(values, mode);
    if (mode === "update" && selectedService?.id) {
      updateMutation.mutate({ id: selectedService.id, values: payload });
      return;
    }
    createMutation.mutate(payload);
  };

  const defaultValues =
    formMode === "update" && selectedService
      ? {
          title: selectedService.title ?? "",
          description: selectedService.description ?? "",
          duration: selectedService.duration ?? "",
          price: selectedService.price ?? "",
          status: selectedService.status ?? "",
          categoryId:
            selectedService.categoryId === null ||
            selectedService.categoryId === undefined
              ? ""
              : String(selectedService.categoryId),
        }
      : {
          title: "",
          description: "",
          duration: "",
          price: "",
          status: "ACTIVE",
          categoryId: "",
        };

  const isSaving =
    formMode === "update" ? updateMutation.isPending : createMutation.isPending;

  const columns = [
    {
      key: "title",
      header: "Title",
      cell: (service) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {service.title}
          </div>
          <div className="mt-1 text-xs text-[#4B4B4B]">
            {service.categoryName || "Uncategorized"}
          </div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (service) => (
        <p className="text-sm text-[#4B4B4B]">
          {service.description || "No description."}
        </p>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      cell: (service) => (
        <span className="text-sm text-[#0F0F0F]">{service.duration} min</span>
      ),
    },
    {
      key: "price",
      header: "Price",
      cell: (service) => (
        <span className="text-sm text-[#0F0F0F]">
          {formatPrice(service.price)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Visibility",
      cell: (service) => <StatusBadge value={service.status} />,
    },
    {
      key: "approvalStatus",
      header: "Approval",
      cell: (service) => <StatusBadge value={service.approvalStatus} />,
    },
    {
      key: "moderationNote",
      header: "Admin Note",
      cell: (service) => (
        <p className="text-sm text-[#4B4B4B]">
          {service.moderationNote || "No admin note yet."}
        </p>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (service) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() => openUpdate(service)}
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[#EA3A30] text-[#EA3A30] hover:bg-[#EA3A30] hover:text-white"
            disabled={deleteMutation.isPending}
            onClick={() => openDeleteConfirm(service)}
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
          title="Services"
          subtitle="Create services, attach categories, and track admin approval."
          actions={
            <div className="flex flex-wrap gap-3">
              <Button href="/categories" variant="soft">
                Request category
              </Button>
              <Button type="button" onClick={openCreate}>
                New service
              </Button>
            </div>
          }
        />

        <SearchInput
          data={services}
          fields={[
            "title",
            "description",
            "status",
            "approvalStatus",
            "categoryName",
            "moderationNote",
          ]}
          onResults={(results, query) => {
            setFilteredServices(results);
            setSearchTerm(query);
          }}
          placeholder="Search services..."
          className="w-full"
        />

        {isLoading ? (
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
            Loading services...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#EA3A30]">
            {error?.message || "Unable to load services."}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredServices}
            emptyMessage={
              searchTerm.trim().length
                ? "No services match your search."
                : "No services yet. Create your first one."
            }
          />
        )}
      </div>

      <OverlayForm
        open={overlayOpen}
        mode={formMode}
        title={formMode === "update" ? "Update service" : "Create service"}
        description="Services are reviewed by an admin before they appear in the public catalog."
        onCancel={() => {
          setOverlayOpen(false);
          setSelectedService(null);
        }}
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        loading={isSaving}
        fields={[
          {
            name: "title",
            label: "Service title",
            placeholder: "e.g. Haircut",
            rules: { required: "Title is required" },
          },
          {
            name: "description",
            label: "Description",
            placeholder: "Optional description",
          },
          {
            name: "duration",
            label: "Duration (minutes)",
            type: "number",
            placeholder: "60",
            rules: {
              required: "Duration is required",
              valueAsNumber: true,
              min: { value: 1, message: "Duration must be at least 1 minute" },
            },
          },
          {
            name: "price",
            label: "Price",
            type: "number",
            placeholder: "50",
            rules: {
              required: "Price is required",
              valueAsNumber: true,
              min: { value: 1, message: "Price must be positive" },
            },
          },
          {
            name: "status",
            label: "Visibility status",
            type: "select",
            placeholder: "Select status",
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ],
            rules: { required: "Status is required" },
          },
          {
            name: "categoryId",
            label: "Category",
            type: "select",
            placeholder: isCategoriesLoading
              ? "Loading categories..."
              : "Select category (optional)",
            options: categories.map((category) => ({
              label:
                category.status === "APPROVED"
                  ? category.name
                  : `${category.name} (${String(category.status ?? "").toLowerCase()})`,
              value: category.id,
            })),
            disabled: isCategoriesLoading,
          },
        ]}
      />

      <Popup
        open={deleteConfirmOpen}
        title="Delete service?"
        description={
          serviceToDelete?.title
            ? `Delete "${serviceToDelete.title}"? This cannot be undone.`
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
