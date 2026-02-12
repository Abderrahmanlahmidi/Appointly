import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { accounts, sessions, users, verificationTokens, roles } from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "database",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );
        if (!isValid) return null;

        return {
          id: user.id.toString(),
          email: user.email,
          name:
            user.name ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email.split("@")[0],
        };
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      const clientRole = await db.query.roles.findFirst({
        where: eq(roles.name, "client"),
      });

      if (!clientRole) return;

      await db
        .update(users)
        .set({ roleId: clientRole.id })
        .where(eq(users.id, user.id));
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (!user?.id) return session;

      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        with: {
          role: true,
        },
      });

      if (!dbUser) return session;

      session.user = {
        id: dbUser.id ?? 0,
        name: dbUser.name ?? "",
        email: dbUser.email ?? "",
        image: dbUser.image ?? "",
        firstName: dbUser.firstName ?? "",
        lastName: dbUser.lastName ?? "",
        role: dbUser.role?.name ?? "",
      };

      return session;
    },
  },
});
