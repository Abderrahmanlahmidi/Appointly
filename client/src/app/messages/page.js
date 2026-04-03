import MessagesPageClient from "./MessagesPageClient";
import { requireAuthenticatedUser } from "../../../lib/route-guards";

export default async function MessagesPage() {
  await requireAuthenticatedUser("/messages");
  return <MessagesPageClient />;
}
