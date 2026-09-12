# List / Set 与迭代

## ArrayList 和 LinkedList 的区别？

<Badge type="info" text="难度：基础" />

### 一句话答案
ArrayList 基于动态数组，随机访问快、增删中间慢；LinkedList 基于双向链表，增删快、随机访问慢，且额外内存开销大。

### 详细解析
- **底层**：ArrayList 是 `Object[]`，扩容时拷贝；LinkedList 是节点双向链表。
- **查询**：ArrayList `get(i)` 是 O(1)；LinkedList 需遍历 O(n)。
- **增删**：ArrayList 中间插入要搬移元素 O(n)；LinkedList 改指针 O(1)（但先遍历到位置仍是 O(n)）。
- **内存**：LinkedList 每个节点额外存前后指针，开销更大。

:::: warning 注意
不要为了「频繁增删」无脑用 LinkedList；现代 CPU 缓存下 ArrayList 的局部性更好，多数场景 ArrayList 更快。
::::

---

## HashSet 的底层是什么？如何保证元素不重复？

<Badge type="info" text="难度：基础" />

### 一句话答案
HashSet 底层就是 HashMap，元素作为 map 的 key，value 用一个共享的空对象；去重依赖元素的 `hashCode()` + `equals()`。

### 详细解析
- 添加时调用 `map.put(e, PRESENT)`，若 key 已存在则覆盖 value（不变），返回旧值判断是否新增成功。
- 因此存入自定义对象务必正确重写 `hashCode` 与 `equals`，否则去重失效。

---

## fail-fast 和 fail-safe 有什么区别？

<Badge type="tip" text="难度：进阶" />

### 一句话答案
fail-fast 在迭代中集合结构被修改会立刻抛 `ConcurrentModificationException`（如 HashMap/ArrayList 的迭代器）；fail-safe 基于副本迭代，不抛异常但可能读不到最新数据（如 CopyOnWriteArrayList、ConcurrentHashMap 迭代器）。

### 详细解析
- **fail-fast**：迭代器记录 `modCount`，每次 `next()` 检查是否被并发修改。
- **fail-safe**：遍历的是容器快照/弱一致性视图，修改不影响遍历，但牺牲实时性。
