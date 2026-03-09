import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

const authPages = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];
const publicPages = ["/"];
const providerOnlyPages = ["/categories", "/services"];
const publicCatalogBasePath = "/services/catalog";
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

const sessionCookieNames = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

const matchesPath = (path, route) =>
  path === route || path.startsWith(`${route}/`);

const isPublicCatalogRoute = (path) => matchesPath(path, publicCatalogBasePath);

const isPublicRoute = (path) =>
  publicPages.includes(path) ||
  authPages.includes(path) ||
  isPublicCatalogRoute(path);

const isProviderOnlyRoute = (path) =>
  !isPublicCatalogRoute(path) &&
  providerOnlyPages.some((route) => matchesPath(path, route));

const buildLoginRedirect = (req) => {
  const loginUrl = new URL("/login", req.nextUrl);
  loginUrl.searchParams.set(
    "callbackUrl",
    `${req.nextUrl.pathname}${req.nextUrl.search}`
  );
  return NextResponse.redirect(loginUrl);
};

const getSessionToken = async (req) => {
  if (!authSecret) return null;

  for (const cookieName of sessionCookieNames) {
    const token = await getToken({
      req,
      secret: authSecret,
      cookieName,
      salt: cookieName,
    });

    if (token) {
      return token;
    }
  }

  return null;
};

export async function middleware(req) {
  const path = req.nextUrl.pathname;
  const token = await getSessionToken(req);
  const isAuthenticated = Boolean(token);
  const role = String(token?.role ?? "").toLowerCase();
  const isProvider = role === "provider";

  if (isAuthenticated && authPages.includes(path)) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (!isAuthenticated && !isPublicRoute(path)) {
    return buildLoginRedirect(req);
  }

  if (isProviderOnlyRoute(path) && !isProvider) {
    return NextResponse.redirect(new URL("/services/catalog", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
