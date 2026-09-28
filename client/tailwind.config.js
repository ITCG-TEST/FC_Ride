/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Baloo 2", "sans-serif"],
        body: ["Poppins", "sans-serif"],
      },
      colors: {
        primary: "#0D9488",
        primaryDark: "#0B7A70",
        surface: "#EEF2F6",
        ink: "#1E293B",
        night: "#0F172A",
        muted: "#64748B",
      },
      boxShadow: {
        soft: "0 16px 40px -12px rgba(13,148,136,0.28)",
        softSm: "0 6px 18px -6px rgba(13,148,136,0.25)",
        card: "0 2px 10px -2px rgba(30,41,59,0.08)",
      },
    },
  },
  plugins: [],
};
