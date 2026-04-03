"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import axios from "../../../../lib/axios";
import {
  fetchAdminUsers,
  sortAdminUsers,
} from "../../../../lib/admin";
import { formatDateTime } from "../../../../lib/domain";
import Button from "../../../../components/ui/Button";
import DataTable from "../../../../components/ui/DataTable";
import PageHeader from "../../../../components/ui/PageHeader";
import SearchInput from "../../../../components/ui/SearchInput";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { useToast } from "../../../../components/ui/Toast";

const roleSelectClassName =
  "w-full rounded-xl border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#0F0F0F] outline-none transition focus:border-[#0F0F0F]";

const roleOptions = ["ADMIN", "PROVIDER", "USER"];

export default function AdminUsersPageClient() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredUsers, setFilteredUsers] = React.useState([]);
  const [roleDrafts, setRoleDrafts] = React.useState({});

  const currentUserId = Number(session?.user?.id ?? 0);

  const {
    data: users = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }) => {
      const response = await axios.patch(`/users/${id}/role`, { role });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setRoleDrafts((currentValue) => {
        const nextValue = { ...currentValue };
        delete nextValue[variables.id];
        return nextValue;
      });
      toast.success("User role updated.");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ?? "Unable to update user role."
      );
    },
  });

  const sortedUsers = React.useMemo(() => sortAdminUsers(users), [users]);

  const visibleUsers = searchTerm.trim().length ? filteredUsers : sortedUsers;

  const adminUsers = users.filter((item) => item.role === "ADMIN").length;
  const providerUsers = users.filter((item) => item.role === "PROVIDER").length;
  const standardUsers = users.filter((item) => item.role === "USER").length;

  const userColumns = [
    {
      key: "name",
      header: "User",
      cell: (user) => (
        <div>
          <div className="text-sm font-semibold text-[#0F0F0F]">
            {user.name || "Unknown user"}
          </div>
          <div className="text-xs text-[#4B4B4B]">
            {user.email || "No email"}
          </div>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (user) => (
        <span className="text-sm text-[#4B4B4B]">
          {formatDateTime(user.createdAt)}
        </span>
      ),
    },
    {
      key: "role",
      header: "Current role",
      cell: (user) => (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            value={user.role}
            toneMap={{
              ADMIN: "border-[#CFE2FF] bg-[#EEF4FF] text-[#1F4ED8]",
              PROVIDER: "border-[#BDE5D3] bg-[#F0FBF5] text-[#037347]",
              USER: "border-[#E0E0E0] bg-[#F7F7F7] text-[#4B4B4B]",
            }}
          />
          {user.id === currentUserId ? (
            <span className="text-xs font-medium text-[#7A7A7A]">
              Current admin
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "manageRole",
      header: "Change role",
      className: "min-w-[220px]",
      cell: (user) => {
        const nextRole = roleDrafts[user.id] ?? user.role;
        const hasChanged = nextRole !== user.role;
        const isCurrentUser = user.id === currentUserId;

        return (
          <div className="flex flex-col gap-2">
            <select
              value={nextRole}
              disabled={isCurrentUser}
              className={roleSelectClassName}
              onChange={(event) =>
                setRoleDrafts((currentValue) => ({
                  ...currentValue,
                  [user.id]: event.target.value,
                }))
              }
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant={hasChanged ? "primary" : "soft"}
              disabled={
                isCurrentUser ||
                !hasChanged ||
                updateRoleMutation.isPending
              }
              onClick={() =>
                updateRoleMutation.mutate({
                  id: user.id,
                  role: nextRole,
                })
              }
            >
              Save role
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="rounded-2xl border border-[#E0E0E0] bg-white p-6">
        <PageHeader
          title="Users and Roles"
          subtitle="Manage the user base in a dedicated admin table and change roles without leaving the admin workspace."
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
            Admins
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#0F0F0F]">
            {adminUsers}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[#7A7A7A]">
            Providers
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#0F0F0F]">
            {providerUsers}
          </div>
        </div>
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-[#7A7A7A]">
            Clients
          </div>
          <div className="mt-2 text-3xl font-semibold text-[#0F0F0F]">
            {standardUsers}
          </div>
        </div>
      </section>

      <SearchInput
        data={sortedUsers}
        fields={["name", "email", "role", "firstName", "lastName"]}
        onResults={(results, query) => {
          setFilteredUsers(results);
          setSearchTerm(query);
        }}
        placeholder="Search users..."
        className="w-full"
      />

      {isLoading ? (
        <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
          Loading users...
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
          Unable to load users.
        </div>
      ) : (
        <DataTable
          columns={userColumns}
          data={visibleUsers}
          emptyMessage={
            searchTerm.trim().length
              ? "No users match your search."
              : "No users found."
          }
        />
      )}
    </div>
  );
}
