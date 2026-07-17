import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Este proyecto usa eslint-plugin-react-hooks@7, cuya config
      // "recommended" ya incluye reglas experimentales pensadas para
      // el futuro React Compiler (aun no adoptado en este proyecto).
      // Se desactivan porque generan muchos falsos positivos sobre
      // patrones estandar y seguros de React (loadData con setLoading
      // antes de un await, funciones declaradas despues del useEffect
      // que las usa gracias al hoisting de JS). Se mantienen activas
      // rules-of-hooks, exhaustive-deps y static-components, que si
      // detectan errores reales.
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
