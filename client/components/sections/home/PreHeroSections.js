import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarClock,
  CheckCheck,
  CircleDashed,
  Clock3,
  Layers3,
  ScanSearch,
  ShieldCheck,
  Users,
} from "lucide-react";

const operations = [
  {
    title: "Availability stays visible",
    description:
      "Open slots, durations, and service pricing stay aligned before clients ever click book.",
    icon: CalendarClock,
  },
  {
    title: "Categories stay organized",
    description:
      "Teams can group services clearly so clients browse less and commit faster.",
    icon: Layers3,
  },
  {
    title: "Follow-up stays consistent",
    description:
      "Confirmations and reminders stay part of the workflow instead of an afterthought.",
    icon: CheckCheck,
  },
];

const servicePreview = [
  { name: "Consultation", duration: "30 min", price: "$40" },
  { name: "Premium session", duration: "60 min", price: "$85" },
  { name: "Follow-up review", duration: "20 min", price: "$25" },
];

const sectors = [
  "Clinics",
  "Salons",
  "Fitness",
  "Coaching",
  "Consulting",
  "Freelancers",
];

const workflow = [
  {
    title: "Shape the catalog",
    description:
      "Create categories, define services, and keep offer details consistent across the business.",
    icon: ScanSearch,
  },
  {
    title: "Open the schedule",
    description:
      "Publish time windows with clear durations so clients see only what is actually available.",
    icon: Clock3,
  },
  {
    title: "Run the day cleanly",
    description:
      "Keep providers, clients, and appointments connected in one workflow instead of scattered tools.",
    icon: ShieldCheck,
  },
];

export default function PreHeroSections() {
  return (
    <>
      <section
        id="features"
        className="border-b border-[#E0E0E0] bg-[#FAFAFA]"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DCDCDC] bg-white px-3 py-1 text-xs font-semibold text-[#4B4B4B]">
              <CircleDashed className="h-3.5 w-3.5 text-[#0F0F0F]" />
              Before the first booking starts
            </div>
            <h2 className="mt-5 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-[#0F0F0F] md:text-4xl">
              Start the day with structure instead of scheduling noise.
            </h2>
            <p className="mt-4 text-base text-[#4B4B4B] md:text-lg">
              Appointly brings categories, services, providers, availability,
              and appointments into one calm workflow so teams can stay ready
              before the rush begins.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {sectors.map((sector) => (
                <span
                  key={sector}
                  className="rounded-full border border-[#E0E0E0] bg-white px-3 py-1 text-xs font-semibold text-[#4B4B4B]"
                >
                  {sector}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {operations.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="rounded-3xl border border-[#E0E0E0] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-3">
                      <Icon className="h-5 w-5 text-[#0F0F0F]" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#0F0F0F]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#4B4B4B]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[#E0E0E0] bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <article
            id="pricing"
            className="rounded-[2rem] border border-[#E0E0E0] bg-[#FAFAFA] p-6"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
              <BadgeDollarSign className="h-4 w-4" />
              Clear service pricing
            </div>
            <h3 className="mt-4 font-[var(--font-display)] text-2xl font-semibold tracking-tight text-[#0F0F0F]">
              Let clients understand the offer before they reach the form.
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#4B4B4B]">
              Show durations, price points, and appointment types early so
              customers can decide quickly and book with confidence.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {servicePreview.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-[#E0E0E0] bg-white p-4"
                >
                  <div className="text-sm font-semibold text-[#0F0F0F]">
                    {item.name}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#4B4B4B]">
                    <span>{item.duration}</span>
                    <span>{item.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-6">
            <article
              id="support"
              className="rounded-[2rem] border border-[#E0E0E0] bg-[#F7F7F7] p-6"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
                <BriefcaseBusiness className="h-4 w-4" />
                Built for many service models
              </div>
              <p className="mt-4 text-sm leading-6 text-[#4B4B4B]">
                Whether you run a clinic, salon, coaching practice, or solo
                consulting business, the same workflow keeps bookings easier to
                manage and easier to trust.
              </p>
            </article>

            <article className="rounded-[2rem] border border-[#E0E0E0] bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0F0F0F]">
                <Users className="h-4 w-4" />
                Workflow at a glance
              </div>
              <div className="mt-5 grid gap-4">
                {workflow.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="grid gap-3 rounded-2xl border border-[#EDEDED] bg-[#FAFAFA] p-4 md:grid-cols-[auto_1fr]"
                    >
                      <div className="h-fit rounded-2xl border border-[#E0E0E0] bg-white p-2.5">
                        <Icon className="h-4 w-4 text-[#0F0F0F]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#0F0F0F]">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-[#4B4B4B]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
