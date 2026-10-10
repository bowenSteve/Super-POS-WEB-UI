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
        // Marketing site palette (Landing/Pages/MarketingAuth) - kept
        // separate from the pos-* app palette above, distinct brand.
        'brand-surface': '#f0f8f5',
        'brand-ink': '#14373b',
        'brand-accent': '#ed8674',
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
