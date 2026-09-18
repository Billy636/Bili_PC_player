<template>
  <div class="overlay-mask" @click.self="$emit('close')">
    <div class="overlay-card bookmark-overlay-card">
      
      <div class="overlay-header">
        <div class="header-left">
          <div class="overlay-title">我的书签</div>
          <div class="badge">{{ bookmarks.length }}</div>
        </div>
        <button class="overlay-close" @click="$emit('close')">×</button>
      </div>

      <div class="search-container">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            class="modern-input" 
            placeholder="搜索标题或 BV 号..." 
            v-model="searchText"
            ref="searchInput"
          />
        </div>

        <!-- 状态快捷筛选胶囊（移除 emoji，使用点标指示） -->
        <div class="filter-pills">
          <button 
            class="pill-btn" 
            :class="{ active: currentFilter === 'all' }" 
            @click="currentFilter = 'all'"
          >
            全部 ({{ bookmarks.length }})
          </button>
          <button 
            class="pill-btn" 
            :class="{ active: currentFilter === 'watching' }" 
            @click="currentFilter = 'watching'"
          >
            <span class="pill-dot pill-dot-watching"></span>
            看了一点 ({{ statusCounts.watching }})
          </button>
          <button 
            class="pill-btn" 
            :class="{ active: currentFilter === 'unwatched' }" 
            @click="currentFilter = 'unwatched'"
          >
            <span class="pill-dot pill-dot-unwatched"></span>
            未看 ({{ statusCounts.unwatched }})
          </button>
          <button 
            class="pill-btn" 
            :class="{ active: currentFilter === 'finished' }" 
            @click="currentFilter = 'finished'"
          >
            <span class="pill-dot pill-dot-finished"></span>
            已看完 ({{ statusCounts.finished }})
          </button>
        </div>
      </div>

      <div class="bookmark-list custom-scroll">
        <div v-if="filteredList.length === 0" class="empty-state">
          <div class="empty-icon">📂</div>
          <div class="empty-text">{{ searchText ? '未找到相关视频' : (currentFilter !== 'all' ? '当前分类下暂无书签' : '暂无书签，快去添加吧') }}</div>
        </div>

        <div 
          v-for="(item, index) in filteredList" 
          :key="item.id" 
          class="b-card"
          :class="{ 'menu-open': activeStatusMenuId === item.id }"
          @click="handleJump(item)"
        >
          <div class="b-cover">
            <div class="gradient-bg" :style="{ background: stringToGradient(item.title) }"></div>
            <img 
              v-if="item.coverUrl" 
              :src="item.coverUrl" 
              class="real-img" 
              @error="onImgError"
              loading="lazy"
            />
            <div class="play-overlay">▶</div>
            <div v-if="getStatus(item) === 'finished'" class="cover-finished-tag" title="本集已看完">
              ✓
            </div>
          </div>

          <div class="b-info">
            <div class="b-title" :title="item.title + (item.partTitle ? ' · ' + item.partTitle : '')">
              {{ item.title }}
              <span v-if="item.partTitle && !item.title.includes(item.partTitle)" class="b-part-sub"> · {{ item.partTitle }}</span>
            </div>
            
            <div class="b-meta">
              <span class="tag tag-page">P{{ item.page || 1 }}</span>
              <span class="tag tag-time">{{ formatTime(item.currentTime) }}</span>

              <!-- 观看状态选择胶囊 -->
              <div class="status-selector" @click.stop>
                <button 
                  class="tag tag-status" 
                  :class="'status-' + getStatus(item)" 
                  @click.stop="toggleStatusMenu(item.id)"
                  title="点击修改观看状态与分集联动"
                >
                  <span class="status-dot"></span>
                  <span class="status-text">{{ getStatusConfig(item).label }}</span>
                  <span class="status-arrow">▾</span>
                </button>

                <!-- 状态选择气泡浮层 -->
                <Transition name="fade-pop">
                  <div 
                    v-if="activeStatusMenuId === item.id" 
                    class="status-popover" 
                    :class="{ 'popover-up': index >= Math.max(1, filteredList.length - 2) && filteredList.length >= 2 }"
                    @click.stop
                  >
                    <div 
                      class="status-opt status-opt-unwatched" 
                      :class="{ selected: getStatus(item) === 'unwatched' }" 
                      @click.stop="handleSetStatus(item, 'unwatched')"
                    >
                      <span class="opt-dot opt-dot-unwatched"></span>
                      <span class="opt-label">本集未看</span>
                      <span v-if="getStatus(item) === 'unwatched'" class="opt-check">✓</span>
                    </div>
                    <div 
                      class="status-opt status-opt-watching" 
                      :class="{ selected: getStatus(item) === 'watching' }" 
                      @click.stop="handleSetStatus(item, 'watching')"
                    >
                      <span class="opt-dot opt-dot-watching"></span>
                      <span class="opt-label">本集看了一点</span>
                      <span v-if="getStatus(item) === 'watching'" class="opt-check">✓</span>
                    </div>
                    <div 
                      class="status-opt status-opt-finished" 
                      :class="{ selected: getStatus(item) === 'finished' }" 
                      @click.stop="handleSetStatus(item, 'finished')"
                    >
                      <span class="opt-dot opt-dot-finished"></span>
                      <span class="opt-label">本集已看完</span>
                      <span v-if="getStatus(item) === 'finished'" class="opt-check">✓</span>
                    </div>

                    <!-- 分集快捷联动（针对多P视频：播完跳下集未看 / 转为上集已看完） -->
                    <template v-if="(item.page && item.page > 1) || getStatus(item) === 'finished'">
                      <div class="popover-divider"></div>
                      
                      <!-- 转换为上集已看完 -->
                      <div 
                        v-if="item.page && item.page > 1" 
                        class="status-opt status-opt-switch" 
                        @click.stop="handleSwitchToPrevFinished(item)"
                        :title="'转为记录第 ' + (item.page - 1) + ' 集已看完'"
                      >
                        <svg class="opt-icon-svg" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                        <span class="opt-label">转为上集 (P{{ item.page - 1 }}) 已看完</span>
                      </div>

                      <!-- 转换为下集待看从头播 -->
                      <div 
                        v-if="getStatus(item) === 'finished'" 
                        class="status-opt status-opt-switch" 
                        @click.stop="handleSwitchToNextUnwatched(item)"
                        :title="'转为准备看第 ' + ((item.page || 1) + 1) + ' 集（从头播）'"
                      >
                        <svg class="opt-icon-svg" viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <span class="opt-label">转为下集 (P{{ (item.page || 1) + 1 }}) 待看</span>
                      </div>
                    </template>
                  </div>
                </Transition>
              </div>

              <span class="date-text">{{ formatDate(item.createdAt) }}</span>
            </div>

            <!-- 笔记条展示（点击直接打开笔记编辑弹窗，不破坏卡片高度） -->
            <div class="b-note" v-if="item.note" @click.stop="openNoteModal(item)" title="点击修改笔记">
              <svg class="note-icon-svg" viewBox="0 0 24 24" width="11" height="11" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <span class="note-text">{{ item.note }}</span>
            </div>
          </div>

          <div class="b-actions" @click.stop>
            <!-- 笔记按钮（悬停显示，点击打开聚焦笔记弹窗） -->
            <button 
              class="btn-icon-action btn-icon-note" 
              @click.stop="openNoteModal(item)" 
              :title="item.note ? '编辑笔记' : '添加笔记'"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>

            <button class="btn-icon-action btn-icon-delete" @click.stop="handleDelete(item)" title="删除">
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 专属轻量笔记编辑模态弹窗 -->
      <Transition name="fade-modal">
        <div v-if="editingNoteItem" class="note-modal-overlay" @click.self="closeNoteModal">
          <div class="note-modal-card">
            <div class="note-modal-header">
              <div class="note-modal-title">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>书签笔记</span>
                <span class="note-modal-badge">P{{ editingNoteItem.page || 1 }} · {{ formatTime(editingNoteItem.currentTime) }}</span>
              </div>
              <button class="note-modal-close" @click="closeNoteModal">×</button>
            </div>

            <div class="note-modal-body">
              <textarea 
                ref="noteTextareaRef"
                v-model="editingNoteText"
                class="note-modal-textarea"
                placeholder="记录本集的重点、进度心得或备忘 (按 Ctrl+Enter 快速保存)..."
                @keydown.ctrl.enter="saveNoteFromModal"
                @keydown.esc="closeNoteModal"
              ></textarea>
            </div>

            <div class="note-modal-footer">
              <button 
                v-if="editingNoteItem.note" 
                class="btn-note-clear" 
                @click="clearNoteFromModal"
              >
                清除笔记
              </button>
              <div class="note-modal-btn-group">
                <button class="btn-note-cancel" @click="closeNoteModal">取消</button>
                <button class="btn-note-save" @click="saveNoteFromModal">保存</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

