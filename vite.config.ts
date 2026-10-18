import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import { generateMetaHtml, pages } from './src/seo.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'vite-plugin-seo-prerender',
      closeBundle() {
        const outDir = path.resolve(import.meta.dirname, 'dist')
        const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')

        pages.forEach((page) => {
          const metaTags = generateMetaHtml(page)
          const html = template.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, metaTags)

          const fileName = page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`
          const filePath = path.join(outDir, fileName)

          fs.writeFileSync(filePath, html)
        })

        console.log('✅ SEO meta tags successfully baked into HTML!')
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    }
  },
  server: {
    host: "127.0.0.1"
  }
})
