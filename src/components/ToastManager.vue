<template>
  <TransitionGroup name="toast" tag="div" class="toast-container">
    <div 
      v-for="toast in toasts" 
      :key="toast.id" 
      class="toast-item"
      :class="toast.type"
    >
      <span class="icon">{{ getIcon(toast.type) }}</span>
      <span class="message">{{ toast.message }}</span>
    </div>
  </TransitionGroup>
</template>

<script setup>
import { ref } from 'vue';

const toasts = ref([]);
let idCounter = 0;

const getIcon = (type) => {
  switch(type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    default: return 'ℹ️';
  }
};

// 暴露给外部调用的方法
const add = (message, type = 'info', duration = 3000) => {
  const id = idCounter++;
  toasts.value.push({ id, message, type });
  
  setTimeout(() => {
    remove(id);
  }, duration);
};

const remove = (id) => {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index !== -1) toasts.value.splice(index, 1);
};

// 暴露方法给模板引用
defineExpose({ add });
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 60px; /* 在菜单栏下方 */
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none; /* 让鼠标穿透，不影响下方点击 */
}

.toast-item {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 10px 20px;
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  min-width: 200px;
  justify-content: center;
}

/* 类型配色 */
.toast-item.success { border: 1px solid #67c23a; color: #67c23a; background: #f0f9eb; }
.toast-item.error { border: 1px solid #f56c6c; color: #f56c6c; background: #fef0f0; }

/* 动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>