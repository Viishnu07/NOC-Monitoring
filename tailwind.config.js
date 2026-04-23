/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',   /* Slate-900 — dark page background */
        card:       '#1e293b',   /* Slate-800 — card surfaces */
        border:     '#334155',   /* Slate-700 — subtle borders */
        success:    '#10b981',   /* Emerald-500 */
        danger:     '#ef4444',   /* Red-500 */
        accent:     '#3b82f6',   /* Blue-500 */
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow':      'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'subtle-bounce':   'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
