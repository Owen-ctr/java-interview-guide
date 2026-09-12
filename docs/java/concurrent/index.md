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

---

## 线程有哪几种状态？

<Badge type="warning" text="难度 ⭐⭐" /> 出现频率：高 ｜ 标签：并发·基础

### 一句话答案
Java 线程有 6 种状态（Thread.State）：NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING、TERMINATED；操作系统层面的「运行/就绪」在 JVM 里统一归为 RUNNABLE。

### 详细解析
- **NEW**：创建未 start。
- **RUNNABLE**：就绪或运行中（含等待 CPU）。
- **BLOCKED**：等 synchronized 锁。
- **WAITING**：`wait()/join()/LockSupport.park()` 无限等待，需他人唤醒。
- **TIMED_WAITING**：`sleep(n)/wait(n)/join(n)` 定时等待。
- **TERMINATED**：执行结束。

---

## 什么是死锁？如何避免？

<Badge type="warning" text="难度 ⭐⭐⭐" /> 出现频率：高 ｜ 标签：并发·锁

### 一句话答案
死锁是多个线程互相持有对方需要的锁而无限等待；避免核心是「破坏四个必要条件」之一，最常用是统一加锁顺序 + 超时。

### 详细解析
- **四个条件**：互斥、持有并等待、不可剥夺、循环等待，缺一不可。
- **避免**：① 固定全局加锁顺序，打破循环等待；② 使用 `tryLock(timeout)` 超时退出；③ 减小锁粒度；④ 用 `ReentrantLock` 的定时/可中断特性。
- **排查**：`jstack` 打印线程栈可定位死锁。

---

## ThreadLocal 原理及内存泄漏问题？

<Badge type="warning" text="难度 ⭐⭐⭐⭐" /> 出现频率：高 ｜ 标签：并发·JMM

### 一句话答案
ThreadLocal 为每个线程维护独立变量副本，底层是线程的 `ThreadLocalMap`（key 为 ThreadLocal 弱引用）；若不及时 `remove()`，线程池场景下 value 强引用会导致内存泄漏。

### 详细解析
- 每个 Thread 有一个 `threadLocals`（ThreadLocalMap），以 ThreadLocal 为 key、变量副本为 value。
- **弱引用坑**：key 是弱引用，GC 后 key 变 null，但 value 仍被 Entry 强引用，若不再访问该槽位 value 无法回收 → 泄漏。
- **正确用法**：用完务必 `remove()`，尤其在线程池（线程复用）中。

---

## 说说 CAS 及 ABA 问题？

<Badge type="warning" text="难度 ⭐⭐⭐⭐" /> 出现频率：高 ｜ 标签：并发·原子

### 一句话答案
CAS（Compare-And-Swap）是无锁原子操作：比较内存值与预期值，相等才更新；ABA 指值从 A→B→A 导致 CAS 误判未变，可用版本号/`AtomicStampedReference` 解决。

### 详细解析
- **原理**：CPU 原子指令（如 `cmpxchg`），自旋重试直到成功。
- **缺点**：自旋开销、只能保一个变量、ABA 问题。
- **ABA**：引入版本号或时间戳（stamped reference），比较时连带版本一起比。

---

## synchronized 的锁升级过程？

<Badge type="warning" text="难度 ⭐⭐⭐⭐" /> 出现频率：高 ｜ 标签：并发·锁

### 一句话答案
JDK6 后 synchronized 有锁升级：无锁 → 偏向锁 → 轻量级锁（CAS 自旋）→ 重量级锁（操作系统互斥），随竞争加剧逐步膨胀，避免一开始就上重锁。

### 详细解析
- **偏向锁**：第一个线程访问加偏向标记，几乎零开销。
- **轻量级锁**：有竞争时撤销偏向，用 CAS 自旋尝试获取，适用于短时间竞争。
- **重量级锁**：自旋失败/竞争激烈，膨胀为监视器锁（monitor），未获锁线程阻塞挂起，切换成本高。
