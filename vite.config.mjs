import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tagger from "@dhiwise/component-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Always use PythonAnywhere URL as requested
  const apiTarget = 'https://progress.pythonanywhere.com';
    
  console.log(`Using API target: ${apiTarget} in ${mode} mode`);
  
  return {
    // This changes the output dir from dist to build
    build: {
      outDir: "build",
      chunkSizeWarningLimit: 2000,
    },
    plugins: [tsconfigPaths(), react(), tagger()],
    server: {
      port: 3001,
      host: "localhost",
      strictPort: false,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: mode === 'production',
        }
      }
    },
    define: {
      'process.env.API_BASE_URL': JSON.stringify(apiTarget)
    }
  };
});
