import { redirect } from "next/navigation";
import { auth } from "./auth";

const buildLoginUrl = (callbackUrl) => {
  const params = new URLSearchParams();

  if (callbackUrl) {
    params.set("callbackUrl", callbackUrl);
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
};

export async function requireAuthenticatedUser(callbackUrl = "/") {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(buildLoginUrl(callbackUrl));
  }

  return session;
}

export async function requireProvider(callbackUrl = "/services") {
  const session = await requireAuthenticatedUser(callbackUrl);
  const role = String(session?.user?.role ?? "").toLowerCase();

  if (role !== "provider") {
    redirect("/services/catalog");
  }

  return session;
}
