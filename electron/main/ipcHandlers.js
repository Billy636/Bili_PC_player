// src/main/ipcHandlers.js - IPC通信处理器
import { ipcMain } from 'electron';
// 改为 import
import bookmarkManager from './bookmarkManager';
import configManager from './configManager';

class IPCHandlers {
  constructor() {
    this.setupHandlers();
  }

  setupHandlers() {
    // 书签相关IPC处理
    this.setupBookmarkHandlers();
    
    // 配置相关IPC处理
    this.setupConfigHandlers();
    
    console.log('[IPCHandlers] IPC处理器已初始化');
  }

  setupBookmarkHandlers() {
    // 获取所有书签
    ipcMain.handle('bookmarks-get-all', async () => {
      try {
        const bookmarks = bookmarkManager.getBookmarks();
        return { success: true, data: bookmarks };
      } catch (error) {
        console.error('[IPCHandlers] 获取书签失败:', error);
        return { success: false, error: error.message };
      }
    });

    // 添加书签
    ipcMain.handle('bookmarks-add', async (event, bookmark) => {
      try {
        const result = bookmarkManager.addBookmark(bookmark);
        return { success: result, data: bookmark };
      } catch (error) {
        console.error('[IPCHandlers] 添加书签失败:', error);
        return { success: false, error: error.message };
      }
    });

    // 删除书签
    ipcMain.handle('bookmarks-remove', async (event, id) => {
      try {
        const result = bookmarkManager.removeBookmark(id);
        return { success: result };
      } catch (error) {
        console.error('[IPCHandlers] 删除书签失败:', error);
        return { success: false, error: error.message };
      }
    });

    // 更新书签
    ipcMain.handle('bookmarks-update', async (event, id, updates) => {
      try {
        const result = bookmarkManager.updateBookmark(id, updates);
        return { success: result };
      } catch (error) {
        console.error('[IPCHandlers] 更新书签失败:', error);
        return { success: false, error: error.message };
      }
    });

    // 清空书签
    ipcMain.handle('bookmarks-clear', async () => {
      try {
        const result = bookmarkManager.clearBookmarks();
        return { success: result };
      } catch (error) {
        console.error('[IPCHandlers] 清空书签失败:', error);
        return { success: false, error: error.message };
      }
    });

    // 导出书签
    ipcMain.handle('bookmarks-export', async () => {
      try {
        const exportPath = bookmarkManager.exportBookmarks();
        return { success: true, data: { exportPath } };
      } catch (error) {
        console.error('[IPCHandlers] 导出书签失败:', error);
        return { success: false, error: error.message };
      }
    });

    // 获取书签数据目录
    ipcMain.handle('bookmarks-get-data-dir', async () => {
      try {
        const dataDir = bookmarkManager.getDataDirectory();
        return { success: true, data: { dataDir } };
      } catch (error) {
        console.error('[IPCHandlers] 获取数据目录失败:', error);
        return { success: false, error: error.message };
      }
    });

    // 从localStorage迁移数据
    ipcMain.handle('bookmarks-migrate-from-localstorage', async (event, localStorageData) => {
      try {
        if (!Array.isArray(localStorageData)) {
          return { success: false, error: '无效的数据格式' };
        }

        let migratedCount = 0;
        for (const bookmark of localStorageData) {
          if (bookmarkManager.validateBookmark(bookmark)) {
            const result = bookmarkManager.addBookmark(bookmark);
            if (result) migratedCount++;
          }
        }

        console.log(`[IPCHandlers] 从localStorage迁移了 ${migratedCount} 个书签`);
        return { success: true, data: { migratedCount } };
      } catch (error) {
        console.error('[IPCHandlers] 迁移书签失败:', error);
        return { success: false, error: error.message };
      }
    });
  }

  setupConfigHandlers() {
    // 获取配置
    ipcMain.handle('config-get', async () => {
      try {
        const config = configManager.getConfig();
        return { success: true, data: config };
      } catch (error) {
        console.error('[IPCHandlers] 获取配置失败:', error);
        return { success: false, error: error.message };
      }
    });

    // 更新配置
    ipcMain.handle('config-update', async (event, partialConfig) => {
      try {
        const config = configManager.updateConfig(partialConfig);
        return { success: true, data: config };
      } catch (error) {
        console.error('[IPCHandlers] 更新配置失败:', error);
        return { success: false, error: error.message };
      }
    });

    // 重置配置
    ipcMain.handle('config-reset', async () => {
      try {
        const config = configManager.resetToDefault();
        return { success: true, data: config };
      } catch (error) {
        console.error('[IPCHandlers] 重置配置失败:', error);
        return { success: false, error: error.message };
      }
    });
  }
}

export default IPCHandlers;