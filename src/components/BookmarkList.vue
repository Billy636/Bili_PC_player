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

          <!-- 笔记按钮（无笔记时显示） -->
          <button 
            v-if="!item.note && editingNoteId !== item.id" 
            class="btn-icon-note" 
            @click.stop="startEditNote(item)" 
            title="添加笔记"
          >📝</button>

          <button class="btn-icon-delete" @click.stop="handleDelete(item)" title="删除">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
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
/* 容器：移除毛玻璃，改为近乎不透明的纯色背景 */
.bookmark-overlay-card {
  width: 800px;
  height: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  
  /* ❌ 移除 backdrop-filter: blur(20px); 这是最卡的地方 */
  /* ✅ 改为高不透明度背景，保证清晰且渲染极快 */
  background: rgba(255, 255, 255, 0.98); 
  
  border: 1px solid #e0e0e0;
  border-radius: 12px; /* 圆角稍微改小一点，更利落 */
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

/* 深色模式适配 */
:global(body.theme-dark) .bookmark-overlay-card {
  background: #1a1a1a; /* 纯色深黑 */
  border: 1px solid #333;
  color: #fff;
}

/* === 头部 === */
.overlay-header {
  padding: 20px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-left { display: flex; align-items: center; gap: 8px; }
.overlay-title { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }
.badge { 
  background: rgba(0,0,0,0.06); padding: 2px 8px; 
  border-radius: 10px; font-size: 12px; font-weight: 600; color: #666; 
}
:global(body.theme-dark) .badge { background: rgba(255,255,255,0.15); color: #ccc; }

.overlay-close {
  border: none; background: transparent; font-size: 24px; line-height: 1;
  color: #999; cursor: pointer; transition: color 0.2s;
}
.overlay-close:hover { color: #f56c6c; }

/* === 搜索 === */
.search-container { padding: 16px 24px; }
.search-wrapper {
  position: relative; display: flex; align-items: center;
}
.search-icon {
  position: absolute; left: 12px; opacity: 0.4; font-size: 14px; pointer-events: none;
}
.modern-input {
  width: 100%; padding: 10px 12px 10px 36px;
  border: 1px solid transparent;
  background: rgba(0,0,0,0.04);
  border-radius: 10px; font-size: 14px; color: inherit;
  transition: all 0.2s;
}
.modern-input:focus {
  background: #fff; border-color: #409eff; box-shadow: 0 0 0 3px rgba(64,158,255,0.15); outline: none;
}
:global(body.theme-dark) .modern-input {
  background: rgba(255,255,255,0.1);
}
:global(body.theme-dark) .modern-input:focus {
  background: rgba(0,0,0,0.3);
}

/* === 列表 === */
.bookmark-list {
  flex: 1; overflow-y: auto; padding: 0 24px 24px 24px;
}

/* 单个卡片 */
/* web_V2.0/src/components/BookmarkList.vue (style scoped) */

/* 卡片：极致性能优化版 */
.b-card {
  display: flex; 
  align-items: center;
  padding: 10px; 
  margin-bottom: 8px; 
  border-radius: 8px;
  border: 1px solid transparent; /* 预留边框位置避免抖动 */
  cursor: pointer; 
  position: relative;
  
  /* ❌ 移除所有 transition，实现 0ms 响应 */
  transition: none !important;
  
  /* 🚀 核心优化：渲染隔离 */
  /* 告诉浏览器这个元素的布局和绘制是独立的，hover 时不会影响父容器 */
  contain: layout paint style; 
  
  /* 避免默认的透明背景导致混合计算，直接给一个显式背景（可选，视情况而定） */
  background: transparent;
}

/* 悬停状态：高对比度纯色，瞬间切换 */
.b-card:hover {
  background: #f2f3f5; 
  border-color: #dcdfe6;
}

/* === 深色模式专属优化 === */
:global(body.theme-dark) .b-card { 
  /* 深色模式下，默认背景保持透明 */
  background: transparent;
  border-color: transparent;
}

:global(body.theme-dark) .b-card:hover { 
  /* ⚡️ 悬停时：使用高亮深灰，且不使用半透明 */
  background: #333333; 
  border-color: #4c4c4c;
}

/* 针对内部元素的优化：防止文字/图片在父级 hover 时发生重绘 */
.b-info, .b-cover, .btn-icon-delete {
  pointer-events: none; /* 让鼠标事件直接穿透到 card，减少事件冒泡处理 */
}
/* 但要允许点击删除按钮和笔记区域 */
.btn-icon-delete, .b-note {
  pointer-events: auto;
}

/* 封面 */
.b-cover {
  width: 120px; height: 68px; border-radius: 8px; 
  overflow: hidden; position: relative; flex-shrink: 0; margin-right: 16px;
  background: #eee;
}
.gradient-bg { width: 100%; height: 100%; opacity: 0.8; }
.real-img {
  position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
}
.play-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.3);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 20px; opacity: 0; transition: opacity 0.2s;
}
.b-card:hover .play-overlay { opacity: 1; }

/* 信息 */
.b-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.b-title {
  font-size: 15px; font-weight: 600; color: #333;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
:global(body.theme-dark) .b-title { color: #eee; }

.b-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #888; }
.tag { padding: 2px 6px; border-radius: 4px; font-weight: 500; font-size: 11px; }
.tag-page { background: rgba(230,162,60,0.1); color: #e6a23c; }
.tag-time { background: rgba(64,158,255,0.1); color: #409eff; }
.date-text { margin-left: auto; opacity: 0.7; }

/* 删除按钮 */
.btn-icon-delete {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  background: transparent; color: #ccc; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; opacity: 0; transform: translateX(10px);
}
.btn-icon-delete:hover { background: rgba(245,108,108,0.1); color: #f56c6c; }
.b-card:hover .btn-icon-delete { opacity: 1; transform: translateX(0); }

/* 空状态 */
.empty-state {
  display: flex; flex-direction: column; align-items: center; 
  justify-content: center; height: 200px; color: #999;
}
.empty-icon { font-size: 48px; margin-bottom: 10px; opacity: 0.5; }

/* 笔记区域 */
.b-note { margin-top: 6px; }
.note-display {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 8px; background: rgba(103, 194, 58, 0.1);
  border-radius: 4px; cursor: pointer; font-size: 12px; color: #67c23a;
  max-width: 100%;
}
.note-display:hover { background: rgba(103, 194, 58, 0.2); }
.note-icon { flex-shrink: 0; }
.note-text { 
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
  max-width: 400px;
}
:global(body.theme-dark) .note-display { 
  background: rgba(103, 194, 58, 0.15); 
  color: #85ce61; 
}

/* 笔记编辑 */
.note-edit-container { display: flex; flex-direction: column; gap: 6px; }
.note-input {
  width: 100%; min-height: 50px; max-height: 100px; padding: 8px;
  border: 1px solid #dcdfe6; border-radius: 6px;
  font-size: 12px; resize: vertical; font-family: inherit;
  background: #fff; color: #333;
}
.note-input:focus { border-color: #67c23a; outline: none; box-shadow: 0 0 0 2px rgba(103,194,58,0.15); }
:global(body.theme-dark) .note-input { 
  background: #2a2a2a; border-color: #444; color: #eee; 
}
.note-actions { display: flex; gap: 6px; }
.note-btn {
  padding: 4px 12px; border: none; border-radius: 4px;
  font-size: 12px; cursor: pointer; transition: opacity 0.2s;
}
.note-btn:hover { opacity: 0.85; }
.note-save { background: #67c23a; color: #fff; }
.note-cancel { background: #eee; color: #666; }
:global(body.theme-dark) .note-cancel { background: #3a3a3a; color: #ccc; }

/* 笔记按钮 */
.btn-icon-note {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  background: transparent; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s; flex-shrink: 0;
}
.btn-icon-note:hover { background: rgba(103,194,58,0.1); }
.b-card:hover .btn-icon-note { opacity: 1; }
</style>