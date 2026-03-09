import ProfilePageClient from "../../../components/sections/profile/ProfilePageClient";
import { requireAuthenticatedUser } from "../../../lib/route-guards";

export default async function ProfilePage() {
  await requireAuthenticatedUser("/profile");
  return <ProfilePageClient />;
}
