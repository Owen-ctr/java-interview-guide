# 内存与 GC

## 说一下 JVM 的内存结构？

<Badge type="tip" text="难度：进阶" />

### 一句话答案
JVM 运行时数据区分为线程私有（程序计数器、虚拟机栈、本地方法栈）和线程共享（堆、方法区/元空间）。

### 详细解析
- **线程私有**：程序计数器（字节码行号指示）、Java 虚拟机栈（栈帧：局部变量表/操作数栈/方法调用）、本地方法栈（Native 方法）。
- **线程共享**：堆（对象实例，GC 主战场）、方法区（类信息、常量、静态变量；JDK8 后为元空间 Metaspace，使用本地内存而非堆）。

:::: tip 延伸
`StackOverflowError` 来自虚拟机栈深度溢出；`OutOfMemoryError` 常见于堆或元空间不足。
::::

---

## 四种引用类型及区别？

<Badge type="tip" text="难度：进阶" />

### 一句话答案
强引用（不回收）、软引用（内存不足才回收，适合缓存）、弱引用（下次 GC 必回收）、虚引用（仅跟踪回收，需 ReferenceQueue）。

### 详细解析
- **强**：`Object o=new Object()`，从不回收。
- **软 SoftReference**：内存将溢出前回收，常用于内存敏感缓存。
- **弱 WeakReference**：GC 时必回收，如 `ThreadLocalMap` 的 key。
- **虚 PhantomReference**：不能取对象，仅感知对象被回收，用于堆外内存清理（如 DirectBuffer）。

---

## 你知道哪些垃圾回收算法？

<Badge type="warning" text="难度：深入" />

### 一句话答案
常见：标记-清除、标记-整理、复制算法；分代收集（新生代用复制、老年代用标记-整理）是主流方案。

### 详细解析
- **标记-清除**：先标记存活对象再清除未标记，简单但产生内存碎片。
- **复制**：把存活对象复制到另一块空间，无碎片但浪费一半空间（新生代 Eden + Survivor 用此思路）。
- **标记-整理**：标记后让存活对象向一端移动，无碎片，适合老年代。
- **分代收集**：新对象在新生代（Minor GC），多次存活进入老年代（Major / Full GC）。

:::: warning 注意
GC  Roots 包括：虚拟机栈局部变量、方法区静态属性/常量、本地方法栈引用等；从 Roots 不可达的对象才可被回收。
::::

---

## 常见的垃圾回收器有哪些？

<Badge type="warning" text="难度：深入" />

### 一句话答案
Serial/Parallel（吞吐优先）、CMS（并发低停顿，已废弃）、G1（Region 化、可预测停顿，主流）、ZGC/Shenandoah（超低停顿，亚毫秒级，大堆友好）。

### 详细解析
- **CMS**：初始标记→并发标记→重新标记→并发清除，并发但易产生碎片、CPU 敏感。
- **G1**：把堆切为多个 Region，优先回收价值最大的 Region（Garbage First），可设 `MaxGCPauseMillis` 目标停顿。
- **ZGC**：基于染色指针 + 读屏障，停顿与堆大小基本无关，适合超大堆。

---

## 内存泄漏和内存溢出（OOM）的区别？如何排查？

<Badge type="warning" text="难度：深入" />

### 一句话答案
内存泄漏是对象不再使用却无法被 GC 回收（长生命周期持有着短生命周期引用）；OOM 是堆/元空间等不足导致分配失败；排查靠 dump + MAT/`jstack`。

### 详细解析
- **常见泄漏**：静态集合、未关资源、ThreadLocal 未 remove、监听器未注销。
- **排查**：`jmap -dump` 导出堆，`jstack` 看线程，`jstat` 看 GC；MAT 分析支配树找大对象。
- **参数**：`-Xms/-Xmx` 设堆，`-XX:MaxMetaspaceSize` 设元空间。
