import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        verse: {
          ink: '#1B1F34',
          charcoal: '#2B2D3A',
          elevated: '#33374A',
          magenta: '#C903D0',
          'magenta-mid': '#A102A6',
          'magenta-deep': '#650268',
          void: '#140015',
          teal: '#3EFED0',
          orange: '#E97609',
          yellow: '#FFDE06',
          slate: '#D4D7E0',
          sage: '#CCF382',
          error: '#E03B3B',
          muted: '#7A7F99',
        },
      },
      fontFamily: {
        display: ['Bricolage Grotesque', 'Manrope', 'sans-serif'],
        body: ['Epilogue', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        xl: '28px',
      },
    },
  },
  plugins: [],
} satisfies Config;
