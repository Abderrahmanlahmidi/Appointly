import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../lib/db";
import { users, roles } from "../../../lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";


export async function POST(req) {
  const body = await req.json();

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, body.email),
  });

  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const clientRole = await db.query.roles.findFirst({
    where: eq(roles.name, "client")
  });

  console.log(clientRole)

  await db.insert(users).values({
    firstName: body.firstname,
    lastName: body.lastname,
    email: body.email,
    password: hashedPassword,
    phone: body.phone,
    roleId: clientRole.id
  });

  return NextResponse.json({ message: "User created" });
}
