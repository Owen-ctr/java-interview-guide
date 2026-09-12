# 并发编程

本模块覆盖线程、锁、线程池、JMM 等并发编程面试常考点。并发的所有问题最终都能归到**原子性、可见性、有序性**这三条上，先记住这张总纲，再看下面各题：

| 特性 | 含义 | 靠什么保证 |
| --- | --- | --- |
| 原子性 | 操作不可分割，要么全做要么不做 | `synchronized`、`ReentrantLock`、`Atomic*`（CAS）、`LongAdder` |
| 可见性 | 一个线程的修改对其它线程立即可见 | `volatile`、`synchronized`、`final`、锁的释放与获取 |
| 有序性 | 禁止指令重排破坏程序语义 | `volatile`（内存屏障）、`synchronized`、`happens-before` 规则 |

题目按「线程 → 锁 → JMM → 工具 → 线程池 → AQS」组织，由浅入深。

## 创建线程有哪几种方式？

结论：本质只有一种——`Thread.start()`。其它说法（实现 `Runnable`、实现 `Callable`、线程池）都只是"怎么把任务交给线程"的不同包装——面试常问的「有哪几种创建方式」，答案就是下面这四条。实际开发中应该用**线程池**，而不是手动 `new Thread`。

- **继承 `Thread`**：重写 `run()`，再调 `start()`。缺点是 Java 只能单继承，线程类无法再继承别的类，且任务与线程耦合。
- **实现 `Runnable`**：任务与线程解耦，但仍要 `new Thread(runnable).start()`；`run()` 没有返回值、不能抛受检异常。
- **实现 `Callable` + `FutureTask`**：有返回值、可抛受检异常，用 `future.get()` 阻塞取结果。
- **通过线程池**：`ExecutorService.submit(...)` 或 `execute(...)`，复用线程、可控并发数——生产环境的标准做法。

另外两点必须说清：

- **`start()` 和 `run()` 的区别**：只有 `start()` 会启动新线程，由 JVM 去调 `run()`；直接调 `run()` 只是当前线程里的一次普通方法调用。
- **一个 `Thread` 对象只能 `start()` 一次**，重复调用抛 `IllegalThreadStateException`。

```java
// 方式一：继承 Thread
class MyThread extends Thread {
    @Override public void run() { System.out.println(Thread.currentThread().getName()); }
}
new MyThread().start();

// 方式二：实现 Runnable（任务与线程解耦）
new Thread(() -> System.out.println("runnable")).start();

// 方式三：Callable + FutureTask（有返回值）
FutureTask<Integer> task = new FutureTask<>(() -> 1 + 1);
new Thread(task).start();
System.out.println(task.get());       // 2

// 方式四：线程池（生产环境标准做法）
ExecutorService pool = Executors.newFixedThreadPool(4);   // 更推荐直接 new ThreadPoolExecutor
pool.submit(() -> System.out.println("pool"));
```

### 高频延伸
- **为什么实际开发不推荐 `new Thread`**：每次创建都新建一个线程且无法复用，并发数不可控，流量一大就可能把机器拖垮；线程池能复用线程、限制并发、统一管理与监控。
- **`Runnable` 和 `Callable` 有什么区别**：`Callable` 的 `call()` 有返回值且能抛受检异常，`Runnable` 的 `run()` 都不能；`Callable` 需配合 `FutureTask` 或线程池的 `submit` 使用。
- **`start()` 能被调用两次吗**：不能，第二次抛 `IllegalThreadStateException`；线程一旦结束也不能再启动。
- **线程池内部不也是 `Thread` 吗**：是。`ThreadPoolExecutor` 的 `Worker` 既继承了 AQS 又实现了 `Runnable`，本质仍是 `Thread`，只是做了复用与调度。
- **虚拟线程算不算新的创建方式**：算。JDK 21 引入的虚拟线程由 JVM 调度、创建开销极小（`Thread.ofVirtual()`）；基线 JDK 8 下不存在，被问到时再展开。

## 线程有哪些状态？状态之间如何转换？

结论：Java 线程有 **6 种状态**，定义在 `Thread.State` 枚举中：`NEW`、`RUNNABLE`、`BLOCKED`、`WAITING`、`TIMED_WAITING`、`TERMINATED`。要注意这里的 `RUNNABLE` 把"就绪"和"运行中"合并了，而 `BLOCKED` **只表示等待进入 `synchronized`**。

- **`NEW`**：已创建但还没调用 `start()`。
- **`RUNNABLE`**：可运行。既包含操作系统的"就绪"与"运行"，也包含**正在等待 IO** 的线程——JVM 不区分这些情况。
- **`BLOCKED`**：等待获取 `synchronized` 锁，被卡在锁的入口。
- **`WAITING`**：无限期等待，必须被其它线程显式唤醒——`Object.wait()`、`Thread.join()`、`LockSupport.park()`。
- **`TIMED_WAITING`**：限时等待，超时自动返回——`Thread.sleep(ms)`、`wait(ms)`、`join(ms)`、`parkNanos()`。
- **`TERMINATED`**：已结束（正常返回或抛出未捕获异常）。

主要转换：

- `NEW` --`start()`--> `RUNNABLE` --被调度--> 运行 --> `TERMINATED`
- `RUNNABLE` --抢不到锁--> `BLOCKED` --拿到锁--> `RUNNABLE`
- `RUNNABLE` --`wait()`--> `WAITING` --`notify()`/`notifyAll()`--> `BLOCKED`（**不是直接回到 `RUNNABLE`**）
- `RUNNABLE` --`sleep(ms)`/`join(ms)`--> `TIMED_WAITING` --超时--> `RUNNABLE`

