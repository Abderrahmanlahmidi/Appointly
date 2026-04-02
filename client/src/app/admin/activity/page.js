import AdminPlaceholderPage from "../../../../components/admin/AdminPlaceholderPage";

export default function AdminActivityPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Activity Module"
      title="Operational Activity"
      subtitle="A dedicated surface for audit trails, operational events, moderation history, and cross-team visibility into what changed across the platform."
      stats={[
        {
          label: "Streams",
          value: "4",
          description: "Moderation, booking events, support actions, and alerts.",
        },
        {
          label: "Audit depth",
          value: "Ready",
          description: "Structured to hold actor, action, timestamp, and outcome.",
        },
        {
          label: "Use case",
          value: "Traceability",
          description: "Makes admin decisions easier to review and debug later.",
        },
        {
          label: "Visibility",
          value: "Admin only",
          description: "Protected for internal operations and oversight.",
        },
      ]}
      sections={[
        {
          title: "Moderation journal",
          badge: "Planned",
          description:
            "Track who approved or rejected categories and services, along with timestamps, notes, and decision quality signals.",
          items: [
            "Category review events",
            "Service approval decisions",
            "Rejected item follow-up history",
          ],
        },
        {
          title: "System event stream",
          badge: "Planned",
          description:
            "Surface operational activity such as appointment interventions, schedule changes, and platform-level alerts in one timeline.",
          items: [
            "Appointment status interventions",
            "Availability changes",
            "Notification and alert events",
          ],
        },
      ]}
      note="The live dashboard already includes a compact activity feed. This full activity module is reserved for deeper audit and investigation tooling."
    />
  );
}
