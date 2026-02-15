import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const toTrimmedString = (value) =>
  typeof value === "string" ? value.trim() : "";

const getUserId = (session) => {
  const id = Number(session?.user?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
};

export async function GET() {
  const session = await auth();
  const userId = getUserId(session);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      image: user.image ?? "",
    },
  });
}

export async function PATCH(req) {
  const session = await auth();
  const userId = getUserId(session);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates = {};

  if (Object.prototype.hasOwnProperty.call(body, "firstName")) {
    const firstName = toTrimmedString(body.firstName);
    if (!firstName) {
      return NextResponse.json(
        { error: "First name is required" },
        { status: 400 }
      );
    }
    updates.firstName = firstName;
  }

  if (Object.prototype.hasOwnProperty.call(body, "lastName")) {
    const lastName = toTrimmedString(body.lastName);
    if (!lastName) {
      return NextResponse.json(
        { error: "Last name is required" },
        { status: 400 }
      );
    }
    updates.lastName = lastName;
  }

  if (Object.prototype.hasOwnProperty.call(body, "phone")) {
    const phone = toTrimmedString(body.phone);
    updates.phone = phone || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, "image")) {
    const image = toTrimmedString(body.image);
    updates.image = image || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      image: users.image,
    });

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: updated });
}
