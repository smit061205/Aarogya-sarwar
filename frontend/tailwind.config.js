/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "outline": "#717783",
        "surface-container-highest": "#e0e2ea",
        "on-secondary": "#ffffff",
        "on-tertiary-fixed-variant": "#733600",
        "tertiary-fixed-dim": "#ffb688",
        "on-secondary-fixed-variant": "#005312",
        "secondary-fixed": "#9df898",
        "secondary": "#106d20",
        "tertiary-container": "#ba5b00",
        "on-error-container": "#93000a",
        "tertiary-fixed": "#ffdbc7",
        "on-tertiary-fixed": "#311300",
        "on-tertiary": "#ffffff",
        "surface": "#f9f9ff",
        "surface-variant": "#e0e2ea",
        "on-secondary-fixed": "#002204",
        "surface-bright": "#f9f9ff",
        "inverse-surface": "#2d3037",
        "on-tertiary-container": "#fffeff",
        "surface-container-lowest": "#ffffff",
        "on-secondary-container": "#1a7425",
        "secondary-fixed-dim": "#82db7e",
        "on-primary-container": "#fffdff",
        "primary-container": "#1976d2",
        "outline-variant": "#c1c6d4",
        "on-primary-fixed": "#001c3a",
        "secondary-container": "#9df898",
        "error": "#ba1a1a",
        "primary": "#005dac",
        "on-surface-variant": "#414752",
        "tertiary": "#944700",
        "error-container": "#ffdad6",
        "on-surface": "#181c21",
        "primary-fixed-dim": "#a5c8ff",
        "inverse-primary": "#a5c8ff",
        "surface-container-high": "#e6e8f0",
        "on-primary-fixed-variant": "#004786",
        "on-background": "#181c21",
        "background": "#f9f9ff",
        "on-error": "#ffffff",
        "primary-fixed": "#d4e3ff",
        "on-primary": "#ffffff",
        "surface-container-low": "#f2f3fc",
        "inverse-on-surface": "#eff0f9",
        "surface-tint": "#005faf",
        "surface-dim": "#d8dae2",
        "surface-container": "#ecedf6"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "container-max": "1280px",
        "stack-sm": "12px",
        "gutter": "24px",
        "margin-mobile": "16px",
        "margin-desktop": "40px",
        "unit": "8px",
        "stack-md": "24px",
        "stack-lg": "48px"
      },
      fontFamily: {
        "display": ["Public Sans", "sans-serif"],
        "label-bold": ["Public Sans", "sans-serif"],
        "h1": ["Public Sans", "sans-serif"],
        "h2": ["Public Sans", "sans-serif"],
        "body-md": ["Public Sans", "sans-serif"],
        "button": ["Public Sans", "sans-serif"],
        "body-lg": ["Public Sans", "sans-serif"]
      },
      fontSize: {
        "display": ["40px", { "lineHeight": "1.2", "fontWeight": "700" }],
        "label-bold": ["16px", { "lineHeight": "1.2", "letterSpacing": "0.02em", "fontWeight": "700" }],
        "h1": ["32px", { "lineHeight": "1.3", "fontWeight": "700" }],
        "h2": ["24px", { "lineHeight": "1.4", "fontWeight": "600" }],
        "body-md": ["18px", { "lineHeight": "1.5", "fontWeight": "400" }],
        "button": ["18px", { "lineHeight": "1", "fontWeight": "600" }],
        "body-lg": ["20px", { "lineHeight": "1.6", "fontWeight": "400" }]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
