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
        border: "hsl(var(--border, 40 14% 85%))",
        input: "hsl(var(--input, 40 14% 85%))",
        ring: "hsl(var(--ring, 162 72% 30%))",
        background: "hsl(var(--background, 40 22% 96%))",
        foreground: "hsl(var(--foreground, 220 13% 10%))",
        primary: {
          DEFAULT: "hsl(var(--primary, 161 72% 26%))",
          foreground: "hsl(var(--primary-foreground, 0 0% 100%))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 40 16% 90%))",
          foreground: "hsl(var(--secondary-foreground, 220 13% 12%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 40 16% 93%))",
          foreground: "hsl(var(--muted-foreground, 220 9% 40%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 158 45% 93%))",
          foreground: "hsl(var(--accent-foreground, 162 60% 22%))",
        },
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 100%))",
          foreground: "hsl(var(--card-foreground, 220 13% 10%))",
        },
        arc: {
          500: '#059669',
          600: '#047857',
          blue: '#2775CA',
          dark: '#0B0F17',
          card: '#131B2A',
        }
      },
      borderRadius: {
        lg: "var(--radius, 0.75rem)",
        md: "calc(var(--radius, 0.75rem) - 2px)",
        sm: "calc(var(--radius, 0.75rem) - 4px)",
      },
    },
  },
  plugins: [],
};
