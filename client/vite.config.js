import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const rootDir = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')

  return {
    plugins: [react()],
    server: env.VITE_SUPABASE_URL
      ? {
          proxy: {
            '/__supabase_proxy__': {
              target: env.VITE_SUPABASE_URL,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/__supabase_proxy__/, ''),
            },
          },
        }
      : undefined,
  }
})
