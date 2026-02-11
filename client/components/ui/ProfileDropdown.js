"use client";

import { signOut } from "next-auth/react";
import Button from "./Button";

export default function ProfileDropdown({ user }) {
  const name = user?.name || "User";
  const email = user?.email || "";
  const image = user?.image;

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-[#0F0F0F] px-3 py-2 text-sm font-semibold text-[#0F0F0F] transition hover:bg-[#0F0F0F] hover:text-white">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : null}
      </summary>

      <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-[#E0E0E0] bg-white p-4 text-left">
        <div className="flex items-center gap-3">
          {image ? (
            <img
              src={image}
              alt={name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : null}
          <div>
            <div className="text-sm font-semibold text-[#0F0F0F]">{name}</div>
            {email ? (
              <div className="text-xs text-[#4B4B4B]">{email}</div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <Button href="/profile" variant="soft" className="w-full">
            View profile
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Logout
          </Button>
        </div>
      </div>
    </details>
  );
}
