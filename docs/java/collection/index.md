# 集合

本模块覆盖 Map、List、Set 及迭代器等 Java 集合框架面试常考点。集合框架分 `Collection`（`List`、`Set`、`Queue`）与 `Map` 两大支，下面是高频实现的速查对照，详细差异见下方各题。

| 实现 | 底层结构 | 有序性 | 允许 null | 线程安全 | 典型场景 |
| --- | --- | --- | --- | --- | --- |
| `ArrayList` | 动态数组 | 插入序 | 元素可 null | 否 | 随机访问多、尾部增删 |
| `LinkedList` | 双向链表 | 插入序 | 元素可 null | 否 | 频繁头/中间增删、兼作 Deque |
| `HashMap` | 数组 + 链表 + 红黑树 | 无序 | key/value 均可 | 否 | 通用键值查找 |
| `LinkedHashMap` | `HashMap` + 双向链表 | 插入序 / 访问序 | 均可 | 否 | 需保序、LRU |
| `TreeMap` | 红黑树 | 按 key 排序 | 键不可为 null（自然序） | 否 | 按 key 排序、范围查询 |
| `HashSet` | 底层就是 `HashMap` | 无序 | 元素可 null | 否 | 去重 |
| `ConcurrentHashMap` | 数组 + 链表 + 红黑树 | 无序 | key/value 都不允许 | 是 | 并发读写 |

## ArrayList 和 LinkedList 有什么区别？

结论：`ArrayList` 基于**动态数组**，随机访问 O(1)、中间插入删除 O(n)；`LinkedList` 基于**双向链表**，随机访问 O(n)、已知节点位置时改指针即可 O(1)。**绝大多数场景选 `ArrayList`**。

- **底层结构**：`ArrayList` 内部是一个可扩容的 `Object[]`；`LinkedList` 是双向链表，每个元素被包装成 `Node`（前驱、后继、数据）。
- **随机访问**：`ArrayList.get(i)` 直接按索引寻址，O(1)；`LinkedList.get(i)` 必须从头或尾逐个走，O(n)。
- **插入删除**：`ArrayList` 在中间增删要搬移后续元素，O(n)；`LinkedList` 若已持有目标节点引用，改指针即可，但**按索引找节点本身仍是 O(n)**。
- **内存开销**：`LinkedList` 每个元素都额外背一个 `Node` 对象（对象头 + 三个引用），`ArrayList` 只在扩容时留有冗余空位，因此 `LinkedList` 通常更占内存。
- **额外能力**：`LinkedList` 还实现了 `Deque`，可直接当队列/栈；`ArrayList` 实现了 `RandomAccess` 标记接口，表明支持快速随机访问。

怎么选：频繁随机访问、或主要在尾部增删 → `ArrayList`；需要在头部/中间频繁增删、或要兼作队列/栈 → `LinkedList`。实践中 `ArrayList` 的使用频率远高于 `LinkedList`。

### 高频延伸
- **为什么实际项目几乎都用 `ArrayList`**：`LinkedList` 的 O(1) 插入只在"已持有节点引用"时成立，而按索引定位节点本身是 O(n)；再叠加每个元素多一个 `Node` 的内存开销，只有头部/中间增删极其频繁时才可能更优。
- **`ArrayList` 是线程安全的吗**：不是。并发 `add` 可能互相覆盖，或抛 `ArrayIndexOutOfBoundsException`；需要并发时改用 `CopyOnWriteArrayList`，或在外部加锁。
- **`size()` 和容量是一回事吗**：不是。`size()` 是实际元素个数，容量是底层数组的长度（含预留空位）。`trimToSize()` 可把容量收缩到与 `size` 一致，释放冗余。
- **`LinkedList` 的内存开销到底大多少**：每个元素多一个 `Node` 对象（对象头 + `prev`/`next`/`item` 三个引用），实际占用常是 `ArrayList` 的数倍。
- **遍历中删除两者有区别吗**：有。`ArrayList` 删除后要搬移后续元素；`LinkedList` 通过迭代器删除只改指针，因此"遍历中频繁删除"是少数 `LinkedList` 可能更优的场景。

## ArrayList 的扩容机制是怎样的？为什么是 1.5 倍？

