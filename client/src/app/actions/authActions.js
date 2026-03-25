"use server";
import { createHash } from "node:crypto";
import { db } from "../../../lib/db";
import { users, verificationTokens } from "../../../lib/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const generateToken = () => {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi) {
    throw new Error("Web Crypto API is not available.");
  }

  if (cryptoApi.randomUUID) {
    return cryptoApi.randomUUID();
  }

  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
};

const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const hashToken = (token) =>
  createHash("sha256").update(String(token)).digest("hex");

const buildResetLink = (token) => {
  const appUrl =
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const url = new URL("/reset-password", appUrl);
  url.searchParams.set("token", token);
  return url.toString();
};

export async function requestPasswordReset(email) {
  try {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return {
        success:
          "If an account exists, a reset link has been generated.",
      };
    }

    const user = await db.query.users.findFirst({
      where: sql`lower(${users.email}) = ${normalizedEmail}`,
    });

    if (!user) {
      return {
        success:
          "If an account exists, a reset link has been generated.",
      };
    }

    const token = generateToken();
    const hashedToken = hashToken(token);
    const expires = new Date(new Date().getTime() + 3600 * 1000);

    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, normalizedEmail));

    await db.insert(verificationTokens).values({
      identifier: normalizedEmail,
      token: hashedToken,
      expires,
    });

    if (process.env.NODE_ENV !== "production") {
      console.info("Password reset link:", buildResetLink(token));
    }

    return {
      success:
        "If an account exists, a reset link has been generated.",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "Something went wrong" };
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const normalizedPassword =
      typeof newPassword === "string" ? newPassword : "";

    if (normalizedPassword.length < 8) {
      return { error: "Password must be at least 8 characters" };
    }

    const hashedToken = hashToken(token);
    const verificationToken = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.token, hashedToken),
    });

    if (!verificationToken) {
      return { error: "Invalid or expired token" };
    }

    if (new Date() > verificationToken.expires) {
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, verificationToken.token));
      return { error: "Token expired" };
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 12);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, verificationToken.identifier));

    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, verificationToken.identifier));

    return { success: "Password updated successfully" };
  } catch (error) {
    console.error("Update password error:", error);
    return { error: "Something went wrong" };
  }
}
