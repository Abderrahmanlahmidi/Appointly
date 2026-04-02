import {
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { getToken } from '@auth/core/jwt';
import type { Request } from 'express';

const sessionCookieNames = [
  '__Secure-authjs.session-token',
  'authjs.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
];

const normalizeRole = (value?: string | null) =>
  String(value ?? 'USER')
    .trim()
    .toUpperCase();

const resolveAuthSecret = () =>
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? null;

export type AuthUser = {
  id: number;
  email: string | null;
  role: string;
};

const getSessionToken = async (req: Request) => {
  const secret = resolveAuthSecret();

  if (!secret) {
    return null;
  }

  for (const cookieName of sessionCookieNames) {
    const token = await getToken({
      req: req as Parameters<typeof getToken>[0]['req'],
      secret,
      cookieName,
      salt: cookieName,
    });

    if (token) {
      return token;
    }
  }

  return null;
};

export const getOptionalAuthUser = async (
  req: Request,
): Promise<AuthUser | null> => {
  const token = await getSessionToken(req);

  if (!token) {
    return null;
  }

  const id = Number(token.id ?? token.sub);

  if (!Number.isFinite(id) || id <= 0) {
    throw new UnauthorizedException('Invalid session');
  }

  return {
    id,
    email: typeof token.email === 'string' ? token.email : null,
    role: normalizeRole(
      typeof token.role === 'string' ? token.role : undefined,
    ),
  };
};

export const requireAuthUser = async (req: Request) => {
  if (!resolveAuthSecret()) {
    throw new InternalServerErrorException(
      'AUTH_SECRET must be configured on the server',
    );
  }

  const authUser = await getOptionalAuthUser(req);

  if (!authUser) {
    throw new UnauthorizedException('Authentication required');
  }

  return authUser;
};

export const requireProviderUser = (authUser: AuthUser) => {
  if (normalizeRole(authUser.role) !== 'PROVIDER') {
    throw new ForbiddenException('Provider access required');
  }

  return authUser;
};

export const requireAdminUser = (authUser: AuthUser) => {
  if (normalizeRole(authUser.role) !== 'ADMIN') {
    throw new ForbiddenException('Admin access required');
  }

  return authUser;
};

export const isAdminUser = (authUser?: AuthUser | null) =>
  normalizeRole(authUser?.role) === 'ADMIN';
