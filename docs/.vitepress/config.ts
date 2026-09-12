import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Java 面试指南',
  description: '原创 Java 面试题库：知识点梳理 + 高频题 + 详解',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,
  appearance: true,
  // GitHub Pages 项目页部署在 owen-ctr.github.io/java-interview-guide/，
  // 故 base 必须为子路径 '/java-interview-guide/'，否则 /assets 资源 404。
  base: '/java-interview-guide/',
  themeConfig: {
    aside: true,
    outline: {
      level: [2, 2],
      label: '本页题目',
    },
    sidebar: [
      {
        text: 'Java',
        collapsed: true,
        items: [
          { text: 'Java 基础', link: '/java/basis/' },
          { text: '集合', link: '/java/collection/' },
          { text: '并发编程', link: '/java/concurrent/' },
          { text: 'IO', link: '/java/io/' },
          { text: 'JVM', link: '/java/jvm/' },
        ],
      },
      {
        text: '数据库',
        collapsed: true,
        items: [
          { text: 'MySQL', link: '/database/mysql/' },
          { text: 'Redis', link: '/database/redis/' },
        ],
      },
      {
        text: '框架',
        collapsed: true,
        items: [
          { text: 'Spring', link: '/framework/spring/' },
          { text: 'SpringMVC', link: '/framework/springmvc/' },
          { text: 'SpringBoot', link: '/framework/springboot/' },
          { text: 'MyBatis', link: '/framework/mybatis/' },
        ],
      },
      {
        text: '系统设计',
        collapsed: true,
        items: [
          { text: '规划中', link: '/system-design/' },
        ],
      },
      {
        text: '分布式',
        collapsed: true,
        items: [
          { text: '规划中', link: '/distributed/' },
        ],
      },
      {
        text: '高性能 & 高可用',
        collapsed: true,
        items: [
          { text: '规划中', link: '/high-availability/' },
        ],
      },
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
