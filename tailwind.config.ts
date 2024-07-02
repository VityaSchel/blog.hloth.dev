import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      backgroundColor: {
        alt: 'var(--bg-alt)',
      },
      fontFamily: {
        'display': ['hloth blog display', 'hloth blog text', 'sans-serif']
      }
    },
  },
  plugins: [],
}
export default config
