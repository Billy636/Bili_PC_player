// src/main/hotkeys.js
import { uIOhook, UiohookKey } from 'uiohook-napi';
// 引入本地文件改为 import
import { togglePlayPause, seekRelativeSeconds } from './bilibiliController';
import configManager from './configManager';

// 从配置管理器获取配置
let hotkeyConfig = configManager.getConfig();

// 按键映射表
const KEY_MAP = {
  '`': UiohookKey.Backquote,
  '1': UiohookKey['1'], '2': UiohookKey['2'], '3': UiohookKey['3'], 
  '4': UiohookKey['4'], '5': UiohookKey['5'], '6': UiohookKey['6'], 
  '7': UiohookKey['7'], '8': UiohookKey['8'], '9': UiohookKey['9'], 
  '0': UiohookKey['0'],
  '-': UiohookKey.Minus, '=': UiohookKey.Equal,
  '[': UiohookKey.BracketLeft, ']': UiohookKey.BracketRight,
  '\\': UiohookKey.Backslash, ';': UiohookKey.Semicolon,
  "'": UiohookKey.Quote, ',': UiohookKey.Comma,
  '.': UiohookKey.Period, '/': UiohookKey.Slash,
  'Space': UiohookKey.Space, 'Enter': UiohookKey.Enter,
  'ArrowLeft': UiohookKey.ArrowLeft, 'ArrowRight': UiohookKey.ArrowRight,
  'ArrowUp': UiohookKey.ArrowUp, 'ArrowDown': UiohookKey.ArrowDown,
  // F1-F12
  'F1': UiohookKey.F1, 'F2': UiohookKey.F2, 'F3': UiohookKey.F3, 'F4': UiohookKey.F4,
  'F5': UiohookKey.F5, 'F6': UiohookKey.F6, 'F7': UiohookKey.F7, 'F8': UiohookKey.F8,
  'F9': UiohookKey.F9, 'F10': UiohookKey.F10, 'F11': UiohookKey.F11, 'F12': UiohookKey.F12
};

function getKeyCode(keyString) {
  if (!keyString) return null;
  return KEY_MAP[keyString] || null;
}

function getHotkeyConfig() {
  return { ...hotkeyConfig };
}

/**
 * 核心监听逻辑
 */
function setupHookListener() {
  uIOhook.removeAllListeners('keydown');

  uIOhook.on('keydown', (e) => {
    // ★★★ 关键修复：使用 setTimeout 将逻辑移出原生线程 ★★★
    // 这可以防止 JS 报错导致 C++ 进程崩溃，并避免阻塞键盘输入
    setTimeout(() => {
      try {
        const { pauseKey, backKey, forwardKey, seekSeconds } = hotkeyConfig;
        
        // 转换 KeyCode
        const pauseCode = getKeyCode(pauseKey);
        const backCode = getKeyCode(backKey);
        const fwdCode = getKeyCode(forwardKey); 

        // 1. 播放/暂停
        if (pauseCode && e.keycode === pauseCode) {
          togglePlayPause();
        }

        // 2. 后退 (通常是 5)
        if (backCode && e.keycode === backCode) {
          seekRelativeSeconds(-seekSeconds);
        }

        // 3. 前进 (通常是 6)
        if (fwdCode && e.keycode === fwdCode) {
          seekRelativeSeconds(seekSeconds);
        }
      } catch (err) {
        console.error('[hotkeys] Error in hook callback:', err);
      }
    }, 0);
  });
}

/**
 * 初始化注册
 */
export function registerGlobalShortcuts() {
  try {
    setupHookListener();
    uIOhook.start();
    console.log('[hotkeys] uIOhook started (Non-blocking mode)');
  } catch (err) {
    console.error('[hotkeys] Failed to start uIOhook:', err);
  }
}

/**
 * 更新热键配置
 */
export function updateHotkeyConfig(partial) {
  const updatedConfig = configManager.updateConfig(partial);
  hotkeyConfig = { ...updatedConfig };
  // 配置更新后，下一次按键触发回调时会自动读取新变量，无需重启 Hook
  console.log('[hotkeys] Config updated');
  return getHotkeyConfig();
}

/**
 * 停止监听
 */
export function unregisterGlobalShortcuts() {
  uIOhook.stop();
  console.log('[hotkeys] uIOhook stopped');
}

// 添加这行以兼容 ipcHandlers 的调用
export { getHotkeyConfig };