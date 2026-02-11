"use client";

import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Button from "../../ui/Button";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#E0E0E0] bg-white">
      <div className="absolute inset-0 bg-[url('/hero-billboard.svg')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-white/90" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E0E0E0] px-3 py-1 text-xs font-semibold text-[#4B4B4B]">
            <Sparkles className="h-3.5 w-3.5 text-[#0F0F0F]" />
            Appointly for service teams
          </div>

          <h1 className="mt-5 font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[#0F0F0F] md:text-5xl">
            The Smart Appointment Management Platform.
          </h1>
          <div className="mt-4 space-y-3 text-base text-[#4B4B4B] md:text-lg">
            <p>
              Appointly is a web-based application designed to centralize and
              simplify appointment scheduling across multiple domains and
              services. The platform allows professionals (such as doctors,
              consultants, trainers, freelancers, or any service provider) to
              manage their appointments efficiently, while also offering
              flexibility for users to create and manage custom service
              categories that may not already exist in the system.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button href="/register" variant="primary" size="lg">
              Start free
              <ArrowRight size={18} />
            </Button>
            <Button href="/login" variant="outline" size="lg">
              Sign in
            </Button>
          </div>

          <div id="features" className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E0E0E0] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
                <CalendarCheck className="h-4 w-4" />
                Smart booking
              </div>
              <p className="mt-2 text-sm text-[#4B4B4B]">
                Centralize scheduling across any service category you create.
              </p>
            </div>
            <div className="rounded-xl border border-[#E0E0E0] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
                <CreditCard className="h-4 w-4" />
                Flexible services
              </div>
              <p className="mt-2 text-sm text-[#4B4B4B]">
                Professionals manage appointments while clients book freely.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4B4B4B]">
              <ShieldCheck className="h-4 w-4 text-[#0F0F0F]" />
              Team overview
            </div>
            <div className="mt-4 grid gap-3">
              {[
                { name: "Hannah Pierce", role: "Stylist", time: "11:00 AM" },
                { name: "Marco Hill", role: "Trainer", time: "1:30 PM" },
                { name: "Priya Singh", role: "Consultant", time: "3:00 PM" },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-[#E0E0E0] px-4 py-3 text-sm"
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

          <div
            id="pricing"
            className="rounded-2xl border border-[#E0E0E0] bg-white p-6"
          >
            <div className="text-xs font-semibold text-[#4B4B4B]">
              Platform objective
            </div>
            <p className="mt-3 text-sm text-[#4B4B4B]">
              A domain-agnostic system that empowers any professional to create
              categories, define services, and manage appointments efficiently.
            </p>
          </div>

          <div
            id="support"
            className="rounded-2xl border border-[#E0E0E0] bg-white p-6"
          >
            <div className="text-xs font-semibold text-[#4B4B4B]">
              Built for all domains
            </div>
            <p className="mt-3 text-sm text-[#4B4B4B]">
              Doctors, consultants, trainers, freelancers, and any service
              provider can tailor Appointly to their workflow.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
