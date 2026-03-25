import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { label: "Services", href: "/services/catalog" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Support", href: "#support" },
];

const authLinks = [
  { label: "Sign in", href: "/login" },
  { label: "Create account", href: "/register" },
];

export default function HomeFooter() {
  return (
    <footer className="border-t border-[#E0E0E0] bg-white text-[#0F0F0F]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <Image
              src="/logo.svg"
              alt="Appointly logo"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            Appointly
          </Link>
          <p className="mt-4 text-sm leading-6 text-[#4B4B4B]">
            A calmer way to manage services, providers, availability, and
            appointments from one booking workflow.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[#0F0F0F]">Explore</h2>
          <div className="mt-4 grid gap-3 text-sm text-[#4B4B4B]">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-[#0F0F0F]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[#0F0F0F]">Account</h2>
          <div className="mt-4 grid gap-3 text-sm text-[#4B4B4B]">
            {authLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-[#0F0F0F]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[#EDEDED]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-4 text-xs text-[#7A7A7A] sm:flex-row sm:items-center sm:justify-between">
          <p>Appointly landing page</p>
          <p>Built for service teams that want a cleaner booking flow.</p>
        </div>
      </div>
    </footer>
  );
}
