export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      colors: {
        void: "#02040A",
        deep: "#060C18",
        surface: "#0A1628",
        card: "#0F1F38",
        rim: "#162840",
        gold: "#F0B429",
        "gold-dim": "#C8941F",
        "gold-glow": "rgba(240,180,41,0.12)",
        teal: "#00D4AA",
        "teal-dim": "#00A882",
        violet: "#7C3AED",
        danger: "#EF4444",
        muted: "#3D5A80",
        text: "#E8F0FE",
        "text-dim": "#7A9CC0",
      },
    },
  },
  plugins: [],
};
