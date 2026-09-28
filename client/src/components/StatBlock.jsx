export default function StatBlock({ label, value, unit }) {
  return (
    <div className="text-center">
      <p className="font-display text-2xl font-extrabold text-ink">
        {value}
        {unit && <span className="ml-1 text-sm font-bold text-muted">{unit}</span>}
      </p>
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
