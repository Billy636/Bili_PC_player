<template>
  <div id="menubar">
    <div class="menu-group left">
      <button class="menu-item icon-btn" @click="$emit('open-settings')" title="偏好设置">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>

      <button class="menu-item icon-btn" @click="$emit('add-bookmark')" title="添加到书签">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>

      <button class="menu-item icon-btn" @click="$emit('open-bookmarks')" title="查看书签列表">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      </button>
    </div>

    <div class="menu-group center">
      <button class="menu-item icon-btn" @click="$emit('nav-back')" title="后退">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button class="menu-item icon-btn" @click="$emit('nav-home')" title="回首页">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
      </button>
      <button class="menu-item icon-btn" @click="$emit('nav-forward')" title="前进">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>

    <div class="menu-group right">
      <button class="menu-item icon-btn" :class="{ 'pin-active': isPinned }" @click="$emit('win-pin')" title="置顶窗口">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 17v5"/>
          <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
        </svg>
      </button>
      
      <button class="menu-item icon-btn" @click="$emit('win-min')" title="最小化到托盘">
        <svg viewBox="0 0 12 12" width="12" height="12"><path d="M2,6 L10,6" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
      </button>

      <button class="menu-item icon-btn" @click="$emit('win-max')" title="最大化/还原">
        <svg viewBox="0 0 12 12" width="12" height="12"><rect x="2" y="2" width="8" height="8" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
      </button>

      <button class="menu-item icon-btn btn-close" @click="$emit('win-close')" title="退出程序">
        <svg viewBox="0 0 12 12" width="12" height="12"><path d="M2,2 L10,10 M2,10 L10,2" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isPinned: {
    type: Boolean,
    default: false
  }
});

defineEmits([
  'open-settings', 'add-bookmark', 'open-bookmarks',
  'nav-back', 'nav-home', 'nav-forward',
  'win-pin', 'win-min', 'win-max', 'win-close'
]);
</script>

<style scoped>
/* === 核心布局：Grid 保证绝对居中 === */
#menubar {
  display: grid;
  /* 关键：左边自动、右边自动、中间由内容决定，实现中间绝对居中 */
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 100%;
  padding: 0 12px; /* 给左右两边留出呼吸感，不再紧贴屏幕 */
  box-sizing: border-box;
}

/* 组的对齐方式 */
.menu-group {
  display: flex;
  align-items: center;
  gap: 6px; /* 统一所有按钮之间的间距 */
}
.menu-group.left { justify-self: start; }
.menu-group.center { justify-self: center; }
.menu-group.right { justify-self: end; }

/* === 统一的按钮样式 (包括功能键和窗口键) === */
.icon-btn {
  width: 34px;  /* 统一尺寸 */
  height: 34px;
  border-radius: 6px; /* 统一圆角 */
  border: none;
  background: transparent;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  /* 窗口控制按钮也需要不可拖拽，否则无法点击 */
  -webkit-app-region: no-drag; 
}

/* 悬停效果：统一为浅灰色圆角块 */
.icon-btn:hover {
  background-color: rgba(0, 0, 0, 0.06);
  color: #000;
}

.icon-btn:active {
  background-color: rgba(0, 0, 0, 0.1);
  transform: scale(0.95);
}

/* === 特殊状态处理 === */

/* 置顶激活态：蓝色高亮 */
.icon-btn.pin-active {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
}

/* 关闭按钮：悬停变为红色 */
.icon-btn.btn-close:hover {
  background-color: #e81123;
  color: white;
}

/* === 深色模式适配 === */
:global(body.theme-dark) .icon-btn {
  color: #ccc;
}
:global(body.theme-dark) .icon-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}
:global(body.theme-dark) .icon-btn.pin-active {
  background-color: rgba(64, 158, 255, 0.2);
  color: #66b1ff;
}
:global(body.theme-dark) .icon-btn.btn-close:hover {
  background-color: #e81123; /* 红色背景不变 */
  color: white;
}
</style>