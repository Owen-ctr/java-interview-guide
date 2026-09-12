# Java 面试题库

Java 面试题库，基于 [VitePress](https://vitepress.dev/) 构建的纯文档式站点。

## 特点

- 按知识点分模块（Java 基础 / 并发编程 / 数据库 …）
- 以「题」为单元，每题含 **难度**、**出现频率**、**主题标签**
- 两层答案：**一句话速记** + **详细解析**，兼顾快速复习与原理深挖

## 内容模型

| 维度 | 说明 |
| --- | --- |
| 骨架 | 知识点模块式（导航清晰、体系完整） |
| 单元 | 题目导向（每题为最小单元，带标签） |
| 标签 | 难度 ⭐ / 出现频率 / 主题标签，便于筛选检索 |

## 本地运行

```bash
pnpm install
pnpm dev      # 本地预览 http://localhost:5173
pnpm build    # 构建产物输出到 docs/.vitepress/dist
```

## 部署

通过 **GitHub Pages + GitHub Actions** 自动部署：推送 `main` 分支即触发
`.github/workflows/deploy.yml`。在仓库 `Settings → Pages → Source` 选择
「GitHub Actions」即可。

## 目录结构

```
java-interview-guide/
├── .github/workflows/deploy.yml   # Pages 自动部署
├── docs/
│   ├── .vitepress/config.ts       # 站点配置（导航/侧边栏/搜索）
│   ├── index.md                   # 首页
│   ├── java/basis/                # Java 基础模块
│   ├── java/concurrent/           # 并发编程模块
│   └── database/                  # 数据库模块
├── package.json
└── README.md
```

> 内容均为原创整理，转载请注明出处。
