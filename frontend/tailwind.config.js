/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neo: {
          bgLight: "#F4F4F0",
          surfaceLight: "#FFFFFF",
          borderLight: "#121212",
          shadowLight: "#121212",

          bgDark: "#0D0D0D",
          surfaceDark: "#161616",
          borderDark: "#3F3F46",
          borderDarkActive: "#EAEAEA",
          shadowDark: "#27272A",
        },
      },
      boxShadow: {
        'neo': '4px 4px 0px var(--neo-shadow)',
        'neo-sm': '2px 2px 0px var(--neo-shadow)',
        'neo-lg': '6px 6px 0px var(--neo-shadow)',
        'neo-xl': '8px 8px 0px var(--neo-shadow)',
        'neo-hover': '6px 6px 0px var(--neo-shadow)',
        'neo-pressed': '0px 0px 0px transparent',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
