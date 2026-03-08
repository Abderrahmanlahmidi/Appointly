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

const baseAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
});

const splitName = (name) => {
  if (!name || typeof name !== "string") return {};
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const mapNameToParts = (data) => {
  if (!data || typeof data !== "object") return data;
  const { name, ...rest } = data;
  const parts = splitName(name);
  const mapped = { ...rest };

  if (mapped.firstName === undefined && parts.firstName !== undefined) {
    mapped.firstName = parts.firstName;
  }

  if (mapped.lastName === undefined && parts.lastName !== undefined) {
    mapped.lastName = parts.lastName;
  }

  return mapped;
};

const adapter = {
  ...baseAdapter,
  async createUser(data) {
    return baseAdapter.createUser(mapNameToParts(data));
  },
  async updateUser(data) {
    return baseAdapter.updateUser(mapNameToParts(data));
  },
};

export const authOptions = {
  adapter,

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
