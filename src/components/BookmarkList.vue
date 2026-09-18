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
      </div>

      <div class="bookmark-list custom-scroll">
        <div v-if="filteredList.length === 0" class="empty-state">
          <div class="empty-icon">📂</div>
          <div class="empty-text">{{ searchText ? '未找到相关视频' : '暂无书签，快去添加吧' }}</div>
        </div>

        <div 
          v-for="item in filteredList" 
          :key="item.id" 
          class="b-card"
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
          </div>

          <div class="b-info">
            <div class="b-title" :title="item.title">{{ item.title }}</div>
            
            <div class="b-meta">
              <span class="tag tag-page">P{{ item.page || 1 }}</span>
              <span class="tag tag-time">{{ formatTime(item.currentTime) }}</span>
              <span class="date-text">{{ formatDate(item.createdAt) }}</span>
            </div>

            <!-- 笔记区域 -->
            <div class="b-note" v-if="item.note || editingNoteId === item.id">
              <div v-if="editingNoteId === item.id" class="note-edit-container" @click.stop>
                <textarea 
                  class="note-input"
                  v-model="editingNoteText"
                  placeholder="记录你的笔记..."
                  @keydown.ctrl.enter="saveNote(item)"
                  @click.stop
                  @mousedown.stop
                ></textarea>
                <div class="note-actions">
                  <button class="note-btn note-save" @click.stop="saveNote(item)">保存</button>
                  <button class="note-btn note-cancel" @click.stop="cancelEditNote">取消</button>
                </div>
              </div>
              <div v-else class="note-display" @click.stop="startEditNote(item)">
                <span class="note-icon">📝</span>
                <span class="note-text">{{ item.note }}</span>
              </div>
            </div>
          </div>

          <div class="b-actions" @click.stop>
            <!-- 笔记按钮（无笔记时显示） -->
            <button 
              v-if="!item.note && editingNoteId !== item.id" 
              class="btn-icon-action btn-icon-note" 
              @click.stop="startEditNote(item)" 
              title="添加笔记"
            >📝</button>

            <button class="btn-icon-action btn-icon-delete" @click.stop="handleDelete(item)" title="删除">
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';

const emit = defineEmits(['close', 'jump']);
const bookmarks = ref([]);
const searchText = ref('');
const searchInput = ref(null);

// 笔记编辑状态
const editingNoteId = ref(null);
const editingNoteText = ref('');

const startEditNote = (item) => {
  editingNoteId.value = item.id;
  editingNoteText.value = item.note || '';
};

const cancelEditNote = () => {
  editingNoteId.value = null;
  editingNoteText.value = '';
};

const saveNote = async (item) => {
  if (window.electronAPI) {
    await window.electronAPI.bookmarksUpdate(item.id, { note: editingNoteText.value });
    loadBookmarks();
  }
  cancelEditNote();
};
// 为了节省篇幅，这里的 JS 逻辑与上一版完全一致，请保留 loadBookmarks, filteredList, handleJump 等函数
// 仅需确保 stringToGradient 等工具函数存在
const loadBookmarks = async () => {
  if (window.electronAPI) {
    const res = await window.electronAPI.bookmarksGetAll();
    if (res.success) bookmarks.value = res.data || [];
  }
};
onMounted(() => {
  loadBookmarks();
  //自动聚焦
  //nextTick(() => searchInput.value?.focus());
});
const filteredList = computed(() => {
  if (!searchText.value) return [...bookmarks.value].sort((a, b) => b.createdAt - a.createdAt);
  const t = searchText.value.toLowerCase();
  return bookmarks.value.filter(b => (b.title && b.title.toLowerCase().includes(t)) || (b.bv && b.bv.toLowerCase().includes(t))).sort((a, b) => b.createdAt - a.createdAt);
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

/* === 搜索 === */
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

/* === 列表 === */
.bookmark-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px 14px 14px;
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
  contain: layout paint style; 
  background: transparent;
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
.b-actions, .btn-icon-action, .b-note {
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

.b-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #888;
}
.tag { padding: 1px 6px; border-radius: 4px; font-weight: 500; font-size: 11px; }
.tag-page { background: rgba(230, 162, 60, 0.12); color: #e6a23c; }
.tag-time { background: rgba(64, 158, 255, 0.12); color: #409eff; }
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
  font-size: 13px;
}
.btn-icon-note:hover {
  background: rgba(103, 194, 58, 0.15);
}
.btn-icon-delete {
  color: #999;
}
.btn-icon-delete:hover {
  background: rgba(245, 108, 108, 0.12);
  color: #f56c6c;
}
:global(body.theme-dark) .btn-icon-delete { color: #888; }
:global(body.theme-dark) .btn-icon-delete:hover {
  background: rgba(245, 108, 108, 0.2);
  color: #ff7875;
}
:global(body.theme-dark) .btn-icon-note:hover {
  background: rgba(103, 194, 58, 0.25);
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

/* 笔记区域 */
.b-note { margin-top: 3px; }
.note-display {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; background: rgba(103, 194, 58, 0.1);
  border-radius: 4px; cursor: pointer; font-size: 12px; color: #67c23a;
  max-width: 100%;
}
.note-display:hover { background: rgba(103, 194, 58, 0.2); }
.note-icon { flex-shrink: 0; }
.note-text { 
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
  max-width: 550px;
}
:global(body.theme-dark) .note-display { 
  background: rgba(103, 194, 58, 0.15); 
  color: #85ce61; 
}

/* 笔记编辑 */
.note-edit-container { display: flex; flex-direction: column; gap: 6px; }
.note-input {
  width: 100%; min-height: 48px; max-height: 96px; padding: 6px 8px;
  border: 1px solid #dcdfe6; border-radius: 6px;
  font-size: 12px; resize: vertical; font-family: inherit;
  background: #fff; color: #333;
}
.note-input:focus { border-color: #67c23a; outline: none; box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.15); }
:global(body.theme-dark) .note-input { 
  background: #2a2a2a; border-color: #444; color: #eee; 
}
.note-actions { display: flex; gap: 6px; }
.note-btn {
  padding: 3px 10px; border: none; border-radius: 4px;
  font-size: 12px; cursor: pointer; transition: opacity 0.2s;
}
.note-btn:hover { opacity: 0.85; }
.note-save { background: #67c23a; color: #fff; }
.note-cancel { background: #eee; color: #666; }
:global(body.theme-dark) .note-cancel { background: #3a3a3a; color: #ccc; }
</style>