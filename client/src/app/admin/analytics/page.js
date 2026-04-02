import AdminPlaceholderPage from "../../../../components/admin/AdminPlaceholderPage";

export default function AdminAnalyticsPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Analytics Module"
      title="Platform Analytics"
      subtitle="A future-focused analytics space for demand, retention, revenue quality, and conversion trends. This section is scaffolded so deeper visual reporting can be added without changing the admin structure."
      stats={[
        {
          label: "Metric groups",
          value: "4",
          description: "Demand, bookings, supply health, and retention views.",
        },
        {
          label: "Chart surfaces",
          value: "8+",
          description: "Ready for cohort, funnel, trend, and map visualizations.",
        },
        {
          label: "Refresh mode",
          value: "Live-ready",
          description: "Designed to accept real operational data once added.",
        },
        {
          label: "Audience",
          value: "Admin",
          description: "Reserved for platform operators and executive reviews.",
        },
      ]}
      sections={[
        {
          title: "Demand intelligence",
          badge: "Planned",
          description:
            "Track booking demand by weekday, provider vertical, cancellation pressure, and service mix to understand where growth is strongest.",
          items: [
            "Booking heatmaps by day and slot",
            "Category and service conversion funnels",
            "Demand changes by provider segment",
          ],
        },
        {
          title: "Growth and retention",
          badge: "Planned",
          description:
            "Measure how clients return, how often providers publish new services, and which operational signals correlate with durable platform usage.",
          items: [
            "Repeat booking cohorts",
            "Provider publishing cadence",
            "Returning client retention benchmarks",
          ],
        },
      ]}
      note="The dashboard already exposes core live metrics. This dedicated analytics page is the next layer for deeper trend analysis, heavier visual reporting, and export-driven decision support."
    />
  );
}
