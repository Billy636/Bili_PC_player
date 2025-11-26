import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'webview'
        }
      }
    }),
    electron([
      {
        // Main-Process 入口
        entry: 'electron/main/main.js',
        // ★★★ 核心修复：配置 Vite 构建选项 ★★★
        vite: {
          build: {
            rollupOptions: {
              // 告诉 Vite：这个库包含 C++ 原生代码，不要打包进 main.js
              // 让它保留 require('uiohook-napi') 的形式
              external: ['uiohook-napi'] 
            }
          }
        }
      },
      {
        entry: 'electron/preload/preload.js',
        onstart(options) {
          options.reload()
        },
      },
    ]),
    renderer(),
  ],
})