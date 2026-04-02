import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../../lib/db";
import { users } from "../../../../lib/schema";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { ensureRole } from "../../../../lib/roles";

export const runtime = "nodejs";

const registerSchema = z
  .object({
    firstname: z.string().trim().min(2, "First name must be at least 2 characters"),
    lastname: z.string().trim().min(2, "Last name must be at least 2 characters"),
    email: z.string().trim().email("Invalid email address"),
    phone: z.string().trim().min(6, "Phone is required"),
    role: z.enum(["USER", "PROVIDER"]).default("USER"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid registration data" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();

  const existingUser = await db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${email}`,
  });

  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
  const selectedRole = await ensureRole(
    parsed.data.role,
    parsed.data.role === "PROVIDER"
      ? "Service provider account"
      : "Default role for standard users",
  );

  await db.insert(users).values({
    firstName: parsed.data.firstname,
    lastName: parsed.data.lastname,
    email,
    password: hashedPassword,
    phone: parsed.data.phone,
    roleId: selectedRole.id,
  });

  return NextResponse.json({ message: "User created" });
}
