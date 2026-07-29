import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/*
  Nombres de archivo predecibles para el bundle de entrada.

  Por que: las funciones de Vercel que renderizan las paginas publicas
  (api/empleo.js y api/empleos.js) tienen que escribir a mano las
  etiquetas <script> y <link> que arrancan la aplicacion. Si Vite les
  pone un hash distinto en cada build (index-a3f81c.js), esas
  referencias quedarian rotas en cada despliegue.

  cssCodeSplit: false junta TODO el CSS en un solo assets/app.css.
  Sin esto, Vite genera un CSS por cada pagina cargada en diferido y
  los numera solo (app2.css, app3.css...), con lo que no habria forma
  segura de saber cual es el principal desde el servidor.

  El costo es que la primera carga trae algo mas de CSS. A cambio, no
  hay parpadeo sin estilos al navegar entre pantallas, y para un sitio
  que vive de visitas que entran directo desde Google, eso conviene.

  Los chunks de JavaScript SI conservan su hash, asi que el cacheo
  sigue funcionando bien para la mayor parte del codigo.
*/
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        assetFileNames: (info) => {
          const nombre = info.names?.[0] || info.name || ''
          if (nombre.endsWith('.css')) return 'assets/app.css'
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})
