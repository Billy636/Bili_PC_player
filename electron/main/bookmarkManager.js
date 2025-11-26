// src/main/bookmarkManager.js
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

// 注意：这里我们不再去计算 src 目录，而是直接使用 Electron 提供的用户数据目录
// Windows: %APPDATA%/YourAppName/
// macOS: ~/Library/Application Support/YourAppName/
// 这样可以确保即使打包后也有读写权限，且数据不会随应用更新丢失
const DATA_DIR_NAME = 'user_data';
const BOOKMARKS_FILE_NAME = 'bookmarks.json';

class BookmarkManager {
  constructor() {
    this.bookmarks = [];
    // 延迟初始化路径，确保 app 模块已就绪
    this.userDataPath = '';
    this.bookmarksFilePath = '';
  }

  /**
   * 初始化管理器
   * 必须在 app.on('ready') 之后或首次调用时确保路径正确
   */
  init() {
    if (this.userDataPath) return; // 已初始化

    this.userDataPath = path.join(app.getPath('userData'), DATA_DIR_NAME);
    this.bookmarksFilePath = path.join(this.userDataPath, BOOKMARKS_FILE_NAME);

    this.ensureDataDirectory();
    this.loadBookmarks();
  }

  ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.userDataPath)) {
        fs.mkdirSync(this.userDataPath, { recursive: true });
        console.log('[BookmarkManager] 创建数据目录:', this.userDataPath);
      }
    } catch (err) {
      console.error('[BookmarkManager] 创建数据目录失败:', err);
    }
  }

  loadBookmarks() {
    try {
      if (fs.existsSync(this.bookmarksFilePath)) {
        const data = fs.readFileSync(this.bookmarksFilePath, 'utf8');
        this.bookmarks = JSON.parse(data);
        // 简单的数据清洗，确保是数组
        if (!Array.isArray(this.bookmarks)) {
            this.bookmarks = [];
        }
        console.log(`[BookmarkManager] 加载成功，共 ${this.bookmarks.length} 条书签`);
      } else {
        this.bookmarks = [];
      }
    } catch (err) {
      console.error('[BookmarkManager] 加载书签失败:', err);
      this.bookmarks = [];
    }
  }

  saveBookmarks() {
    try {
      this.ensureDataDirectory(); // 保存前再次确保目录存在
      const data = JSON.stringify(this.bookmarks, null, 2);
      fs.writeFileSync(this.bookmarksFilePath, data, 'utf8');
      console.log('[BookmarkManager] 保存成功');
      return true;
    } catch (err) {
      console.error('[BookmarkManager] 保存书签失败:', err);
      return false;
    }
  }

  // --- 业务逻辑 ---

  getBookmarks() {
    this.init(); // 确保已初始化
    return [...this.bookmarks];
  }

  addBookmark(bookmark) {
    this.init();
    if (!bookmark || !bookmark.bv) return false;

    // 逻辑优化：如果 BV 和 P数 相同，视为更新
    const page = bookmark.page || 1;
    const existingIndex = this.bookmarks.findIndex(
      b => b.bv === bookmark.bv && (b.page || 1) === page
    );

    if (existingIndex !== -1) {
      // 更新
      const old = this.bookmarks[existingIndex];
      this.bookmarks[existingIndex] = {
        ...old,
        ...bookmark,
        id: old.id, // ID 保持不变
        createdAt: old.createdAt // 创建时间保持不变
      };
    } else {
      // 新增
      this.bookmarks.push({
          ...bookmark,
          page,
          id: bookmark.id || Date.now().toString(),
          createdAt: bookmark.createdAt || Date.now()
      });
    }

    return this.saveBookmarks();
  }

  removeBookmark(id) {
    this.init();
    const prevLen = this.bookmarks.length;
    this.bookmarks = this.bookmarks.filter(b => b.id !== id);
    if (this.bookmarks.length !== prevLen) {
      return this.saveBookmarks();
    }
    return false;
  }

  updateBookmark(id, updates) {
    this.init();
    const idx = this.bookmarks.findIndex(b => b.id === id);
    if (idx === -1) return false;
    
    this.bookmarks[idx] = { ...this.bookmarks[idx], ...updates };
    return this.saveBookmarks();
  }

  clearBookmarks() {
    this.init();
    this.bookmarks = [];
    return this.saveBookmarks();
  }

  // 导出功能
  exportBookmarks() {
    this.init();
    try {
      const exportFile = path.join(this.userDataPath, `bookmarks_export_${Date.now()}.json`);
      fs.writeFileSync(exportFile, JSON.stringify(this.bookmarks, null, 2));
      return exportFile;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  
  getDataDirectory() {
      this.init();
      return this.userDataPath;
  }
}

export default new BookmarkManager();