import { haversineKm } from "./geo.js";

// A real cyclist on this event rarely sustains much past ~30 km/h. A single
// fast GPS segment isn't proof of anything (jitter, a downhill burst) — what
// matters is a *sustained* stretch well above normal riding speed, the
// signature of covering ground in a vehicle rather than on the bike.
const THRESHOLD_KMH = 32;
const MIN_SUSTAINED_SECONDS = 180; // 3 minutes of continuous elevated speed
const MIN_SEGMENT_SECONDS = 5; // ignore noisy back-to-back GPS fixes

// `path` is an array of [lat, lng, epochMs] points, in order.
export function detectSuspiciousSpeed(path) {
  const empty = { flagged: false, reason: null, maxSustainedKmh: 0, maxSustainedSeconds: 0 };
  if (!Array.isArray(path) || path.length < 2) return empty;

  let runStartIdx = null;
  let best = { kmh: 0, seconds: 0 };

  for (let i = 1; i < path.length; i++) {
    const [lat1, lng1, t1] = path[i - 1];
    const [lat2, lng2, t2] = path[i];
    if (typeof t1 !== "number" || typeof t2 !== "number") continue;

    const dtSeconds = (t2 - t1) / 1000;
    if (dtSeconds < MIN_SEGMENT_SECONDS) continue; // too noisy to trust, skip without breaking the run

    const distKm = haversineKm([lat1, lng1], [lat2, lng2]);
    const speedKmh = distKm / (dtSeconds / 3600);

    if (speedKmh >= THRESHOLD_KMH) {
      if (runStartIdx === null) runStartIdx = i - 1;
      const runSeconds = (t2 - path[runStartIdx][2]) / 1000;
      if (runSeconds > best.seconds) best = { kmh: speedKmh, seconds: runSeconds };
    } else {
      runStartIdx = null;
    }
  }

  const flagged = best.seconds >= MIN_SUSTAINED_SECONDS;
  return {
    flagged,
    reason: flagged
      ? `Sustained ~${Math.round(best.kmh)} km/h for ${Math.round(best.seconds / 60)} min — well above normal cycling speed.`
      : null,
    maxSustainedKmh: Math.round(best.kmh),
    maxSustainedSeconds: Math.round(best.seconds),
  };
}
