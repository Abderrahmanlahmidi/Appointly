"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarClock,
  FolderKanban,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import {
  DashboardPanel,
  DistributionChart,
  MetricCard,
} from "../../../../components/admin/AdminVisuals";
import Button from "../../../../components/ui/Button";
import PageHeader from "../../../../components/ui/PageHeader";
import {
  buildAdminAnalyticsModel,
  fetchAdminAppointments,
  fetchAdminCategories,
  fetchAdminServices,
  fetchAdminUsers,
  statusTone,
} from "../../../../lib/admin";
import { formatDate, formatPrice } from "../../../../lib/domain";

function QuickLinkCard({ title, description, href, metric, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FAFAFA] text-[#0F0F0F]">
          <Icon className="h-5 w-5" />
        </div>
        <span className="rounded-full border border-[#E0E0E0] bg-[#FAFAFA] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#7A7A7A]">
          {metric}
        </span>
      </div>
      <div className="mt-5 text-lg font-semibold tracking-tight text-[#0F0F0F]">
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-[#4B4B4B]">{description}</p>
      <div className="mt-5">
        <Button href={href} variant="soft" className="w-full justify-center">
          Open page
        </Button>
      </div>
    </div>
  );
}

export default function AdminDashboardPageClient() {
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: fetchAdminCategories,
  });

  const {
    data: services = [],
    isLoading: servicesLoading,
    isError: servicesError,
  } = useQuery({
    queryKey: ["admin", "services"],
    queryFn: fetchAdminServices,
  });

  const {
    data: appointments = [],
    isLoading: appointmentsLoading,
    isError: appointmentsError,
  } = useQuery({
    queryKey: ["admin", "appointments"],
    queryFn: fetchAdminAppointments,
  });

  const {
    data: users = [],
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: fetchAdminUsers,
  });

  const analytics = React.useMemo(
    () =>
      buildAdminAnalyticsModel({
        categories,
        services,
        appointments,
        users,
      }),
    [appointments, categories, services, users]
  );

  if (
    categoriesLoading ||
    servicesLoading ||
    appointmentsLoading ||
    usersLoading
  ) {
    return (
      <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 text-sm text-[#4B4B4B]">
        Loading admin overview...
      </div>
    );
  }

  if (categoriesError || servicesError || appointmentsError || usersError) {
    return (
      <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
        Unable to load the admin overview.
      </div>
    );
  }

  const quickLinks = [
    {
      title: "Statistics and graphs",
      description:
        "Platform trends, revenue, role mix, and booking analytics live here.",
      href: "/admin/analytics",
      metric: "Charts",
      icon: BarChart3,
    },
    {
      title: "Categories",
      description:
        "Keep category moderation separate from the main dashboard and review requests faster.",
      href: "/admin/categories",
      metric: `${analytics.pendingCategories} pending`,
      icon: FolderKanban,
    },
    {
      title: "Services",
      description:
        "Approve or reject provider services from a dedicated review queue.",
      href: "/admin/services",
      metric: `${analytics.pendingServices} pending`,
      icon: ShieldCheck,
    },
    {
      title: "Appointments",
      description:
        "Watch booking flow, confirmations, and cancellations in their own operational table.",
      href: "/admin/appointments",
      metric: `${appointments.length} total`,
      icon: CalendarClock,
    },
    {
      title: "Users and roles",
      description:
        "Manage accounts and change roles without mixing user operations into catalog moderation.",
      href: "/admin/users",
      metric: `${users.length} users`,
      icon: Users,
    },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="rounded-2xl border border-[#E0E0E0] bg-white p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#7A7A7A]">
              <Sparkles className="h-3.5 w-3.5" />
              Executive Overview
            </div>
            <PageHeader
              className="mt-3"
              title="Admin dashboard"
              subtitle="The overview is now cleaner. Tables and charts are separated into dedicated admin pages for categories, services, appointments, analytics, and users."
              titleClassName="text-3xl tracking-tight"
              subtitleClassName="max-w-3xl text-[#4B4B4B]"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/admin/analytics" variant="soft">
              Open analytics
            </Button>
            <Button href="/admin/users">Manage users</Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <MetricCard
          icon={ShieldCheck}
          label="Moderation queue"
          value={analytics.pendingCategories + analytics.pendingServices}
          trend={`${analytics.pendingCategories} categories • ${analytics.pendingServices} services`}
          description="Items waiting for admin decisions right now."
          tone="bg-[#A65E00]"
        />
        <MetricCard
          icon={CalendarClock}
          label="Bookings"
          value={appointments.length}
          trend={`${analytics.confirmedAppointments} confirmed`}
          description={`${analytics.pendingAppointments} pending and ${analytics.cancelledAppointments} cancelled appointments across the platform.`}
          tone="bg-[#0F0F0F]"
        />
        <MetricCard
          icon={Users}
          label="User base"
          value={users.length}
          trend={`${analytics.providerUsers} providers • ${analytics.standardUsers} clients`}
          description={`${analytics.adminUsers} admin accounts currently have elevated access.`}
          tone="bg-[#1E5B9E]"
        />
        <MetricCard
          icon={BarChart3}
          label="Gross value"
          value={formatPrice(analytics.totalRevenue)}
          trend={`${analytics.activeProviders} active providers`}
          description={`Average ticket ${formatPrice(
            analytics.averageTicket
          )} across all recorded bookings.`}
          tone="bg-[#037347]"
        />
      </section>

      <DashboardPanel
        title="Admin pages"
        description="The admin area is split into clearer workspaces so each domain has its own page."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => (
            <QuickLinkCard key={item.href} {...item} />
          ))}
        </div>
      </DashboardPanel>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel
          title="Queue snapshot"
          description="A compact view of what needs attention before you jump into the dedicated pages."
        >
          <div className="grid gap-3">
            {[
              {
                label: "Pending categories",
                value: analytics.pendingCategories,
                href: "/admin/categories",
              },
              {
                label: "Pending services",
                value: analytics.pendingServices,
                href: "/admin/services",
              },
              {
                label: "Pending appointments",
                value: analytics.pendingAppointments,
                href: "/admin/appointments",
              },
              {
                label: "Provider accounts",
                value: analytics.providerUsers,
                href: "/admin/users",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-[#0F0F0F]">
                    {item.label}
                  </div>
                  <div className="text-xs text-[#7A7A7A]">
                    Go to the dedicated page for details and actions.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-lg font-semibold text-[#0F0F0F]">
                    {item.value}
                  </div>
                  <Button href={item.href} variant="soft" size="sm">
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Role distribution"
          description="A quick user-role mix before you open the full user management table."
        >
          <DistributionChart items={analytics.roleMix} />
        </DashboardPanel>
      </section>

      <DashboardPanel
        title="Recent platform activity"
        description="A lightweight feed kept on the overview while the larger data tables live on separate pages."
      >
        <div className="grid gap-3">
          {analytics.recentFeed.length ? (
            analytics.recentFeed.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#EDEDED] bg-[#FAFAFA] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7A7A7A]">
                    {item.label}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#7A7A7A]">
                    <span
                      className={[
                        "h-2.5 w-2.5 rounded-full",
                        statusTone[item.status] ?? "bg-[#7A7A7A]",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    />
                    {formatDate(item.createdAt)}
                  </div>
                </div>
                <div className="mt-2 text-sm font-semibold text-[#0F0F0F]">
                  {item.title}
                </div>
                <div className="mt-1 text-sm leading-6 text-[#4B4B4B]">
                  {item.detail}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-5 text-sm text-[#4B4B4B]">
              No platform activity has been recorded yet.
            </div>
          )}
        </div>
      </DashboardPanel>
    </div>
  );
}
