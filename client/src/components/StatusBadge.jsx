const STYLES = {
  pending: "bg-amber-100 text-amber-600",
  approved: "bg-emerald-100 text-emerald-600",
  rejected: "bg-red-100 text-red-500",
};

const LABELS = {
  pending: "⏳ Pending",
  approved: "✅ Approved",
  rejected: "❌ Rejected",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`pill ${STYLES[status] || "bg-surface text-muted"}`}>
      {LABELS[status] || status}
    </span>
  );
}
