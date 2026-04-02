import PageHeader from "../ui/PageHeader";

export default function AdminPlaceholderPage({
  eyebrow = "Admin Module",
  title,
  subtitle,
  stats = [],
  sections = [],
  noteTitle = "Scalable foundation",
  note,
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[#E0E0E0] bg-white p-6">
        <div className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#7A7A7A]">
          {eyebrow}
        </div>
        <PageHeader
          className="mt-3"
          title={title}
          subtitle={subtitle}
          titleClassName="text-3xl tracking-tight"
          subtitleClassName="max-w-3xl text-[#4B4B4B]"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#E0E0E0] bg-white p-5"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A7A7A]">
              {stat.label}
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-[#0F0F0F]">
              {stat.value}
            </div>
            <p className="mt-2 text-sm leading-6 text-[#4B4B4B]">
              {stat.description}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-[#E0E0E0] bg-white p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-[#0F0F0F]">
                {section.title}
              </h2>
              {section.badge ? (
                <span className="rounded-full border border-[#E0E0E0] bg-[#FAFAFA] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#7A7A7A]">
                  {section.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-6 text-[#4B4B4B]">
              {section.description}
            </p>
            {section.items?.length ? (
              <div className="mt-5 grid gap-3">
                {section.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#0F0F0F]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-dashed border-[#E0E0E0] bg-[#FAFAFA] p-6">
        <div className="text-lg font-semibold tracking-tight text-[#0F0F0F]">
          {noteTitle}
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4B4B4B]">
          {note}
        </p>
      </section>
    </div>
  );
}
