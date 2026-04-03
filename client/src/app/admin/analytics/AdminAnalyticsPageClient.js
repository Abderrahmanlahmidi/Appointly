"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarClock,
  DollarSign,
  ShieldCheck,
  Users,
} from "lucide-react";
import Button from "../../../../components/ui/Button";
import PageHeader from "../../../../components/ui/PageHeader";
import {
  CircularMeter,
  DashboardPanel,
  DistributionChart,
  MetricCard,
  RevenueBarChart,
  StatusMixChart,
  TrendLineChart,
  WeekdayBarChart,
} from "../../../../components/admin/AdminVisuals";
import {
  buildAdminAnalyticsModel,
  fetchAdminAppointments,
  fetchAdminCategories,
  fetchAdminServices,
  fetchAdminUsers,
} from "../../../../lib/admin";
import { formatPrice } from "../../../../lib/domain";

export default function AdminAnalyticsPageClient() {
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
        Loading analytics...
      </div>
    );
  }

  if (categoriesError || servicesError || appointmentsError || usersError) {
    return (
      <div className="rounded-2xl border border-[#F5C2C0] bg-white p-6 text-sm text-[#B42318]">
        Unable to load admin analytics.
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <section className="rounded-2xl border border-[#E0E0E0] bg-white p-6">
        <PageHeader
          title="Statistics and Graphs"
          subtitle="Track platform demand, supply health, booking outcomes, revenue flow, and user mix from one analytics workspace."
          actions={
            <div className="flex flex-wrap gap-3">
              <Button href="/admin/dashboard" variant="soft">
                Overview
              </Button>
              <Button href="/admin/users" variant="soft">
                Users
              </Button>
            </div>
          }
        />
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <MetricCard
          icon={DollarSign}
          label="Gross booking value"
          value={formatPrice(analytics.totalRevenue)}
          trend={`${appointments.length} booking records`}
          description={`Average ticket ${formatPrice(
            analytics.averageTicket
          )} across all current appointments.`}
          tone="bg-[#0F0F0F]"
        />
        <MetricCard
          icon={ShieldCheck}
          label="Moderation backlog"
          value={analytics.pendingCategories + analytics.pendingServices}
          trend={`${analytics.pendingCategories} categories • ${analytics.pendingServices} services`}
          description="Items currently waiting for admin decisions."
          tone="bg-[#A65E00]"
        />
        <MetricCard
          icon={CalendarClock}
          label="Confirmed bookings"
          value={analytics.confirmedAppointments}
          trend={`${analytics.pendingAppointments} pending • ${analytics.cancelledAppointments} cancelled`}
          description="A current view of booking health across the platform."
          tone="bg-[#037347]"
        />
        <MetricCard
          icon={Users}
          label="User base"
          value={users.length}
          trend={`${analytics.providerUsers} providers • ${analytics.standardUsers} clients`}
          description="Admin, provider, and client roles currently active in the system."
          tone="bg-[#1E5B9E]"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr] 2xl:grid-cols-[1.4fr_1fr_1fr]">
        <DashboardPanel
          title="Platform activity trend"
          description="Daily creation volume across categories, services, and bookings for the last 7 days."
        >
          <TrendLineChart
            data={analytics.activityTrend}
            series={[
              {
                key: "appointments",
                label: "Bookings",
                color: "#0F0F0F",
              },
              {
                key: "services",
                label: "Services",
                color: "#037347",
              },
              {
                key: "categories",
                label: "Categories",
                color: "#1E5B9E",
              },
            ]}
          />
        </DashboardPanel>

        <DashboardPanel
          title="Revenue intake"
          description="Booking value created over the last 7 days."
        >
          <RevenueBarChart data={analytics.revenueTrend} />
        </DashboardPanel>

        <DashboardPanel
          title="Appointment status mix"
          description="A stacked operational view of booking states across the platform."
        >
          <StatusMixChart
            items={analytics.appointmentStatusMix}
            total={appointments.length}
            caption={`${appointments.length} booking records are currently tracked in the admin workspace.`}
          />
        </DashboardPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr] 2xl:grid-cols-[1.5fr_1fr_1fr]">
        <DashboardPanel
          title="Demand by weekday"
          description="A quick booking distribution chart to show where activity clusters through the week."
        >
          <WeekdayBarChart data={analytics.weekdayVolume} />
        </DashboardPanel>

        <DashboardPanel
          title="Booking outcome"
          description="Confirmation rate across all recorded appointments."
        >
          <CircularMeter
            label="Confirmed bookings"
            value={analytics.confirmedAppointments}
            total={appointments.length}
            caption="Confirmed appointments indicate the healthiest booking flow."
            ringClassName="stroke-[#037347]"
          />
        </DashboardPanel>

        <DashboardPanel
          title="User role mix"
          description="How the active user base is distributed across admin, provider, and client roles."
        >
          <DistributionChart items={analytics.roleMix} />
        </DashboardPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <DashboardPanel
          title="Category review health"
          description="Visibility into category request volume and review output."
        >
          <DistributionChart items={analytics.categoryMix} />
        </DashboardPanel>
        <DashboardPanel
          title="Service approval pipeline"
          description="Where supply is landing inside the moderation pipeline."
        >
          <DistributionChart items={analytics.approvalMix} />
        </DashboardPanel>
      </section>
    </div>
  );
}