const emit = defineEmits(['close', 'jump']);
const bookmarks = ref([]);
const searchText = ref('');
const searchInput = ref(null);
const currentFilter = ref('all'); // 'all' | 'watching' | 'unwatched' | 'finished'
const activeStatusMenuId = ref(null);

// 状态定义与工具
const STATUS_CONFIG = {
  unwatched: { label: '未看', fullLabel: '本集未看' },
  watching: { label: '看了一点', fullLabel: '本集看了一点' },
  finished: { label: '已看完', fullLabel: '本集已看完' }
};

const getStatus = (item) => {
  if (item.watchStatus) return item.watchStatus;
  // 历史数据兜底推断：如果播放时间在 25 秒内，视为未看；否则视为看了一点
  return (item.currentTime && item.currentTime > 25) ? 'watching' : 'unwatched';
};

const getStatusConfig = (item) => {
  const st = getStatus(item);
  return STATUS_CONFIG[st] || STATUS_CONFIG.unwatched;
};

const toggleStatusMenu = (id) => {
  activeStatusMenuId.value = activeStatusMenuId.value === id ? null : id;
};

const handleSetStatus = async (item, status) => {
  activeStatusMenuId.value = null;
  item.watchStatus = status; // 乐观更新
  if (window.electronAPI) {
    await window.electronAPI.bookmarksUpdate(item.id, { watchStatus: status });
    loadBookmarks();
  }
};

