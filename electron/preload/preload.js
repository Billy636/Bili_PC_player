// src/preload/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  refreshWindowDragRegion: () => ipcRenderer.invoke('window:refresh-drag-region'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeOrRestoreWindow: () => ipcRenderer.invoke('window:maximize-or-restore'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('window:toggle-always-on-top'),

  // 热键配置
  getHotkeyConfig: () => ipcRenderer.invoke('hotkeys:get-config'),
  updateHotkeyConfig: (partial) => ipcRenderer.invoke('hotkeys:update-config', partial),

  // === 书签相关 (确保通道名称与 ipcHandlers 一致) ===
  bookmarksGetAll: () => ipcRenderer.invoke('bookmarks-get-all'),
  bookmarksAdd: (b) => ipcRenderer.invoke('bookmarks-add', b),
  bookmarksRemove: (id) => ipcRenderer.invoke('bookmarks-remove', id),
  bookmarksUpdate: (id, u) => ipcRenderer.invoke('bookmarks-update', id, u),
  bookmarksClear: () => ipcRenderer.invoke('bookmarks-clear'),
  bookmarksExport: () => ipcRenderer.invoke('bookmarks-export'),
  bookmarksGetDataDir: () => ipcRenderer.invoke('bookmarks-get-data-dir'),
  
  // 配置相关
  configGet: () => ipcRenderer.invoke('config-get'),
  configUpdate: (p) => ipcRenderer.invoke('config-update', p),
  configReset: () => ipcRenderer.invoke('config-reset'),

  // 监听
  onPollingModeChange: (callback) => {
    // 使用 ipcRenderer.on 时要注意内存泄漏，但在 preload 中通常跟随窗口生命周期
    // 更好的做法是过滤
    const subscription = (_event, mode) => callback(mode);
    ipcRenderer.on('polling-mode-change', subscription);
    // 可选：提供清理机制，目前简单起见省略
  }
});