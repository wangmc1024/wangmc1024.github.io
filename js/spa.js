/**
 * Hexo Next SPA 核心脚本（适配 Twikoo 评论）
 */
document.addEventListener('DOMContentLoaded', () => {
  // 拦截站内链接点击
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // 过滤无需拦截的链接
    const isExternal = href.startsWith('http') && !href.startsWith(window.location.origin);
    const isAnchor = href.startsWith('#') || (href === '' && link.hash);
    const isSpecial = href.startsWith('javascript:') || link.classList.contains('exturl');
    if (isExternal || isAnchor || isSpecial) return;

    e.preventDefault();
    await loadPage(href);
  });

  // 监听浏览器前进/后退
  window.addEventListener('popstate', (e) => {
    if (e.state?.url) loadPage(e.state.url);
  });
});

/**
 * 动态加载页面内容
 * @param {string} url - 目标页面 URL
 */
async function loadPage(url) {
  try {
    showLoading(true);

    // 加载目标页面 HTML
    const response = await fetch(url);
    if (!response.ok) throw new Error(`加载失败: ${response.status}`);
    const html = await response.text();

    // 解析 HTML 并替换动态内容
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newContentWrap = doc.querySelector('#spa-content-wrap');
    if (!newContentWrap) throw new Error('未找到 #spa-content-wrap');

    document.querySelector('#spa-content-wrap').innerHTML = newContentWrap.innerHTML;

    // 更新标题和历史记录
    if (doc.title) document.title = doc.title;
    window.history.pushState({ url }, doc.title, url);

    // 初始化组件（含 Twikoo 评论）
    initNextComponents();

    // 处理锚点滚动
    const hash = new URL(url).hash;
    if (hash) {
      const target = document.querySelector(hash);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }

  } catch (err) {
    console.error('SPA 加载失败:', err);
    window.location.href = url;
  } finally {
    showLoading(false);
  }
}

/**
 * 初始化页面所有组件
 */
function initNextComponents() {
  initCodeHighlight();      // 代码高亮
  initComments();           // 评论系统（含 Twikoo）
  initCommentSwitch();      // 评论切换逻辑
  initSidebar();            // 侧边栏
  initBackToTop();          // 返回顶部
}

/**
 * 初始化代码高亮
 */
function initCodeHighlight() {
  if (window.hljs) {
    document.querySelectorAll('pre code').forEach(block => {
      window.hljs.highlightElement(block);
    });
  }
}

/**
 * 初始化评论系统（重点适配 Twikoo）
 */
function initComments() {
  // 适配 Twikoo 评论
  if (window.twikoo && document.querySelector('#tcomment')) {
    // 清理旧实例
    const tcommentContainer = document.querySelector('#tcomment');
    if (tcommentContainer) tcommentContainer.innerHTML = '';

    // 重新初始化 Twikoo
    window.twikoo.init({
      envId: window.twikooConfig.envId,
      region: window.twikooConfig.region,
      el: '#tcomment',
      path: window.location.pathname  // 用当前路径区分评论
    });
  }
}

/**
 * 初始化评论切换（多评论插件场景）
 */
function initCommentSwitch() {
  // 按钮模式切换
  document.querySelectorAll('.comment-button').forEach(button => {
    button.addEventListener('click', () => {
      setTimeout(() => {
        if (document.querySelector('#tcomment')) initComments();
      }, 100);
    });
  });

  // 标签页模式切换
  document.querySelectorAll('.tabs-comment .nav-tabs a').forEach(tab => {
    tab.addEventListener('click', () => {
      setTimeout(() => {
        if (document.querySelector('#tcomment')) initComments();
      }, 100);
    });
  });
}

/**
 * 初始化侧边栏
 */
function initSidebar() {
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.onclick = () => {
      document.body.classList.toggle('sidebar-active');
    };
  }
}

/**
 * 初始化返回顶部按钮
 */
function initBackToTop() {
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    const toggle = () => {
      backToTop.style.display = window.scrollY > 300 ? 'block' : 'none';
    };
    window.addEventListener('scroll', toggle);
    toggle();
    backToTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * 加载动画
 */
function showLoading(show) {
  let loader = document.querySelector('#spa-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'spa-loader';
    loader.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      z-index: 9999; display: none;
    `;
    loader.innerHTML = '<div style="width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #3eaf7c; border-radius: 50%; animation: spin 1s linear infinite;"></div>';
    document.body.appendChild(loader);
  }
  loader.style.display = show ? 'block' : 'none';
}

// 添加加载动画样式
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);
