import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0c1f3f",
        ink: "#07111F",
        electric: "#2F8CFF",
        cyan: "#47D7FF",
        mist: "#D8E3F0"
      },
      boxShadow: {
        glow: "0 0 32px rgba(47,140,255,0.28)",
        panel: "0 24px 70px rgba(0,0,0,0.32)"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
