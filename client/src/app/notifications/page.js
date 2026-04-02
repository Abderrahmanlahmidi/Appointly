import NotificationsPageClient from "./NotificationsPageClient";
import { requireAuthenticatedUser } from "../../../lib/route-guards";

export default async function NotificationsPage() {
  await requireAuthenticatedUser("/notifications");
  return <NotificationsPageClient />;
}
