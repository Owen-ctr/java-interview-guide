# JVM

本模块覆盖内存结构、垃圾回收、类加载等 JVM 面试常考点。

## JVM 的运行时数据区由哪些部分组成？

JVM 在运行时会将所管理的内存划分为若干区域，理解这些区域是掌握垃圾回收、内存溢出与线程模型的基础。按是否线程私有，可分为两类。

线程私有区域随线程的创建而创建、销毁而销毁：

- **程序计数器**：一小块内存，记录当前线程正在执行的字节码指令地址；若当前执行的是 `native` 方法，该值为 undefined。它是唯一不会抛出 `OutOfMemoryError` 的区域，作用是线程切换后能恢复到正确的执行位置。
- **Java 虚拟机栈**：对应 Java 方法调用的栈结构，每次方法调用会创建一个栈帧，存放局部变量表、操作数栈、动态链接、方法出口等信息。递归深度超出栈容量触发 `StackOverflowError`。规范允许虚拟机栈固定大小或动态扩展，但 HotSpot 采用固定大小（`-Xss`），因此 OOM 并非「栈扩展失败」，而是创建新线程时无法为其分配栈。
- **本地方法栈**：与虚拟机栈作用类似，服务于 `native` 方法（如 JNI 调用的 C/C++ 代码），HotSpot 中与虚拟机栈合并实现。

线程共享区域为所有线程共用，也是垃圾收集的主要关注对象：

- **堆**：JVM 中最大的一块内存，存放对象实例与数组，是 GC 的主战场，通常按分代划分为新生代（Eden 与两个 Survivor 区）和老年代。
- **方法区**：存储已被加载的类信息（字段与方法描述、方法字节码）、**运行时常量池**等。JDK 8 之前称为"永久代"，位于堆内、容易 OOM；JDK 8 起改为**元空间（Metaspace）**，使用本地内存，理论上受系统内存限制，但同样可能溢出。两个常见误区：JIT 编译后的本地代码存放在 HotSpot 独立的**代码缓存（CodeCache）**中，不属于方法区（元空间）；类的静态变量自 JDK 7 起随 `Class` 对象移入堆，同样不在方法区。

需要厘清的易混点：基本类型变量与对象引用存于栈帧的局部变量表，对象实例本身在堆中；方法区在 JDK 8 前后的实现差异（永久代到元空间）、以及「运行时常量池在方法区、字符串常量池自 JDK 7 起在堆」是面试高频追问点，应明确区分。

### 高频延伸（面试官爱追问）
- 堆的分代比例有默认值吗？有，且随收集器而变：JDK 8 默认 `-XX:NewRatio=2`（新生代:老年代 = 1:2）、`-XX:SurvivorRatio=8`（Eden:S0:S1 = 8:1:1）。
- 堆与方法区（元空间）分别可能抛出哪种 OOM？对应的调优参数（如 `-Xmx`、`-XX:MaxMetaspaceSize`）是什么？堆溢出报 `OutOfMemoryError: Java heap space`，由 `-Xms`/`-Xmx` 控制；元空间溢出报 `OutOfMemoryError: Metaspace`，由 `-XX:MetaspaceSize`/`-XX:MaxMetaspaceSize` 控制（JDK 8 之前为 `PermGen space`，对应 `-XX:MaxPermSize`）。
- JDK 8 为何用元空间替换永久代？核心原因是规避永久代固定大小带来的 OOM、降低调优成本，并与 JRockit/J9 等 JVM 实现对齐。
- JDK 8 服务端默认用哪个收集器？**Parallel Scavenge（新生代）+ Parallel Old（老年代）**，并非 CMS；G1 到 JDK 9 才成为默认。
- 栈帧中的局部变量表如何存放基本类型与对象引用？以**变量槽（Slot）**为单位，HotSpot 中每个槽占 32 位：`boolean`/`byte`/`char`/`short`/`int`/`float`/`reference` 各占 1 个槽，`long`/`double` 占 2 个**连续**槽（规范只规定成对占用，不强制槽宽与对齐）；存对象时槽内是**指向堆中实例的引用**，实例本身仍在堆；实例方法的第 0 个槽固定为 `this`，静态方法没有。
- 运行时数据区之外还有什么会 OOM？**直接内存**——NIO 的 `DirectByteBuffer` 使用它，不受 `-Xmx` 约束，由 `-XX:MaxDirectMemorySize` 限制，溢出同样抛 `OutOfMemoryError`。
- `-XX:MaxMetaspaceSize` 与 `-XX:MetaspaceSize` 有什么区别？前者是上限（**默认不限制**，受本地内存约束），后者是**首次触发 Full GC 的阈值**，不是「初始大小」，容易记反。
- 代码缓存（CodeCache）也会成为瓶颈吗？会，但表现与堆 OOM 不同：占满后 JIT 编译被禁用、退化为解释执行（性能骤降而非直接崩溃），上限由 `-XX:ReservedCodeCacheSize` 控制（JDK 8 默认约 240MB）。
