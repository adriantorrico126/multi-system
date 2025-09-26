import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cargar variables de entorno basadas en el modo actual (development, production)
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      react(), // Soporte para React con compilador SWC (más rápido que Babel)
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // Alias para rutas más limpias
      },
      dedupe: ['react', 'react-dom'], // Evita múltiples instancias de React en dev
    },
    server: {
      host: '::', // Permite acceso desde red local (útil para testing en móvil)
      port: 8080,
      open: true, // Abre el navegador automáticamente
      strictPort: true, // Error si el puerto está en uso
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''), // Opcional: elimina `/api` en backend
        },
      },
    },
    build: {
      outDir: 'dist', // Carpeta de salida personalizada
      sourcemap: mode === 'development', // Mapas de fuente solo en dev
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    preview: {
      port: 4173, // Puerto para vista previa de producción
    },
  };
});
