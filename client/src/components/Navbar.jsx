import { useState } from "react";
import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Join", icon: "📝" },
  { to: "/board", label: "Board", icon: "🏁" },
  { to: "/rides", label: "My Rides", icon: "📍" },
  { to: "/admin", label: "Admin", icon: "🔐" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-20 bg-surface/80 px-4 pb-2 pt-4 backdrop-blur">
      <div className="mx-auto max-w-3xl">
        <div className="card flex items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-black shadow-softSm">
              <img src="/logo-icon.png" alt="FC RIDE SQUAD" className="h-full w-full object-cover" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-base font-extrabold text-ink">
                FC RIDE SQUAD
              </span>
              <span className="flex items-center gap-1 text-xs text-muted">
                <span>📍</span> 450km Group Ride
              </span>
            </span>
          </NavLink>

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-surface text-ink transition active:scale-95"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>

        {open && (
          <div className="card mt-2 flex flex-col gap-1 p-2">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 font-display font-bold transition ${
                    isActive ? "bg-primary text-white" : "text-ink hover:bg-surface"
                  }`
                }
              >
                <span>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
