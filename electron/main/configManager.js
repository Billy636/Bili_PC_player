// src/main/configManager.js - 配置文件管理模块
import fs from 'fs';
import path from 'path';
import os from 'os';

// 配置文件路径
const CONFIG_DIR = path.join(os.homedir(), '.bilibili-player');
const CONFIG_FILE = 'config.json';
const CONFIG_PATH = path.join(CONFIG_DIR, CONFIG_FILE);

// 默认配置
const DEFAULT_CONFIG = {
  pauseKey: '`',
  backKey: '5', 
  forwardKey: '6',
  seekSeconds: 3,
  themeStyle: 'default'
};

class ConfigManager {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.ensureConfigDir();
    this.loadConfig();
  }

  /**
   * 确保配置目录存在
   */
  ensureConfigDir() {
    try {
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
        console.log('[ConfigManager] 创建配置目录:', CONFIG_DIR);
      }
    } catch (err) {
      console.error('[ConfigManager] 创建配置目录失败:', err);
    }
  }

  /**
   * 加载配置文件
   */
  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const data = fs.readFileSync(CONFIG_PATH, 'utf8');
        const loadedConfig = JSON.parse(data);
        
        // 合并配置（保留默认值中的缺失项）
        this.config = { ...DEFAULT_CONFIG, ...loadedConfig };
        console.log('[ConfigManager] 配置加载成功:', CONFIG_PATH);
      } else {
        console.log('[ConfigManager] 配置文件不存在，使用默认配置');
        this.saveConfig(); // 创建默认配置文件
      }
    } catch (err) {
      console.error('[ConfigManager] 加载配置失败:', err);
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  /**
   * 保存配置到文件
   */
  saveConfig() {
    try {
      const configData = JSON.stringify(this.config, null, 2);
      fs.writeFileSync(CONFIG_PATH, configData, 'utf8');
      console.log('[ConfigManager] 配置保存成功:', CONFIG_PATH);
      return true;
    } catch (err) {
      console.error('[ConfigManager] 保存配置失败:', err);
      return false;
    }
  }

  /**
   * 获取完整配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 更新配置（部分更新）
   */
  updateConfig(partialConfig) {
    const validKeys = Object.keys(DEFAULT_CONFIG);
    let hasChanges = false;

    for (const [key, value] of Object.entries(partialConfig)) {
      if (validKeys.includes(key) && value !== undefined) {
        // 特殊验证
        if (key === 'seekSeconds') {
          if (typeof value === 'number' && value > 0) {
            this.config.seekSeconds = Math.floor(value);
            hasChanges = true;
          }
        } else if (key === 'themeStyle') {
          if (typeof value === 'string' && value.trim()) {
            this.config.themeStyle = value.trim();
            hasChanges = true;
          }
        } else {
          // 字符串类型的配置项
          if (typeof value === 'string' && value.trim()) {
            this.config[key] = value.trim();
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      this.saveConfig();
      console.log('[ConfigManager] 配置已更新:', partialConfig);
    }

    return this.getConfig();
  }

  /**
   * 获取单个配置项
   */
  get(key) {
    return this.config[key];
  }

  /**
   * 设置单个配置项
   */
  set(key, value) {
    return this.updateConfig({ [key]: value });
  }

  /**
   * 重置为默认配置
   */
  resetToDefault() {
    this.config = { ...DEFAULT_CONFIG };
    this.saveConfig();
    console.log('[ConfigManager] 配置已重置为默认值');
    return this.getConfig();
  }

  /**
   * 获取配置文件路径（调试用）
   */
  getConfigPath() {
    return CONFIG_PATH;
  }
}

// 创建单例实例
const configManager = new ConfigManager();

export default configManager;