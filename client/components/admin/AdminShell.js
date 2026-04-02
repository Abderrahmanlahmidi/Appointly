"use client";

import {
  Activity,
  BarChart3,
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Button from "../ui/Button";
import ProfileDropdown from "../ui/ProfileDropdown";

const navItems = [
  {
    href: "/admin/dashboard",
    label: "Overview",
    description: "Live system health and moderation queues",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    description: "Demand, funnel, and growth views",
    icon: BarChart3,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    description: "Exports, compliance, and scheduled packs",
    icon: FileText,
  },
  {
    href: "/admin/activity",
    label: "Activity",
    description: "Operational events and audit streams",
    icon: Activity,
  },
  {
    href: "/admin/management",
    label: "Management",
    description: "Catalog, support, and admin tooling",
    icon: SlidersHorizontal,
  },
  {
    href: "/admin/settings",
    label: "Settings",
    description: "Policy, defaults, and platform controls",
    icon: Settings,
  },
];

const matchesPath = (pathname, href) =>
  pathname === href || pathname.startsWith(`${href}/`);

export default function AdminShell({ user, children }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white text-[#0F0F0F]">
      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-5 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between rounded-2xl border border-[#E0E0E0] bg-white px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[#7A7A7A]">
              <Shield className="h-3.5 w-3.5" />
              Admin Control Panel
            </div>
            <div className="mt-1 text-lg font-semibold text-[#0F0F0F]">
              Platform operations
            </div>
          </div>
          <ProfileDropdown user={user} />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(250px,280px)_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#7A7A7A]">
                <Shield className="h-4 w-4" />
                Admin Only
              </div>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-[#0F0F0F]">
                Appointly Ops
              </h1>
              <p className="mt-3 text-sm leading-6 text-[#4B4B4B]">
                Review demand, moderate submissions, and steer the platform from
                one workspace.
              </p>
            </div>

            <nav className="rounded-2xl border border-[#E0E0E0] bg-white p-3">
              <div className="mb-2 px-3 pt-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#7A7A7A]">
                Workspace
              </div>
              <div className="grid gap-2">
                {navItems.map((item) => {
                  const isActive = matchesPath(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Button
                      key={item.href}
                      href={item.href}
                      variant="soft"
                      className={[
                        "w-full justify-start rounded-2xl px-4 py-4 text-left",
                        isActive
                          ? "!border-[#0F0F0F] !bg-[#0F0F0F] !text-white hover:!bg-[#0F0F0F]"
                          : "!border-[#E0E0E0] !bg-white !text-[#0F0F0F] hover:!bg-[#FAFAFA]",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <span
                          className={[
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                            isActive
                              ? "bg-white/12 text-white"
                              : "bg-[#FAFAFA] text-[#0F0F0F]",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span
                            className={[
                              "block text-sm font-semibold",
                              isActive ? "!text-white" : "text-[#0F0F0F]",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {item.label}
                          </span>
                          <span
                            className={[
                              "mt-1 block text-xs leading-5",
                              isActive ? "!text-white/72" : "text-[#4B4B4B]",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {item.description}
                          </span>
                        </span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            </nav>

            <div className="rounded-2xl border border-[#E0E0E0] bg-white p-5">
              <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#7A7A7A]">
                Operations Lens
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-4">
                  <div className="text-sm font-semibold">Moderation first</div>
                  <p className="mt-1 text-xs leading-5 text-[#4B4B4B]">
                    Prioritize category and service approvals to keep supply
                    clean and discoverable.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-4">
                  <div className="text-sm font-semibold">Scalable structure</div>
                  <p className="mt-1 text-xs leading-5 text-[#4B4B4B]">
                    Static modules are ready for deeper admin tools without
                    changing the shell or route model.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 max-w-full flex-col gap-6 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
