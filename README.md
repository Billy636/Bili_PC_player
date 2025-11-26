# Bilibili Desktop Player (B站自制PC播放器)

[![Electron](https://img.shields.io/badge/Electron-28.0.0-blue?logo=electron)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.3.0-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.0-646CFF?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

一个基于 **Electron + Vue 3 + Vite** 构建的现代化 Bilibili 桌面客户端。拥有清爽的 UI、全局快捷键支持、强大的广告净化功能以及本地书签管理系统。

## ✨ 核心特性 (Features)

* **🚀 现代技术栈**：使用 Vue 3 (Composition API) 和 Vite 构建，响应迅速，开发体验流畅。
* **🛡️ 深度净化**：内置强大的 CSS/JS 注入脚本，移除首页广告、轮播图、直播推荐等干扰元素，提供沉浸式观看体验。
* **⌨️ 全局快捷键**：集成 `uiohook-napi`，支持系统级全局快捷键（播放/暂停、快进/快退），后台运行时依然有效。
* **🔖 本地书签系统**：
    * 支持一键保存当前视频进度。
    * 自动抓取视频封面（已解决 B 站防盗链问题）。
    * 美观的书签列表 UI，支持搜索和快速跳转。
* **🎨 现代化 UI**：
    * 全图标化菜单栏，支持 Windows/macOS 风格。
    * 支持 **深色模式 (Dark Mode)** 切换。
    * 精致的毛玻璃与过渡动画效果。
* **🖥️ 窗口管理**：支持置顶、最小化到系统托盘、托盘右键菜单控制。

## 🛠️ 技术栈 (Tech Stack)

* **前端 (Renderer)**: Vue 3, Vite, CSS3 (Grid/Flex), SVG Icons
* **主进程 (Main)**: Electron 28, IPC Communication
* **原生模块**: `uiohook-napi` (C++ 编写的键盘钩子)
* **构建工具**: electron-builder

## 📦 目录结构 (Project Structure)

```text
├── electron/
│   ├── main/               # Electron 主进程代码 (ESM)
│   │   ├── main.js         # 应用入口
│   │   ├── hotkeys.js      # 快捷键逻辑
│   │   ├── styleInjector.js# 广告净化脚本
│   │   └── ...
│   ├── preload/            # 预加载脚本 (IPC桥接)
│   └── assets/             # 静态资源 (图标等)
├── src/                    # Vue 3 前端源码
│   ├── components/         # Vue 组件 (MenuBar, BookmarkList...)
│   ├── utils/              # 工具脚本
│   ├── App.vue             # 根组件
│   └── style.css           # 全局样式
├── dist/                   # 前端构建产物
├── dist-electron/          # 主进程构建产物
├── release/                # 打包生成的 .exe 安装包
└── package.json            # 项目配置