// URL 分集参数工具
const updateUrlPage = (url, targetPage) => {
  if (!url) return url;
  if (/[?&]p=\d+/.test(url)) {
    return url.replace(/([?&]p=)\d+/, `$1${targetPage}`);
  }
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}p=${targetPage}`;
};

// 分集快捷联动：转为上集已看完
const handleSwitchToPrevFinished = async (item) => {
  activeStatusMenuId.value = null;
  const prevPage = Math.max(1, (item.page || 1) - 1);
  const updatedUrl = updateUrlPage(item.url, prevPage);
  item.page = prevPage;
  item.url = updatedUrl;
  item.watchStatus = 'finished';
  if (window.electronAPI) {
    await window.electronAPI.bookmarksUpdate(item.id, {
      page: prevPage,
      url: updatedUrl,
      watchStatus: 'finished'
    });
    loadBookmarks();
  }
};

// 分集快捷联动：转为下集待看（进度归零从头播）
const handleSwitchToNextUnwatched = async (item) => {
  activeStatusMenuId.value = null;
  const nextPage = (item.page || 1) + 1;
  const updatedUrl = updateUrlPage(item.url, nextPage);
  item.page = nextPage;
  item.url = updatedUrl;
  item.currentTime = 0;
  item.watchStatus = 'unwatched';
  if (window.electronAPI) {
    await window.electronAPI.bookmarksUpdate(item.id, {
      page: nextPage,
      url: updatedUrl,
      currentTime: 0,
      watchStatus: 'unwatched'
    });
    loadBookmarks();
  }
};

const statusCounts = computed(() => {
  const counts = { all: bookmarks.value.length, watching: 0, unwatched: 0, finished: 0 };
  bookmarks.value.forEach(item => {
    const st = getStatus(item);
    if (counts[st] !== undefined) counts[st]++;
  });
  return counts;
});

// 笔记编辑模态弹窗状态与方法
const editingNoteItem = ref(null);
const editingNoteText = ref('');
const noteTextareaRef = ref(null);

const openNoteModal = (item) => {
  editingNoteItem.value = item;
  editingNoteText.value = item.note || '';
  nextTick(() => {
    noteTextareaRef.value?.focus();
  });
};

const closeNoteModal = () => {
  editingNoteItem.value = null;
  editingNoteText.value = '';
};

const saveNoteFromModal = async () => {
  if (!editingNoteItem.value) return;
  const item = editingNoteItem.value;
  const newNote = editingNoteText.value.trim();
  item.note = newNote;
  if (window.electronAPI) {
    await window.electronAPI.bookmarksUpdate(item.id, { note: newNote });
    loadBookmarks();
  }
  closeNoteModal();
};

const clearNoteFromModal = async () => {
  if (!editingNoteItem.value) return;
  const item = editingNoteItem.value;
  item.note = '';
  if (window.electronAPI) {
    await window.electronAPI.bookmarksUpdate(item.id, { note: '' });
    loadBookmarks();
  }
  closeNoteModal();
};

const loadBookmarks = async () => {
  if (window.electronAPI) {
    const res = await window.electronAPI.bookmarksGetAll();
    if (res.success) bookmarks.value = res.data || [];
  }
};

const handleDocClick = () => {
  if (activeStatusMenuId.value) {
    activeStatusMenuId.value = null;
  }
};

onMounted(() => {
  loadBookmarks();
  document.addEventListener('click', handleDocClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleDocClick);
});

const filteredList = computed(() => {
  let list = [...bookmarks.value];
  if (currentFilter.value !== 'all') {
    list = list.filter(b => getStatus(b) === currentFilter.value);
  }
  if (searchText.value) {
    const t = searchText.value.toLowerCase();
    list = list.filter(b => (b.title && b.title.toLowerCase().includes(t)) || (b.bv && b.bv.toLowerCase().includes(t)));
  }
  return list.sort((a, b) => b.createdAt - a.createdAt);
});

const handleJump = (item) => emit('jump', item);
const handleDelete = async (item) => {
  if (confirm(`确定删除 "${item.title}"？`)) {
    if (window.electronAPI) {
      await window.electronAPI.bookmarksRemove(item.id);
      loadBookmarks();
    }
  }
};
const onImgError = (e) => { e.target.style.display = 'none'; };
const formatTime = (sec) => {
  sec = Math.floor(sec || 0);
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = sec%60, pad=n=>n<10?'0'+n:''+n;
  return h>0?`${h}:${pad(m)}:${pad(s)}`:`${m}:${pad(s)}`;
};
const formatDate = (ts) => {
  if(!ts) return ''; const d = new Date(ts);
  return `${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`;
};
const stringToGradient = (str) => {
  let hash = 0;
  for(let i=0;i<str.length;i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c1 = `hsl(${hash%360}, 70%, 65%)`;
  const c2 = `hsl(${(hash+60)%360}, 70%, 55%)`;
  return `linear-gradient(135deg, ${c1}, ${c2})`;
};
</script>

<style scoped>
/* === 容器样式 === */
.bookmark-overlay-card {
  width: 780px;
  max-width: 92vw;
  height: auto !important;
  max-height: 85vh;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.98); 
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 0 !important; /* 彻底消除父级 .overlay-card 带来的叠加 padding */
}

/* 深色模式适配 */
:global(body.theme-dark) .bookmark-overlay-card {
  background: #1a1a1a;
  border: 1px solid #333;
  color: #fff;
}

/* === 头部 === */
.overlay-header {
  padding: 16px 18px 8px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left { display: flex; align-items: center; gap: 8px; }
.overlay-title { font-size: 17px; font-weight: 700; letter-spacing: -0.3px; }
.badge { 
  background: rgba(0, 0, 0, 0.06); padding: 2px 8px; 
  border-radius: 10px; font-size: 12px; font-weight: 600; color: #666; 
}
:global(body.theme-dark) .badge { background: rgba(255, 255, 255, 0.15); color: #ccc; }

.overlay-close {
  border: none; background: transparent; font-size: 22px; line-height: 1;
  color: #999; cursor: pointer; transition: color 0.2s; padding: 2px 6px;
}
.overlay-close:hover { color: #f56c6c; }

/* === 搜索与状态筛选 === */
.search-container { padding: 4px 18px 10px 18px; }
.search-wrapper {
  position: relative; display: flex; align-items: center;
}
.search-icon {
  position: absolute; left: 12px; opacity: 0.4; font-size: 14px; pointer-events: none;
}
.modern-input {
  width: 100%; padding: 8px 12px 8px 34px;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px; font-size: 13px; color: inherit;
  transition: all 0.2s;
}
.modern-input:focus {
  background: #fff; border-color: #409eff; box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15); outline: none;
}
:global(body.theme-dark) .modern-input {
  background: rgba(255, 255, 255, 0.08);
}
:global(body.theme-dark) .modern-input:focus {
  background: rgba(0, 0, 0, 0.3);
}

/* 顶部状态筛选药丸 */
.filter-pills {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(0, 0, 0, 0.04);
  font-size: 11px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.15s ease;
  line-height: 1.4;
}
.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.pill-dot-watching { background: #2b7fff; }
.pill-dot-unwatched { background: #888; }
.pill-dot-finished { background: #529b2e; }

.pill-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #333;
}
.pill-btn.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.25);
}
.pill-btn.active .pill-dot {
  background: #fff !important;
}

:global(body.theme-dark) .pill-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #bbb;
}
:global(body.theme-dark) .pill-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
:global(body.theme-dark) .pill-btn.active {
  background: #409eff;
  color: #fff;
}

/* === 列表 === */
.bookmark-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 20px 14px;
  max-height: calc(85vh - 110px);
}

/* 自定义滚动条 */
.bookmark-list::-webkit-scrollbar {
  width: 6px;
}
.bookmark-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}
.bookmark-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}
:global(body.theme-dark) .bookmark-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
}

/* 单个卡片 */
.b-card {
  display: flex; 
  align-items: center;
  padding: 8px 10px; 
  margin-bottom: 6px; 
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer; 
  position: relative;
  transition: none !important;
  background: transparent;
}

/* 当下拉菜单展开时，提升当前卡片的层叠上下文，避免被后续卡片盖住 */
.b-card.menu-open {
  z-index: 50;
}

.b-card:hover {
  background: #f4f5f7; 
  border-color: #e5e7eb;
}

:global(body.theme-dark) .b-card { 
  background: transparent;
  border-color: transparent;
}

:global(body.theme-dark) .b-card:hover { 
  background: #2a2a2a; 
  border-color: #3d3d3d;
}

/* 渲染隔离与事件穿透控制 */
.b-info, .b-cover {
  pointer-events: none;
}
.b-actions, .btn-icon-action, .b-note, .status-selector, .tag-status, .status-popover, .status-opt {
  pointer-events: auto;
}

/* 封面 */
.b-cover {
  width: 116px;
  height: 65px;
  border-radius: 6px; 
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  margin-right: 12px;
  background: #eee;
}
.gradient-bg { width: 100%; height: 100%; opacity: 0.8; }
.real-img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
}
.play-overlay {
  position: absolute; inset: 0; background: rgba(0, 0, 0, 0.3);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 18px; opacity: 0; transition: opacity 0.2s;
}
.b-card:hover .play-overlay { opacity: 1; }

/* 封面已看完徽标 */
.cover-finished-tag {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(103, 194, 58, 0.92);
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
  z-index: 2;
}

/* 信息 */
.b-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}
.b-title {
  font-size: 14px;
  font-weight: 600;
  color: #222;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}
:global(body.theme-dark) .b-title { color: #f0f0f0; }

.b-part-sub {
  color: #888;
  font-weight: 400;
  font-size: 12px;
}
:global(body.theme-dark) .b-part-sub {
  color: #aaa;
}

.b-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: #888;
}
.tag { padding: 1px 6px; border-radius: 4px; font-weight: 500; font-size: 11px; }
.tag-page { background: rgba(230, 162, 60, 0.12); color: #e6a23c; }
.tag-time { background: rgba(64, 158, 255, 0.12); color: #409eff; }

/* 状态选择器与胶囊（无 emoji，点标提示） */
.status-selector {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.tag-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  background: transparent;
  line-height: 1.4;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.status-text {
  font-size: 11px;
}
.status-arrow {
  font-size: 9px;
  opacity: 0.6;
  margin-left: 1px;
}
.tag-status:hover {
  filter: brightness(0.92);
}

/* 各状态点标与标签颜色 */
.status-unwatched {
  background: rgba(140, 140, 140, 0.12);
  color: #666;
  border-color: rgba(140, 140, 140, 0.25);
}
.status-unwatched .status-dot { background: #888; }

.status-watching {
  background: rgba(64, 158, 255, 0.12);
  color: #2b7fff;
  border-color: rgba(64, 158, 255, 0.28);
}
.status-watching .status-dot { background: #2b7fff; }

.status-finished {
  background: rgba(103, 194, 58, 0.15);
  color: #529b2e;
  border-color: rgba(103, 194, 58, 0.32);
}
.status-finished .status-dot { background: #529b2e; }

:global(body.theme-dark) .status-unwatched {
  background: rgba(160, 160, 160, 0.16);
  color: #bbb;
  border-color: rgba(160, 160, 160, 0.25);
}
:global(body.theme-dark) .status-unwatched .status-dot { background: #aaa; }

:global(body.theme-dark) .status-watching {
  background: rgba(64, 158, 255, 0.2);
  color: #66b1ff;
  border-color: rgba(64, 158, 255, 0.35);
}
:global(body.theme-dark) .status-watching .status-dot { background: #66b1ff; }

:global(body.theme-dark) .status-finished {
  background: rgba(103, 194, 58, 0.2);
  color: #85ce61;
  border-color: rgba(103, 194, 58, 0.35);
}
:global(body.theme-dark) .status-finished .status-dot { background: #85ce61; }

/* 状态下拉浮层（无 emoji） */
.status-popover {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 100;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 4px;
  min-width: 165px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.status-popover.popover-up {
  top: auto;
  bottom: calc(100% + 4px);
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.15);
}

:global(body.theme-dark) .status-popover {
  background: #252525;
  border-color: #404040;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}
:global(body.theme-dark) .status-popover.popover-up {
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.45);
}

.status-opt {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  border-radius: 5px;
  font-size: 11px;
  color: #444;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
:global(body.theme-dark) .status-opt {
  color: #ddd;
}
.status-opt:hover {
  background: #f2f3f5;
}
:global(body.theme-dark) .status-opt:hover {
  background: #333;
}
.status-opt.selected {
  font-weight: 600;
  background: rgba(64, 158, 255, 0.08);
}
:global(body.theme-dark) .status-opt.selected {
  background: rgba(64, 158, 255, 0.18);
}
.status-opt-finished.selected {
  background: rgba(103, 194, 58, 0.08);
}
:global(body.theme-dark) .status-opt-finished.selected {
  background: rgba(103, 194, 58, 0.18);
}

.opt-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.opt-dot-watching { background: #2b7fff; }
.opt-dot-finished { background: #529b2e; }
.opt-dot-unwatched { background: #888; }

.opt-label {
  flex: 1;
}
.opt-check {
  font-size: 11px;
  color: #409eff;
  font-weight: bold;
}
.status-opt-finished .opt-check {
  color: #67c23a;
}

/* 分割线与快捷分集切换按钮 */
.popover-divider {
  height: 1px;
  background: #ebeef5;
  margin: 3px 0;
}
:global(body.theme-dark) .popover-divider {
  background: #3a3a3a;
}

.status-opt-switch {
  color: #409eff;
  font-size: 11px;
}
:global(body.theme-dark) .status-opt-switch {
  color: #66b1ff;
}
.status-opt-switch:hover {
  background: rgba(64, 158, 255, 0.1);
}
:global(body.theme-dark) .status-opt-switch:hover {
  background: rgba(64, 158, 255, 0.2);
}

.opt-icon-svg {
  flex-shrink: 0;
}

/* 浮层动画 */
.fade-pop-enter-active,
.fade-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fade-pop-enter-from,
.fade-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.date-text { margin-left: auto; opacity: 0.75; font-size: 12px; white-space: nowrap; }
:global(body.theme-dark) .date-text { color: #aaa; }

/* 操作按钮区 */
.b-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  flex-shrink: 0;
}
.btn-icon-action {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s, background-color 0.15s;
}
.b-card:hover .btn-icon-action {
  opacity: 1;
}
.btn-icon-note {
  color: #888;
}
.btn-icon-note:hover {
  background: rgba(64, 158, 255, 0.12);
  color: #409eff;
}
.btn-icon-delete {
  color: #999;
}
.btn-icon-delete:hover {
  background: rgba(245, 108, 108, 0.12);
  color: #f56c6c;
}
:global(body.theme-dark) .btn-icon-note { color: #aaa; }
:global(body.theme-dark) .btn-icon-note:hover {
  background: rgba(64, 158, 255, 0.2);
  color: #66b1ff;
}
:global(body.theme-dark) .btn-icon-delete { color: #888; }
:global(body.theme-dark) .btn-icon-delete:hover {
  background: rgba(245, 108, 108, 0.2);
  color: #ff7875;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center; 
  justify-content: center;
  padding: 36px 0;
  color: #999;
}
.empty-icon { font-size: 40px; margin-bottom: 8px; opacity: 0.5; }
.empty-text { font-size: 13px; }

/* 卡片上的微型笔记引用条（清爽不破坏高度，点击直接唤起编辑弹窗） */
.b-note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: #666;
  font-size: 11px;
  cursor: pointer;
  max-width: 100%;
  margin-top: 3px;
  transition: all 0.15s ease;
}
.b-note:hover {
  background: rgba(64, 158, 255, 0.08);
  border-color: rgba(64, 158, 255, 0.25);
  color: #2b7fff;
}
:global(body.theme-dark) .b-note {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
  color: #aaa;
}
:global(body.theme-dark) .b-note:hover {
  background: rgba(64, 158, 255, 0.15);
  border-color: rgba(64, 158, 255, 0.35);
  color: #66b1ff;
}
.note-icon-svg {
  flex-shrink: 0;
  opacity: 0.75;
}
.note-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 520px;
}

/* 专属轻量笔记编辑模态弹窗 */
.note-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}
.note-modal-card {
  width: 440px;
  max-width: 90%;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25);
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modal-scale-in 0.18s ease-out;
}
:global(body.theme-dark) .note-modal-card {
  background: #242424;
  border-color: #3d3d3d;
  color: #fff;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
}
@keyframes modal-scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.note-modal-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
:global(body.theme-dark) .note-modal-header {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}
.note-modal-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}
.note-modal-badge {
  font-size: 11px;
  font-weight: normal;
  color: #888;
  background: rgba(0, 0, 0, 0.04);
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 4px;
}
:global(body.theme-dark) .note-modal-badge {
  background: rgba(255, 255, 255, 0.08);
  color: #aaa;
}
.note-modal-close {
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  color: #999;
  cursor: pointer;
  padding: 2px 4px;
}
.note-modal-close:hover { color: #f56c6c; }
.note-modal-body {
  padding: 12px 16px;
}
.note-modal-textarea {
  width: 100%;
  min-height: 110px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  font-size: 13px;
  line-height: 1.5;
  font-family: inherit;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
  background: #fafafa;
  color: #333;
  transition: all 0.2s;
}
.note-modal-textarea:focus {
  background: #fff;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
}
:global(body.theme-dark) .note-modal-textarea {
  background: #1e1e1e;
  border-color: #444;
  color: #eee;
}
:global(body.theme-dark) .note-modal-textarea:focus {
  background: #1a1a1a;
  border-color: #409eff;
}
.note-modal-footer {
  padding: 10px 16px 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}
:global(body.theme-dark) .note-modal-footer {
  background: rgba(255, 255, 255, 0.02);
  border-top-color: rgba(255, 255, 255, 0.06);
}
.btn-note-clear {
  border: none;
  background: transparent;
  color: #f56c6c;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}
.btn-note-clear:hover {
  background: rgba(245, 108, 108, 0.1);
}
.note-modal-btn-group {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.btn-note-cancel, .btn-note-save {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.btn-note-cancel {
  background: transparent;
  border-color: #dcdfe6;
  color: #666;
}
.btn-note-cancel:hover {
  background: rgba(0, 0, 0, 0.04);
}
:global(body.theme-dark) .btn-note-cancel {
  border-color: #444;
  color: #aaa;
}
:global(body.theme-dark) .btn-note-cancel:hover {
  background: rgba(255, 255, 255, 0.06);
}
.btn-note-save {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}
.btn-note-save:hover {
  background: #66b1ff;
}

/* 模态淡入淡出动画 */
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.2s ease;
}
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}
</style>