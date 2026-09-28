import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getAdminToken, setAdminToken } from "../api.js";

export default function AdminFlaggedRides() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAdminToken()) {
      navigate("/admin");
      return;
    }
    api
      .adminGetFlaggedRides()
      .then(setRides)
      .catch((err) => {
        if (err.message.includes("Invalid or expired") || err.message.includes("Missing admin")) {
          setAdminToken(null);
          navigate("/admin");
          return;
        }
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Flagged Rides 🚩</h1>
          <p className="text-sm text-muted">
            Rides with a sustained stretch well above normal cycling speed — worth a second look
            before trusting the distance.
          </p>
        </div>
        <Link to="/admin/dashboard" className="btn-ghost px-4 py-2 text-sm">
          ← Dashboard
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-2xl bg-red-100 p-3 text-sm font-bold text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="text-center text-muted">Loading…</p>
      ) : rides.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-2 font-display font-bold text-ink">Nothing flagged.</p>
          <p className="text-muted">Every saved ride so far looks like a bicycle.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((r) => (
            <Link
              key={r.rideId}
              to={`/admin/riders/${r.riderId}`}
              className="card block p-4 ring-2 ring-red-400 transition hover:bg-red-50/50"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base font-bold text-ink">
                    {r.riderName} {r.bibNumber ? <span className="text-muted">#{r.bibNumber}</span> : null}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(r.startedAt).toLocaleString(undefined, {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="text-right">
                  <span className="block font-display text-sm font-extrabold text-red-500">
                    {r.distanceKm.toFixed(2)} km
                  </span>
                  <span className="block text-xs text-muted">{r.avgSpeedKmh.toFixed(1)} km/h avg</span>
                </span>
              </div>
              <p className="mt-2 rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-600">
                🚩 {r.flagReason}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
