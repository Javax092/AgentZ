import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#f3f7fb",
        mist: "#94a3b8",
        canvas: "#0b0f14",
        line: "#1c2533",
        brand: "#5b8cff",
        branddeep: "#3452ff",
        accent: "#7c5cff",
        coral: "#ff8a3d",
        sand: "#111926",
        slatecard: "#111926",
        success: "#1ec98b",
        danger: "#ff6b6b"
      },
      fontFamily: {
        sans: ["'Manrope'", "sans-serif"],
        display: ["'Space Grotesk'", "sans-serif"]
      },
      boxShadow: {
        panel: "0 30px 80px rgba(2, 6, 23, 0.45)",
        soft: "0 18px 40px rgba(2, 6, 23, 0.22)"
      },
      backgroundImage: {
        "app-glow":
          "radial-gradient(circle at top left, rgba(124, 92, 255, 0.22), transparent 26%), radial-gradient(circle at top right, rgba(91, 140, 255, 0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(30, 201, 139, 0.16), transparent 20%), linear-gradient(180deg, #08111f 0%, #0b0f14 100%)"
      }
    }
  },
  plugins: []
} satisfies Config;
