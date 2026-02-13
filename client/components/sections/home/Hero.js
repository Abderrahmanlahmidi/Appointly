"use client";
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Button from "../../ui/Button";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#E0E0E0] bg-[#F7F6F2]">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/hero-billboard.svg')] bg-cover bg-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-white/70 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCDCDC] bg-white/80 px-3 py-1 text-xs font-semibold text-[#4B4B4B] backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#0F0F0F]" />
            Built for service teams
          </div>

          <h1 className="mt-5 font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[#0F0F0F] md:text-5xl">
            Make booking feel effortless.
          </h1>
          <p className="mt-4 text-base text-[#4B4B4B] md:text-lg">
            A modern appointment workspace for professionals who want less
            admin and more time with clients. Build categories, define services,
            and keep every booking in one place.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button href="/register" variant="primary" size="lg">
              Start free
              <ArrowRight size={18} />
            </Button>
            <Button href="/login" variant="outline" size="lg">
              Sign in
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-xs font-semibold text-[#4B4B4B]">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E0E0E0] bg-white/70 px-3 py-1">
              <CalendarCheck className="h-3.5 w-3.5 text-[#0F0F0F]" />
              Live availability
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E0E0E0] bg-white/70 px-3 py-1">
              <CreditCard className="h-3.5 w-3.5 text-[#0F0F0F]" />
              Secure payments
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E0E0E0] bg-white/70 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-[#0F0F0F]" />
              Team-ready controls
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl border border-[#E0E0E0] bg-white/90 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between text-xs font-semibold text-[#4B4B4B]">
              <span>Today, Feb 12</span>
              <span>4 appointments</span>
            </div>
            <div className="mt-4 grid gap-3">
              {[
                { name: "Hannah Pierce", role: "Stylist", time: "11:00 AM" },
                { name: "Marco Hill", role: "Trainer", time: "1:30 PM" },
                { name: "Priya Singh", role: "Consultant", time: "3:00 PM" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-[#E0E0E0] bg-white px-4 py-3 text-sm"
                >
                  <div>
                    <div className="font-semibold text-[#0F0F0F]">
                      {item.name}
                    </div>
                    <div className="text-xs text-[#4B4B4B]">{item.role}</div>
                  </div>
                  <div className="text-xs font-semibold text-[#0F0F0F]">
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -left-6 bottom-6 hidden w-44 rounded-2xl border border-[#E0E0E0] bg-white p-4 text-xs text-[#4B4B4B] shadow-xl lg:block">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0F0F0F]">
              <Users className="h-4 w-4" />
              Client queue
            </div>
            <p className="mt-2">12 confirmations sent today.</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          <div
            id="features"
            className="rounded-2xl border border-[#E0E0E0] bg-white/80 p-5 shadow-sm backdrop-blur"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
              <CalendarCheck className="h-4 w-4" />
              Smart booking
            </div>
            <p className="mt-2 text-sm text-[#4B4B4B]">
              Centralize scheduling across any service category you create.
            </p>
          </div>

          <div
            id="pricing"
            className="rounded-2xl border border-[#E0E0E0] bg-white/80 p-5 shadow-sm backdrop-blur"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
              <CreditCard className="h-4 w-4" />
              Flexible services
            </div>
            <p className="mt-2 text-sm text-[#4B4B4B]">
              Professionals manage appointments while clients book freely.
            </p>
          </div>

          <div
            id="support"
            className="rounded-2xl border border-[#E0E0E0] bg-white/80 p-5 shadow-sm backdrop-blur"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
              <ShieldCheck className="h-4 w-4" />
              Built for all domains
            </div>
            <p className="mt-2 text-sm text-[#4B4B4B]">
              Doctors, consultants, trainers, freelancers, and any service
              provider can tailor Appointly to their workflow.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
