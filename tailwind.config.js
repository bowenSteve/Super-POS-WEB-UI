/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pos-bg': '#E7ECF1',
        'pos-text': '#211A20',
        'pos-card': '#FFFFFF',
        'pos-primary': '#211A20',
        'pos-hover': '#E7ECF1',
        'pos-border': '#E0E0E0',
        'pos-success': '#10B981',
        'pos-warning': '#F59E0B',
        'pos-error': '#EF4444',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
