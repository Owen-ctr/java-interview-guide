import { defineConfig } from 'vitepress'

// GitHub Pages 项目页部署在 owen-ctr.github.io/java-interview-guide/，
// 故 base 必须为子路径 '/java-interview-guide/'，否则 /assets 资源 404。
// 抽成常量是因为 head 里的 favicon 路径不会被自动带上 base（实测），必须显式拼。
const base = '/java-interview-guide/'

export default defineConfig({
  title: 'Java 面试指南',
  description: '原创 Java 面试题库：知识点梳理 + 高频题 + 详解',
  lang: 'zh-CN',
  lastUpdated: true,
  cleanUrls: true,
  appearance: true,
  base,
  // favicon：head 里的 href 不会被自动带上 base，必须自己拼（见上方常量）
  // 顺序有讲究：.ico 放前面兜底（Safari 不支持 SVG favicon——实测 Edge 正常、Safari 空白），
  // 认识 SVG 的浏览器会取后一个，拿到自带亮/暗适配的矢量图标。
  head: [
    ['link', { rel: 'icon', href: `${base}favicon.ico`, sizes: '16x16 32x32' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }],
  ],
  themeConfig: {
    // 导航栏品牌标记：亮/暗两版，颜色与主题 indigo 一致
    logo: { light: '/logo.svg', dark: '/logo-dark.svg', alt: 'Java 面试题库' },
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
