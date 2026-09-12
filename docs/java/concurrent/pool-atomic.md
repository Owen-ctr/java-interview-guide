# 线程池与原子类

## 线程池的核心参数和工作流程？

<Badge type="warning" text="难度：深入" />

### 一句话答案
核心参数：corePoolSize、maximumPoolSize、keepAliveTime、workQueue、threadFactory、handler；提交流程：核心线程 → 队列 → 非核心线程 → 拒绝策略。

### 详细解析
1. 任务数 ≤ corePoolSize：直接新建核心线程执行。
2. 核心线程满：任务进 workQueue 排队。
3. 队列满且未达 maximumPoolSize：创建非核心线程。
4. 都满：触发 RejectedExecutionHandler（默认抛异常）。
- **调优经验**：CPU 密集 core≈核数；IO 密集可放大。拒绝策略 `CallerRunsPolicy` 常用于降级。

---

## 说说 CAS 及 ABA 问题？

<Badge type="warning" text="难度：深入" />

### 一句话答案
CAS（Compare-And-Swap）是无锁原子操作：比较内存值与预期值，相等才更新；ABA 指值从 A→B→A 导致 CAS 误判未变，可用版本号/`AtomicStampedReference` 解决。

### 详细解析
- **原理**：CPU 原子指令（如 `cmpxchg`），自旋重试直到成功。
- **缺点**：自旋开销、只能保一个变量、ABA 问题。
- **ABA**：引入版本号或时间戳（stamped reference），比较时连带版本一起比。

---

## ThreadLocal 原理及内存泄漏问题？

<Badge type="warning" text="难度：深入" />

### 一句话答案
ThreadLocal 为每个线程维护独立变量副本，底层是线程的 `ThreadLocalMap`（key 为 ThreadLocal 弱引用）；若不及时 `remove()`，线程池场景下 value 强引用会导致内存泄漏。

### 详细解析
- 每个 Thread 有一个 `threadLocals`（ThreadLocalMap），以 ThreadLocal 为 key、变量副本为 value。
- **弱引用坑**：key 是弱引用，GC 后 key 变 null，但 value 仍被 Entry 强引用，若不再访问该槽位 value 无法回收 → 泄漏。
- **正确用法**：用完务必 `remove()`，尤其在线程池（线程复用）中。
