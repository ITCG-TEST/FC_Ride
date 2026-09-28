import { useState } from "react";

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

// Tailwind needs literal class strings to detect at build time, so sizes are
// mapped rather than built dynamically (e.g. `h-${size}` would not compile).
const SIZES = {
  10: "h-10 w-10",
  12: "h-12 w-12",
  14: "h-14 w-14",
  24: "h-24 w-24",
};

export default function Avatar({ src, name, size = 12, rounded = "rounded-2xl" }) {
  const [failed, setFailed] = useState(false);
  const dim = SIZES[size] || SIZES[12];

  if (failed || !src) {
    return (
      <div
        className={`flex ${dim} flex-shrink-0 items-center justify-center ${rounded} bg-gradient-to-br from-primary to-primaryDark font-display font-bold text-white`}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className={`${dim} flex-shrink-0 ${rounded} object-cover`}
    />
  );
}
