import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  roles,
} from "./schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export const authOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  session: {
    strategy: "jwt",
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
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
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

    async jwt({ token, user }) {

      if (user) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        });

        const dbRole = await db.query.roles.findFirst({
          where: eq(roles.id, dbUser?.roleId),
        });

        token.id = dbUser?.id;
        token.email = dbUser?.email;
        token.name = dbUser?.name;
        token.firstName = dbUser?.firstName;
        token.lastName = dbUser?.lastName;
        token.image = dbUser?.image;
        token.role = dbRole?.name ?? "client";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user = {
          id: token.id ?? 0,
          name: token.name ?? "",
          email: token.email ?? "",
          image: token.image ?? "",
          firstName: token.firstName ?? "",
          lastName: token.lastName ?? "",
          role: token.role ?? "client",
        };
      }

      return session;
    },
  },

  debug: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
export const GET = handlers.GET;
export const POST = handlers.POST;
