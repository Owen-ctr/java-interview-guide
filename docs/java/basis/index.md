# Java 基础 · 高频面试题

<Badge type="info" text="模块：Java 基础" />
<Badge type="tip" text="建议优先级：高" />

---

## String、StringBuilder、StringBuffer 的区别？

<Badge type="warning" text="难度 ⭐⭐" /> 出现频率：高 ｜ 标签：基础·字符串

### 一句话答案
String 不可变；StringBuilder 可变、非线程安全、速度快；StringBuffer 可变、方法 synchronized、线程安全。

### 详细解析
- **String**：底层 `final byte[]`（JDK9 起）+ coder，不可变，频繁拼接产生大量中间对象。
- **StringBuilder**：可变，拼接效率高，单线程首选。
- **StringBuffer**：与 StringBuilder API 一致，但关键方法加锁，多线程拼接安全，代价是性能略低。

::: warning 注意
循环里用 `+` 拼接 String 会隐式创建 StringBuilder，但每轮循环都是一个新对象，大量拼接仍建议显式复用同一个 StringBuilder。
:::

---

## 重写 equals 为什么通常也要重写 hashCode？

<Badge type="warning" text="难度 ⭐⭐⭐" /> 出现频率：高 ｜ 标签：基础·Object

### 一句话答案
因为相等的对象必须有相等的 hashCode，否则放到 HashMap/HashSet 中会「存得进、查不出」，破坏集合语义。

### 详细解析
- Java 规范：`a.equals(b) == true` ⇒ `a.hashCode() == b.hashCode()`（反之不要求）。
- 若只重写 equals 不重写 hashCode，两个逻辑相等的对象可能 hashCode 不同，被放到哈希表不同桶，导致重复元素或查找失败。
- 重写 hashCode 时使用的字段应与 equals 保持一致。

---

## Java 异常体系是怎样的？Checked 和 Unchecked 区别？

<Badge type="warning" text="难度 ⭐⭐⭐" /> 出现频率：中 ｜ 标签：基础·异常

### 一句话答案
Throwable 分 Error（严重、不应捕获）和 Exception；Exception 分 Checked（编译期强检，如 IOException）和 RuntimeException（Unchecked，如 NPE）。

### 详细解析
- **Error**：如 `OutOfMemoryError`，通常由 JVM 抛出，不应也不建议捕获。
- **Checked Exception**：继承 Exception 但不继承 RuntimeException，编译期必须 try-catch 或 throws。
- **Unchecked / RuntimeException**：如 `NullPointerException`、`IllegalArgumentException`，编译期不强制处理。
- 设计原则：可恢复用 Checked，程序错误用 RuntimeException。
