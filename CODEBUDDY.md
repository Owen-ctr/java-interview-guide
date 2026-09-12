# CODEBUDDY.md This file provides guidance to CodeBuddy when working with code in this repository.

纯文档型站点，无应用代码、无测试套件、无组件库。全部内容是可编辑的 Markdown。

## 常用命令

**安装依赖**（项目固定使用 pnpm@10，勿用 npm/yarn）
`pnpm install`
已在 `package.json` 的 `packageManager` 指定版本；CI 用 `--frozen-lockfile`。

**本地预览**
`pnpm dev` → 启动 VitePress，默认 http://localhost:5173

**构建**（产物输出到 `docs/.vitepress/dist`，不入库）
`pnpm build`
构建即内容校验：Markdown 语法/链接错误会在此时报错，等同于"测试"。

**预览构建产物**
`pnpm preview`

**部署**
推送 `main` 分支即触发 `.github/workflows/deploy.yml`（GitHub Actions 自动构建并发布到 GitHub Pages）。**无需本地构建或手动部署**。注意 `dist` 不提交，由 Action 在 ubuntu 上重新构建上传。

## 架构总览

站点由 [VitePress](https://vitepress.dev/) 驱动，`docs/` 是站点根目录。

**唯一配置中心** `docs/.vitepress/config.ts`：站点标题、语言、搜索、侧边栏、导航、outline 全在此一处定义。改导航/菜单只需改这里，不要新建配置。

**`base` 是项目页的生命线**：当前 `base: '/java-interview-guide/'`。这是 GitHub Pages 项目页（域名为 `owen-ctr.github.io/java-interview-guide/`）的核心约束——若改回 `'/'`，`/assets/*` 会 404、整站无样式。**除非迁移到独占自定义域名（如 javaoffer.com），否则不要动 base。**

**主题定制极轻量**：`docs/.vitepress/theme/index.ts` + `theme/custom.css`，只做少量 CSS 覆盖（外观切换按钮 / GitHub 图标在低断点的显示）。VitePress 的 scoped 隐藏样式需用 `!important` 才能全局覆盖。

**内容即文件**：每篇 Markdown 对应一个路由（路径即 URL，`cleanUrls: true` 隐藏 `.html`）。`docs/index.md` 是首页。

### 内容组织结构（两级菜单）
侧边栏为「大类 → 模块」两级，顶层 6 个大类分组（Java / 数据库 / 框架 / 系统设计 / 分布式 / 高性能&高可用），均 `collapsed: true` 默认折叠。每个分组的 `items` 指向模块页面。大类本身**不再是落地页**（已移除各分类首页），是纯可折叠标题。

模块页面路径形如 `docs/java/basis/index.md`、`docs/database/mysql/index.md`、`docs/framework/spring/index.md` 等。

### 题目如何存放（关键）
**没有"每题一页"**。题目是模块 `index.md` 内的二级标题（`## 题名`），其答案章节为三级标题（`###`）。`config.ts` 里 `outline: { level: [2,2], label: '本页题目' }` 正是据此把页面右侧大纲渲染成"本页题目"导航（只显示 `##` 题名，不展开 `###`）——所以**题目必须用 `##`、答案小节用 `###`，层级不要乱**。

### 题目正文格式（当前约定）
不加难度分级、不强制分层，直接把答案写清楚即可——开头给核心结论/要点，后面自然展开，读者按自己水平决定读多少：
- **直接写答案**：`## 题名` 下方直接用段落 + 要点作答，不必分"初/中级 / 高级"等档位，也不必套"标准解析 / 骨架 / 细节"等固定小节。
- **`### 高频延伸（面试官爱追问）`**：可选，仅挂在重点/高频题末尾，写常见追问方向、易踩的坑、延伸对比。这是唯一保留的可选小节（属面试真实独立的追问单元，非难度分层）。
- **无标题徽章、无难度标注**：页面标题下方的 `<Badge>` 已全部移除，题目标题也不加难度括号；页面只留标题 + 一句简介。

占位大类（系统设计 / 分布式 / 高性能&高可用）目前仅有 `index.md` 标注"规划中"，待补充真实子模块后再在 `config.ts` 补 `items`。

### 搜索
`search.provider: 'local'`（VitePress 内置本地搜索），无需额外服务，索引随构建自动生成。

## 工作约定
- **不要自动 commit/push**：改完文件留在工作区即可，需要提交时先询问用户是否提交。
- **改菜单/导航只动 `config.ts`**；新增模块页后须同步在 `sidebar` 加对应 `link`，否则侧边栏不显示且该路由可能 404。
- `README.md` 描述的是旧内容模型（难度/频率标签 + 一句话速记+详细解析），**已过时**，以本文件描述的实际格式为准，不要照抄 README 的约定写题。
