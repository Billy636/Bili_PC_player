<template>
  <div class="overlay-mask" @click.self="$emit('close')">
    <div class="overlay-card settings-card">
      
      <div class="overlay-header">
        <div class="overlay-title">偏好设置</div>
      </div>

      <div class="overlay-body">
        <div class="setting-group">
          <div class="group-title">快捷键控制</div>
          
          <div class="form-grid">
            <div class="form-item">
              <label>播放 / 暂停</label>
              <input type="text" v-model="form.pauseKey" class="modern-input" placeholder="~" />
            </div>
            <div class="form-item">
              <label>快退 (秒)</label>
              <input type="text" v-model="form.backKey" class="modern-input" placeholder="5" />
            </div>
            <div class="form-item">
              <label>快进 (秒)</label>
              <input type="text" v-model="form.forwardKey" class="modern-input" placeholder="6" />
            </div>
            <div class="form-item">
              <label>跳跃步长 (秒)</label>
              <input type="number" v-model.number="form.seekSeconds" class="modern-input" min="1" />
            </div>
          </div>
        </div>

        <div class="setting-group">
          <div class="group-title">外观风格</div>
          <div class="theme-selector">
            <select v-model="form.themeStyle" @change="applyPreview" class="modern-select">
              <option value="default">🌞 默认明亮</option>
              <option value="dark">🌑 深色模式</option>
              <option value="light">⚪ 极致简约</option>
              <option value="tech">💠 科技蓝风</option>
            </select>
            <div class="select-arrow">▼</div>
          </div>
        </div>
      </div>

      <div class="overlay-footer">
        <button class="btn btn-text" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="saveConfig">保存更改</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// ... (逻辑与之前完全一致，直接保留即可) ...
import { ref, onMounted, reactive } from 'vue';
const emit = defineEmits(['close', 'theme-change']);
const form = reactive({ pauseKey: '', backKey: '', forwardKey: '', seekSeconds: 3, themeStyle: 'default' });
onMounted(async () => {
  if (window.electronAPI) {
    const config = await window.electronAPI.getHotkeyConfig();
    if (config) Object.assign(form, config);
  }
});
const applyPreview = () => emit('theme-change', form.themeStyle);
const saveConfig = async () => {
  if (window.electronAPI) await window.electronAPI.updateHotkeyConfig({ ...form });
  emit('close');
};
</script>

<style scoped>
/* === 卡片主体 === */
.settings-card {
  width: 400px;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transition: background 0.3s, color 0.3s; /* 添加过渡效果 */
}

/* 深色模式：卡片背景变黑 */
:global(body.theme-dark) .settings-card {
  background: #222;
  color: #fff;
}

/* === 标题与文字 === */
.overlay-header { margin-bottom: 20px; }
.overlay-title { font-size: 20px; font-weight: 700; }

.setting-group { margin-bottom: 24px; }
.group-title {
  font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 1px;
  margin-bottom: 12px; font-weight: 600;
}

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
}

.form-item label {
  display: block; font-size: 12px; color: #666; margin-bottom: 6px;
}
:global(body.theme-dark) .form-item label { color: #aaa; }

/* === 输入框与下拉框 (核心修复) === */
.modern-input,
.modern-select {
  width: 100%; 
  padding: 8px 12px; 
  border-radius: 8px;
  border: 1px solid #ddd; 
  background: #f9f9f9; /* 默认浅色背景 */
  font-size: 14px; 
  color: #333;         /* 默认深色文字 */
  outline: none;
  transition: all 0.2s;
}

.modern-input:focus,
.modern-select:focus {
  border-color: #409eff; 
  background: #fff;
  box-shadow: 0 0 0 3px rgba(64,158,255,0.1);
}

/* 自定义 Select 容器 */
.theme-selector { position: relative; }
.modern-select { appearance: none; cursor: pointer; }
.select-arrow {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 10px; color: #999; pointer-events: none;
}

/* === 深色模式适配 (修复白底白字问题) === */
:global(body.theme-dark) .modern-input,
:global(body.theme-dark) .modern-select {
  background-color: #333 !important; /* 强制覆盖背景 */
  border-color: #444 !important;
  color: #fff !important;            /* 强制文字变白 */
}

:global(body.theme-dark) .modern-input:focus,
:global(body.theme-dark) .modern-select:focus {
  background-color: #2a2a2a !important;
  border-color: #409eff !important;
}

/* 修复下拉选项在 Windows/Chrome 下可能是白色的问题 */
:global(body.theme-dark) option {
  background-color: #222;
  color: #fff;
}

/* === 按钮样式 === */
.overlay-footer {
  display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;
}
.btn {
  padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500;
  cursor: pointer; border: none; transition: all 0.2s;
}

/* 取消按钮 */
.btn-text { background: transparent; color: #666; }
.btn-text:hover { background: rgba(0,0,0,0.05); }
:global(body.theme-dark) .btn-text { color: #aaa; }
:global(body.theme-dark) .btn-text:hover { background: rgba(255,255,255,0.1); }

/* 保存按钮 */
.btn-primary {
  background: #409eff; color: white;
  box-shadow: 0 4px 10px rgba(64,158,255,0.3);
}
.btn-primary:hover { background: #66b1ff; transform: translateY(-1px); }
.btn-primary:active { transform: translateY(0); }
</style>