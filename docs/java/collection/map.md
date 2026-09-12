# Map 集合

## HashMap 和 Hashtable 的区别？为什么 HashMap 线程不安全？

<Badge type="tip" text="难度：进阶" />

### 一句话答案
Hashtable 线程安全但已过时（方法全 synchronized），HashMap 非线程安全但性能更好；HashMap 在并发 put 时可能丢数据、产生环形链表（JDK7）或数据覆盖（JDK8）。

### 详细解析
- **线程安全**：Hashtable 对所有方法加 `synchronized`，并发度低；HashMap 不做同步。
- **Null 值**：HashMap 允许 key/value 为 null（仅一个 null key）；Hashtable 不允许。
- **迭代器**：HashMap 的 fail-fast 迭代器在结构被修改时抛 `ConcurrentModificationException`；Hashtable 的 enumerator 非 fail-fast。
- **线程不安全表现**：JDK7 头插法在并发扩容时可能形成环；JDK8 改用尾插法但仍存在数据覆盖、size 统计不准。并发场景应改用 `ConcurrentHashMap`。

:::: tip 延伸
JDK8 的 HashMap 底层为「数组 + 链表 + 红黑树」，链表长度 ≥ 8 且数组容量 ≥ 64 时转红黑树。
::::

---

## JDK8 的 HashMap 底层原理与扩容？

<Badge type="warning" text="难度：深入" />

### 一句话答案
JDK8 HashMap = 数组 + 链表 + 红黑树；默认容量 16、负载因子 0.75；元素超 `容量×负载因子` 触发 2 倍扩容并 rehash；链表长度 ≥8 且数组≥64 转红黑树，≤6 退化回链表。

### 详细解析
- **put 流程**：算 hash（高16位异或低16位扰动）→ 定位桶；桶空直接放；是红黑树节点则树插入；是链表则尾插，同时判断是否达树化阈值。
- **扩容**：新建 2 倍数组，遍历旧桶重新分配（e.hash & oldCap 决定留原位或移 half 处），JDK8 比 JDK7 头插更优且避免死循环。
- **树化条件**：链表长度 ≥8 且 table 容量 ≥64；否则优先扩容而非树化。

---

## ConcurrentHashMap 是如何保证线程安全的？

<Badge type="warning" text="难度：深入" />

### 一句话答案
JDK7 用分段锁（Segment）降低锁粒度；JDK8 放弃 Segment，改用 `Node + CAS + synchronized`（只锁桶头节点），并配合 volatile 保证可见性，并发度更高。

### 详细解析
- **JDK7**：默认 16 个 Segment，每个 Segment 是一把 ReentrantLock，不同段可并发写入。
- **JDK8**：`table` 用 volatile 数组；读几乎无锁（volatile 读）；写时若桶为空用 CAS 放头节点，否则对头节点 `synchronized` 加锁再操作链表/树。
- **size()**：用 baseCount + CounterCell 分段累加，近似准确、避免全局锁。
