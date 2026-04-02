import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { roles, users } from "./schema";

const buildLoginUrl = (callbackUrl) => {
  const params = new URLSearchParams();

  if (callbackUrl) {
    params.set("callbackUrl", callbackUrl);
  }

  const query = params.toString();
  return query ? `/login?${query}` : "/login";
};

const getDbRoleForSession = async (session) => {
  const userId = Number(session?.user?.id);
  const normalizedEmail = String(session?.user?.email ?? "")
    .trim()
    .toLowerCase();

  let dbUser =
    Number.isFinite(userId) && userId > 0
      ? await db.query.users.findFirst({
          where: eq(users.id, userId),
        })
      : null;

  if (!dbUser && normalizedEmail) {
    dbUser = await db.query.users.findFirst({
      where: sql`lower(${users.email}) = ${normalizedEmail}`,
    });
  }

  const dbRole = dbUser?.roleId
    ? await db.query.roles.findFirst({
        where: eq(roles.id, dbUser.roleId),
      })
    : null;

  return String(dbRole?.name ?? session?.user?.role ?? "")
    .trim()
    .toUpperCase();
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
  const role = (await getDbRoleForSession(session)).toLowerCase();

  if (role !== "provider") {
    redirect("/services/catalog");
  }

  return session;
}

export async function requireAdmin(callbackUrl = "/admin/dashboard") {
  const session = await requireAuthenticatedUser(callbackUrl);
  const role = (await getDbRoleForSession(session)).toLowerCase();

  if (role !== "admin") {
    redirect("/");
  }

  return session;
}
