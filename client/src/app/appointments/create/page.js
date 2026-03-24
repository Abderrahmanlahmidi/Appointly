import CreateAppointmentPageClient from "./CreateAppointmentPageClient";
import { requireAuthenticatedUser } from "../../../../lib/route-guards";

export default async function CreateAppointmentPage() {
  await requireAuthenticatedUser("/appointments/create");
  return <CreateAppointmentPageClient />;
}
