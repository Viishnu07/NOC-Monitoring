/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',   /* Pure/deep dark for background */
        card: '#171717',         /* Slightly elevated slate */
        border: '#262626',       /* Soft dark borders */
        success: '#34d399',      /* Soft mint green */
        danger: '#fb7185',       /* Soft rose/coral */
        accent: '#38bdf8',       /* Soft sky blue */
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'subtle-bounce': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
