import CategoriesPageClient from "./CategoriesPageClient";
import { requireAuthenticatedUser } from "../../../lib/route-guards";

export default async function CategoriesPage() {
  await requireAuthenticatedUser("/categories");
  return <CategoriesPageClient />;
}
