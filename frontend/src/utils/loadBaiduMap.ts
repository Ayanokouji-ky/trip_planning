/** 百度地图 GL JS 脚本动态加载（单例 Promise） */

const AK = 'IwPC9IpdUBx2lRel17WexwWX3V4zEvQy';

/**
 * dev 环境走 vite 代理 /bmapgl（见 vite.config.ts），规避部分网络对 baidu.com 的拦截；
 * 生产构建使用百度官方 getscript 直链（不用 api?v=1.0 引导层，其 document.write 注入会被浏览器拦截）。
 */
const SCRIPT_URL = import.meta.env.DEV
  ? '/bmapgl'
  : `https://api.map.baidu.com/getscript?type=webgl&v=1.0&ak=${AK}&services=`;

let loadingPromise: Promise<void> | null = null;

export function loadBaiduMapScript(): Promise<void> {
  if (window.BMapGL?.Map) {
    return Promise.resolve();
  }
  if (loadingPromise) {
    return loadingPromise;
  }
  loadingPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = SCRIPT_URL;
    script.onload = () => {
      if (window.BMapGL?.Map) {
        resolve();
      } else {
        // onload 后类未注册（极少数环境下脚本未真正执行），重置以允许重试
        loadingPromise = null;
        reject(new Error('百度地图脚本执行后未就绪'));
      }
    };
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error('百度地图脚本加载失败'));
    };
    document.head.appendChild(script);
  });
  return loadingPromise;
}
