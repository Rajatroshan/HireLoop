import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gmail: {
          blue: "#1a73e8",
          red: "#d93025",
          hover: "#174ea6",
          bg: "#f6f8fc",
          sidebar: "#eaf1fb",
          border: "#dadce0",
          text: "#202124",
          "text-secondary": "#5f6368",
        },
      },
      boxShadow: {
        compose:
          "0 8px 10px 1px rgba(0,0,0,.14), 0 3px 14px 2px rgba(0,0,0,.12), 0 5px 5px -3px rgba(0,0,0,.2)",
      },
    },
  },
  plugins: [],
};

export default config;
