# 线程与锁

## 创建线程有哪几种方式？

<Badge type="info" text="难度：基础" />

### 一句话答案
本质上只有「继承 Thread」和「实现 Runnable/Callable」两类；线程池（Executor）也是基于这两种提交任务，并不是第 N 种新方式。

### 详细解析
- **继承 Thread**：重写 run()，耦合度高，受单继承限制。
- **实现 Runnable**：任务与线程解耦，可复用，推荐。
- **实现 Callable + Future**：有返回值、可抛异常。
- **线程池 ExecutorService**：通过 `submit()` 提交 Runnable/Callable，由池管理线程生命周期，生产环境首选。

:::: tip 延伸
`Runnable` 的 run() 无返回值；`Callable` 的 call() 有返回值并支持泛型，可通过 Future 获取。
::::

---

## 线程有哪几种状态？

<Badge type="info" text="难度：基础" />

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

## synchronized 和 ReentrantLock 有什么区别？

<Badge type="tip" text="难度：进阶" />

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

:::: warning 注意
用 ReentrantLock 必须在 finally 中 unlock，否则异常时会死锁。
::::

---

## 什么是死锁？如何避免？

<Badge type="tip" text="难度：进阶" />

### 一句话答案
死锁是多个线程互相持有对方需要的锁而无限等待；避免核心是「破坏四个必要条件」之一，最常用是统一加锁顺序 + 超时。

### 详细解析
- **四个条件**：互斥、持有并等待、不可剥夺、循环等待，缺一不可。
- **避免**：① 固定全局加锁顺序，打破循环等待；② 使用 `tryLock(timeout)` 超时退出；③ 减小锁粒度；④ 用 `ReentrantLock` 的定时/可中断特性。
- **排查**：`jstack` 打印线程栈可定位死锁。

---

## volatile 关键字的作用？

<Badge type="tip" text="难度：进阶" />

### 一句话答案
volatile 保证**可见性**和**有序性（禁止指令重排）**，但不保证原子性；典型用于状态标志、双重检查单例。

### 详细解析
- **可见性**：写操作立即刷主内存，读操作从主内存取，跨线程立即可见。
- **有序性**：通过内存屏障禁止特定重排序。
- **不保证原子性**：`i++` 这种读-改-写仍非线程安全，需 `AtomicInteger` 或锁。
- **经典用法**：DCL 单例的 `instance` 字段加 volatile，防止拿到半初始化对象。

:::: tip 延伸
happens-before 规则中，volatile 写 happens-before 后续对该变量的读。
::::

---

## synchronized 的锁升级过程？

<Badge type="warning" text="难度：深入" />

### 一句话答案
JDK6 后 synchronized 有锁升级：无锁 → 偏向锁 → 轻量级锁（CAS 自旋）→ 重量级锁（操作系统互斥），随竞争加剧逐步膨胀，避免一开始就上重锁。

### 详细解析
- **偏向锁**：第一个线程访问加偏向标记，几乎零开销。
- **轻量级锁**：有竞争时撤销偏向，用 CAS 自旋尝试获取，适用于短时间竞争。
- **重量级锁**：自旋失败/竞争激烈，膨胀为监视器锁（monitor），未获锁线程阻塞挂起，切换成本高。
