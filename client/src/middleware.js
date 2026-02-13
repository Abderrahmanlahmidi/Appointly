import { NextResponse } from "next/server";

const authPages = ["/login", "/register"];

const protectedPages = ["/profile"];

const sessionCookieNames = [
  "__Secure-authjs.session-token",
  "authjs.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

const hasSessionCookie = (req) =>
  sessionCookieNames.some((name) => req.cookies.get(name)?.value);

export async function middleware(req){
  const hasSession = hasSessionCookie(req);
  const path = req.nextUrl.pathname;

  if (hasSession && authPages.includes(path)) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  if (!hasSession && protectedPages.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  return NextResponse.next();
};

export const config = {
  matcher: ["/login", "/register", "/profile/:path*"],
};
