import AdminPlaceholderPage from "../../../../components/admin/AdminPlaceholderPage";

export default function AdminSettingsPage() {
  return (
    <AdminPlaceholderPage
      eyebrow="Settings Module"
      title="Platform Settings"
      subtitle="A future-ready control area for moderation rules, platform defaults, notification policies, and administrative access controls."
      stats={[
        {
          label: "Control areas",
          value: "6",
          description: "Access, moderation, notifications, booking, catalog, and ops.",
        },
        {
          label: "Policy mode",
          value: "Centralized",
          description: "Designed to keep administrative settings in one place.",
        },
        {
          label: "Access level",
          value: "Restricted",
          description: "Only admins should reach or modify this area.",
        },
        {
          label: "Extensibility",
          value: "High",
          description: "Ready for forms, toggles, review thresholds, and defaults.",
        },
      ]}
      sections={[
        {
          title: "Governance controls",
          badge: "Placeholder",
          description:
            "Host future configuration for moderation thresholds, approval workflows, and exception handling rules.",
          items: [
            "Approval policies and thresholds",
            "Escalation and rejection defaults",
            "Admin review notes configuration",
          ],
        },
        {
          title: "Platform defaults",
          badge: "Placeholder",
          description:
            "Reserve this area for notifications, scheduling defaults, and catalog behavior that should be configurable without code edits.",
          items: [
            "Notification defaults",
            "Scheduling guardrails",
            "Catalog publishing defaults",
          ],
        },
      ]}
      note="The settings route is intentionally present now so policy and system configuration can be added later without changing the admin IA or access model."
    />
  );
}
