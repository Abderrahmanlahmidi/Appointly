"use client";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCheck,
  Clock3,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Button from "../../ui/Button";

const heroHighlights = [
  {
    title: "Service catalog",
    description: "Organize categories, durations, and pricing in one place.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Live schedule",
    description: "Keep provider availability visible before bookings stack up.",
    icon: CalendarCheck,
  },
  {
    title: "Reliable follow-up",
    description: "Run confirmations and appointment flow with less manual work.",
    icon: CheckCheck,
  },
];

const timeline = [
  { time: "09:00", title: "New client consultation", meta: "30 min · Provider A" },
  { time: "11:30", title: "Premium session", meta: "60 min · Provider B" },
  { time: "15:00", title: "Follow-up review", meta: "20 min · Provider A" },
];

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b border-[#E0E0E0] bg-white">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(250,250,250,0.96)_100%)]" />
      <div className="absolute inset-y-0 left-0 w-[58%] bg-[radial-gradient(circle_at_top_left,rgba(245,245,245,0.95)_0%,rgba(255,255,255,0)_68%)]" />
      <div className="absolute inset-y-0 right-0 w-[44%] bg-[radial-gradient(circle_at_center,rgba(240,240,240,0.75)_0%,rgba(255,255,255,0)_72%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(248,248,248,0.95)_100%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DCDCDC] bg-white px-3 py-1 text-xs font-semibold text-[#4B4B4B]">
            <Sparkles className="h-3.5 w-3.5 text-[#0F0F0F]" />
            Appointment management for modern service teams
          </div>

          <h1 className="mt-5 max-w-2xl font-[var(--font-display)] text-4xl font-semibold tracking-tight text-[#0F0F0F] md:text-5xl lg:text-6xl">
            Replace scheduling chaos with one clear booking workspace.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#4B4B4B] md:text-lg">
            Run services, provider availability, and client appointments from a
            single flow. Appointly helps teams move from scattered messages and
            manual follow-up to a booking experience that feels deliberate.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button href="/register" variant="primary" size="lg">
              Start free
              <ArrowRight size={18} />
            </Button>
            <Button href="/services/catalog" variant="outline" size="lg">
              Explore services
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {heroHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="rounded-2xl border border-[#E0E0E0] bg-white/90 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#4B4B4B]">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-[#E0E0E0] bg-white p-6 shadow-2xl shadow-black/5">
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#4B4B4B]">
              <span>Operations board</span>
              <span>Today</span>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-[#EDEDED] bg-[#FAFAFA] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
                <CalendarCheck className="h-4 w-4" />
                Appointments in motion
              </div>
              <div className="mt-4 grid gap-3">
                {timeline.map((item) => (
                  <div
                    key={item.time + item.title}
                    className="grid grid-cols-[56px_1fr] items-start gap-3 rounded-2xl border border-[#E0E0E0] bg-white p-3"
                  >
                    <div className="rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] px-2 py-2 text-center text-xs font-semibold text-[#0F0F0F]">
                      {item.time}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#0F0F0F]">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs text-[#4B4B4B]">{item.meta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[#EDEDED] bg-[#FAFAFA] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
                  <Clock3 className="h-4 w-4" />
                  Booking cadence
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[#0F0F0F]">
                  18 slots
                </p>
                <p className="mt-2 text-xs leading-5 text-[#4B4B4B]">
                  Available across active providers for the next working day.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-[#EDEDED] bg-[#FAFAFA] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
                  <ShieldCheck className="h-4 w-4" />
                  Team visibility
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-[#0F0F0F]">
                  100%
                </p>
                <p className="mt-2 text-xs leading-5 text-[#4B4B4B]">
                  Services, categories, and appointments visible in one shared
                  workflow.
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -left-6 bottom-8 hidden w-48 rounded-2xl border border-[#E0E0E0] bg-white p-4 text-xs text-[#4B4B4B] shadow-xl lg:block">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0F0F0F]">
              <Users className="h-4 w-4" />
              Client queue
            </div>
            <p className="mt-2 leading-5">
              Confirmations stay on track while providers manage a cleaner day.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
