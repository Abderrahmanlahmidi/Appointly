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
import { eq, sql } from "drizzle-orm";
import { ensureRole, normalizeRoleName } from "./roles";

const normalizeEmail = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

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
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials) return null;

        const email = normalizeEmail(credentials.email);
        const password =
          typeof credentials.password === "string" ? credentials.password : "";

        if (!email || !password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: sql`lower(${users.email}) = ${email}`,
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) return null;

        return {
          id: String(user.id),
          email: user.email,
        };
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  events: {
    async createUser({ user }) {
      const defaultRole = await ensureRole(
        "USER",
        "Default role for standard users",
      );

      await db
        .update(users)
        .set({ roleId: defaultRole.id })
        .where(eq(users.id, user.id));
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, Number(user.id)),
        });

        const dbRole = dbUser?.roleId
          ? await db.query.roles.findFirst({
              where: eq(roles.id, dbUser.roleId),
            })
          : null;

        token.id = dbUser?.id;
        token.email = dbUser?.email;
        token.firstName = dbUser?.firstName;
        token.lastName = dbUser?.lastName;
        token.image = dbUser?.image;
        token.role = normalizeRoleName(dbRole?.name);
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
          role: normalizeRoleName(token.role),
        };
      }

      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
export const GET = handlers.GET;
export const POST = handlers.POST;
