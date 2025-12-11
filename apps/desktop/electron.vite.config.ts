import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        // 1. FORCE these packages to be bundled into main.js
        //    This prevents "Cannot find module" errors at runtime.
        exclude: [
          'electron-store',
          'electron-log',
          'electron-updater',
          'discord-rpc',
          'ajv',
          'conf',
          'semver'
        ]
      })
    ],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src/renderer'),
      },
    },
    plugins: [react()],
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ],
      },
    },
  },
})

