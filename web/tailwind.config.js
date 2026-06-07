/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["'Cormorant Garamond'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        tomb: {
          50: "#f6f6f5",
          100: "#e6e6e3",
          200: "#cccac4",
          300: "#a8a59c",
          400: "#7e7b71",
          500: "#5d5b53",
          600: "#46443e",
          700: "#34332e",
          800: "#23221f",
          900: "#161614",
        },
        moss: {
          400: "#7a8e6a",
          500: "#5f7252",
          600: "#465840",
        },
      },
    },
  },
  plugins: [],
};
