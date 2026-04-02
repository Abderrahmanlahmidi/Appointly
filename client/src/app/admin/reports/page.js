import AdminPlaceholderPage from "../../../../components/admin/AdminPlaceholderPage";

export default function AdminReportsPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Reports Module"
      title="Reports & Export Center"
      subtitle="A structured admin reporting area for scheduled exports, compliance packs, moderation summaries, and executive reviews."
      stats={[
        {
          label: "Report lanes",
          value: "5",
          description: "Operations, moderation, bookings, supply, and finance.",
        },
        {
          label: "Export targets",
          value: "CSV / PDF",
          description: "Prepared for downloadable operational and executive packs.",
        },
        {
          label: "Cadence",
          value: "Daily+",
          description: "Designed for recurring snapshots and scheduled delivery.",
        },
        {
          label: "Scope",
          value: "Platform-wide",
          description: "Aggregates every important administrative surface.",
        },
      ]}
      sections={[
        {
          title: "Executive reporting",
          badge: "Placeholder",
          description:
            "Board-level summaries can live here once automated reporting is introduced across revenue, activity, and moderation outcomes.",
          items: [
            "Monthly performance summary",
            "Quarterly platform health pack",
            "Leadership KPI digest",
          ],
        },
        {
          title: "Operational exports",
          badge: "Placeholder",
          description:
            "Give admins a single place to export moderation queues, service audits, booking exceptions, and support workload snapshots.",
          items: [
            "Moderation backlog export",
            "Appointment exception export",
            "Provider catalog quality report",
          ],
        },
      ]}
      note="This page is intentionally scaffolded as a full report hub so export and scheduling workflows can be introduced without revisiting route structure or navigation."
    />
  );
}
