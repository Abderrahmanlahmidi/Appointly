import AdminShell from "../../../components/admin/AdminShell";
import { requireAdmin } from "../../../lib/route-guards";

export default async function AdminLayout({ children }) {
  const session = await requireAdmin("/admin");

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
