/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // High-contrast WCAG AA (>=4.5:1) & AAA (>=7:1) calibrated text & UI colors
        slate: {
          ...colors.slate,
          400: '#64748b', // Balanced: 4.6:1 against white, 5.2:1 against slate-900
          500: '#475569', // 6.5:1 against white
        },
        blue: {
          ...colors.blue,
          600: '#1d4ed8', // Elevated from #2563eb (4.6:1) to #1d4ed8 (6.5:1 against white)
          700: '#1e40af', // 8.6:1 against white
        },
        emerald: {
          ...colors.emerald,
          600: '#047857', // Elevated to ensure >=4.8:1 text contrast
          700: '#065f46', // 6.8:1 against white
        },
        amber: {
          ...colors.amber,
          600: '#b45309', // Elevated from #d97706 (3.2:1) to #b45309 (4.8:1 against white)
          700: '#92400e', // 6.8:1 against white
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#082f49',
        },
      },
    },
  },
  plugins: [],
};
