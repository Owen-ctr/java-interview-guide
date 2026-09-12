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
