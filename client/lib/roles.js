import { eq } from "drizzle-orm";
import { db } from "./db";
import { roles } from "./schema";

const allowedRoles = new Set(["ADMIN", "USER", "PROVIDER"]);

export const normalizeRoleName = (value, fallback = "USER") => {
  const normalized = String(value ?? fallback)
    .trim()
    .toUpperCase();

  return allowedRoles.has(normalized) ? normalized : fallback;
};

export async function ensureRole(name, description = null) {
  const normalizedName = normalizeRoleName(name);

  const existingRole = await db.query.roles.findFirst({
    where: eq(roles.name, normalizedName),
  });

  if (existingRole) {
    return existingRole;
  }

  const [createdRole] = await db
    .insert(roles)
    .values({
      name: normalizedName,
      description,
    })
    .returning();

  return createdRole;
}
