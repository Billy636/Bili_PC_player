// electron/main/main.js
import path from 'path';
import { app, BrowserWindow, Menu, ipcMain } from 'electron';
// 注意路径变化：现在都在同级目录，引用方式不变，但基于 __dirname
// === 核心修改：改为 Import ===
import { registerGlobalShortcuts, unregisterGlobalShortcuts, getHotkeyConfig, updateHotkeyConfig } from './hotkeys';
import { setVideoWebContents } from './bilibiliController';
import IPCHandlers from './ipcHandlers';
import bookmarkManager from './bookmarkManager'; // 虽然 main.js 没直接用，但 import 进来确保被打包
import TrayManager from './trayManager';
import { injectPurifyStyles } from './styleInjector';

// 禁用硬件加速 (保持原样)
app.disableHardwareAcceleration();

// 保持原来的 session 拦截逻辑
app.on('ready', () => {
  const { session } = require('electron');
  const filter = { urls: ['https://*.bilibili.com/*', 'https://*.biliapi.net/*'] };
  
  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    details.requestHeaders['Referer'] = 'https://www.bilibili.com/';
    callback({ requestHeaders: details.requestHeaders });
  });
});

let mainWindow = null;
let trayManager = null;

// Webview 窗口打开处理 (保持原样)
app.on('web-contents-created', (event, contents) => {
  if (contents.getType() === 'webview') {
    contents.setWindowOpenHandler(({ url }) => {
      contents.loadURL(url);
      return { action: 'deny' };
    });
  }
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    resizable: true,
    autoHideMenuBar: true,
    // 图标路径可能需要根据打包后的位置微调，开发环境暂时指向资源目录
    // 假设资源在根目录的 resources 文件夹
    icon: path.join(__dirname, '../electron/assets/favicon.ico'),
    webPreferences: {
      // 预加载脚本路径：electron-vite 会自动处理路径
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });

  Menu.setApplicationMenu(null);

  // === 核心修改：区分开发环境和生产环境 ===
  if (process.env.VITE_DEV_SERVER_URL) {
    // 开发模式：加载 Vite 服务地址
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // 开发模式下可以自动打开控制台
    // mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载打包后的 index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 初始化托盘
  trayManager = new TrayManager(mainWindow);

  // 监听 Webview 挂载
  mainWindow.webContents.on('did-attach-webview', (_event, webContents) => {
    webContents.setMaxListeners(20);
    
    // 注入样式
    webContents.on('dom-ready', () => {
        injectPurifyStyles(webContents);
    });
    
    // 绑定视频控制逻辑
    setVideoWebContents(webContents);
  });

  // 窗口状态监听（保持原样）
  const sendPollingMode = (mode) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('polling-mode-change', mode);
    }
  };

  mainWindow.on('minimize', () => sendPollingMode('slow'));
  mainWindow.on('hide', () => sendPollingMode('slow'));
  mainWindow.on('restore', () => sendPollingMode('normal'));
  mainWindow.on('show', () => sendPollingMode('normal'));

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (trayManager) {
      trayManager.destroy();
      trayManager = null;
    }
  });
}

function getTargetWindow() {
  return (
    BrowserWindow.getFocusedWindow() ||
    mainWindow ||
    BrowserWindow.getAllWindows()[0] ||
    null
  );
}

// IPC 处理 
// electron/main/main.js
ipcMain.handle('window:refresh-drag-region', () => {
  const win = getTargetWindow();
  if (win) win.setBounds(win.getBounds());
});

// === 修改 1：最小化改为“隐藏到托盘” ===
ipcMain.handle('window:minimize', () => {
  const win = getTargetWindow();
  if (win) {
    // 原来是 win.minimize()，现在改为 hide() 即可隐藏到托盘
    // 前提是 TrayManager 已经初始化且托盘图标存在
    win.hide(); 
  }
});

ipcMain.handle('window:maximize-or-restore', () => {
  const win = getTargetWindow();
  if (win) {
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  }
});

// === 修改 2：关闭改为“直接退出程序” ===
ipcMain.handle('window:close', () => {
  // 必须通知 TrayManager 我们是真的要退出了，否则它的 on('close') 事件会拦截并只是隐藏窗口
  if (trayManager) {
    trayManager.isQuitting = true;
  }
  app.quit(); // 执行真正的退出
});


ipcMain.handle('window:toggle-always-on-top', () => {
  const win = getTargetWindow();
  if (win) {
    const next = !win.isAlwaysOnTop();
    win.setAlwaysOnTop(next);
    return next;
  }
});

ipcMain.handle('hotkeys:get-config', () => getHotkeyConfig());

ipcMain.handle('hotkeys:update-config', (_event, partial) => {
  return updateHotkeyConfig(partial || {});
});

// 初始化其他处理器
new IPCHandlers();

app.whenReady().then(() => {
  createMainWindow();
  registerGlobalShortcuts(); 

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('will-quit', () => {
  unregisterGlobalShortcuts();
});