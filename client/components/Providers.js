"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import RouteGuard from "./RouteGuard";
import { ToastProvider } from "./ui/Toast";

export function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RouteGuard>{children}</RouteGuard>
        </ToastProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
