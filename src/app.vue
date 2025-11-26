<template>
  <div class="app-container">
    <ToastManager ref="toastRef" />
    
    <MenuBar
      :is-pinned="isPinned"
      @open-settings="showSettings = true"
      @add-bookmark="handleAddBookmark"
      @open-bookmarks="showBookmarks = true"
      @nav-back="handleNavBack"
      @nav-home="handleNavHome"
      @nav-forward="handleNavForward"
      @win-pin="handleTogglePin"
      @win-min="handleMinimize"
      @win-max="handleMaximize"
      @win-close="handleClose"
    />

    <div id="videoContainer">
      <webview
        ref="webviewRef"
        src="https://www.bilibili.com/"
        allowpopups
        class="video-webview"
        useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        httpreferrer="https://www.bilibili.com/"
      ></webview>
    </div>

    <Transition name="zoom">
      <SettingsModal 
        v-if="showSettings" 
        @close="showSettings = false" 
        @theme-change="applyTheme"
      />
    </Transition>

    <Transition name="zoom">
      <BookmarkList 
        v-if="showBookmarks" 
        @close="showBookmarks = false" 
        @jump="handleJumpToBookmark"
      />
    </Transition>

  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import MenuBar from './components/MenuBar.vue';
import SettingsModal from './components/SettingsModal.vue';
import BookmarkList from './components/BookmarkList.vue';
import { INJECT_POLLING_SCRIPT, INJECT_COLLECT_INFO_SCRIPT } from './utils/injectionScripts';
import ToastManager from './components/ToastManager.vue';

// === 状态定义 ===
const webviewRef = ref(null);
const isPinned = ref(false);
const showSettings = ref(false);
const showBookmarks = ref(false);
const toastRef = ref(null);

// 轮询与全屏状态
const isWebFullscreen = ref(false);
const menuVisible = ref(false);
let hideMenuTimer = null;
let pollingTimer = null;
let pollingMode = 'normal';
const POLLING_INTERVAL_NORMAL = 150;
const POLLING_INTERVAL_SLOW = 2000;

// === 主题管理 ===
const THEME_STYLES = {
  default: 'theme-default', dark: 'theme-dark', light: 'theme-light', tech: 'theme-tech'
};
const initTheme = async () => {
  if (!window.electronAPI) return;
  const config = await window.electronAPI.getHotkeyConfig();
  applyTheme(config?.themeStyle || 'default');
};
const applyTheme = (themeName) => {
  const cls = THEME_STYLES[themeName] || THEME_STYLES.default;
  Object.values(THEME_STYLES).forEach(c => document.body.classList.remove(c));
  document.body.classList.add(cls);
};

// === 窗口与导航控制 ===
const handleMinimize = () => window.electronAPI?.minimizeWindow();
const handleMaximize = () => window.electronAPI?.maximizeOrRestoreWindow();
const handleClose = () => window.electronAPI?.closeWindow();
const handleTogglePin = async () => {
  if (window.electronAPI) isPinned.value = await window.electronAPI.toggleAlwaysOnTop();
};
const handleNavBack = () => webviewRef.value?.canGoBack() && webviewRef.value.goBack();
const handleNavForward = () => webviewRef.value?.canGoForward() && webviewRef.value.goForward();
const handleNavHome = () => webviewRef.value?.loadURL('https://www.bilibili.com/');

