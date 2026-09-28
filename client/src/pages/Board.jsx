import { useEffect, useState } from "react";
import { api } from "../api.js";
import Hero from "../components/Hero.jsx";
import Leaderboard from "../components/Leaderboard.jsx";

export default function Board() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api
      .getBoard()
      .then((data) => alive && setRiders(data))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => (alive = false);
  }, []);

  const totalSquadKm = riders.reduce((sum, r) => sum + (r.totalKm || 0), 0);

  return (
    <div>
      <Hero
        eyebrow="RIDER BOARD"
        title="The Squad 🔥"
        subtitle="Ranked by practice distance — every rider approved for the 450km ride."
        stats={[
          { icon: "🚴", label: `${riders.length} Confirmed` },
          { icon: "🔥", label: `${totalSquadKm.toFixed(0)} Squad KM` },
        ]}
      />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {loading && <p className="text-center text-muted">Loading riders…</p>}
        {error && <p className="text-center font-bold text-red-500">{error}</p>}

        {!loading && !error && riders.length === 0 && (
          <div className="card p-8 text-center">
            <p className="text-4xl">🚴</p>
            <p className="mt-2 font-display font-bold text-ink">No riders approved yet.</p>
            <p className="text-muted">Be the first — register and wait for admin approval!</p>
          </div>
        )}

        {riders.length > 0 && <Leaderboard riders={riders} />}
      </div>
    </div>
  );
}
