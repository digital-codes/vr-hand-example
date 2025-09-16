import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { viteStaticCopy } from 'vite-plugin-static-copy'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    viteStaticCopy({
          targets: [
    {
          // Copy everything inside the @mediapipe/hands package
          src: path.resolve(__dirname, 'node_modules/@mediapipe/hands/**/*'),
          dest: 'mediapipe/hands'
        }
      ]
        })
  ],
})
