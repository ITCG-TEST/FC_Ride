export default function DateRangeFilter({ from, to, onFromChange, onToChange, onClear }) {
  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      <label className="min-w-[140px] flex-1">
        <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wide text-muted">
          From
        </span>
        <input
          type="date"
          className="input"
          value={from}
          max={to || undefined}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </label>
      <label className="min-w-[140px] flex-1">
        <span className="mb-1 block font-display text-xs font-bold uppercase tracking-wide text-muted">
          To
        </span>
        <input
          type="date"
          className="input"
          value={to}
          min={from || undefined}
          onChange={(e) => onToChange(e.target.value)}
        />
      </label>
      {(from || to) && (
        <button onClick={onClear} className="pill bg-surface px-3 py-2.5 text-ink">
          ✕ Clear
        </button>
      )}
    </div>
  );
}