### 高频延伸
- **`wait()` 被唤醒后直接变成 `RUNNABLE` 吗**：不是。`notify()`/`notifyAll()` 只是把它从 `WAITING` 挪到 `BLOCKED`，它还要重新竞争到 `synchronized` 锁才会回到 `RUNNABLE`——**唤醒不等于立刻继续执行**。
- **`sleep` 和 `wait` 有什么区别**：`sleep` 是 `Thread` 的静态方法、**不释放锁**、到点自动醒；`wait` 是 `Object` 的方法、**会释放锁**、需要被 `notify` 唤醒，且必须在 `synchronized` 块内调用。这个差别是必考。
- **`BLOCKED` 和 `WAITING` 有什么区别**：`BLOCKED` 是"被动等锁"，`WAITING` 是"主动放弃、等人叫"；前者卡在 `synchronized` 入口，后者由 `wait`/`join`/`park` 主动进入。
- **为什么等待 IO 的线程还是 `RUNNABLE`**：JVM 无法区分线程是在等 CPU 还是在等 IO，所以状态仍报 `RUNNABLE`（对操作系统而言它可能已是阻塞态）。
- **怎么在线排查线程状态**：`jstack <pid>` 会打印每个线程的栈与状态，卡在 `BLOCKED` 的线程会显示 `waiting to lock`，这是定位锁竞争与死锁的第一步（见[『死锁的四个必要条件是什么？如何避免和排查？』](#死锁的四个必要条件是什么-如何避免和排查)）。

## synchronized 的原理是什么？它和 ReentrantLock 有什么区别？

结论：`synchronized` 是 JVM 的**内置锁（监视器锁）**，靠对象头的 Mark Word 与 Monitor 实现，JDK 6 起有锁升级优化；`ReentrantLock` 是 JDK 5 提供的**显式锁**，基于 AQS 实现，能力更强但**必须手动释放**。

原理层面：

- 同步代码块编译后是 `monitorenter` / `monitorexit` 两条字节码（异常路径上还会补一条 `monitorexit` 保证释放）；同步方法则是在方法上打 `ACC_SYNCHRONIZED` 标志。
- 每个对象都关联一个 Monitor，内部有 `owner`（当前持有线程）、重入计数、`EntryList`（等锁的线程）与 `WaitSet`（`wait()` 后的线程）。
- **锁升级**：无锁 → 偏向锁（只有一个线程访问，Mark Word 记线程 ID）→ 轻量级锁（有竞争，CAS 自旋）→ 重量级锁（自旋失败，进 Monitor 阻塞）。**偏向锁 JDK 6 引入；JDK 15（JEP 374）起默认禁用并标记废弃，之后版本移除**。

两者的区别：

- **实现层面**：`synchronized` 由 JVM 内置实现；`ReentrantLock` 是基于 AQS 的普通 Java 类。
- **释放方式**：`synchronized` 由 JVM 自动释放（出块或抛异常都释放）；`ReentrantLock` **必须手动 `unlock()`**，且要写在 `finally` 里，否则锁会永久泄漏。
- **可中断**：`ReentrantLock` 有 `lockInterruptibly()`，等锁时可被中断；`synchronized` 等锁时不可中断。
- **超时**：`ReentrantLock` 支持 `tryLock(timeout)`，拿不到就放弃；`synchronized` 不支持。
- **公平性**：`ReentrantLock` 可构造公平锁（`new ReentrantLock(true)`）；`synchronized` 只有非公平。
- **条件变量**：`ReentrantLock` 可创建多个 `Condition`（`await`/`signal`），精确唤醒某一类等待者；`synchronized` 只有一个等待集（只能 `wait`/`notifyAll`）。
- **共性**：两者都**可重入**，都保证原子性与可见性。

怎么选：用不上高级功能就直接 `synchronized`（写法简单、不会忘释放、JVM 还在持续优化）；需要可中断、超时、公平锁或多条件变量时再用 `ReentrantLock`。

### 高频延伸
- **`synchronized` 是可重入的吗，怎么实现**：是。Monitor 用 `owner` + 重入计数记录，同一线程再次进入就把计数加一、退出时减一，减到 0 才真正释放。
- **锁升级可逆吗**：**升级链条是单向的**——偏向 → 轻量级 → 重量级，不会降回去（降级收益小、实现也复杂）；但**偏向锁本身可以被撤销**：当另一个线程来竞争时会走撤销流程（另配有批量重偏向、批量撤销的阈值优化），对象于是回到无锁态。
- **偏向锁为什么被废弃**：它只对"始终单线程访问"的场景有收益，而现代应用大量使用线程池与并发容器，偏向锁的撤销反而成了额外开销，所以 JDK 15（JEP 374）起默认禁用并标记废弃，之后版本移除。
- **`synchronized` 能修饰什么，锁的是谁**：实例方法锁 `this`、静态方法锁 `Class` 对象、代码块锁指定对象。注意锁 `Class` 对象和锁 `this` 是两把不同的锁，互不影响。
- **为什么不要拿 `String` 常量或包装类对象当锁**：它们会被常量池与缓存复用，多个不相干的业务可能锁到同一个对象而互相阻塞。`Integer` 在 `-128~127` 范围内就是同一个对象（见[『基本类型和包装类有什么区别？』](/java/basis/#基本类型和包装类有什么区别)）。

## volatile 能保证什么？为什么不能保证原子性？

结论：`volatile` 保证**可见性**与**有序性**（禁止指令重排），但**不保证原子性**。它是最轻量的同步手段，适合"一个线程写、多个线程读"的状态标志，不能用来做 `i++` 这类复合操作。

- **可见性**：写 `volatile` 变量会立刻刷回主内存并使其它线程的缓存失效；读 `volatile` 变量会直接读主内存。普通变量则可能长期留在工作内存里，别的线程看不到修改。
- **有序性**：`volatile` 读写在前后插入内存屏障，禁止编译器与 CPU 把它和别的内存操作重排。
- **不保证原子性**：`i++` 是"读 → 加一 → 写"三步，`volatile` 只能保证每一步读到的都是最新值，但两步之间仍可能被其它线程插入，因此并发下依然会丢更新。

```java
volatile boolean flag = false;      // 可见性：一个线程改，其它线程立即可见

// 原子性：volatile 保证不了，多线程各加 1000 次通常 < 2000
// 正确做法是 AtomicInteger（CAS）或 synchronized

// 双重检查锁：这里的 volatile 不可省
class Singleton {
    private static volatile Singleton instance;
    static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();   // new 非原子：分配→初始化→赋引用
                }
            }
        }
        return instance;
    }
}
```

### 高频延伸
- **双重检查锁为什么必须加 `volatile`**：`new` 不是原子操作，分为分配内存、初始化、把引用赋给变量三步；没有 `volatile` 时第 2、3 步可能重排，别的线程会拿到"引用非空、对象却还没初始化完"的对象。
- **`volatile` 能替代 `synchronized` 吗**：不能。它只管可见性与有序性，不保证原子性、也不提供互斥；出现"读-改-写"或复合操作时必须用锁或原子类。
- **`volatile` 和 `AtomicInteger` 有什么区别**：`AtomicInteger` 用 CAS 保证了原子性，`volatile` 只保证可见性；需要计数、累加这类复合操作就得用原子类。
- **`volatile` 数组能保证元素读写的可见性吗**：不能。`volatile` 只作用于数组**引用**本身，元素读写没有 `volatile` 语义；要保证元素可见得用 `AtomicIntegerArray` 一类的原子数组。
- **`long`/`double` 不加 `volatile` 会怎样**：规范允许 64 位值的读写被拆成两次 32 位操作，并发下可能读到"半个值"；`volatile` 能保证其读写原子（这一条自 JSR-133 / JDK 5 起明确）。

## CAS 是什么？ABA 问题如何解决？

结论：CAS（Compare And Swap）是 CPU 提供的**原子指令**，有三个操作数——内存位置、期望值、新值；只有当前位置的值等于期望值时才写入新值，否则什么都不做。它是**乐观锁的基石**，`AtomicInteger` 等原子类全靠它。

- **工作方式**：典型的自旋重试——`while (!compareAndSet(expected, update)) { expected = get(); }`。
- **`AtomicInteger` 的组成**：`volatile int value`（保证可见性）+ `Unsafe` 的 CAS（保证原子性），两者缺一不可。
- **优点**：无锁、不阻塞线程、没有上下文切换开销，竞争不激烈时性能优于锁。
- **缺点**：自旋会空耗 CPU；只能保证**单个变量**的原子性；存在 ABA 问题。

ABA 问题指：线程 1 读到 A，线程 2 把 A 改成 B 又改回 A，线程 1 的 CAS 依然成功——值没变，但**中间状态已经变了**。对"值本身"在意的场景无妨，对"有没有被改过"在意的场景会出错。

解决办法：

- **加版本号**：用 `AtomicStampedReference`（值 + `int` 版本戳）或 `AtomicMarkableReference`（值 + `boolean` 标记），CAS 时同时比较值和时间戳。
- **从数据结构设计上规避**：ABA 之所以危险，是因为节点被移除后又**被复用**——引用看起来没变，实际已经换过一轮；所以要么给引用加版本号，要么**不复用节点**（每次都分配新对象），后者是无锁栈 / 无锁队列里的常规做法。

```java
// 乐观锁的典型写法：自旋 CAS
AtomicInteger count = new AtomicInteger(0);
int old;
do {
    old = count.get();
} while (!count.compareAndSet(old, old + 1));    // 失败就重读重试

// 解决 ABA：值 + 版本戳必须同时匹配
AtomicStampedReference<Integer> ref = new AtomicStampedReference<>(1, 0);
ref.compareAndSet(1, 2, 0, 1);
```

### 高频延伸
- **CAS 底层靠什么实现**：靠 CPU 的原子指令（x86 是 `cmpxchg`，多核下加 `lock` 前缀触发缓存一致性协议）；Java 层通过 `Unsafe` 暴露给原子类使用。
- **CAS 为什么比锁快**：它不挂起线程，没有用户态与内核态之间的切换；但竞争激烈时自旋会白白烧 CPU，这时反而比不上锁。
- **`LongAdder` 为什么比 `AtomicLong` 快**：`AtomicLong` 让所有线程 CAS 同一个变量，热点集中；`LongAdder` 把值分散到多个 `Cell` 上各自累加，`sum()` 时再汇总，用空间换竞争（JDK 8+）。
- **CAS 自旋有上限吗**：`Atomic*` 的循环由调用方控制，可能一直自旋；`synchronized` 的轻量级锁自旋则是自适应的，失败后升级为重量级锁，不会无限空转。
- **CAS 怎么保证可见性**：CAS 自带内存屏障语义——成功时相当于一次 `volatile` 写，失败时相当于一次 `volatile` 读。

## 死锁的四个必要条件是什么？如何避免和排查？

结论：死锁需要**互斥、持有并等待、不可剥夺、循环等待**四个条件**同时成立**。破坏其中任意一个就能预防死锁；排查主要靠 `jstack`，它会直接标出 `Found one Java-level deadlock`。

四个必要条件：

- **互斥**：资源一次只能被一个线程占用。
- **持有并等待**：线程已经持有部分资源，同时还在等待其它资源。
- **不可剥夺**：资源只能由持有者主动释放，不能被抢走。
- **循环等待**：存在一条线程与资源的环形等待链。

避免手段（本质上都是破坏某个条件）：

- **破坏循环等待（最实用）**：给锁规定**全局顺序**，所有线程按同一顺序获取。例如转账时总是先锁 ID 小的账号、再锁 ID 大的。
- **破坏持有并等待**：一次性申请全部所需资源；或用 `tryLock(timeout)`，拿不到就释放已持有的锁再重试。
- **破坏不可剥夺**：使用支持中断或超时的 `lockInterruptibly()`、`tryLock(timeout)`，超时后主动放弃并回退。
- **互斥**：通常无法破坏（临界资源本身就是互斥的），所以实践上主要靠上面三条。
- 另外，**减小锁粒度、缩短持锁时间、避免锁嵌套**都能显著降低概率。

排查手段：`jstack <pid>` 会打印线程栈并直接给出死锁检测结果；`jconsole`、`jvisualvm` 有"检测死锁"按钮；生产上还可以用 `ThreadMXBean.findDeadlockedThreads()` 做定时巡检。

```java
// 破坏循环等待：所有线程按同一顺序加锁
void transfer(Account from, Account to, int amount) {
    Account first  = from.id < to.id ? from : to;    // 固定顺序
    Account second = from.id < to.id ? to : from;
    synchronized (first) {
        synchronized (second) {                      // 顺序一致，不会成环
            from.balance -= amount;
            to.balance += amount;
        }
    }
}
```

### 高频延伸
- **`synchronized` 的死锁能被中断吗**：不能。等在 `synchronized` 上的线程无法被中断，只能等对方释放；用 `ReentrantLock.lockInterruptibly()` 或 `tryLock(timeout)` 才有自救的机会。
- **活锁和饥饿是什么**：死锁是"互相等"，活锁是"互相让"——线程都在运行却始终推进不了；饥饿是某个线程长期抢不到资源，比如非公平锁下被不断插队。
- **只有 `synchronized` 会死锁吗**：不是。任何"持有并等待"的排他资源都会——`ReentrantLock`、数据库行锁、乃至连接池耗尽（本质是池资源的循环等待）都一样。
- **生产上怎么预防死锁**：统一加锁顺序、避免持锁时调用外部服务或回调、给锁加超时，并用 `ThreadMXBean` 做定时检测。
- **除了 `jstack` 还有什么排查手段**：`jconsole`、`jvisualvm` 的"检测死锁"、`ThreadMXBean.findDeadlockedThreads()`、以及 APM 的线程分析；关键是能拿到线程栈。

## JMM 是什么？happens-before 有哪些规则？

结论：JMM（Java 内存模型）规定了多线程下**共享变量的可见性与有序性**语义。它抽象出"主内存 + 每个线程的工作内存"模型，并在此之上定义 `happens-before` 规则——满足该规则的两次操作，前者的结果对后者可见。

- **主内存与工作内存**：所有共享变量存在主内存；每个线程有自己的工作内存（对应 CPU 缓存与寄存器），读写要经过"从主内存拷贝 → 操作 → 写回"。这正是可见性问题的来源。
- **JMM 解决的三件事**：原子性、可见性、有序性——就是模块顶部那张总纲表。
- **`happens-before` 是保证，不是时间先后**：只要规则成立，即使两个操作在不同线程、没有真实时序关系，JVM 也必须让前者的结果对后者可见。

主要规则：

- **程序顺序规则**：同一线程内，前面的操作 happens-before 后面的操作。
- **监视器锁规则**：对同一把锁的 `unlock` happens-before 后续的 `lock`。
- **`volatile` 规则**：`volatile` 变量的写 happens-before 后续对它的读。
- **线程启动规则**：`Thread.start()` happens-before 新线程中的任何操作。
- **线程终止规则**：线程中的所有操作 happens-before 其它线程检测到它终止（`join()` 返回、`isAlive()` 为 `false`）。
- **中断规则**：`interrupt()` happens-before 被中断线程检测到中断。
- **对象终结规则**：对象构造完成 happens-before 它的 `finalize()` 开始。
- **传递性**：A happens-before B、B happens-before C ⇒ A happens-before C。

### 高频延伸
- **`happens-before` 是时间上的先后吗**：不是。它是**可见性保证**——只要规则成立，哪怕 A 在墙上时钟上晚于 B，A 的结果也必须对 B 可见；反过来，不满足规则的两次操作，JVM 可以任意重排。
- **`as-if-serial` 是什么**：单线程内，无论怎么重排，执行结果必须与顺序执行一致。它保证重排不破坏单线程语义，但**不保证多线程**——多线程的重排由 `happens-before` 约束。
- **为什么 `synchronized` 能保证可见性**：它既满足监视器锁规则（解锁前的写对后续加锁者可见），又会在临界区前后插入内存屏障，所以退出时的修改都会刷出去。
- **JMM 与硬件内存模型是什么关系**：JMM 屏蔽了不同 CPU 架构的差异，在需要时插入内存屏障指令，让同一份程序在 x86 与 ARM 上都表现一致。
- **`final` 字段有什么特殊保证**：只要对象构造期间没把 `this` 逸出，其它线程就能看到 `final` 字段已正确初始化，无需额外同步（JSR-133 给出的保证）。

## ThreadLocal 的原理是什么？为什么会导致内存泄漏？

结论：`ThreadLocal` 让每个线程拥有**自己独立的变量副本**。原理是每个 `Thread` 内部持有一个 `ThreadLocalMap`，以 `ThreadLocal` 实例的**弱引用**为 key、以变量副本为 value。**泄漏的根因正是 key 是弱引用而 value 是强引用**——key 被回收后 value 仍被线程持有，而线程池里的线程长期存活。

- **数据结构**：`Thread` 持有 `ThreadLocalMap`（字段名 `threadLocals`），内部是 `Entry[]`；`Entry` 的 key 是 `ThreadLocal` 的**弱引用**，value 是**强引用**。
- **读写路径**：`get()`/`set()` 先取当前线程的 `ThreadLocalMap`，再以 `this`（`ThreadLocal` 实例）为 key 查找——副本因此天然按线程隔离。
- **冲突解决**：`ThreadLocalMap` 不用链表，而是**开放地址法**（线性探测），这是它与 `HashMap` 最大的实现差异。

泄漏是怎么发生的：

1. `ThreadLocal` 变量被置空或离开作用域后，`ThreadLocal` 实例就只剩 `Entry.key` 这一个弱引用；
2. 下一次 GC 回收该实例，`entry.key` 变成 `null`；
3. 但 `entry.value` 是强引用，只要线程还活着（线程池的核心线程恰恰长期存活），value 就一直回收不掉 ⇒ 内存泄漏。

正确用法：**用完必须 `remove()`**，线程池场景尤其如此，`set()` 后一定配 `finally { tl.remove(); }`。`ThreadLocalMap` 在 `get`/`set` 时会顺带清理 `key == null` 的槽（`expungeStaleEntry`），但那只是**兜底**，不能依赖。

```java
private static final ThreadLocal<SimpleDateFormat> FMT =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd"));

// 线程池场景：必须手动 remove，否则 value 随线程一直存活
public String format(Date d) {
    try {
        return FMT.get().format(d);
    } finally {
        FMT.remove();          // 关键：清掉 Entry，切断对 value 的强引用
    }
}
```

### 高频延伸
- **key 为什么设计成弱引用**：若 key 是强引用，`ThreadLocal` 实例即使不再使用也会被 `ThreadLocalMap` 一直引用，泄漏只会更严重；弱引用至少让 key 能被回收，属于两害相权——但**泄漏并没有被消除**，所以仍要 `remove()`。
- **`ThreadLocal` 的值会传给子线程吗**：默认不会，子线程拿到的是自己的空副本。`InheritableThreadLocal` 能让子线程继承父线程的值，但在**线程池下会失效**（线程被复用、不会重新创建），此时需要 `TransmittableThreadLocal` 之类的方案。
- **`ThreadLocal` 为什么能减少锁竞争**：它用空间换隔离——每个线程操作自己的副本，就不需要共享，也就不需要同步。典型用法是给每个线程分配独立的 `SimpleDateFormat`（它本身线程不安全）。
- **`ThreadLocal` 和 `synchronized` 是什么关系**：方向相反。`synchronized` 是"多个线程共享一个变量、靠锁串行化"；`ThreadLocal` 是"每个线程各持一份、压根不共享"。
- **`Entry` 为什么继承弱引用**：`Entry extends WeakReference<ThreadLocal<?>>`，key 走弱引用、value 作为普通字段强引用——这正是泄漏链条的结构性原因。
- **想深入了解四种引用的差异**：弱引用只是四种引用之一，强 / 软 / 弱 / 虚各自的回收时机与适用场景见 JVM 模块的[『强、软、弱、虚引用有什么区别？』](/java/jvm/#强、软、弱、虚引用有什么区别)。

## 线程池的核心参数和执行流程是怎样的？

结论：`ThreadPoolExecutor` 有 **7 个核心参数**；`execute()` 的流程是 **核心线程 → 任务队列 → 非核心线程 → 拒绝策略**。很多人以为"先开线程到最大再排队"，其实正好相反——**队列满了才会创建非核心线程**。

7 个参数：

- **`corePoolSize`**：核心线程数。默认即使空闲也保留（除非开启 `allowCoreThreadTimeOut(true)`）。
- **`maximumPoolSize`**：最大线程数，线程总数上限。
- **`keepAliveTime`** 与 **`unit`**：非核心线程空闲后的存活时间。
- **`workQueue`**：任务队列。有界队列（如 `ArrayBlockingQueue`）能防 OOM；无界队列（`LinkedBlockingQueue` 不传容量）会让 `maximumPoolSize` **形同虚设**。
- **`threadFactory`**：创建线程的工厂，建议自定义以便设置有意义的线程名（排查问题时极其有用）。
- **`handler`**：拒绝策略，在队列满且线程数已达上限时触发。

`execute()` 的四步流程：

1. 核心线程未满 → 新建核心线程执行任务；
2. 核心线程已满 → 任务进入 `workQueue` 排队；
3. 队列已满且线程数未达 `maximumPoolSize` → 新建非核心线程；
4. 队列满且线程数已达上限 → 交给拒绝策略。

另外两点：

- **非核心线程空闲超过 `keepAliveTime` 会被回收**，核心线程默认不回收。
- "先排队、后扩容"的取舍：核心线程数设小 + 无界队列时，线程数会永远停在 `corePoolSize`，并发能力被浪费、任务不断堆积。

```java
// 生产环境应直接构造，而不是用 Executors 工厂方法
ThreadPoolExecutor pool = new ThreadPoolExecutor(
        4,                                   // corePoolSize
        8,                                   // maximumPoolSize
        60L, TimeUnit.SECONDS,               // 非核心线程空闲存活时间
        new ArrayBlockingQueue<>(200),       // 有界队列：挡住任务堆积
        r -> new Thread(r, "order-pool-" + r.hashCode()),   // 自定义线程名
        new ThreadPoolExecutor.CallerRunsPolicy()           // 拒绝策略
);
```

### 高频延伸
- **为什么队列满之前不会创建非核心线程**：这是 `ThreadPoolExecutor` 的既定逻辑——先入队、队列满才扩容，目的是尽量用少量线程消化突发流量；理解这点才能解释"线程数为什么上不去"。
- **`Executors` 的工厂方法有什么坑**：`newFixedThreadPool` / `newSingleThreadExecutor` 用**无界队列**，任务会无限堆积直到 OOM；`newCachedThreadPool` 的 `maximumPoolSize` 是 `Integer.MAX_VALUE`，可能创建海量线程。所以开发规范要求直接用 `new ThreadPoolExecutor(...)`。
- **`allowCoreThreadTimeOut(true)` 有什么用**：让核心线程也受 `keepAliveTime` 约束、空闲后回收，适合流量波峰波谷明显的场景。
- **线程池状态是怎么表示的**：`ctl` 是一个 `AtomicInteger`，高 3 位存运行状态（`RUNNING`/`SHUTDOWN`/`STOP`/`TIDYING`/`TERMINATED`），低 29 位存线程数，一个变量同时表达两件事。
- **`shutdown` 和 `shutdownNow` 有什么区别**：`shutdown` 不再接收新任务、等已提交的任务跑完；`shutdownNow` 尝试中断正在执行的任务，并返回队列中尚未执行的任务列表。

## 线程池的拒绝策略有哪些？线程数怎么设置？

结论：JDK 内置 **4 种拒绝策略**——`AbortPolicy`（默认，抛异常）、`CallerRunsPolicy`、`DiscardPolicy`、`DiscardOldestPolicy`。线程数没有万能公式，取决于任务类型：**CPU 密集 ≈ 核数 + 1；IO 密集 ≈ 核数 × (1 + 等待时间 / 计算时间)**。

四种拒绝策略：

- **`AbortPolicy`（默认）**：直接抛 `RejectedExecutionException`，不静默丢任务，但要求调用方处理异常。
- **`CallerRunsPolicy`**：把任务交回**提交任务的线程**执行。它相当于一个反压机制——提交方被拖慢，提交速度自然降下来（若线程池已关闭则直接丢弃）。
- **`DiscardPolicy`**：静默丢弃新任务、不抛异常，**最危险**——任务丢了却毫无感知。
- **`DiscardOldestPolicy`**：丢掉队列里最老的任务，再尝试提交当前任务。
- 也可以自定义：实现 `RejectedExecutionHandler`，把任务落库、落盘或记日志，做后续补偿。

线程数怎么定：

- **CPU 密集型**（计算、加解密、序列化）：`核数 + 1`，多出的一个用于顶上偶发的页缺失等情况。
- **IO 密集型**（调用 RPC、查库、读写文件）：`核数 × (1 + 等待时间 / 计算时间)`，等待占比越高、线程数越多。
- 实践中先用公式给初值，再**压测调优**，并配合监控（活跃线程数、队列长度、拒绝次数）调整。
- 不同任务应使用**不同的线程池**，核心业务最好做隔离，避免互相拖累。

```java
// 自定义拒绝策略：记录并补偿，而不是静默丢弃
RejectedExecutionHandler handler = (task, executor) ->
        log.warn("任务被拒绝，队列长度={}", executor.getQueue().size());

// CPU 密集：核数 + 1；IO 密集：核数 × (1 + 等待/计算)
int cores = Runtime.getRuntime().availableProcessors();
int cpuBound = cores + 1;
int ioBound  = cores * (1 + 2);     // 假设等待时间 / 计算时间 ≈ 2
```

### 高频延伸
- **默认的拒绝策略是哪个**：`AbortPolicy`，抛 `RejectedExecutionException`。所以"线程池会不会丢任务"取决于选的策略，默认不丢但会抛。
- **`CallerRunsPolicy` 有什么副作用**：会让提交任务的线程（比如 Tomcat 的工作线程）亲自去执行任务、被阻塞；但正因如此它形成了天然反压，保护线程池不被压垮。
- **为什么不建议用无界队列**：无界队列下 `maximumPoolSize` 形同虚设，任务无限堆积，最终以 `OutOfMemoryError` 收场——这是线上事故的经典成因。
- **线程数必须区分任务类型吗**：必须。给 IO 密集任务配 `核数 + 1` 会严重浪费并发能力；反过来给 CPU 密集任务配几百个线程，只会加剧上下文切换。
- **多个业务共用一个线程池有什么风险**：一个业务的任务堆积会拖垮其它业务（队头阻塞）。应按业务隔离线程池，核心链路单独配置。

## CompletableFuture 是什么？和 Future 有什么区别？

结论：`Future` 只能**阻塞式**拿结果、也无法编排多个任务；`CompletableFuture`（JDK 8）在它之上提供了**回调、组合与异常处理**，是 Java 异步编排的主力。

`Future` 的四个短板：

1. **只能阻塞取结果**：`get()` 会一直等，`get(timeout)` 也只是限时等，没有"完成了通知我"的办法。
2. **无法组合**：想让 B 在 A 完成后执行、或等 A + B 都完成再做 C，用 `Future` 只能自己写阻塞逻辑。
3. **无法优雅处理异常**：只能拿 `try-catch` 包住 `get()`。
4. **不支持回调**：要么阻塞，要么轮询 `isDone()`。

`CompletableFuture` 怎么解决：

- **回调**：`thenApply`（转换结果）、`thenAccept`（消费结果）、`thenRun`（完成后执行、不关心结果）。
- **组合**：`thenCompose`（串行依赖，拍平嵌套）、`thenCombine`（两个都完成后合并）、`allOf`（等全部完成）、`anyOf`（任一完成即可）。
- **异常处理**：`exceptionally`（兜底）、`handle`（无论成败都处理）、`whenComplete`（只做收尾、不改结果）。
- **主动完成**：`complete(value)` 可手动结束；取结果用 `get()` 或 `join()`（**`join` 不抛受检异常**）。

```java
// 串行：查询用户 → 用用户信息查订单
CompletableFuture<String> future = CompletableFuture
        .supplyAsync(() -> queryUser(id))                 // 默认用 commonPool
        .thenApply(User::getName)
        .thenComposeAsync(name -> queryOrder(name), pool) // 显式指定线程池
        .exceptionally(ex -> "fallback");                 // 异常兜底

// 并行：两个独立查询一起等，再合并
CompletableFuture<String> a = CompletableFuture.supplyAsync(() -> queryA(), pool);
CompletableFuture<String> b = CompletableFuture.supplyAsync(() -> queryB(), pool);
String result = a.thenCombine(b, (x, y) -> x + y).join();

// 等全部完成
CompletableFuture.allOf(a, b).join();
```

### 高频延伸（面试官爱追问）
- **`CompletableFuture` 默认用哪个线程池**：不传 Executor 时用 **`ForkJoinPool.commonPool()`**——它是**全 JVM 共享**的，默认并行度是 CPU 核数减一。**这是最常见的坑**：把阻塞式任务（调 RPC、查库）丢进 commonPool 会占满公共线程，拖累同进程里其它用到它的代码。**线上务必显式传入业务线程池**。
- **`thenApply` 和 `thenCompose` 有什么区别**：`thenApply` 是**映射**，若返回 `CompletableFuture` 就会嵌套成两层；`thenCompose` 是**扁平化**，把两层拍平，等价于 `flatMap`。返回 `CompletableFuture` 时用 `thenCompose`，否则用 `thenApply`。
- **带 `Async` 后缀和不带有什么区别**：不带 `Async` 的方法由**上一个任务完成时所在的那个线程**执行（可能是别人的任务线程，也可能就是主线程）；带 `Async` 的会把后续动作**提交给线程池**执行，并可指定 Executor。为了可控，链上最好统一用带 `Async` 的版本。
- **`get()` 和 `join()` 有什么区别**：`get()` 抛受检的 `InterruptedException` / `ExecutionException`；`join()` 抛**非受检**的 `CompletionException`，因此在 lambda 里更适合用 `join()`。
- **异常是怎么传播的**：某一步抛异常后，后续的 `thenApply` 等**会被跳过**，直到遇到 `exceptionally` / `handle` 才被处理；若一路没人处理，最终 `get()` / `join()` 会抛出（被包成 `ExecutionException` / `CompletionException`）。

## AQS 是什么？ReentrantLock 是怎么基于它实现的？

结论：AQS（`AbstractQueuedSynchronizer`）是 JDK 5 引入的**同步器框架**，用「一个 `volatile int state` + 一条 CLH 变体双向等待队列」把"排队、阻塞、唤醒"这套通用逻辑封装好，子类只需实现 `tryAcquire`/`tryRelease` 等钩子方法。`ReentrantLock`、`Semaphore`、`CountDownLatch`、`ReentrantReadWriteLock` 都基于它。

核心结构：

- **`volatile int state`**：同步状态，含义由子类定义——`ReentrantLock` 用它表示**重入次数**，`Semaphore` 用它表示**剩余许可数**，`CountDownLatch` 用它表示**未完成的计数**。
- **CLH 变体双向队列**：抢不到锁的线程被包装成 `Node` 入队，并 `LockSupport.park()` 阻塞；释放锁时唤醒后继节点。
- **`Node.waitStatus`**：`SIGNAL`（需要唤醒后继）、`CANCELLED`、`CONDITION`、`PROPAGATE` 等，用于队列内部的状态协作。
- **模板方法模式**：`acquire`/`release`（独占）与 `acquireShared`/`releaseShared`（共享）是 AQS 写好的骨架，子类只实现 `tryAcquire`/`tryRelease`/`tryAcquireShared`/`tryReleaseShared`/`isHeldExclusively`。

`ReentrantLock` 是怎么用的：

- 内部有 `Sync extends AbstractQueuedSynchronizer`，再分 `NonfairSync` 与 `FairSync` 两个子类。
- **加锁**：`tryAcquire` 判断 `state == 0` 时 CAS 抢锁并置为 1、记录持有线程；若持有者就是当前线程，则 `state++`——这就是**可重入**的来源。
- **释放**：`tryRelease` 把 `state--`，减到 0 才真正释放并唤醒后继节点。
- **公平与非公平的差别**：公平锁在 `tryAcquire` 里先判断队列中是否有更早的等待者，有就不抢；非公平锁直接 CAS 插队，吞吐更高但可能造成饥饿。
- **`Condition`**：`ConditionObject` 也是 AQS 的内部类，用它自己的条件队列实现 `await`/`signal`，因此一把 `ReentrantLock` 可以有多个条件队列（`synchronized` 只有一个等待集）。

### 高频延伸
- **AQS 支持哪两种模式**：独占（`acquire`/`release`，如 `ReentrantLock`）与共享（`acquireShared`/`releaseShared`，如 `Semaphore`、`CountDownLatch`）；`ReentrantReadWriteLock` 两种都用——读锁共享、写锁独占。
- **为什么用 CLH 队列的变体**：CLH 原本是自旋锁队列，AQS 把它改成"自旋 + `LockSupport.park()` 阻塞"的变体，既保留 FIFO 公平性，又避免纯自旋浪费 CPU。
- **`CountDownLatch` 和 `CyclicBarrier` 有什么区别**：一个是**一次性**的计数放行，一个是**可循环**的"等齐再走"；`Semaphore` 则是许可控制。三者的完整对照见[『CountDownLatch、CyclicBarrier、Semaphore 有什么区别？』](#countdownlatch、cyclicbarrier、semaphore-有什么区别)。
- **`state` 只是个 `int`，够用吗**：够。`ReentrantLock` 的重入次数上限是 `Integer.MAX_VALUE`，`Semaphore` 的许可数也够用；需要更大计数时应换用 `LongAdder` 一类的分散计数，而非扩宽 AQS。
- **为什么说 AQS 是模板方法模式**：它把"怎么排队、怎么阻塞、怎么唤醒"固定成骨架，把"什么算获取成功"开放给子类实现钩子——框架定流程、子类填判定。

## CountDownLatch、CyclicBarrier、Semaphore 有什么区别？

结论：三者常被放在一起问，但语义完全不同——**`CountDownLatch` 是"等够数量就放行"（一次性）**、**`CyclicBarrier` 是"等齐一批再一起走"（可循环）**、**`Semaphore` 是"控制同时访问的线程数"（发许可）**。

- **`CountDownLatch`**：一组线程 `await()` 等待，其它线程每完成一项就 `countDown()`；计数减到 0 时所有等待者被放行。**一次性**——归零后不能重置。
  - 典型场景：主线程等所有子任务完成、服务启动时等依赖就绪。
- **`CyclicBarrier`**：一组线程互相等待，凑齐 `parties` 个后一起继续，且可以**循环复用**（`reset()`）；还能传入一个"到齐后执行"的回调（`Runnable`）。
  - 典型场景：多阶段并行计算，每阶段结束同步一次。
- **`Semaphore`**：维护一组**许可**，`acquire()` 拿走一个（不够就阻塞）、`release()` 归还。**不关心先后，只限制并发数**。
  - 典型场景：接口限流、限制对某资源的并发访问（连接池、DB 并发）。
- **与 AQS 的关系**：`CountDownLatch` 用它实现**共享模式**（计数即 `state`），`Semaphore` 用 `state` 当**许可数**；而 **`CyclicBarrier` 并不基于 AQS**——它用 `ReentrantLock` + `Condition` 自行实现（见[『AQS 是什么？ReentrantLock 是怎么基于它实现的？』](#aqs-是什么-reentrantlock-是怎么基于它实现的)）。

```java
// CountDownLatch：主线程等 3 个子任务跑完
CountDownLatch latch = new CountDownLatch(3);
for (int i = 0; i < 3; i++) {
    pool.submit(() -> {
        try { doWork(); } finally { latch.countDown(); }   // 必须放 finally
    });
}
latch.await();                       // 计数归零才继续；用一次即废

// Semaphore：最多 2 个线程同时访问
Semaphore semaphore = new Semaphore(2);
semaphore.acquire();
try { accessResource(); }
finally { semaphore.release(); }     // 必须放 finally，否则许可永久泄漏

// CyclicBarrier：3 个线程到齐后一起继续，可循环使用
CyclicBarrier barrier = new CyclicBarrier(3, () -> System.out.println("一波结束"));
barrier.await();                     // 每阶段调一次，凑齐即放行
```

### 高频延伸（面试官爱追问）
- **`CountDownLatch` 和 `CyclicBarrier` 最本质的区别**：`CountDownLatch` 是**一个线程等多个线程**（做减法、一次性）；`CyclicBarrier` 是**一批线程互相等**（凑齐、可循环）。前者等的是"事件"，后者等的是"伙伴"。
- **`Semaphore` 的许可会"泄漏"吗**：会。`acquire()` 之后若在异常路径上忘了 `release()`，许可就永久少一个，最终所有线程都被卡住。**必须写在 `finally` 里**——这与 `countDown()` 要放 `finally` 是同一个道理。
- **`CountDownLatch` 的计数能重用吗**：不能。归零即失效，再 `await()` 会立刻返回。需要重用就用 `CyclicBarrier`，或干脆新建一个 latch。
- **`CyclicBarrier` 的 `reset()` 有什么风险**：会让已在等待的线程抛 `BrokenBarrierException`。它通常用于"异常后整体放弃"，正常流程不该随意调用。
- **这三个在项目里怎么用**：批量接口并发调用后聚合结果（`CountDownLatch` 或 `CompletableFuture.allOf`）、多阶段数据加工（`CyclicBarrier`）、下游限流与资源池并发控制（`Semaphore`）。限流场景如今更常用 `RateLimiter`（Guava / Sentinel）。
