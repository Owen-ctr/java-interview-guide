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
      level: [2, 3],
      label: '本页题目',
    },
    sidebar: [
      {
        text: 'Java 基础',
        collapsed: false,
        items: [
          { text: '概览', link: '/java/basis/' },
          { text: '字符串与 Object', link: '/java/basis/string-object' },
          { text: '面向对象与语言特性', link: '/java/basis/oo-lang' },
        ],
      },
      {
        text: 'Java 集合',
        collapsed: false,
        items: [
          { text: '概览', link: '/java/collection/' },
          { text: 'Map 集合', link: '/java/collection/map' },
          { text: 'List / Set 与迭代', link: '/java/collection/list-set-iterator' },
        ],
      },
      {
        text: 'Java 并发',
        collapsed: false,
        items: [
          { text: '概览', link: '/java/concurrent/' },
          { text: '线程与锁', link: '/java/concurrent/thread-lock' },
          { text: '线程池与原子类', link: '/java/concurrent/pool-atomic' },
        ],
      },
      {
        text: 'JVM',
        collapsed: false,
        items: [
          { text: '概览', link: '/java/jvm/' },
          { text: '内存与 GC', link: '/java/jvm/memory-gc' },
          { text: '类加载', link: '/java/jvm/classload' },
        ],
      },
      {
        text: '数据库',
        collapsed: false,
        items: [
          { text: '概览', link: '/database/' },
          { text: 'MySQL 索引', link: '/database/mysql-index' },
          { text: 'MySQL 事务', link: '/database/mysql-tx' },
          { text: 'Redis 与分库分表', link: '/database/redis-sharding' },
        ],
      },
      {
        text: '框架',
        collapsed: false,
        items: [
          { text: '概览', link: '/framework/' },
          { text: 'Spring 核心', link: '/framework/spring-core' },
          { text: 'MyBatis', link: '/framework/mybatis' },
        ],
      },
      {
        text: '分布式',
        collapsed: false,
        items: [
          { text: '概览', link: '/distributed/' },
          { text: '理论与锁事务', link: '/distributed/theory-lock-tx' },
          { text: 'ID 与路由', link: '/distributed/id-routing' },
        ],
      },
      {
        text: '系统设计',
        collapsed: false,
        items: [
          { text: '概览', link: '/system-design/' },
          { text: '设计实战', link: '/system-design/design' },
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
