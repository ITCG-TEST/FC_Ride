export default function Hero({ eyebrow, title, subtitle, stats = [] }) {
  return (
    <div className="relative overflow-hidden bg-night">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-primaryDark/40 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 pb-8 pt-8 text-center sm:pt-10">
        {eyebrow && (
          <span className="pill mb-3 inline-block bg-white/10 text-white/80">{eyebrow}</span>
        )}
        <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
        <span className="mx-auto mt-2 block h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primaryDark" />
        {subtitle && <p className="mx-auto mt-3 max-w-md text-white/70">{subtitle}</p>}

        {stats.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {stats.map((s) => (
              <span
                key={s.label}
                className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-white"
              >
                <span>{s.icon}</span>
                {s.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
