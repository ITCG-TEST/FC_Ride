export default function Hero({ eyebrow, title, subtitle, stats = [] }) {
  return (
    <div className="border-b border-black/5 bg-white">
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-8 text-center sm:pt-10">
        {eyebrow && (
          <span className="pill mb-3 inline-block bg-primary/10 text-primary">{eyebrow}</span>
        )}
        <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
        <span className="mx-auto mt-2 block h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primaryDark" />
        {subtitle && <p className="mx-auto mt-3 max-w-md text-muted">{subtitle}</p>}

        {stats.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {stats.map((s) => (
              <span
                key={s.label}
                className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-2 text-sm font-bold text-ink"
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
