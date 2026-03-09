import CategoriesPageClient from "./CategoriesPageClient";
import { requireProvider } from "../../../lib/route-guards";

export default async function CategoriesPage() {
  await requireProvider("/categories");
  return <CategoriesPageClient />;
}
