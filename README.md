# Java 面试题库

面向 Java 后端面试的系统性题库，基于 [VitePress](https://vitepress.dev/) 构建的纯文档式站点，在线地址：**https://owen-ctr.github.io/java-interview-guide/**

按**知识点模块**组织，以**题**为最小单元；每题给出可直接作答的结论与展开，并附面试官常见的追问方向。

## 内容组织

- **模块化**：Java（基础 / 集合 / 并发编程 / IO / JVM）五个子模块已覆盖，数据库、框架模块规划中。
- **每页一份「阅读路线」**：把该模块的题按「**入门必答 → 进阶追问 → 深入原理**」分档并用锚点列出——初学者知道从哪读起、哪些可以先跳过。
- **每题两部分**：正文**直接作答**（先给结论，再展开细节）；末尾可选一节「**高频延伸**」，按被问到的频率排列追问方向与易踩的坑。
- **不标难度、不分层答案**：难度信息由「阅读路线 + 模块内由浅入深排序」表达，不用主观标签（同一题对 5 年经验的人和应届生显然不是一个难度）。
- **交叉引用可点击**：题目之间用锚点链接互指，跨模块的带路径——不用「上一题 / 下一题」这类会随重排失效的说法。

## 内容基线

- **以 JDK 8 为准**。涉及版本差异的结论都会显式标注适用范围——例如垃圾收集器（JDK 8 默认 Parallel Scavenge + Parallel Old，JDK 9 起 G1 转正）、`HashMap` 的两代实现、`ArrayList` 的扩容公式、`-Xlog` 与 `PrintGCDetails` 的分界。
- 版本敏感或容易说错的断言尽量对照 JVM 规范 / JDK 源码确认；无法确证的地方会标明，不含糊带过。

## 本地运行

依赖用 **pnpm** 管理（版本见 `package.json` 的 `packageManager` 字段）：

```bash
pnpm install
pnpm dev      # 本地预览 http://localhost:5173
pnpm build    # 构建到 docs/.vitepress/dist
pnpm preview  # 预览构建产物
```

> 站点没有配置 lint / 单元测试，`pnpm build` 是唯一的自动校验：Markdown 语法、死链、配置错误都会在此时暴露。

## 部署

通过 **GitHub Pages + GitHub Actions** 自动部署：推送 `main` 分支即触发
`.github/workflows/deploy.yml` 构建并发布。在仓库 `Settings → Pages → Source` 选择
「GitHub Actions」即可。**无需本地构建或手动部署**（`dist` 不入库，由 Action 现场构建）。

> 注意：站点部署在项目页 `owen-ctr.github.io/java-interview-guide/`，因此
> `docs/.vitepress/config.ts` 里的 `base` 必须是 `/java-interview-guide/`，改成 `/` 会导致所有静态资源 404。

## 目录结构

```
java-interview-guide/
├── .github/workflows/deploy.yml   # Pages 自动部署
├── docs/
│   ├── .vitepress/
│   │   ├── config.ts              # 唯一的配置中心（导航 / 侧边栏 / 搜索 / 大纲）
│   │   └── theme/                 # 极轻量主题定制（CSS 计数器编号等）
│   ├── index.md                   # 站点首页
│   ├── java/
│   │   ├── basis/                 # Java 基础
│   │   ├── collection/            # 集合
│   │   ├── concurrent/            # 并发编程
│   │   ├── io/                    # IO / NIO / 网络编程
│   │   └── jvm/                   # JVM
│   ├── database/                  # MySQL / Redis（规划中）
│   ├── framework/                 # Spring 系列（规划中）
│   └── system-design/ distributed/ high-availability/   # 大类占位（规划中）
├── package.json                   # pnpm 脚本与依赖
└── README.md
```

## 贡献方式

题目是模块 `index.md` 里的二级标题（`## 题名`），答案小节用三级标题；题目序号由 CSS 自动生成，**不要手写**。
新增题目后需同步：① 归入该模块「阅读路线」的某一档；② 若新建模块页，在 `docs/.vitepress/config.ts` 的 `sidebar` 里挂上对应 `link`。

> 内容均为原创整理，转载请注明出处。
