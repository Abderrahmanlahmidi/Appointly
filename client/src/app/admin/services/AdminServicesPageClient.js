"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "../../../../lib/axios";
import {
  fetchAdminServices,
  sortAdminServices,
} from "../../../../lib/admin";
import { formatPrice } from "../../../../lib/domain";
import Button from "../../../../components/ui/Button";
import DataTable from "../../../../components/ui/DataTable";
import PageHeader from "../../../../components/ui/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { useToast } from "../../../../components/ui/Toast";

export default function AdminServicesPageClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredServices, setFilteredServices] = React.useState([]);

  const {
    data: services = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: fetchAdminServices,
  });

  const moderateServiceMutation = useMutation({
    mutationFn: async ({ id, approvalStatus }) => {
      const response = await axios.patch(`/services/${id}/moderate`, {
        approvalStatus,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service moderation updated.");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to moderate service."
      );
    },
  });

  const sortedServices = React.useMemo(
    () => sortAdminServices(services),
    [services]
  );

  const visibleServices = searchTerm.trim().length
    ? filteredServices
    : sortedServices;

  const pendingServices = services.filter(
    (item) => item.approvalStatus === "PENDING"
  ).length;
  const approvedServices = services.filter(
    (item) => item.approvalStatus === "APPROVED"
  ).length;
  const rejectedServices = services.filter(
    (item) => item.approvalStatus === "REJECTED"
  ).length;

  const serviceColumns = [
    {
      key: "title",
      header: "Service",
      cell: (service) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {service.title}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {service.categoryName || "Uncategorized"}
          </div>
        </div>
      ),
    },
    {
      key: "providerName",
      header: "Provider",
      cell: (service) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {service.providerName}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {service.providerEmail || "No email"}
          </div>
        </div>
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
      key: "price",
      header: "Price",
      cell: (service) => (
        <span className="text-sm text-[#0F0F0F]">
          {formatPrice(service.price)}
        </span>
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
            disabled={moderateServiceMutation.isPending}
            onClick={() =>
              moderateServiceMutation.mutate({
                id: service.id,
                approvalStatus: "APPROVED",
              })
            }
          >
            Approve
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={moderateServiceMutation.isPending}
            onClick={() =>
              moderateServiceMutation.mutate({
                id: service.id,
                approvalStatus: "PENDING",
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
            disabled={moderateServiceMutation.isPending}
            onClick={() =>
              moderateServiceMutation.mutate({
                id: service.id,
                approvalStatus: "REJECTED",
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
          title="Services"
          subtitle="Moderate provider services in a dedicated review table with their own queue metrics."
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
            {pendingServices}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[#7A7A7A]">
            Approved
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#0F0F0F]">
            {approvedServices}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[#7A7A7A]">
            Rejected
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#0F0F0F]">
            {rejectedServices}
          </div>
        </div>
      </section>

      <SearchInput
        data={sortedServices}
        fields={[
          "title",
          "categoryName",
          "providerName",
          "providerEmail",
          "status",
          "approvalStatus",
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
        <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
          Unable to load services.
        </div>
      ) : (
        <DataTable
          columns={serviceColumns}
          data={visibleServices}
          emptyMessage={
            searchTerm.trim().length
              ? "No services match your search."
              : "No services found."
          }
        />
      )}
    </div>
  );
}