// === 核心业务：书签添加 ===
const handleAddBookmark = async () => {
  if (!webviewRef.value) return;
  try {
    // 1. 执行注入脚本获取信息
    const info = await webviewRef.value.executeJavaScript(INJECT_COLLECT_INFO_SCRIPT);
    
    if (!info || info.isHome || !info.bv) {
      toastRef.value?.add('只能在视频播放页添加书签', 'warning');
      return;
    }

    // 2. 构建书签对象
    const bookmark = {
      id: Date.now().toString(),
      title: info.title,
      bv: info.bv,
      url: info.url,
      page: info.page || 1,
      currentTime: info.currentTime,
      coverUrl: info.coverUrl,
      createdAt: Date.now()
    };

    // 3. 调用 IPC 保存
    if (window.electronAPI) {
      const res = await window.electronAPI.bookmarksAdd(bookmark);
      if (res.success) {
        // 可选：做一个 toast 提示，这里简单用 alert
        toastRef.value?.add('书签保存成功！', 'success');
      } else {
        toastRef.value?.add('保存失败: ' + res.error, 'error');
      }
    }
  } catch (e) {
    console.error('添加书签失败:', e);
    toastRef.value?.add('操作异常', 'error');
  }
};

// === 核心业务：书签跳转 ===
const handleJumpToBookmark = (item) => {
  showBookmarks.value = false; // 关闭列表
  const wv = webviewRef.value;
  if (!wv) return;

  // 1. 加载链接
  wv.loadURL(item.url);

  // 2. 监听一次 dom-ready 或 did-finish-load 来执行跳转
  // 由于 B 站页面是 SPA，loadURL 后可能需要等待特定事件
  // 这里使用简单的单次事件监听策略
  const jumpHandler = () => {
    // 注入跳转时间脚本
    const script = `
      (function(){
        const v = document.querySelector('video');
        if(v) {
            v.currentTime = ${item.currentTime};
            v.play(); 
        }
      })();
    `;
    // 稍微延迟一下确保 video 标签存在
    setTimeout(() => {
        wv.executeJavaScript(script).catch(console.warn);
    }, 1500);
  };

  wv.addEventListener('did-finish-load', jumpHandler, { once: true });
};

// === 轮询逻辑 (保持一致) ===
const updateMenuState = (screenState, mouseY) => {
  const isFullscreenNow = screenState === 'web' || screenState === 'full';
  if (isFullscreenNow !== isWebFullscreen.value) {
    isWebFullscreen.value = isFullscreenNow;
    if (isFullscreenNow) {
      document.body.classList.add('web-fullscreen');
      menuVisible.value = false;
    } else {
      document.body.classList.remove('web-fullscreen');
      document.body.classList.remove('menu-visible');
      menuVisible.value = false;
      window.electronAPI?.refreshWindowDragRegion();
    }
  }
  if (isWebFullscreen.value) {
    if (mouseY <= 24) {
      if (!menuVisible.value) {
        menuVisible.value = true;
        document.body.classList.add('menu-visible');
      }
      if (hideMenuTimer) { clearTimeout(hideMenuTimer); hideMenuTimer = null; }
    } else if (menuVisible.value && !hideMenuTimer) {
      hideMenuTimer = setTimeout(() => {
          menuVisible.value = false;
          document.body.classList.remove('menu-visible');
          hideMenuTimer = null;
      }, 1200);
    }
  }
};

const startPolling = () => {
    const poll = async () => {
        if (!webviewRef.value) return;
        try {
            const result = await webviewRef.value.executeJavaScript(INJECT_POLLING_SCRIPT);
            updateMenuState(result.screen, result.mouseY);
        } catch (err) {}
        const delay = pollingMode === 'slow' ? POLLING_INTERVAL_SLOW : POLLING_INTERVAL_NORMAL;
        pollingTimer = setTimeout(poll, delay);
    };
    poll();
};

// === 生命周期 ===
onMounted(() => {
  initTheme();
  if (webviewRef.value) {
    webviewRef.value.addEventListener('dom-ready', startPolling);
  }
  if (window.electronAPI) {
      window.electronAPI.onPollingModeChange((mode) => pollingMode = mode);
  }
});

onUnmounted(() => {
    if (pollingTimer) clearTimeout(pollingTimer);
    if (hideMenuTimer) clearTimeout(hideMenuTimer);
});
</script>

<style>
/* 简单的 Vue Transition 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>