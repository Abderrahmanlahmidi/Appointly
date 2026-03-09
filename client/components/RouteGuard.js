"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

const authPages = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];
const publicPages = ["/"];
const providerOnlyPages = ["/categories", "/services"];
const publicCatalogBasePath = "/services/catalog";

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

const buildCallbackUrl = (pathname, searchParams) => {
  const query = searchParams?.toString();
  return query ? `${pathname}?${query}` : pathname;
};

const GuardScreen = () => (
  <div className="flex min-h-screen items-center justify-center bg-white px-6 text-sm text-[#4B4B4B]">
    Checking access...
  </div>
);

export default function RouteGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const role = String(session?.user?.role ?? "").toLowerCase();
  const isProvider = role === "provider";
  const callbackUrl = React.useMemo(
    () => buildCallbackUrl(pathname ?? "/", searchParams),
    [pathname, searchParams]
  );

  React.useEffect(() => {
    if (!pathname || isLoading) return;

    if (isAuthenticated && authPages.includes(pathname)) {
      router.replace("/");
      return;
    }

    if (!isAuthenticated && !isPublicRoute(pathname)) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (isAuthenticated && isProviderOnlyRoute(pathname) && !isProvider) {
      router.replace("/services/catalog");
    }
  }, [
    callbackUrl,
    isAuthenticated,
    isLoading,
    isProvider,
    pathname,
    router,
  ]);

  if (!pathname) {
    return null;
  }

  if (!isPublicRoute(pathname) && (isLoading || !isAuthenticated)) {
    return <GuardScreen />;
  }

  if (isAuthenticated && authPages.includes(pathname)) {
    return <GuardScreen />;
  }

  if (isAuthenticated && isProviderOnlyRoute(pathname) && !isProvider) {
    return <GuardScreen />;
  }

  return children;
}
