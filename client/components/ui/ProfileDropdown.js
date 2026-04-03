"use client";
import React from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck2,
  ChevronDown,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MessageSquare,
  User,
} from "lucide-react";
import Button from "./Button";
import Popup from "./Popup";
import { normalizeRole } from "../../lib/domain";

export default function ProfileDropdown({ user }) {
  const fullName =
    `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "User";
  const email = user?.email || "";
  const image = user?.image;
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const role = normalizeRole(user?.role);

  return (
    <>
      <details className="relative">
        <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl border-2 border-[#0F0F0F] px-3 py-2 text-sm font-semibold text-[#0F0F0F] transition hover:bg-[#0F0F0F] hover:text-white [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            {image ? (
              <Image
                src={image}
                alt={fullName}
                width={40}
                height={40}
                className="h-7 w-7 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F0F0F] text-white">
                <User className="h-4 w-4" />
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </summary>

        <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-[#E0E0E0] bg-white p-4 text-left shadow-xl">
          <div className="rounded-xl border border-[#EDEDED] bg-[#FAFAFA] p-3">
            <div>
              <div className="text-sm font-semibold text-[#0F0F0F]">
                {fullName}
              </div>
              {email ? (
                <div className="text-xs text-[#4B4B4B]">{email}</div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <Button
              href="/profile"
              variant="soft"
              className="w-full justify-start gap-3"
            >
              <User className="h-4 w-4" />
              View profile
            </Button>
            {role === "ADMIN" ? (
              <Button
                href="/admin/dashboard"
                variant="soft"
                className="w-full justify-start gap-3"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            ) : null}
            <Button
              href="/appointments"
              variant="soft"
              className="w-full justify-start gap-3"
            >
              <CalendarCheck2 className="h-4 w-4" />
              Appointments
            </Button>
            {role !== "ADMIN" ? (
              <Button
                href="/messages"
                variant="soft"
                className="w-full justify-start gap-3"
              >
                <MessageSquare className="h-4 w-4" />
                Messages
              </Button>
            ) : null}
            <Button
              href="/notifications"
              variant="soft"
              className="w-full justify-start gap-3"
            >
              <Bell className="h-4 w-4" />
              Notifications
            </Button>
            {role !== "ADMIN" ? (
              <Button
                href="/categories"
                variant="soft"
                className="w-full justify-start gap-3"
              >
                <LayoutGrid className="h-4 w-4" />
                Categories
              </Button>
            ) : null}
            {role === "PROVIDER" ? (
              <>
                <Button
                  href="/services"
                  variant="soft"
                  className="w-full justify-start gap-3"
                >
                  <BriefcaseBusiness className="h-4 w-4" />
                  Services
                </Button>
                <Button
                  href="/availability"
                  variant="soft"
                  className="w-full justify-start gap-3"
                >
                  <CalendarCheck2 className="h-4 w-4" />
                  Availability
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-3 border-[#EA3A30] text-[#EA3A30] hover:bg-[#EA3A30] hover:text-white"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </details>

      <Popup
        open={showLogoutConfirm}
        title="Log out of Appointly?"
        description="You will be signed out and redirected to the home page."
        confirmText="Yes, log me out"
        cancelText="Cancel"
        confirmVariant="outline"
        confirmClassName="border-[#EA3A30] text-[#EA3A30] hover:bg-[#EA3A30] hover:text-white"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => signOut({ callbackUrl: "/" })}
      />
    </>
  );
}
