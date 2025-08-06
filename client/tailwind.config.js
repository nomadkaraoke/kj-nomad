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
        'brand-pink': 'var(--color-brand-pink)',
        'brand-blue': 'var(--color-brand-blue)',
        'brand-yellow': 'var(--color-brand-yellow)',
        'bg-light': 'var(--color-bg-light)',
        'card-light': 'var(--color-card-light)',
        'text-primary-light': 'var(--color-text-primary-light)',
        'text-secondary-light': 'var(--color-text-secondary-light)',
        'border-light': 'var(--color-border-light)',
        'bg-dark': 'var(--color-bg-dark)',
        'card-dark': 'var(--color-card-dark)',
        'text-primary-dark': 'var(--color-text-primary-dark)',
        'text-secondary-dark': 'var(--color-text-secondary-dark)',
        'border-dark': 'var(--color-border-dark)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Righteous', 'cursive'],
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-accent': 'var(--gradient-accent)',
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        'glow-lg': 'var(--shadow-glow-lg)',
      }
    },
  },
  plugins: [],
}
