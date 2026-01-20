// src/main/bookmarkManager.js
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

// 书签数据统一存储到用户主目录 ~/.bilibili-player/
// Windows: C:\Users\<用户名>\.bilibili-player\
// macOS/Linux: ~/.bilibili-player/
// 与 config.json 同目录，便于用户管理和备份
const DATA_DIR_NAME = '.bilibili-player';
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

    this.userDataPath = path.join(app.getPath('home'), DATA_DIR_NAME);
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

    // 查找同一 bv 视频的所有书签
    const sameBvBookmarks = this.bookmarks
      .map((b, index) => ({ ...b, _index: index }))
      .filter(b => b.bv === bookmark.bv);

    if (sameBvBookmarks.length > 0) {
      // 按创建时间排序，找最新的无笔记书签
      const sortedByTime = [...sameBvBookmarks].sort((a, b) => b.createdAt - a.createdAt);
      const latestNoNote = sortedByTime.find(b => !b.note || !b.note.trim());

      if (latestNoNote) {
        // 找到无笔记的书签，覆盖它
        const targetIndex = latestNoNote._index;
        const old = this.bookmarks[targetIndex];
        this.bookmarks[targetIndex] = {
          ...old,
          ...bookmark,
          id: old.id,
          createdAt: old.createdAt,
          note: old.note || ''
        };
      } else {
        // 所有同 bv 书签都有笔记，新建书签
        this.bookmarks.push({
          ...bookmark,
          page: bookmark.page || 1,
          id: bookmark.id || Date.now().toString(),
          createdAt: bookmark.createdAt || Date.now(),
          note: ''
        });
      }
    } else {
      // 没有同 bv 的书签，新增
      this.bookmarks.push({
        ...bookmark,
        page: bookmark.page || 1,
        id: bookmark.id || Date.now().toString(),
        createdAt: bookmark.createdAt || Date.now(),
        note: ''
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