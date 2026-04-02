import AvailabilityPageClient from "./AvailabilityPageClient";
import { requireProvider } from "../../../lib/route-guards";

export default async function AvailabilityPage() {
  await requireProvider("/availability");
  return <AvailabilityPageClient />;
}
