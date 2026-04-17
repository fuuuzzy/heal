/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--rgb-surface) / <alpha-value>)',
          dark: 'rgb(var(--rgb-surface-dark) / <alpha-value>)',
          elevated: 'rgb(var(--rgb-surface-elevated) / <alpha-value>)',
          hover: 'rgb(var(--rgb-surface-hover) / <alpha-value>)',
        },
        line: {
          DEFAULT: 'rgb(var(--rgb-line) / <alpha-value>)',
          light: 'rgb(var(--rgb-line-light) / <alpha-value>)',
          faint: 'rgb(var(--rgb-line-faint) / <alpha-value>)',
        },
        gold: {
          DEFAULT: 'rgb(var(--rgb-gold) / <alpha-value>)',
          light: 'rgb(var(--rgb-gold-light) / <alpha-value>)',
          dark: 'rgb(var(--rgb-gold-dark) / <alpha-value>)',
        },
        mate: {
          DEFAULT: 'rgb(var(--rgb-mate) / <alpha-value>)',
          light: 'rgb(var(--rgb-mate-light) / <alpha-value>)',
        },
        txt: {
          primary: 'rgb(var(--rgb-txt-primary) / <alpha-value>)',
          secondary: 'rgb(var(--rgb-txt-secondary) / <alpha-value>)',
          muted: 'rgb(var(--rgb-txt-muted) / <alpha-value>)',
        },
        'on-gold': 'rgb(var(--rgb-on-gold) / <alpha-value>)',
        danger: 'rgb(var(--rgb-danger) / <alpha-value>)',
        success: 'rgb(var(--rgb-success) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Outfit"', 'system-ui', 'sans-serif'],
        serif: ['"LXGW WenKai"', '"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
