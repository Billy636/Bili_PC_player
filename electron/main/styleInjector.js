// electron/main/styleInjector.js

/**
 * 原始稳定版净化样式
 * 只使用性能消耗极低的简单选择器，确保 100% 稳定不白屏
 */
const PURIFY_CSS = `
  /* === 首页净化 === */
  
  /* 1. 隐藏首页左上角的巨大轮播图推荐 */
  .recommended-swipe {
    display: none !important;
  }
  
  /* 2. 隐藏原本轮播图右侧的置顶推荐卡片 */
  .bili-feed4 .top-btn-wrap {
    display: none !important;
  }

  /* 3. 强制调整 Grid 布局，让视频网格自动填补空白，防止出现空洞 */
  .bili-feed4 .bili-feed4-layout {
    grid-auto-flow: row dense !important;
  }

  /* 4. 隐藏视频卡片中的广告 (基础文字匹配) */
  .bili-video-card__info--ad,
  .ad-report {
    display: none !important;
  }
  
  /* 5. 隐藏右下角的浮动工具栏 (客服、回到顶部等) */
  .palette-button-wrap {
    display: none !important;
  }

  /* === 播放页净化 === */
  /* 隐藏视频下方的横幅广告 */
  #bannerAd,
  #slide_ad {
    display: none !important;
  }
`;

/**
 * 注入净化样式
 * @param {Electron.WebContents} webContents 
 */
export function injectPurifyStyles(webContents) {
  if (!webContents) return;

  // cssOrigin: 'user' 使得样式优先级更高
  webContents.insertCSS(PURIFY_CSS, { cssOrigin: 'user' }).catch(err => {
    console.error('[styleInjector] 样式注入失败:', err);
  });
  
  console.log('[styleInjector] 基础稳定版净化样式已注入');
}

module.exports = {
  injectPurifyStyles
};