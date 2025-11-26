// electron/main/trayManager.js
import { Tray, Menu, app } from 'electron';
import path from 'path';

class TrayManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.tray = null;
    this.isQuitting = false; 

    this.init();
  }

  init() {
    // ★★★ 核心修复：精准定位图标路径 ★★★
    // 无论开发环境还是生产环境，main.js 都在 dist-electron 文件夹里
    // 图标都在 electron/assets 文件夹里
    // 所以逻辑统一为：从 dist-electron 跳出去 (..)，再进入 electron/assets
    const iconPath = path.join(__dirname, '../electron/assets/favicon.ico');

    try {
      // 创建托盘实例
      this.tray = new Tray(iconPath);
      
      // 设置悬停提示
      this.tray.setToolTip('Bilibili 桌面播放器');
      
      // 设置右键菜单
      this.updateContextMenu();
      
      // 设置点击事件
      this.setupEvents();
      
      console.log('[TrayManager] 托盘图标创建成功');
    } catch (e) {
      // 如果这里报错，说明图标路径还是不对，或者文件没打包进去
      console.error('[TrayManager] 托盘创建失败 (可能是图标路径错误):', iconPath, e);
    }
  }

  updateContextMenu() {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      { 
        label: '显示主界面', 
        click: () => this.showWindow() 
      },
      { type: 'separator' },
      { 
        label: '退出程序', 
        click: () => {
          this.isQuitting = true;
          // 销毁托盘图标，防止退出后残留
          this.destroy();
          app.quit();
        } 
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  setupEvents() {
    if (!this.tray) return;

    // 左键点击：切换显示/隐藏
    this.tray.on('click', () => {
      this.toggleWindow();
    });

    // 监听窗口关闭事件
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault(); // 阻止真正关闭
        this.mainWindow.hide(); // 改为隐藏
      }
    });
  }

  showWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) this.mainWindow.restore();
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  toggleWindow() {
    if (!this.mainWindow) return;
    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
    }
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

export default TrayManager;