结论：JDK 7 起是**懒初始化**——首次 `add` 时才按默认容量 10 分配；扩容时新容量为 `旧容量 + (旧容量 >> 1)`，即**原来的 1.5 倍**，再用 `Arrays.copyOf` 把元素整体复制到新数组。

- **懒初始化**：JDK 7 起 `new ArrayList<>()` 只把内部数组指向共享的空数组 `EMPTY_ELEMENTDATA`，第一次 `add` 时才真正分配容量 10（JDK 6 是构造时就建长度为 10 的数组）。
- **扩容公式**：JDK 7+ 为 `oldCapacity + (oldCapacity >> 1)`（1.5 倍）；JDK 6 是 `(oldCapacity * 3) / 2 + 1`。
- **兜底逻辑**：如果 1.5 倍后仍不够用，就直接取所需的最小容量；再超过 `MAX_ARRAY_SIZE`（`Integer.MAX_VALUE - 8`）则走 `hugeCapacity`，上限为 `Integer.MAX_VALUE`。
- **均摊代价**：单次扩容要整体复制，是 O(n)；但容量每次涨 1.5 倍，均摊到每次 `add` 是 O(1)。
- **为什么是 1.5 倍**：折中。倍数太小会频繁扩容复制，太大则浪费内存；1.5 倍比 2 倍更省内存，又能让均摊成本保持常数级。

```java
// java.util.ArrayList#grow（JDK 8，精简）
private void grow(int minCapacity) {
    int oldCapacity = elementData.length;
    int newCapacity = oldCapacity + (oldCapacity >> 1);      // 1.5 倍
    if (newCapacity - minCapacity < 0) {
        newCapacity = minCapacity;                           // 仍不够就用需求值
    }
    if (newCapacity - MAX_ARRAY_SIZE > 0) {
        newCapacity = hugeCapacity(minCapacity);             // 上限保护
    }
    elementData = Arrays.copyOf(elementData, newCapacity);   // 整体复制
}
```

