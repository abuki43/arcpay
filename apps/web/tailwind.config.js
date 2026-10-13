/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/sdk/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        raised: "var(--raised)",
        inset: "var(--inset)",
        line: "var(--line)",
        'line-strong': "var(--line-strong)",
        ink: "var(--ink)",
        'ink-2': "var(--ink-2)",
        'ink-3': "var(--ink-3)",
        accent: {
          DEFAULT: "var(--accent)",
          2: "var(--accent-2)",
        },
        danger: "var(--danger)",
        border: "var(--line)",
        input: "var(--line)",
        ring: "var(--accent)",
        background: "var(--canvas)",
        foreground: "var(--ink)",
        primary: {
          DEFAULT: "var(--accent)",
          foreground: "#0B0B0A",
        },
        secondary: {
          DEFAULT: "var(--raised)",
          foreground: "var(--ink)",
        },
        muted: {
          DEFAULT: "var(--inset)",
          foreground: "var(--ink-3)",
        },
        'muted-foreground': "var(--ink-3)",
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--ink)",
        },
        popover: {
          DEFAULT: "var(--surface)",
          foreground: "var(--ink)",
        },
        destructive: {
          DEFAULT: "var(--danger)",
          foreground: "#FFFFFF",
        },
      },
      borderRadius: {
        chip: "var(--radius-chip)",
        ctl: "var(--radius-ctl)",
        pill: "var(--radius-pill)",
        lg: "var(--radius-ctl)",
        md: "var(--radius-chip)",
        sm: "4px",
      },
      fontSize: {
        "nano":  ["10px",  { lineHeight: "14px", letterSpacing: "0.04em" }],
        "tiny":  ["11px",  { lineHeight: "15px", letterSpacing: "0.02em" }],
        "micro": ["12px",  { lineHeight: "16px", letterSpacing: "0" }],
        "body":  ["13px",  { lineHeight: "20px" }],
        "lead":  ["15px",  { lineHeight: "24px" }],
        "title": ["16px",  { lineHeight: "22px" }],
        "h6":    ["18px",  { lineHeight: "24px" }],
        "h5":    ["20px",  { lineHeight: "26px" }],
        "h4":    ["24px",  { lineHeight: "30px", letterSpacing: "-0.01em" }],
        "h3":    ["32px",  { lineHeight: "38px", letterSpacing: "-0.015em" }],
        "h2":    ["44px",  { lineHeight: "48px", letterSpacing: "-0.02em" }],
        "h1":    ["56px",  { lineHeight: "60px", letterSpacing: "-0.022em" }],
        "display":   ["72px",  { lineHeight: "72px", letterSpacing: "-0.025em" }],
        "display-xl":["96px",  { lineHeight: "96px", letterSpacing: "-0.03em" }],
      },
      letterSpacing: {
        "tightish": "-0.012em",
        "wideish": "0.025em",
        "mono-cap": "0.18em",
      },
      transitionTimingFunction: {
        "out-quint": "cubic-bezier(0.23, 1, 0.32, 1)",
      },
    },
  },
  plugins: [],
};
