export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// `fromDate`/`toDate` are plain "YYYY-MM-DD" strings from a <input type="date">,
// or empty/undefined for an open-ended side of the range.
export function isWithinDateRange(isoString, fromDate, toDate) {
  const d = new Date(isoString);
  if (fromDate && d < new Date(`${fromDate}T00:00:00`)) return false;
  if (toDate && d > new Date(`${toDate}T23:59:59.999`)) return false;
  return true;
}

export function formatRelativeTime(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}
