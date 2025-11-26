/**
 * 该模块只关心两件事：
 * 1. 保存当前 B 站 webview 对应的 webContents
 * 2. 在该 webContents 内执行控制 <video> 的脚本
 */

let videoWebContents = null;

/**
 * 由 main.js 在 did-attach-webview 时调用
 * @param {Electron.WebContents} webContents
 */
export function setVideoWebContents(webContents) {
  videoWebContents = webContents;
  console.log('[bilibiliController] bind webview webContents success');
}

/**
 * 在 B 站页面上下文中，找到“主视频”元素
 * 简单策略：
 *  - 先找所有 <video>
 *  - 优先返回 duration > 0 且可播放的那个，否则退回第一个
 * 这里的逻辑写在注入脚本内部
 */
function buildFindVideoScript(extraBodyJs) {
  return `
    (function() {
      const videos = Array.from(document.querySelectorAll('video'));
      if (!videos.length) {
        return { ok: false, reason: 'no-video-element' };
      }
      let mainVideo = null;
      for (const v of videos) {
        if (!Number.isNaN(v.duration) && v.duration > 0) {
          mainVideo = v;
          break;
        }
      }
      if (!mainVideo) {
        mainVideo = videos[0];
      }
      if (!mainVideo) {
        return { ok: false, reason: 'no-main-video' };
      }

      ${extraBodyJs}

      return { ok: true };
    })();
  `;
}

/**
 * 切换播放 / 暂停
 */
export function togglePlayPause() {
  if (!videoWebContents) {
    console.warn('[bilibiliController] not bind webview yet，ignore play/pause action');
    return;
  }

  const script = buildFindVideoScript(`
    if (mainVideo.paused) {
      mainVideo.play();
    } else {
      mainVideo.pause();
    }
  `);

  videoWebContents.executeJavaScript(script).catch(err => {
    console.error('[bilibiliController] togglePlayPause 执行失败:', err);
  });
}

/**
 * 相对当前位置快进 / 快退若干秒
 * @param {number} offsetSeconds 正数为前进，负数为后退
 */
export function seekRelativeSeconds(offsetSeconds) {
  if (!videoWebContents) {
    console.warn('[bilibiliController] 尚未绑定 webview，忽略快进/快退操作');
    return;
  }

  const script = buildFindVideoScript(`
    const duration = Number.isNaN(mainVideo.duration) ? Infinity : mainVideo.duration;
    const current = Number.isNaN(mainVideo.currentTime) ? 0 : mainVideo.currentTime;
    let target = current + (${offsetSeconds});
    if (target < 0) target = 0;
    if (duration !== Infinity && target > duration) {
      target = duration;
    }
    mainVideo.currentTime = target;
  `);

  videoWebContents.executeJavaScript(script).catch(err => {
    console.error('[bilibiliController] seekRelativeSeconds 执行失败:', err);
  });
}
