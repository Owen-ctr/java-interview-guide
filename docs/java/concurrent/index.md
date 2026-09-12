# 并发编程 · 高频面试题

<Badge type="info" text="模块：并发编程" />
<Badge type="tip" text="建议优先级：高" />

---

## 创建线程有哪几种方式？

<Badge type="warning" text="难度 ⭐⭐" /> 出现频率：高 ｜ 标签：并发·基础

### 一句话答案
本质上只有「继承 Thread」和「实现 Runnable/Callable」两类；线程池（Executor）也是基于这两种提交任务，并不是第 N 种新方式。

### 详细解析
- **继承 Thread**：重写 run()，耦合度高，受单继承限制。
- **实现 Runnable**：任务与线程解耦，可复用，推荐。
- **实现 Callable + Future**：有返回值、可抛异常。
- **线程池 ExecutorService**：通过 `submit()` 提交 Runnable/Callable，由池管理线程生命周期，生产环境首选。

::: tip 延伸
`Runnable` 的 run() 无返回值；`Callable` 的 call() 有返回值并支持泛型，可通过 Future 获取。
:::

---

## synchronized 和 ReentrantLock 有什么区别？

<Badge type="warning" text="难度 ⭐⭐⭐" /> 出现频率：高 ｜ 标签：并发·锁

### 一句话答案
synchronized 是 JVM 内置关键字、自动释放、非公平；ReentrantLock 是 API 层锁，需手动 unlock，支持可中断、公平/非公平、多条件等待。

### 详细解析
| 对比 | synchronized | ReentrantLock |
| --- | --- | --- |
| 实现 | JVM 内置（monitor） | JDK API（AQS） |
| 释放 | 自动（出作用域） | 手动 `unlock()`（需 try/finally） |
| 中断 | 不支持 | `lockInterruptibly()` 支持 |
| 公平 | 非公平 | 可指定公平/非公平 |
| 条件 | 单一 wait/notify | 多 `Condition` |

::: warning 注意
用 ReentrantLock 必须在 finally 中 unlock，否则异常时会死锁。
:::

---

## 线程池的核心参数和工作流程？

<Badge type="warning" text="难度 ⭐⭐⭐⭐" /> 出现频率：高 ｜ 标签：并发·线程池

### 一句话答案
核心参数：corePoolSize、maximumPoolSize、keepAliveTime、workQueue、threadFactory、handler；提交流程：核心线程 → 队列 → 非核心线程 → 拒绝策略。

### 详细解析
1. 任务数 ≤ corePoolSize：直接新建核心线程执行。
2. 核心线程满：任务进 workQueue 排队。
3. 队列满且未达 maximumPoolSize：创建非核心线程。
4. 都满：触发 RejectedExecutionHandler（默认抛异常）。
- **调优经验**：CPU 密集 core≈核数；IO 密集可放大。拒绝策略 `CallerRunsPolicy` 常用于降级。

---

## volatile 关键字的作用？

<Badge type="warning" text="难度 ⭐⭐⭐" /> 出现频率：高 ｜ 标签：并发·JMM

### 一句话答案
volatile 保证**可见性**和**有序性（禁止指令重排）**，但不保证原子性；典型用于状态标志、双重检查单例。

### 详细解析
- **可见性**：写操作立即刷主内存，读操作从主内存取，跨线程立即可见。
- **有序性**：通过内存屏障禁止特定重排序。
- **不保证原子性**：`i++` 这种读-改-写仍非线程安全，需 `AtomicInteger` 或锁。
- **经典用法**：DCL 单例的 `instance` 字段加 volatile，防止拿到半初始化对象。

::: tip 延伸
happens-before 规则中，volatile 写 happens-before 后续对该变量的读。
:::
