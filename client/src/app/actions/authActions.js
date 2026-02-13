"use server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
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

export async function requestPasswordReset(email) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return { error: "User not found" };
        }

        const token = generateToken();
        const expires = new Date(new Date().getTime() + 3600 * 1000); 

        await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

        await db.insert(verificationTokens).values({
            identifier: email,
            token,
            expires,
        });

        return { success: "Reset link generated (check server console)" };
    } catch (error) {
        console.error("Reset password error:", error);
        return { error: "Something went wrong" };
    }
}

export async function resetPassword(token, newPassword) {
    try {
        const verificationToken = await db.query.verificationTokens.findFirst({
            where: eq(verificationTokens.token, token),
        });

        if (!verificationToken) {
            return { error: "Invalid or expired token" };
        }

        if (new Date() > verificationToken.expires) {
            return { error: "Token expired" };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

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
