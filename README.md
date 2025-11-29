Bilibili Desktop Player (B站自制PC播放器，由AI创作)
===================================

一个基于 **Electron + Vue 3 + Vite** 构建的现代化 Bilibili 桌面客户端。拥有清爽的 UI、全局快捷键支持、强大的广告净化功能以及本地书签管理系统。

✨ 核心特性 (Features)
-----------------

*   **🚀 现代技术栈**：使用 Vue 3 (Composition API) 和 Vite 构建，响应迅速，开发体验流畅。
*   **🛡️ 深度净化**：内置强大的 CSS/JS 注入脚本，移除首页广告、轮播图、直播推荐等干扰元素，提供沉浸式观看体验。
*   **⌨️ 全局快捷键**：集成 `uiohook-napi`，支持系统级全局快捷键（播放/暂停、快进/快退），后台运行时依然有效。
*   **🔖 本地书签系统**：
    *   支持一键保存当前视频进度。
    *   自动抓取视频封面（已解决 B 站防盗链问题）。
    *   美观的书签列表 UI，支持搜索和快速跳转。
*   **🎨 现代化 UI**：
    *   全图标化菜单栏，支持 Windows/macOS 风格。
    *   支持 **深色模式 (Dark Mode)** 切换。
    *   精致的毛玻璃与过渡动画效果。
*   **🖥️ 窗口管理**：支持置顶、最小化到系统托盘、托盘右键菜单控制。

🛠️ 技术栈 (Tech Stack)
--------------------

*   **前端 (Renderer)**: Vue 3, Vite, CSS3 (Grid/Flex), SVG Icons
*   **主进程 (Main)**: Electron 28, IPC Communication
*   **原生模块**: `uiohook-napi` (C++ 编写的键盘钩子)
*   **构建工具**: electron-builder

📦 目录结构 (Project Structure)
---------------------------

```
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
```

🚀 开发指南 (Development)
---------------------

### 环境要求

*   **Node.js**: 推荐 **v18.x** (与 Electron 28 匹配，避免 ABI 兼容性问题)。
*   **C++ 构建环境**: Windows 用户需安装 Visual Studio Build Tools (用于编译 `uiohook-napi`)。

### 1\. 克隆项目

```
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2\. 安装依赖

由于使用了 C++ 原生模块，安装过程会自动触发编译。

```
npm install
```

_注意：如果下载 Electron 或编译报错，请检查网络或 `.npmrc` 配置。_

### 3\. 启动开发环境

```
npm run dev
```

🔨 打包构建 (Build)
---------------

本项目配置了 `electron-builder` 进行打包。

```
npm run build
```

构建完成后，安装包 (`Setup.exe`) 和绿色版程序将位于 `release/` 目录下。

### ⚠️ 关于原生模块 (Native Modules) 的重要说明

本项目依赖 `uiohook-napi`，这是一个原生 C++ 模块。在打包或更换 Node 版本时，极易出现 **ABI 版本不匹配** 的错误。

**解决方案：**

1.  项目根目录已包含 `.npmrc` 文件，强制指定编译目标为 Electron。
2.  如果在打包后运行报错 `No native build was found`，请执行以下命令彻底重装依赖：
    ```
    # 1. 清理旧依赖
    rm -rf node_modules package-lock.json
    # 2. 重新安装 (会自动触发针对 Electron 的重编译)
    npm install
    # 3. 重新打包
    npm run build
    ```

🤝 贡献 (Contributing)
--------------------

欢迎提交 Issue 或 Pull Request！如果你有更好的去广告规则或新功能想法，请随时分享。

1.  Fork 本仓库
2.  新建 Feat\_xxx 分支
3.  提交代码
4.  新建 Pull Request

📄 开源协议 (License)
-----------------

[MIT License](https://www.google.com/search?q=./LICENSE)



---
Powered by [Gem Chat Exporter](https://www.gem-chat-exporter.com)
