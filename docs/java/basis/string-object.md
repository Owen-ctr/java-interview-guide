# 字符串与 Object

## String、StringBuilder、StringBuffer 的区别？

<Badge type="info" text="难度：基础" />

### 一句话答案
String 不可变；StringBuilder 可变、非线程安全、速度快；StringBuffer 可变、方法 synchronized、线程安全。

### 详细解析
- **String**：底层 `final byte[]`（JDK9 起）+ coder，不可变，频繁拼接产生大量中间对象。
- **StringBuilder**：可变，拼接效率高，单线程首选。
- **StringBuffer**：与 StringBuilder API 一致，但关键方法加锁，多线程拼接安全，代价是性能略低。

:::: warning 注意
循环里用 `+` 拼接 String 会隐式创建 StringBuilder，但每轮循环都是一个新对象，大量拼接仍建议显式复用同一个 StringBuilder。
::::

---

## == 和 equals 的区别？

<Badge type="info" text="难度：基础" />

### 一句话答案
`==` 比较基本类型比的是值、比较引用类型比的是内存地址；`equals` 默认也比地址，但通常被重写为比较「逻辑相等」（如 String 比内容）。

### 详细解析
- **基本类型**：`==` 直接比较值；基本类型没有 `equals`（需由其包装类调用）。
- **引用类型**：`==` 比较是否为同一个对象（地址）；`equals` 不重写时等价于 `==`，重写后按业务比较（如 String、Integer 比较内容）。
- **Integer 缓存坑**：`Integer.valueOf(-128~127)` 走缓存，`new Integer(1) == Integer.valueOf(1)` 为 false，但 `Integer.valueOf(1).equals(Integer.valueOf(1))` 为 true。

---

## 重写 equals 为什么通常也要重写 hashCode？

<Badge type="tip" text="难度：进阶" />

### 一句话答案
因为相等的对象必须有相等的 hashCode，否则放到 HashMap/HashSet 中会「存得进、查不出」，破坏集合语义。

### 详细解析
- Java 规范：`a.equals(b) == true` ⇒ `a.hashCode() == b.hashCode()`（反之不要求）。
- 若只重写 equals 不重写 hashCode，两个逻辑相等的对象可能 hashCode 不同，被放到哈希表不同桶，导致重复元素或查找失败。
- 重写 hashCode 时使用的字段应与 equals 保持一致。
