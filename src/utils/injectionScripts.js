// 鼠标追踪与全屏检测脚本 (原 bilibiliIntegration.js)
export const INJECT_POLLING_SCRIPT = `
  (function () {
    try {
      // 1. 注入鼠标追踪器 (仅一次)
      if (!window.__BILI_MENU_HELPER_INSTALLED) {
        window.__BILI_MENU_HELPER_INSTALLED = true;
        window.__BILI_MOUSE_Y = 9999;
        document.addEventListener('mousemove', function (ev) {
          if (!ev) return;
          window.__BILI_MOUSE_Y = typeof ev.clientY === 'number' ? ev.clientY : 9999;
        }, { capture: true, passive: true });
      }

      // 2. 获取当前状态
      var container = document.querySelector('.bpx-player-container');
      var screen = container ? (container.getAttribute('data-screen') || 'normal') : 'none';
      
      return { 
        screen: screen, 
        mouseY: typeof window.__BILI_MOUSE_Y === 'number' ? window.__BILI_MOUSE_Y : 9999 
      };
    } catch (e) {
      return { screen: 'error', mouseY: 9999 };
    }
  })();
`;

// 视频信息采集脚本 (原 videoCollector.js)
export const INJECT_COLLECT_INFO_SCRIPT = `
  (function () {
    try {
      var url = location.href;
      var m = url.match(/\\/video\\/(BV[0-9A-Za-z]+)/);
      var bv = m ? m[1] : null;
      var pMatch = url.match(/[?&]p=(\\d+)/);
      var page = pMatch ? parseInt(pMatch[1], 10) : 1;
      
      var titleEl = document.querySelector('h1') || document.querySelector('.video-title') || null;
      var title = titleEl ? titleEl.innerText.trim() : document.title;
      
      var video = document.querySelector('video');
      var currentTime = video ? video.currentTime || 0 : 0;
      var duration = video ? video.duration || 0 : 0;

      // 封面提取
      var coverUrl = '';
      var metaOg = document.querySelector('meta[property="og:image"]');
      if (metaOg) coverUrl = metaOg.content;
      if (!coverUrl && window.__INITIAL_STATE__ && window.__INITIAL_STATE__.videoData) {
          coverUrl = window.__INITIAL_STATE__.videoData.pic;
      }
      if (coverUrl && coverUrl.startsWith('//')) {
          coverUrl = 'https:' + coverUrl;
      }

      return { 
          isHome: !bv, 
          url: url, 
          bv: bv, 
          page: page, 
          title: title, 
          currentTime: currentTime,
          duration: duration,
          coverUrl: coverUrl 
      };
    } catch (e) { 
      return { isHome: true, error: e.message }; 
    }
  })();
`;