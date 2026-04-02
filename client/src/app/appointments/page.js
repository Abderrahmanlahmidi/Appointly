import AppointmentsPageClient from "./AppointmentsPageClient";
import { requireAuthenticatedUser } from "../../../lib/route-guards";

export default async function AppointmentsPage() {
  await requireAuthenticatedUser("/appointments");
  return <AppointmentsPageClient />;
}
