import ServicesPageClient from "./ServicesPageClient";
import { requireProvider } from "../../../lib/route-guards";

export default async function ServicesPage() {
  await requireProvider("/services");
  return <ServicesPageClient />;
}
