import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import Hero from "../components/Hero.jsx";

export default function FindMyLink() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFound(null);
    setLoading(true);
    try {
      const result = await api.lookupRider(mobileNumber);
      setFound(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Hero
        eyebrow="MY RIDES"
        title="Find Your Tracker 🔎"
        subtitle="Lost your personal ride-tracking link? Enter the mobile number you registered with."
      />

      <div className="mx-auto max-w-sm px-4 py-6">
        <form onSubmit={handleSubmit} className="card space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block font-display text-sm font-bold text-ink">
              Mobile number
            </span>
            <input
              className="input"
              required
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="9876543210"
            />
          </label>

          {error && (
            <p className="rounded-2xl bg-red-100 p-3 text-sm font-bold text-red-600">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Searching…" : "Find my tracker"}
          </button>
        </form>

        {found && (
          <div className="card mt-4 p-5 text-center">
            <p className="text-3xl">🎉</p>
            <p className="mt-1 font-display font-bold text-ink">Found it, {found.name}!</p>
            <Link to={`/rides/${found.id}`} className="btn-primary mt-4 block">
              Continue to my tracker →
            </Link>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-muted">
          Registered but no rides showing? Make sure you're entering the same number you signed
          up with.
        </p>
      </div>
    </div>
  );
}
