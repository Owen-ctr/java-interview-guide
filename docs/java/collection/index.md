# Java 集合 · 高频面试题

<Badge type="info" text="模块：Java 集合" />
<Badge type="tip" text="建议优先级：高" />

---

## HashMap 和 Hashtable 的区别？为什么 HashMap 线程不安全？

<Badge type="warning" text="难度 ⭐⭐⭐" /> 出现频率：高 ｜ 标签：集合·Map

### 一句话答案
Hashtable 线程安全但已过时（方法全 synchronized），HashMap 非线程安全但性能更好；HashMap 在并发 put 时可能丢数据、产生环形链表（JDK7）或数据覆盖（JDK8）。

### 详细解析
- **线程安全**：Hashtable 对所有方法加 `synchronized`，并发度低；HashMap 不做同步。
- **Null 值**：HashMap 允许 key/value 为 null（仅一个 null key）；Hashtable 不允许。
- **迭代器**：HashMap 的 fail-fast 迭代器在结构被修改时抛 `ConcurrentModificationException`；Hashtable 的 enumerator 非 fail-fast。
- **线程不安全表现**：JDK7 头插法在并发扩容时可能形成环；JDK8 改用尾插法但仍存在数据覆盖、size 统计不准。并发场景应改用 `ConcurrentHashMap`。

::: tip 延伸
JDK8 的 HashMap 底层为「数组 + 链表 + 红黑树」，链表长度 ≥ 8 且数组容量 ≥ 64 时转红黑树。
:::

---

## ArrayList 和 LinkedList 的区别？

<Badge type="warning" text="难度 ⭐⭐" /> 出现频率：高 ｜ 标签：集合·List

### 一句话答案
ArrayList 基于动态数组，随机访问快、增删中间慢；LinkedList 基于双向链表，增删快、随机访问慢，且额外内存开销大。

### 详细解析
- **底层**：ArrayList 是 `Object[]`，扩容时拷贝；LinkedList 是节点双向链表。
- **查询**：ArrayList `get(i)` 是 O(1)；LinkedList 需遍历 O(n)。
- **增删**：ArrayList 中间插入要搬移元素 O(n)；LinkedList 改指针 O(1)（但先遍历到位置仍是 O(n)）。
- **内存**：LinkedList 每个节点额外存前后指针，开销更大。

::: warning 注意
不要为了「频繁增删」无脑用 LinkedList；现代 CPU 缓存下 ArrayList 的局部性更好，多数场景 ArrayList 更快。
:::
