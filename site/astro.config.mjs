import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'
import react from '@astrojs/react'

// Um único projeto:
//  - páginas públicas em SSR (SEO + preview de link)
//  - painel React montado em /admin como ilha client-side (client:only)
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [react()]
})
