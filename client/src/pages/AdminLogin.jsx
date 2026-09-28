import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAdminToken } from "../api.js";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await api.adminLogin(username, password);
      setAdminToken(token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primaryDark text-2xl shadow-softSm">
            🔐
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">Admin Login</h1>
        </div>
        <input
          className="input"
          placeholder="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p className="rounded-2xl bg-red-100 p-2 text-sm font-bold text-red-600">{error}</p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
