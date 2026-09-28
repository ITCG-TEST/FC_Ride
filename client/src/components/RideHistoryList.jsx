import { useState } from "react";
import { api } from "../api.js";
import RideMap from "./RideMap.jsx";
import StatBlock from "./StatBlock.jsx";
import { formatDuration } from "../lib/rideMath.js";

function RideRow({ ride }) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && !path) {
      setLoading(true);
      try {
        const detail = await api.getRide(ride.id);
        setPath(detail.path);
      } catch {
        // silently ignore — row still shows stats without the map
      } finally {
        setLoading(false);
      }
    }
    setOpen((o) => !o);
  }

  return (
    <div className={`card overflow-hidden ${ride.flagged ? "ring-2 ring-red-400" : ""}`}>
      <button onClick={toggle} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div>
          <p className="flex items-center gap-1.5 font-display text-sm font-bold text-ink">
            {ride.flagged && <span title="Flagged for review">🚩</span>}
            {new Date(ride.startedAt).toLocaleDateString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="text-xs text-muted">
            {new Date(ride.startedAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            –{" "}
            {new Date(ride.endedAt).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-right">
            <span className={`block font-display text-sm font-extrabold ${ride.flagged ? "text-red-500" : "text-primary"}`}>
              {ride.distanceKm.toFixed(2)} km
            </span>
            <span className="block text-xs text-muted">{ride.avgSpeedKmh.toFixed(1)} km/h avg</span>
          </span>
          <span className="text-muted">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-surface p-4">
          {ride.flagged && (
            <p className="mb-3 rounded-2xl bg-red-100 p-3 text-sm font-bold text-red-600">
              🚩 {ride.flagReason}
            </p>
          )}
          {loading && <p className="text-center text-sm text-muted">Loading route…</p>}
          {!loading && path && <RideMap points={path} height={220} />}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatBlock label="Distance" value={ride.distanceKm.toFixed(2)} unit="km" />
            <StatBlock label="Avg Speed" value={ride.avgSpeedKmh.toFixed(1)} unit="km/h" />
            <StatBlock label="Duration" value={formatDuration(ride.durationSeconds)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function RideHistoryList({ rides, emptyMessage = "No practice rides logged yet." }) {
  if (rides.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-muted">{emptyMessage}</div>
    );
  }

  return (
    <div className="space-y-3">
      {rides.map((ride) => (
        <RideRow key={ride.id} ride={ride} />
      ))}
    </div>
  );
}
