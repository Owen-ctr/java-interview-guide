import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Java 面试指南',
  description: '原创 Java 面试题库：知识点梳理 + 高频题 + 详解',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,
  appearance: true,
  // 自定义域名 javaoffer.com，GitHub Pages 根路径为 /，故 base 设为 '/'
  base: '/',
  // 默认外观设为浅色（太阳）：首次访问若无用户偏好，则写入 light 并移除 dark 类。
  // 内联脚本在 <head> 同步执行，body 渲染前完成，不会闪烁；切换按钮仍保留。
  head: [
    [
      'script',
      {},
      `(() => {
        try {
          const KEY = 'vitepress-theme-appearance';
          let mode = localStorage.getItem(KEY);
          if (!mode) {
            mode = 'light';
            localStorage.setItem(KEY, mode);
          }
          if (mode === 'light') {
            const el = document.documentElement;
            el.classList.remove('dark');
            el.setAttribute('data-theme', 'light');
            el.style.colorScheme = 'light';
          }
        } catch (e) {}
      })();`,
    ],
  ],
  themeConfig: {
    aside: true,
    outline: {
      level: [2, 3],
      label: '本页题目',
    },
    sidebar: [
      {
        text: 'Java',
        items: [
          { text: 'Java 基础', link: '/java/basis/' },
          { text: 'Java 集合', link: '/java/collection/' },
          { text: 'Java 并发', link: '/java/concurrent/' },
          { text: 'JVM', link: '/java/jvm/' },
        ],
      },
      { text: '数据库', link: '/database/' },
      { text: '框架', link: '/framework/' },
      { text: '分布式', link: '/distributed/' },
      { text: '系统设计', link: '/system-design/' },
    ],
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Owen-ctr/java-interview-guide' },
    ],
    footer: {
      message: 'Java 面试题库 · 基于 VitePress 构建',
      copyright: 'Copyright © 2026 Owen',
    },
  },
})
