import baseConfig from '@anivault/ui/tailwind'

/** @type {import('tailwindcss').Config} */
export default {
  ...baseConfig,
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    ...(baseConfig.theme || {}),
    extend: {
      ...(baseConfig.theme?.extend || {}),
      colors: {
        ...(baseConfig.theme?.extend?.colors || {}),
        background: 'var(--bg-main)',
        card: 'var(--bg-card)',
        foreground: 'var(--text-main)',
        muted: 'var(--bg-card)',
        'muted-foreground': 'var(--text-muted)',
        primary: 'var(--primary)',
        border: 'var(--border)',
      },
    },
  },
}

