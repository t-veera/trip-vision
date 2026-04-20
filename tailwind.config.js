/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          900: '#0B0907',
          800: '#0E0B08',
          700: '#141110',
          600: '#1C1816',
          500: '#26211E',
          400: '#3A332E',
        },
        ink: {
          DEFAULT: '#F4EFE6',
          muted: '#B8AFA1',
          dim: '#726A5E',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
}
