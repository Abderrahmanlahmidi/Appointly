"use server";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

export async function requestPasswordReset(email) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return { error: "User not found" };
        }

        const token = randomUUID();
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
