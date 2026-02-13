"use client";
import Link from "next/link";
import Image from "next/image";
import Button from "../../ui/Button";
import ProfileDropdown from "../../ui/ProfileDropdown";

export default function HomeNavbar({ session }) {
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#E0E0E0] bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <Image
            src="/logo.svg"
            alt="Appointly logo"
            width={28}
            height={28}
            className="h-7 w-7"
            priority
          />
          Appointly
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[#4B4B4B] md:flex">
          <a href="#features" className="transition hover:text-[#0F0F0F]">
            Features
          </a>
          <a href="#pricing" className="transition hover:text-[#0F0F0F]">
            Pricing
          </a>
          <a href="#support" className="transition hover:text-[#0F0F0F]">
            Support
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <ProfileDropdown user={user} />
          ) : (
            <>
              <Button href="/login" variant="link">
                Sign in
              </Button>
              <Button href="/register" variant="outline" size="sm">
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