### 高频延伸
- **为什么默认容量是 10 却几乎感觉不到开销**：因为 JDK 7 起是懒初始化——`new ArrayList<>()` 并不分配数组，只有真正 `add` 时才建长度为 10 的数组。
- **可以预先指定容量吗，有什么用**：可以，`new ArrayList<>(expectedSize)`。明确知道元素规模时预先指定可避免多次扩容与复制，是常见且有效的性能优化。
- **1.5 倍和 `HashMap` 的 2 倍为什么不同**：`ArrayList` 用索引直接寻址，不需要容量是 2 的幂，所以能取更省内存的 1.5 倍；`HashMap` 则必须让容量是 2 的幂（原因见[『HashMap 的底层实现原理是什么？』](#hashmap-的底层实现原理是什么)）。
- **扩容会影响正在使用的迭代器吗**：单纯扩容只是把元素搬到新数组、逻辑内容不变，不会触发 `ConcurrentModificationException`；但如果遍历中通过集合本身增删元素，就会触发（见[『遍历集合时删除元素为什么会抛 ConcurrentModificationException？』](#遍历集合时删除元素为什么会抛-concurrentmodificationexception)）。
- **`ensureCapacity` 与 `trimToSize` 分别做什么**：`ensureCapacity(n)` 手动预扩容，避免边加边扩；`trimToSize()` 把容量收缩到实际元素数，释放冗余内存。

## HashMap、LinkedHashMap、TreeMap、Hashtable 有什么区别？怎么选？

结论：四者都能存键值对，差异集中在三点——**有序性**、**是否允许 null**、**是否线程安全**。日常首选 `HashMap`；需要保序用 `LinkedHashMap`；需要按 key 排序用 `TreeMap`；`Hashtable` 是遗留类，基本已被 `ConcurrentHashMap` 取代。

- **有序性**：`HashMap` 无序（顺序不确定，扩容后还会变）；`LinkedHashMap` 默认保持**插入序**，构造时传 `accessOrder = true` 则变为**访问序**；`TreeMap` 按 key 的**自然序或 `Comparator` 排序**；`Hashtable` 无序。
- **null 支持**：`HashMap` 允许一个 `null` key 和多个 `null` value；`LinkedHashMap` 与 `HashMap` 相同；`TreeMap` 的 key **不能为 null**（自然排序时会抛 NPE）；`Hashtable` 的 **key 和 value 都不能为 null**。
- **线程安全**：四者中只有 `Hashtable` 线程安全，但它用方法级 `synchronized`，并发性能差，已被 `ConcurrentHashMap` 取代。
- **底层结构**：`HashMap` 与 `LinkedHashMap` 都是数组 + 链表 + 红黑树（JDK 8），后者额外维护一条双向链表来记住顺序；`TreeMap` 是红黑树；`Hashtable` 是数组 + 链表。
- **复杂度**：`HashMap`、`LinkedHashMap` 的查询**平均 O(1)**、增删**均摊 O(1)**；`TreeMap` 为 O(log n)。

怎么选：通用键值查找 → `HashMap`；要按插入顺序遍历、或实现 LRU → `LinkedHashMap`；要按 key 排序、做范围查询 → `TreeMap`；多线程 → `ConcurrentHashMap`（见[『ConcurrentHashMap 是如何保证线程安全的？』](#concurrenthashmap-是如何保证线程安全的)）。

### 高频延伸
- **为什么 `HashMap` 允许 null，而 `Hashtable`、`ConcurrentHashMap` 都不允许**：`HashMap` 是单线程设计，用一个特殊分支把 `null` key 放到桶 0 即可。并发容器必须在 `get` 返回 `null` 时区分"键不存在"与"值就是 null"，无法用返回值消歧，所以干脆禁止（`Hashtable` 禁用 null 则是历史设计选择）。
- **怎么用 `LinkedHashMap` 实现 LRU**：构造时传 `accessOrder = true`，并重写 `removeEldestEntry`，返回 `true` 即自动淘汰最久未访问的条目——JDK 官方文档给出的示例就是这种写法。
- **`TreeMap` 的 key 为什么不能为 null**：排序必须调用 `compareTo`/`compare`，对 `null` 调用会抛 NPE。若传入的自定义 `Comparator` 能处理 `null`，理论上可用，但实践中不建议。
- **`HashMap` 的遍历顺序稳定吗**：不稳定。顺序取决于 hash 与容量，扩容后会重排，同一份数据在不同 JDK 上也未必一致，因此不要依赖它。
- **`Hashtable` 现在还有使用场景吗**：几乎没有。它是遗留类（方法级 `synchronized`、性能差）且不允许 null，并发场景一律用 `ConcurrentHashMap`。

## HashMap 的底层实现原理是什么？

结论：JDK 8 的 `HashMap` 是**数组 + 链表 + 红黑树**。`put` 时先对 key 的 hash 做扰动，再用 `(n - 1) & hash` 定位桶：桶为空直接放入，否则遍历链表（或红黑树）逐个比较 key。链表长度达到 8 且数组容量 ≥ 64 时转红黑树，元素减少到 6 时退回链表。

- **扰动函数**：JDK 8 用 `(h = key.hashCode()) ^ (h >>> 16)`，把高 16 位异或到低 16 位——因为定位只用到低位，这样能让高位也参与运算，减少碰撞。（JDK 7 是四次移位异或，JDK 8 简化为一次。）
- **定位下标**：`(n - 1) & hash`，`n` 为容量。它**只在容量是 2 的幂时才等价于 `hash % n`**，且位运算更快。
- **`put` 流程**：算下标 → 桶空则新建 `Node` 放入 → 桶非空则先比 `hash` 再比 `equals`，相同就覆盖 value，不同则尾插进链表（或插入红黑树）→ 元素总数超过 `容量 × 负载因子` 时扩容。
- **树化条件**：链表长度达到 `TREEIFY_THRESHOLD = 8` **且**容量 ≥ `MIN_TREEIFY_CAPACITY = 64` 才转红黑树；容量不足时改为**先扩容**。
- **退化条件**：树中元素减少到 `UNTREEIFY_THRESHOLD = 6` 时退回链表（留一个差值，避免在 7 附近反复转换）。
- **负载因子 0.75**：JDK 源码注释给出依据——时间与空间的折中；按泊松分布计算，桶内元素达到 8 个的概率小于千万分之一。
- **扩容**：容量翻倍，JDK 8 把原链表按 hash 新增的那一位拆成 `lo` / `hi` 两条，因此**顺序相对稳定**；JDK 7 则是重新计算索引且会逆序。
- **key 的相等判定**：先比 `hash`，再比 `==` 或 `equals`。所以自定义 key 必须正确重写这两个方法，详见[『为什么重写 equals() 必须重写 hashCode()？』](/java/basis/#为什么重写-equals-必须重写-hashcode)。

### 高频延伸
- **为什么容量必须是 2 的幂**：因为定位用 `(n - 1) & hash`，只有 `n` 是 2 的幂时 `n - 1` 的低位才全是 1，位运算才等价于取模、分布才均匀；否则会有部分桶永远用不到，冲突也显著上升。
- **链表长度 8 转树、6 退回，为什么不用同一个阈值**：留出缓冲差，避免元素数在 7~8 之间反复增删时反复树化与退化，产生无谓开销。
- **既然到 8 才转树，为什么还要判断容量 ≥ 64**：容量小时链表长往往只是桶太少造成的，此时**扩容比树化更划算**（扩容后元素会被重新分散），所以先扩容，实在不行才树化。
- **`hashCode` 相同而 `equals` 不同的多个 key 会怎样**：它们落在同一个桶里组成链表或红黑树，查找要先比 hash、再逐个 `equals`，最坏从 O(1) 退化为 O(log n)（树化后）甚至 O(n)。
- **JDK 7 的扰动函数为什么要改**：JDK 7 是四次移位异或，JDK 8 认为一次异或已经足够，简化为 `h ^ (h >>> 16)`，并把下标计算统一为位运算。

## HashMap 为什么线程不安全？

结论：`HashMap` 没有任何同步机制，多线程并发 `put` 会出现**数据覆盖、元素丢失、`size` 不准**；在 **JDK 7 及以前**，并发扩容还会因头插法形成**环形链表**，让 `get` 陷入死循环、CPU 飙到 100%。

- **数据覆盖**：两个线程同时算出同一个桶且都判定"桶为空"，于是各自挂上自己的节点，后写入的覆盖先写入的，元素就丢了；两个线程交错更新 `size` 时，`size` 也会小于实际元素数。
- **JDK 7 的环形链表**：JDK 7 扩容时用**头插法**把旧链表元素逐个搬到新数组。并发 `transfer` 时两个线程交错执行会让指针互相指向，形成环；此后任何落到该桶的 `get` 都会无限循环。
- **JDK 8 修掉了死循环**：JDK 8 改为**尾插法**并把链表拆成 `lo` / `hi` 两条，保持相对顺序，因此不再成环；但**数据覆盖与 `size` 丢失依然存在**，仍然不是线程安全的。
- **`size` 为什么会不准**：`size` 只是普通 `int` 字段，`++size` 是"读—改—写"三步，本身非原子，并发下会丢更新。

```java
Map<Integer, Integer> map = new HashMap<>();
IntStream.range(0, 1000).parallel().forEach(i -> map.put(i, i));
System.out.println(map.size());   // 通常 < 1000：并发下会丢元素；异常只在极端竞态下偶发
```

### 高频延伸
- **JDK 8 之后 `HashMap` 就线程安全了吗**：不是。JDK 8 只修掉了"扩容成环导致死循环"，数据覆盖与 `size` 丢失依旧存在——很多人误以为换成 JDK 8 就安全了。
- **并发场景有哪些现成替代**：首选 `ConcurrentHashMap`；`Collections.synchronizedMap` 是全表锁、性能差；`Hashtable` 是遗留类，方法级 `synchronized`，并发性能同样差。
- **`Collections.synchronizedMap` 够用吗**：不够。它只保证**单个方法**原子，复合操作（如"不存在才放入"）仍需自行加锁；而且它是整表一把锁，并发性能远不如 `ConcurrentHashMap`。
- **并发下怎么写"不存在才放入"**：用 `ConcurrentHashMap.putIfAbsent`（或 `computeIfAbsent`）；在普通 `HashMap` 上则必须由调用方保证整体加锁。
- **`fail-fast` 与线程安全是一回事吗**：不是。`HashMap` 的迭代器是 fail-fast，靠检测 `modCount` 变化抛异常（见[『遍历集合时删除元素为什么会抛 ConcurrentModificationException？』](#遍历集合时删除元素为什么会抛-concurrentmodificationexception)），它是**尽力而为的 bug 探测**，不是并发保护机制。

## ConcurrentHashMap 是如何保证线程安全的？

结论：JDK 8 的 `ConcurrentHashMap` 放弃了 JDK 7 的**分段锁**，改为 **CAS + `synchronized` 锁单个桶头节点 + `volatile` 保证可见性**：空桶用 CAS 无锁插入，非空桶只锁住该桶头节点。并发粒度从"段"细化到"桶"，读操作基本无锁。

- **JDK 7：分段锁**：内部是 `Segment[]`，每个 `Segment` 继承 `ReentrantLock`，默认 16 段，每段内含一个 `HashEntry` 数组；并发度等于段数，不同段之间可并行写。
- **JDK 8：取消 Segment**，数组每个位置直接放 `Node`（或 `TreeBin`）：
  - **空桶**：用 `casTabAt` 把新节点 CAS 进桶，成功即完成，不涉及加锁；
  - **非空桶**：`synchronized (f)` 只锁该桶的头节点，在桶内做链表/红黑树插入；
  - **读取**：`Node` 的 `val` 与 `next` 都是 `volatile`，读操作不加锁。
- **扩容**：支持**多线程协助扩容**——`sizeCtl` 记录状态与阈值，参与 `put` 的线程可通过 `helpTransfer` 一起搬运数据。
- **计数**：`size` 不用一把锁保护，改用 `baseCount` + `CounterCell[]` 分散计数（思路类似 `LongAdder`），`size()` 求和得到的是**近似值**。
- **为什么不许 null**：并发下无法区分"key 不存在"与"value 就是 null"，一旦允许 null，`get` 返回 null 就有歧义，因此 key 与 value 都禁止为 null。

### 高频延伸
- **JDK 8 与 JDK 7 哪个并发度更高**：JDK 8。JDK 7 的并发度受限于段数（默认 16），同一段内仍是串行；JDK 8 把锁粒度细化到单个桶，冲突概率大幅降低。
- **`size()` 为什么只保证近似准确**：计数分散在 `CounterCell[]` 各单元，`size()` 只是把它们求和，期间若有并发修改，返回值只是某一时刻的近似值；需要强一致计数得另加同步。
- **`CopyOnWriteArrayList` 是怎么做的**：写时复制——每次修改都复制整个数组、在副本上改、再替换引用，因此**读完全无锁**；代价是写开销大、内存瞬时翻倍，且迭代器看到的是**快照**（弱一致：遍历中看不到后续修改，也不支持 `remove`）。适合读多写极少的场景。
- **`ConcurrentHashMap` 能替代 `Collections.synchronizedMap` 吗**：能，且应优先。后者是整表一把锁；前者锁粒度细、读无锁、还支持协助扩容。
- **`ConcurrentHashMap` 上的复合操作为什么要用原子方法**：先 `get` 再 `put` 之间存在竞态，应改用 `putIfAbsent`、`computeIfAbsent`、`replace` 等内置原子方法。
- **想深入 CAS / `synchronized` / `volatile` 本身**：这里只讲它们在集合里的用途，机制原理见并发模块的[『CAS 是什么？ABA 问题如何解决？』](/java/concurrent/#cas-是什么-aba-问题如何解决)与[『synchronized 的原理是什么？它和 ReentrantLock 有什么区别？』](/java/concurrent/#synchronized-的原理是什么-它和-reentrantlock-有什么区别)。

## 遍历集合时删除元素为什么会抛 ConcurrentModificationException？

结论：因为集合的迭代器是 **fail-fast** 的——创建时记录当时的修改次数 `modCount`，每次 `next()` 都校验它有没有被改动，一旦不一致就抛 `ConcurrentModificationException`。遍历中直接调用集合自己的 `remove` 会改动 `modCount`，于是立刻触发异常。

- **`modCount` 是什么**：`AbstractList`、`HashMap` 等维护的修改计数器，**结构性修改**（增删、扩容重排）会让它自增，仅替换元素内容不会。
- **迭代器怎么检测**：迭代器内部保存 `expectedModCount = modCount`，每次 `next()` 调用 `checkForComodification()`，两者不等即抛异常。
- **正确做法**：用迭代器自己的 `remove()`（它删完会同步 `expectedModCount = modCount`）；或使用 `removeIf(...)`（JDK 8+）；或在 `List` 上倒序按索引删除。
- **为什么 `for-each` 更容易踩**：`for (E e : list)` 本质就是迭代器，所以同样会抛；而 `for (int i = 0; i < list.size(); i++)` 用索引操作不触发异常（但可能漏删元素）。

```java
List<String> list = new ArrayList<>(Arrays.asList("a", "b", "c"));

for (String s : list) {
    if ("b".equals(s)) {
        list.remove(s);                 // 抛 ConcurrentModificationException
    }
}

// 正确做法：用迭代器自己的 remove()
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if ("b".equals(it.next())) {
        it.remove();                    // 同步 expectedModCount，安全
    }
}
```

### 高频延伸
- **fail-fast 能保证检测到所有并发修改吗**：不能。它只在 `next()` 时校验 `modCount`，是**尽力而为**的探测机制，不保证一定发现——所以它只是 bug 探测器，不是并发安全手段。
- **`modCount` 会因哪些操作变化**：结构性修改（`add`、`remove`、`clear`、扩容重排）自增；`set` 这类替换元素的操作不会。另需注意 `LinkedHashMap` 开启访问序后，`get` 也会改动它。
- **`removeIf` 为什么不会抛异常**：它在迭代器内部批量删除并同步更新 `expectedModCount`，因此是安全的（JDK 8+）。
- **`CopyOnWriteArrayList` 的迭代器会抛 CME 吗**：不会。它的迭代器基于**快照**，遍历期间看到的是创建迭代器那一刻的数组副本，既不抛 CME，也看不到后续修改（弱一致），且迭代器不支持 `remove`。
- **`Iterator` 和 `ListIterator` 有什么区别**：`ListIterator` 是 `Iterator` 的子接口，支持**双向遍历**、`add`、`set` 和获取索引；`Iterator` 只能单向 `next` 加 `remove`。

## Comparable 和 Comparator 有什么区别？

结论：`Comparable` 是**类自己实现的"自然排序"**接口，方法是 `compareTo(T o)`，只能定义在类内部；`Comparator` 是**外部比较器**，方法是 `compare(T a, T b)`，可以在不改类的前提下提供任意多种排序规则，也能写成 lambda。

- **定义位置**：`Comparable` 由被比较的类实现（如 `String`、`Integer`）；`Comparator` 独立于类，作为参数传入（`Collections.sort(list, cmp)`、`new TreeMap<>(cmp)`）。
- **方法签名**：`compareTo` 只有一个参数（与自己比）；`compare` 需要两个参数。
- **规则数量**：一个类只能有一种自然排序（`Comparable` 只能实现一次），但可以挂任意多个 `Comparator`。
- **典型用途**：`Comparable` 定义"默认怎么比"；`Comparator` 处理临时、多变、组合式的排序需求。
- **`TreeSet`/`TreeMap` 如何判重**：它们用 `compareTo`/`compare` 的结果**是否为 0** 判重，**而不是** `equals`。

```java
// Comparable：类自己定义"自然序"
class User implements Comparable<User> {
    String name;
    @Override
    public int compareTo(User o) { return this.name.compareTo(o.name); }
}

// Comparator：外部规则，可多套、可用 lambda
list.sort(Comparator.comparing(User::name).reversed());
list.sort(Comparator.comparingInt(String::length)
                    .thenComparing(Comparator.naturalOrder()));
```

### 高频延伸
- **`compareTo` 与 `equals` 不一致会怎样**：`TreeSet`/`TreeMap` 用 `compareTo` 判重，于是可能出现"`equals` 为 `false` 却被当成重复元素丢掉"。经典例子：`new BigDecimal("1.0").equals(new BigDecimal("1.00"))` 为 `false`，但 `compareTo` 返回 0——两者放进 `TreeSet` 只会留下一个。
- **`Comparator` 的写法演进**：JDK 8 之前要写匿名内部类；JDK 8 起可用 lambda 与方法引用，并提供了 `Comparator.comparing`、`thenComparing`、`reversed`、`naturalOrder` 等静态工具。
- **`Collections.sort` 和 `list.sort` 有什么区别**：功能等价，`list.sort` 是 JDK 8 加入 `List` 的默认方法，更符合面向对象习惯；两者底层都走 `Arrays.sort`（对象数组用 TimSort）。
- **升序改降序有几种写法**：`Comparator.reversed()`、交换 `compare` 两个参数、或在 `compareTo` 前取负——注意取负对 `Integer.MIN_VALUE` 有溢出风险，优先用 `reversed()`。
- **排序稳定性是什么意思**：相等元素在排序后保持原有相对顺序。`Arrays.sort` 对**对象数组**用 TimSort，是**稳定**的；对**基本类型数组**用双轴快排，是**不稳定**的（基本类型无法区分"相等的不同元素"）。

## Arrays.asList()、subList() 返回的是视图还是拷贝？有哪些坑？

结论：`Arrays.asList()` 返回的是**基于原数组的定长视图**（不是拷贝，但长度固定）；`List.subList()` 返回的是**原列表的视图**（读写都作用于原列表）。两者最大的坑都是"以为拿到的是独立的新集合"。

- **`Arrays.asList(array)`**：
  - 内部直接持有传入的数组，**修改元素会写回原数组**（`set` 有效）；
  - 但**长度固定**，调用 `add`/`remove` 会抛 `UnsupportedOperationException`；
  - 传入**基本类型数组**（如 `int[]`）会得到 `List<int[]>`（只有一个元素），必须用包装类型数组。
- **`subList(from, to)`**：
  - 是**视图不是拷贝**，非结构性修改（`set`、`replaceAll`）会写回父列表；
  - 结构性修改（`add`/`remove`）作用在视图上，也会同步反映到父列表；
  - 一旦**父列表被结构性修改**，原视图即失效，再访问会抛 `ConcurrentModificationException`。
- **想要真正独立的集合**：`new ArrayList<>(Arrays.asList(array))`、`new ArrayList<>(list.subList(a, b))`。

```java
Integer[] arr = {1, 2, 3};
List<Integer> view = Arrays.asList(arr);
view.set(0, 99);
System.out.println(arr[0]);          // 99 —— 修改写回了原数组

view.add(4);                         // 抛 UnsupportedOperationException（长度固定）

List<Integer> parent = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
List<Integer> sub = parent.subList(1, 3);   // 视图，不是拷贝
sub.set(0, 99);
System.out.println(parent.get(1));   // 99 —— 改的就是父列表
```

### 高频延伸
- **`Arrays.asList(intArray)` 为什么只有一个元素**：`asList(T... a)` 是泛型可变参数，`int[]` 会被当成**一个对象**整体传入（而不是展开成多个元素），所以返回 `List<int[]>`、`size()` 为 1。应改用 `Integer[]` 或 `IntStream.of(...).boxed()`。
- **`List.of()` 和 `Arrays.asList()` 有什么区别**：`List.of`（**JDK 9+**）创建的是**真正不可变**的集合——`set`/`add`/`remove` 全抛 `UnsupportedOperationException`，且不允许 `null`；`Arrays.asList` 是**定长可变**（`set` 可以，`add`/`remove` 不行）。基线 JDK 8 上没有 `List.of`。
- **`subList` 的视图有什么实际用途**：`list.subList(a, b).clear()` 可以一次性删除区间元素，比循环逐个 `remove` 高效得多（只做一次数组搬移）。
- **`subList` 的视图为什么会失效**：视图内部记录了父列表的 `modCount`，父列表发生结构性修改后两者不一致，访问时即抛 `ConcurrentModificationException`（与 fail-fast 是同一机制，见[『遍历集合时删除元素为什么会抛 ConcurrentModificationException？』](#遍历集合时删除元素为什么会抛-concurrentmodificationexception)）。
- **怎么快速判断一个方法是返回视图还是拷贝**：`Arrays.asList`、`subList`、`Map.keySet()`/`values()`/`entrySet()` 返回的都是**视图**，改动会互相影响；而 `new ArrayList<>(...)`、`list.toArray()` 返回的是**拷贝**。拿不准就实测一次。
