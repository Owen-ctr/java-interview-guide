# Java 基础

本模块覆盖 Java 语言基础、面向对象、字符串、异常等面试常考点。

## Object 类有哪些常用方法？

结论：`Object` 是所有类的根父类，JDK 8 中它提供 11 个方法，可分为三类——**判等与表示**、**对象复制与生命周期**、**线程协作**。

判等与表示：

- **`equals(Object)`**：默认比较引用（`this == obj`），可重写以定义逻辑相等。
- **`hashCode()`**：默认与对象地址相关，重写 `equals` 必须同步重写它（详见[『为什么重写 equals() 必须重写 hashCode()？』](#为什么重写-equals-必须重写-hashcode)）。
- **`toString()`**：默认返回「类名@十六进制哈希」，建议重写为可读信息——日志与调试几乎都依赖它。
- **`getClass()`**：返回运行时类对象 `Class<?>`，是反射与运行时类型判断的基础。

复制与生命周期：

- **`clone()`**：默认是**浅拷贝**（逐字段复制），且必须实现 `Cloneable`，否则抛 `CloneNotSupportedException`。
- **`finalize()`**：GC 回收该对象前的回调，**执行时机不确定**，不应依赖它释放资源（JDK 9 起已标记废弃）。

线程协作（都必须在 `synchronized` 块内调用，否则抛 `IllegalMonitorStateException`；关于 `synchronized` 与监视器本身的原理，见[『synchronized 的原理是什么？它和 ReentrantLock 有什么区别？』](/java/concurrent/#synchronized-的原理是什么-它和-reentrantlock-有什么区别)）：

- **`wait()` / `wait(long)` / `wait(long, int)`**：释放锁并等待，直到被唤醒或超时。
- **`notify()`**：随机唤醒一个在该对象监视器上等待的线程。
- **`notifyAll()`**：唤醒所有在该对象上等待的线程。

### 高频延伸
- **哪些方法不能重写**：`getClass()`、`wait()`、`notify()`、`notifyAll()` 都是 `final` 方法，保证监视器语义与运行时类型不可被篡改；`clone()`、`finalize()` 则是 `protected`，只能被子类或同包访问。
- **为什么 `wait`/`notify` 定义在 `Object` 而不是 `Thread`**：它们是**基于对象监视器（锁）**的协作机制，而 Java 中任意对象都能充当锁、都自带监视器，所以这些方法必须定义在所有对象共有的 `Object` 上，而不是某个线程对象上。
- **`clone()` 为什么常被认为设计糟糕**：它绕过构造器创建对象，依赖 `Cloneable` 这个不含任何方法的"标记接口"，且默认实现只做浅拷贝，嵌套对象容易漏改。
- **`finalize()` 为什么被废弃**：执行时机不可预期、会延长对象存活并加重 GC 负担，甚至能让对象在回收前"复活"；资源释放应显式 `close()`，需要兜底则用 `Cleaner`（JDK 9+）。
- **重写 `equals` 时要一并考虑什么**：必须同步重写 `hashCode`；`toString` 虽非强制，但不重写会让日志全是「类名@哈希」，排查问题非常痛苦。

## == 和 equals 有什么区别？

核心结论：`==` 的语义由 Java 语言规定、不可被类重写——作用于基本类型时比较数值，作用于引用类型时比较两个引用是否指向同一个对象（引用同一性）。`equals` 是 `Object` 定义的方法，默认实现即 `return (this == obj)`，因此未重写的类，`equals` 与 `==` 对引用类型完全等价；只有 `String`、`Integer` 以及正确重写了 `equals` 的类，才会转而比较对象的"逻辑内容"。二者真正的区别来自 `equals` 是否被正确重写，`equals` 并不天然比较内容。

从语义上看：

- **`==` 比较值或引用，且不可重写**：对基本类型（`int`、`long`、`double` 等）比较其数值；对引用类型比较两个引用是否指向同一对象，与对象内部状态无关。
- **`equals` 的语义可由类自定义**：`Object.equals` 默认比较引用，子类可重写以定义逻辑相等（如比较字段）。`String`、`Integer` 等已重写，故按内容比较。

需注意：`equals` 能否比较内容，取决于该类是否提供了相应的重写实现；未重写的类用 `equals` 与用 `==` 没有区别。

### 高频延伸
- **Integer 缓存**：`Integer a = 127, b = 127` 时 `a == b` 为 `true`，换成 `128` 却为 `false`。原因：`Integer` 对 `-128~127` 做了自动装箱缓存，区间内取值复用同一对象；超出范围每次自动装箱都新建对象，引用不同。所以包装类型判等应使用 `equals`，而不是 `==`。
- **String 示例**：`String s1 = new String("abc")` 与 `String s2 = "abc"`，`s1 == s2` 为 `false`、`s1.equals(s2)` 为 `true`。关键在于**是否复用同一个对象**：字面量 `"abc"` 纳入字符串常量池（`s2` 指向池对象），而 `new String(...)` 必然新建一个独立对象（`s1` 指向它）。二者都在堆中（JDK 7 起字符串常量池也已移入堆），差异在**对象同一性**而非所在区域，因此二者不是同一个对象，故 `==`（比引用）为 `false`，而 `.equals`（比字符内容）为 `true`。这正是"`==` 比引用、`equals` 比内容"的典型例证。
- **拆箱混用的隐蔽坑**：`int a = 128; Integer b = 128;` 时 `a == b` 为 `true`，而 `Integer c = 128, d = 128;` 时 `c == d` 为 `false`。根因是 `==` 的语义取决于操作数类型——前者一边是基本类型、一边是包装类型，`==` 触发自动拆箱后按数值比较（故为 `true`）；后者两边都是 `Integer`（引用类型），不拆箱、直接比引用，而 `128` 超出装箱缓存范围（`-128~127`），`c`、`d` 各自新建、引用不同（故为 `false`）。同样是"两个 128"，`==` 一个比的是值、一个比的是引用，这正是它最隐蔽之处，也说明包装类型判等应当用 `equals`。
- **不止 Integer 有缓存**：`Byte`、`Short`、`Integer`、`Long` 缓存 `-128~127`（`Byte` 恰好覆盖全部取值），`Character` 缓存 `0~127`，`Integer` 的上界还可用 `-XX:AutoBoxCacheMax` 调大；而 `Float`、`Double` 没有缓存，因此 `Double x = 1.0, y = 1.0;` 的 `x == y` 恒为 `false`。
- **null 安全**：`null.equals(x)` 会抛 `NullPointerException`，而 `==` 不会；判空应写成 `null == x`，或直接用 null 安全的 `Objects.equals(a, b)`。
- **与 hashCode 的联动**：`equals` 能定义内容相等，但哈希集合（`HashMap`、`HashSet`）先以 `hashCode` 定位桶、再以 `equals` 判定相等；若只重写 `equals` 而不重写 `hashCode`，会出现"存入后无法取出"的异常（详见[『为什么重写 equals() 必须重写 hashCode()？』](#为什么重写-equals-必须重写-hashcode)）。

## 为什么重写 equals() 必须重写 hashCode()？

Java 规范对 `equals` 与 `hashCode` 存在强约束：如果两个对象根据 `equals` 比较相等，那么它们的 `hashCode` 必须相等；反之并不要求——`hashCode` 相等的对象 `equals` 可以不等，这对应哈希冲突，是被允许的。

这一约束与哈希集合的实现机制直接相关。`HashMap`、`HashSet` 等基于哈希表的结构在存取元素时，先用 `hashCode` 定位到桶（bucket），再在桶内用 `equals` 比较。如果只重写了 `equals` 而沿用 `Object` 默认的 `hashCode`（该实现尽力为不同对象返回不同哈希值，所谓「按对象地址计算」只是常见实现、并非规范要求），两个逻辑相等的对象通常会得到不同的哈希值，被分配到不同的桶中——即使 `equals` 返回 `true`，用其中之一去 `get` 另一个时也定位不到，造成"存得进、取不出"的数据错乱。

重写时需要遵循以下原则：

- `equals` 为 `true` 的对象，`hashCode` 必须相同，这是硬约束。
- `equals` 为 `false` 的对象，`hashCode` 应尽量不同以减少冲突、保证性能，但不强制。
- `hashCode` 用到的字段必须是 `equals` 比较字段的**子集**：只用其中一部分仍然合法（只是冲突更多、查询略慢）；一旦用到 `equals` 未比较的字段，才会出现逻辑相等的对象却算出不同哈希值的矛盾。
- 实际开发中可用 IDE 自动生成、Lombok `@EqualsAndHashCode`，或借助 Java 7+ 的 `Objects.hash(field1, field2...)` 统一实现，避免手写不一致。

### 高频延伸
- `hashCode` 相等但 `equals` 不等是否允许？允许，这正是哈希冲突，只是会让桶内退化为链表/树比较，性能下降。
- 除了「取不出」还会出什么问题？两个逻辑相等的对象能同时放进 `HashSet`（表现为出现「重复」元素），`contains`、`remove` 也会失效，且往往到数据量变化后才暴露。
- 可变对象作为 key 有什么风险？对象成为 key 后若其参与 `hashCode` 的字段被修改，哈希值随之改变，再次查找便定位不到原桶，导致无法检索。
- 为什么 `String`、`Integer` 等包装类适合做 `HashMap` 的 key？因为它们正确重写了 `equals` 与 `hashCode`，且不可变，哈希值稳定。
- 重写 `equals` 本身还需满足五条契约：自反、对称、传递、一致性，以及 `x.equals(null)` 必须返回 `false`。
- `hashCode` 直接返回常量（如 `return 1`）合法吗？合法——契约只要求相等的对象哈希相同；但所有对象会挤进同一个桶，`HashMap` 退化为链表/红黑树，查询从 O(1) 降为 O(log n)/O(n)。契约正确不等于实现可用。

## 基本类型和包装类有什么区别？

结论：Java 有 8 种基本类型，各自对应一个包装类。基本类型**直接保存数值**、不是对象；包装类型是**对象**，可以为 `null`、可以用于泛型与集合。二者通过自动装箱/拆箱互相转换。

8 种基本类型与对应包装类：

- **整型**：`byte`（1 字节）、`short`（2）、`int`（4）、`long`（8）—— 对应 `Byte`、`Short`、`Integer`、`Long`
- **浮点**：`float`（4）、`double`（8）—— 对应 `Float`、`Double`
- **字符**：`char`（2 字节，UTF-16 编码单元）—— 对应 `Character`
- **布尔**：`boolean`（规范未精确定义：数组中占 1 字节，HotSpot 中局部变量按 4 字节处理）—— 对应 `Boolean`

核心区别：

- **存值 vs 存对象**：基本类型的局部变量直接保存在栈帧中；作为对象字段时则嵌入在对象内部（随对象一起在堆里），本身没有对象头与引用开销；包装类型是独立对象，存放在堆中。
- **能否为 `null`**：基本类型不能（各有默认值），包装类型可以——这也是它最大的风险：`Integer i = null; int x = i;` 会在自动拆箱时抛 NPE。
- **能否用于泛型与集合**：基本类型不能，所以 `List<int>` 不合法，只能写 `List<Integer>`，此时会发生装箱。
- **比较语义**：基本类型用 `==` 比数值；包装类型用 `==` 比引用（超出缓存范围会得到 `false`），判等要用 `equals`——详见[『== 和 equals 有什么区别？』](#和-equals-有什么区别)。
- **开销**：装箱/拆箱有额外成本（创建对象、增加 GC 压力），大批量数值运算应避免频繁装箱。

### 高频延伸
- **自动装箱/拆箱发生在哪些时机**：赋值、方法传参/返回、与基本类型混合运算、放进集合时。反编译能看到编译器插入的 `Integer.valueOf(...)` 与 `intValue()`。
- **`null` 引发的典型 NPE 有哪些**：把可能是 `null` 的 `Integer` 直接赋给 `int`、`Map.get()` 得到 `null` 后参与运算、三元表达式中混用基本类型与包装类型——这是线上最常见的 NPE 来源之一。
- **为什么 `List<int>` 不合法**：泛型只接受引用类型（擦除后统一按 `Object` 处理），基本类型必须先装箱，所以只能写 `List<Integer>`。
- **`int` 与 `Integer` 用 `==` 比较会怎样**：只要有一侧是基本类型，另一侧就会**自动拆箱**，于是比较的是数值而非引用——这与两个 `Integer` 互比的结果可能相反，详见[『== 和 equals 有什么区别？』](#和-equals-有什么区别)。
- **`Integer.valueOf` 与 `new Integer` 有何区别**：`valueOf` 会复用 `-128~127` 的缓存对象，`new` 每次新建独立对象；JDK 9 起 `Integer` 的构造器已被标记废弃，应改用 `valueOf` 或自动装箱。

## Java 是值传递还是引用传递？

结论：Java **只有值传递**。方法调用时传入的都是**变量值的副本**——基本类型传的是数值的副本，引用类型传的是**引用的副本**（"指向哪个对象"这个地址值的拷贝），而不是对象本身。

由此可直接推出三条结论：

- 在方法内修改基本类型参数，不影响调用方。
- 在方法内让引用参数**指向另一个新对象**，不影响调用方——改的只是副本。
- 但通过引用副本**修改对象内部状态**（如 `list.add(...)`、`setXxx(...)`），调用方可见——因为两个引用指向同一个对象。

用一个例子把三种情况都覆盖到：

```java
static void changePrimitive(int x) { x = 100; }
static void reassign(List<Integer> list) { list = new ArrayList<>(); }
static void mutate(List<Integer> list) { list.add(1); }

public static void main(String[] args) {
    int a = 1;
    changePrimitive(a);
    System.out.println(a);         // 1，基本类型不受影响

    List<Integer> l = new ArrayList<>();
    reassign(l);
    System.out.println(l.size());  // 0，重新赋值只改了副本

    mutate(l);
    System.out.println(l.size());  // 1，修改对象内容可见
}
```

### 高频延伸
- **为什么不能说"引用传递"**：引用传递的定义是传递变量本身（即别名），方法内重新赋值会影响调用方；而 Java 中重新赋值**不影响调用方**，所以是按值传递——只不过这个"值"恰好是一个引用。
- **为什么写不出通用的 `swap` 方法**：交换的是两个引用副本，调用方的引用不受影响。要"交换"只能修改对象内部状态，或返回新值交由调用方接收。
- **`String` 作参数为什么"改不动"**：`String` 不可变，方法内的任何"修改"都返回新对象并赋给副本，调用方自然看不到变化。
- **数组和集合为什么能改**：传入的虽是引用副本，但它与调用方引用指向**同一个对象**，修改对象内容双方都可见。
- **为什么这题容易答错**：因为"传引用副本后能改对象内容"这个现象太像引用传递，容易把"能改内容"误当成"能改变量"。区分点始终是：**方法内重新赋值是否影响调用方**。

## static 关键字有什么作用？

结论：`static` 表示**属于类、而不是属于某个实例**。它可以修饰成员变量、方法、代码块与内部类，还支持静态导入。

- **静态变量**：类初始化时分配，全类共享一份（JDK 7 起随 `Class` 对象存放在堆中），生命周期与类一致，与是否创建过实例无关。
- **静态方法**：无需实例即可调用；方法体内**不能使用 `this`/`super`**，也不能直接访问实例成员。
- **静态代码块**：在类初始化（`<clinit>`）时执行**一次**，用于初始化静态资源；执行时机是类**首次被主动使用**时。
- **静态内部类**：不持有外部类实例引用，可独立创建；相比非静态内部类不会隐式持有外部引用，能避免由此导致的内存泄漏。
- **静态导入**：`import static java.lang.Math.*;` 之后可直接写 `PI`、`max(...)`，适度使用以免可读性下降。

### 高频延伸
- **静态变量到底存在哪**：JDK 7 起随 `Class` 对象放在**堆**中（JDK 6 及之前在永久代），所以它并非"特殊存放"，只是生命周期挂在类上。
- **静态方法能被重写吗**：不能。子类定义同签名的 `static` 方法只是**隐藏**父类方法，不是重写；调用哪一个由引用的**静态类型**在编译期决定，因此不具备多态性。
- **什么操作会触发类初始化**：`new` 实例、访问静态字段或调用静态方法、反射 `Class.forName(...)`、初始化子类时先初始化父类等；只声明引用（如 `Foo f = null;`）**不会**触发。
- **静态成员与实例成员谁先初始化**：顺序是父类静态 → 子类静态 → 父类实例（字段、代码块、构造器）→ 子类实例。"静态代码块与构造器的执行顺序"是这一考点最常见的问法。
- **接口里能用 `static` 吗**：JDK 8 起可以。接口的 `static` 方法不属于实现类，只能用接口名调用；接口中也不能有静态变量（字段隐式为 `public static final` 常量）。

## final、finally、finalize 有什么区别？

结论：三者除了拼写相近，毫无关系。`final` 是**修饰符**（修饰类、方法、变量，表示"不可改变"）；`finally` 是**异常处理的收尾块**（无论是否发生异常都会执行）；`finalize` 是 `Object` 的**方法**（对象被 GC 前回调，已废弃）。

`final` 的三种用法：

- **修饰类**：类不能被继承。`String`、`Integer` 等都是 `final`，这也是它们不可变的基础。
- **修饰方法**：方法不能被子类重写（如 `Object.getClass()`）。
- **修饰变量**：值或引用只能赋值一次。基本类型是**值不可变**；引用类型是**引用不可变、对象内容仍可变**（`final List` 照样能 `add`）。

`finally`：异常处理中无论是否抛异常都会执行的收尾块，用于释放资源；它与 `return` 的执行顺序详见[『try-catch-finally 中 return 与 finally 的执行顺序？』](#try-catch-finally-中-return-与-finally-的执行顺序)。

`finalize`：`Object` 的 `protected` 方法，GC 回收前调用一次；**执行时机不确定**，不应依赖它释放资源，JDK 9 起已被标记废弃。

### 高频延伸
- **`final` 能保证对象不可变吗**：不能。`final` 只锁住引用，`final` 数组或集合的内容照样能改；真正的不变需要"不对外暴露修改途径"，详见[『String 为什么被设计成不可变的？』](#string-为什么被设计成不可变的)。
- **`finally` 和 `finalize` 都带"最后"的意思，区别在哪**：`finally` 是**代码块**，属异常控制流，正常情况下必然执行；`finalize` 是**方法**，属 GC 生命周期，**不保证执行**，甚至可能一次都不调用。
- **`static final` 常量有什么坑**：编译期常量（基本类型与 `String` 字面量）会被**内联**到使用处，若只改了常量所在类而不重新编译引用方，引用方读到的仍是旧值。
- **`private` 方法加 `final` 有意义吗**：没有。`private` 方法本就不可被重写，再加 `final` 属冗余（部分静态检查工具会告警）。
- **`finalize` 的替代方案是什么**：显式 `close()` 配合 try-with-resources；需要兜底清理时用 `java.lang.ref.Cleaner`（JDK 9+）。

## 泛型擦除是什么？带来哪些限制？

结论：Java 泛型是**编译期**的语法糖，编译后类型参数会被**擦除**成它的上界（无界则擦除为 `Object`），运行时并不存在泛型信息。这一点解释了大量"看起来不合理"的限制。

- **擦除规则**：`List<String>` 与 `List<Integer>` 擦除后都是 `List`；`T extends Number` 擦除为 `Number`，无界 `T` 擦除为 `Object`。
- **为什么要擦除**：为了与 JDK 5 之前的代码保持**二进制兼容**，让泛型化的新类库仍能被旧版本编译出的代码调用。
- **桥接方法**：为保证擦除后仍具多态，编译器会生成合成的桥接方法（bridge method），这是擦除的副产物。

由此产生的限制：

- **不能 `new T()` 或 `new T[]`**：运行时不知道 `T` 究竟是什么类型，无法分配数组或调用构造器。
- **不能对泛型做 `instanceof`**：`x instanceof List<String>` 无法通过编译，只能判断原始类型 `x instanceof List`。
- **不能用基本类型作类型参数**：只能写 `List<Integer>` 而不能写 `List<int>`，详见[『基本类型和包装类有什么区别？』](#基本类型和包装类有什么区别)。
- **静态成员不能使用类的类型参数**：`class Box<T> { static T value; }` 非法，因为静态成员属于类，与实例的具体 `T` 无关。
- **泛型方法无法仅靠类型参数区分重载**：擦除后签名相同，会报"方法冲突"。
- **通配符用来弥补信息缺失**：`List<?>`、`? extends T`（上界，只读）、`? super T`（下界，只写）用于表达协变与逆变。

### 高频延伸
- **擦除后为什么还能保证类型安全**：编译期会在插入与取值处自动补上**强制类型转换**并完成检查；运行时靠 `checkcast` 指令兜底。只有用原始类型绕过泛型，才会在运行期抛 `ClassCastException`。
- **`List<?>` 与 `List<Object>` 一样吗**：不一样。`List<Object>` 可以添加任意对象；`List<?>` 表示"某种未知类型的列表"，除 `null` 外不能添加元素，只能按 `Object` 读取——它是**只读**视图。
- **为什么反射还能拿到泛型信息**：擦除抹掉的是类型参数，但泛型**签名**会保存在 `class` 文件的 `Signature` 属性中。反射（`ParameterizedType`）与 Spring、Gson 等框架正是靠它还原泛型；不过它还原不了局部变量的泛型。
- **`? extends T` 与 `? super T` 怎么选**：生产者用 `extends`、消费者用 `super`（PECS 原则）。`extends` 侧只能读（元素可视为 `T`），`super` 侧只能写（可安全放入 `T` 及其子类）。
- **泛型数组为什么被禁止**：若允许，`List<String>[]` 与 `List<Integer>[]` 擦除后都是 `List[]`，就能通过父类引用放进错误类型的元素，破坏类型安全，因此干脆禁止。

## 反射是什么？有哪些用法和代价？

结论：反射（Reflection）让程序在**运行时**获取类的信息并操作它——创建实例、调用方法、读写字段，即使这些在编译期并不知道。它是 `java.lang.reflect` 提供的能力，也是 Spring、MyBatis、动态代理等框架的地基。

获取 `Class` 对象的三种方式：

- **`类名.class`**：编译期已知类型，最安全、性能最好，且**不触发类初始化**。
- **`对象.getClass()`**：已经有实例时用。
- **`Class.forName("全限定名")`**：用字符串形式的类名，**会触发类的初始化**（执行静态代码块）；另有 `ClassLoader.loadClass` 只加载不初始化。

常用操作：

- **创建实例**：`clazz.getDeclaredConstructor().newInstance()`（`Class.newInstance()` 自 JDK 9 起已废弃）。
- **调用方法**：`clazz.getMethod("name", 参数类型...)` → `method.invoke(实例, 参数...)`。
- **读写字段**：`clazz.getDeclaredField("name")`，私有字段需 `field.setAccessible(true)`。
- **读取泛型与注解**：`getGenericSuperclass()` 取泛型签名、`getAnnotation(...)` 取注解——**注解就是靠这一步才有意义**（见[『注解是什么？元注解有哪些？』](#注解是什么-元注解有哪些)）。

代价与风险：

- **性能开销**：反射调用要经历方法解析、参数装箱与访问检查，比直接调用慢，也更难被 JIT 内联。热点路径应**缓存 `Method`/`Field` 对象**，或改用 `MethodHandle`。
- **破坏封装**：能读写私有成员、甚至改写 `final` 字段（如强行改 `String` 的 `value`），**不可依赖**；JDK 9 模块化后核心包的反射访问受限（JDK 16 起默认强封装）。
- **编译期失去检查**：类名、方法名写错只能在运行时暴露，抛 `ClassNotFoundException` / `NoSuchMethodException`。
- **安全风险**：反序列化漏洞的核心机制之一就是反射调用（见 IO 模块的[『反序列化为什么会有安全风险？』](/java/io/#反序列化为什么会有安全风险)）。

```java
Class<?> clazz = Class.forName("com.example.User");   // 会触发类初始化

// 创建实例（JDK 9 起的推荐写法，Class.newInstance() 已废弃）
Object user = clazz.getDeclaredConstructor().newInstance();

// 调用方法
Method setter = clazz.getMethod("setName", String.class);
setter.invoke(user, "Tom");

// 读写私有字段
Field field = clazz.getDeclaredField("password");
field.setAccessible(true);                            // 抑制访问检查
field.set(user, "secret");

// 注解只有在被反射读取时才"起作用"
if (clazz.isAnnotationPresent(MyAnnotation.class)) {
    MyAnnotation anno = clazz.getAnnotation(MyAnnotation.class);
}
```

### 高频延伸（面试官爱追问）
- **反射到底用在哪**：Spring 的依赖注入与 Bean 创建、MyBatis 把结果集映射成对象、JDK 动态代理（`Proxy.newProxyInstance`）与 CGLIB、JUnit 扫描测试方法、Jackson/Gson 的序列化——**几乎所有"用配置替代硬编码"的场景都靠它**。
- **`Class.forName` 和 `ClassLoader.loadClass` 有什么区别**：前者默认**会初始化**类（触发静态代码块），后者只加载不初始化。JDBC 老代码用 `Class.forName` 正是为了触发驱动类的静态块完成注册。
- **反射慢在哪，怎么优化**：慢在方法解析、参数装箱、访问检查，以及难以内联。优化手段是**缓存 `Method`/`Field`/`Constructor`**（避免每次查找）、必要时用 `setAccessible(true)` 跳过检查，极端热路径改用 `MethodHandle`。业务代码里的这点开销通常可忽略。
- **`getMethod` 和 `getDeclaredMethod` 有什么区别**：`getMethod` 只能拿到 **public** 方法（含继承来的）；`getDeclaredMethod` 能拿到本类声明的**所有**方法（含 private），但**不含继承的**。字段同理。
- **为什么 `invoke` 抛的是 `InvocationTargetException`**：它把目标方法**真正抛出的异常包了一层**，必须用 `getCause()` 取出原始异常——否则日志里全是 `InvocationTargetException`，排查时极易被误导。

## 注解是什么？元注解有哪些？

结论：注解（Annotation）是**贴在代码上的"标签"**——它本身**不会做任何事**，必须由**反射**（或编译期注解处理器）读取后才产生作用。这与"注解看起来能自动生效"的直觉正好相反。

- **本质**：注解是继承 `java.lang.annotation.Annotation` 的特殊接口，用 `@interface` 声明；所谓"属性"其实就是接口方法。
- **三大用途**：给编译器看的（`@Override`、`@SuppressWarnings`）、给框架看的（`@Transactional`、`@Test`）、生成文档或代码（`@Deprecated`、Lombok）。
- **读取方式**：**运行时靠反射**（`getAnnotation` / `isAnnotationPresent`，前提是 `@Retention(RUNTIME)`）；**编译期靠注解处理器**（Lombok、MapStruct 走的是这条路）。
- **默认值**：注解属性可声明 `default`，不写就取默认值。

四种元注解（用来修饰注解的注解）：

- **`@Retention`**：保留到哪个阶段——`SOURCE`（源码级，编译即丢，如 `@Override`）/ `CLASS`（保留在 class 文件但运行时读不到，**默认值**）/ `RUNTIME`（运行时可通过反射读取，**自定义注解几乎都要它**）。
- **`@Target`**：能贴在哪里——`TYPE`、`METHOD`、`FIELD`、`PARAMETER`、`CONSTRUCTOR` 等；不写则默认可贴任意位置。
- **`@Documented`**：是否被包含进 javadoc。
- **`@Inherited`**：注解能否被子类继承（**只对类注解生效**）。
- 另有 **`@Repeatable`**（JDK 8+），允许同一个注解在同一位置重复贴多次。

```java
@Retention(RetentionPolicy.RUNTIME)      // 必须 RUNTIME，否则反射读不到
@Target({ElementType.TYPE, ElementType.METHOD})
@Documented
public @interface MyAnnotation {
    String value() default "default";    // 属性实为方法，可给默认值
    int order() default 0;
}

@MyAnnotation(value = "demo", order = 1)
public class User { /* ... */ }

// 只有被反射读到时，注解才"起作用"
MyAnnotation a = User.class.getAnnotation(MyAnnotation.class);
System.out.println(a.value());           // demo
```

### 高频延伸（面试官爱追问）
- **注解为什么能"自动生效"**：它不能。`@Transactional` 之所以能开事务，是 Spring 用反射（或字节码增强）读到它之后动态生成代理、织入事务逻辑；把注解贴在一个**不受 Spring 管理**的类上，它毫无作用。**"注解 + 反射 = 框架"**机制侧见[『反射是什么？有哪些用法和代价？』](#反射是什么-有哪些用法和代价)，这也正是这两题总被一起问的原因。
- **`@Retention` 的三个级别怎么选**：需要运行时反射读取 → `RUNTIME`；只给编译期工具用（如 `@Override`）→ `SOURCE`；默认的 `CLASS` 实际很少用（用户代码拿不到）。**忘了写 `RUNTIME`、导致反射读不到**，是自定义注解最常见的新手坑。
- **`@Inherited` 有什么限制**：只对**类**注解有效（方法和字段上的注解不会被继承），且只影响 `getAnnotation` 的结果——子类自己声明的同名注解仍会覆盖父类。
- **`@Override` 为什么只用 `SOURCE` 就够**：它纯粹是给编译器做检查的（确认确实在重写父类方法），不需要写进 class 文件、更不需要运行时读取。
- **注解影响性能吗**：反射读取注解有开销，所以框架通常会在**启动时一次性扫描并缓存**（如 Spring 的 `AnnotationMetadata`），而不是每次调用都读——这样它才敢用在核心链路上。

## 重载（Overload）和重写（Override）有什么区别？

结论：重载发生在**同一个类**内，靠**参数列表不同**区分同名方法，绑定在**编译期**（静态分派）；重写发生在**子类**，方法签名与父类完全相同，绑定在**运行期**（动态分派）。

- **发生位置**：重载在同一个类中（子类里新增不同参数的同名方法同样属于重载）；重写在子类中。
- **方法签名**：重载要求方法名相同、**参数列表必须不同**；重写要求方法名与参数列表**完全相同**。
- **返回类型**：重载可任意不同；重写必须相同，或是父类返回类型的**子类型**（协变返回）。
- **访问权限**：重载无限制；重写**不能收窄**，只能相同或更宽。
- **抛出异常**：重载无限制；重写**不能抛出更宽的受检异常**。
- **绑定时机**：重载为编译期（静态分派）；重写为运行期（动态分派）。
- **`static` 方法**：可以重载；不能重写，子类同名 `static` 方法只是**隐藏**父类的。

记忆口诀：重写遵循**「两同两小一大」**——方法名与参数列表相同；返回值和抛出的受检异常更小（更窄）；访问权限更大（更宽）。

重载的静态分派可以这样验证：

```java
static void f(Object o) { System.out.println("Object"); }
static void f(String s) { System.out.println("String"); }

Object o = "abc";
f(o);      // 输出 Object：编译期按静态类型（Object）选中
f("abc");  // 输出 String
```

### 高频延伸
- **仅返回值不同能构成重载吗**：不能。方法签名在 JVM 层面由**名称 + 参数列表**决定，返回值不参与，只改返回值会编译报错。
- **为什么重载是编译期决定的**：Java 用静态分派，编译期按参数的**静态类型**（声明类型）挑选版本。因此把 `String` 赋给 `Object` 变量后再传参，会选中 `f(Object)` 而不是 `f(String)`。
- **`private`、`final`、`static` 方法能被重写吗**：都不能。`private` 对子类不可见，子类同名方法是新方法；`final` 明确禁止重写；`static` 属于类，只能被隐藏，且按引用类型在编译期绑定。
- **在父类构造器中调用被重写的方法会怎样**：会执行**子类版本**，而此刻子类字段尚未初始化，容易读到 `null` 或 `0`。Effective Java 明确建议规避这种写法。
- **重写对异常的要求**：子类可以不抛异常或抛出更窄的受检异常，但不能抛出更宽的新受检异常，否则父类引用处无法处理。

## 接口和抽象类有什么区别？

结论：接口描述**能力契约**（"能做什么"），抽象类提供**不完全的实现**（"是什么"的公共骨架）。Java 8 引入 `default`/`static` 方法后二者的边界已模糊，但**类只能单继承、接口可多实现**这一根本差异仍然存在。

- **继承数量**：类只能继承一个抽象类；可以实现多个接口。
- **成员变量**：接口中的字段隐式是 `public static final`（只能定义常量）；抽象类可有任意可见性、可变的实例字段。
- **方法**：接口方法隐式 `public abstract`（JDK 8 起可有 `default`、`static`，JDK 9 起可有 `private`）；抽象类可同时包含抽象方法与带实现的具体方法。
- **构造器**：接口没有；抽象类有，供子类初始化时调用。
- **设计意图**：接口定义可被多个类共享的契约（如 `Comparable`、`Runnable`）；抽象类复用实现、表达强 is-a 关系。

选型：需要定义契约、允许多种实现、跨继承体系复用 → 接口；需要共享状态与实现、表达强 is-a → 抽象类。JDK 8 之后，若只是想提供一份默认实现，优先用接口的 `default` 方法。

两个接口的 `default` 方法冲突时，必须在类中显式重写：

```java
interface A { default String hello() { return "A"; } }
interface B { default String hello() { return "B"; } }

class C implements A, B {
    @Override
    public String hello() {
        return A.super.hello() + B.super.hello();  // 必须指明调用哪一个
    }
}
```

### 高频延伸
- **JDK 8 之后接口还是"纯抽象"吗**：不是。`default` 方法自带实现，`static` 方法可作工具方法，接口也能包含代码；但接口仍**不能有实例字段**，只能有常量。
- **多个接口的 `default` 方法冲突怎么办**：若一个类实现的两个接口存在同签名的 `default` 方法，编译报错，必须在类中显式重写，并用 `接口名.super.方法名()` 指明调用哪一个。
- **为什么接口能多实现、类却不能多继承**：多继承会带来状态（字段）与构造器层面的"菱形"歧义；接口没有实例状态，冲突只发生在方法层面，可通过强制重写消解。
- **抽象类可以不含抽象方法吗**：可以。此时 `abstract` 的作用就是"禁止被实例化"，常见于**模板基类**——方法全部实现好，但要求必须由子类来使用（例如 `ClassLoader` 是抽象类，却没有任何抽象方法）。注意别与工具类混淆：`Collections`、`Math` 这类工具类是用 `final` 加私有构造器禁止实例化的，并非抽象类。
- **什么时候该选抽象类**：需要维护公共状态、需要 `protected` 成员、或需要在构造阶段完成初始化逻辑时。

## 深拷贝和浅拷贝有什么区别？怎么实现深拷贝？

结论：浅拷贝只复制对象本身，其**引用类型字段仍与原对象指向同一个对象**；深拷贝会把引用字段也递归复制，得到两个完全独立的对象。

- **浅拷贝**：`Object.clone()` 的默认行为——逐字段按值复制。基本类型字段被复制一份；引用类型字段只复制**引用**，仍指向同一个对象。因此改动拷贝对象引用字段的内容，原对象会跟着变。
- **深拷贝**：引用字段也各自新建对象，两个对象完全隔离。代价是要递归复制整张对象图，还需处理循环引用。

实现深拷贝的常见方式：

- **重写 `clone()`**：在本类的 `clone()` 中对每个引用字段再调用其 `clone()`。需要链条上每个类都正确实现 `Cloneable`，漏一层就退化成浅拷贝。
- **序列化 / 反序列化**：把对象写出再读回，天然是深拷贝。要求对象图全部可序列化，性能较差；具体机制见 IO 模块的[『序列化是什么？serialVersionUID 有什么用？』](/java/io/#序列化是什么-serialversionuid-有什么用)。
- **拷贝构造器或静态工厂**：为每个类写 `new Foo(other)`，显式可控，Effective Java 推荐；但新增字段时要记得同步维护。
- **JSON 等第三方库转换**：序列化成字符串再反序列化，写起来最简单，但泛型与多态容易失真，性能也一般。

### 高频延伸
- **`clone()` 为什么容易踩坑**：它绕过构造器创建对象，`Cloneable` 又是个不含任何方法的"标记接口"——没实现它就调用会抛 `CloneNotSupportedException`；而且默认实现是浅拷贝，嵌套对象必须逐层处理。
- **什么时候浅拷贝就等于深拷贝**：字段全是基本类型或**不可变对象**（`String`、包装类）时，两者效果一致——因为不可变对象不存在"被改坏"的风险。
- **数组的 `clone()` 是深还是浅**：浅拷贝。它复制了数组本身（相当于新建了一个同样长度的数组），但元素若是对象，新旧数组仍指向同一批对象。
- **深拷贝遇到循环引用会怎样**：递归实现会无限递归直到栈溢出。必须额外用一个 `IdentityHashMap` 记录"已复制对象 → 副本"的映射，再次遇到时直接复用。
- **`final` 字段能避免浅拷贝的坑吗**：不能。`final` 只锁引用，指向的集合或对象内容照样能被改，详见[『final、finally、finalize 有什么区别？』](#final、finally、finalize-有什么区别)。

## String 为什么被设计成不可变的？

`String` 是不可变类：对象一旦创建，其内部的字符序列就不能再被修改，任何"修改"都会返回新对象。这不是随意选择，而是同时换来了安全性、并发安全与性能。

实现层面的保障：JDK 8 及之前用 `private final char[] value` 存储字符，字段私有且不对外暴露修改途径；JDK 9 起为节省内存改为 `byte[] value` 加一个 `coder` 标识编码（紧凑字符串）。所有看似修改的方法（`substring`、`concat`、`replace`、`toUpperCase`）都返回新对象，原对象保持不变。

设计成不可变的收益：

- **字符串常量池才可行**：字面量会被复用，多个引用指向同一个对象。若可变，一处修改会污染所有使用者，常量池根本无法安全存在。
- **天然线程安全**：不可变对象可无同步地在多线程间共享，无需加锁。
- **`hashCode` 可缓存**：`String` 内部缓存了 `hash`，只计算一次，因此非常适合做 `HashMap` 的 key。
- **安全**：类加载、网络地址、文件路径等都以 `String` 传参（如 `Class.forName`、`URL`）。若可变，攻击者可在校验通过后篡改内容，绕过检查（典型的 TOCTOU 问题）。

### 高频延伸
- **`final` 就等于不可变吗**：不等于。`final` 只锁住引用本身，`final` 数组或对象的**内容**仍可被修改；不可变靠的是"不对外暴露任何修改途径"——字段私有、无 setter、可变成员不外泄。
- **每次"修改"都产生新对象，不浪费吗**：会浪费，这正是循环里用 `+=` 拼接字符串慢的根因——每轮都新建对象并复制整串内容。频繁修改应改用 `StringBuilder`。
- **反射能改 `String` 的内容吗**：JDK 8 下可以拿到 `value` 字段强行改写，但这属于破坏封装，不应依赖；JDK 9 起模块系统对 `java.lang` 的反射访问限制更强。
- **JDK 9 的"紧凑字符串"改了什么**：把 `char[]` 改为 `byte[]` 加编码标识，纯 Latin-1 字符按 1 字节存储，省掉约一半内存；**不可变性并未改变**。

## String、StringBuilder、StringBuffer 有什么区别？

三者都能表示字符序列，核心差别在**可变性**与**线程安全**：

- **`String`**：不可变，任何"修改"都返回新对象。
- **`StringBuilder`**：可变，方法**不加同步**，单线程下性能最好。
- **`StringBuffer`**：可变，方法几乎都带 `synchronized`，线程安全，因此比 `StringBuilder` 慢。

`StringBuilder` 与 `StringBuffer` 都继承 `AbstractStringBuilder`，底层维护一个可自动扩容的字符数组，`append`、`insert` 等操作在原对象上原地进行，因此不会像 `String` 那样产生大量中间对象。

选择原则：内容不再变化用 `String`；单线程频繁拼接用 `StringBuilder`；确有跨线程共享同一缓冲区时才用 `StringBuffer`（实际很少见）。

循环拼接的差距最直观：

```java
// 慢：每轮都生成新 String 并复制全部内容，复杂度 O(n²)
String s = "";
for (int i = 0; i < 10000; i++) {
    s += i;
}

// 快：全程只操作一个可扩容的字符数组，最后才生成一次 String
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10000; i++) {
    sb.append(i);
}
String fast = sb.toString();
```

### 高频延伸
- **为什么循环里 `s += x` 很慢**：每次执行都会新建一个 `StringBuilder`，`append` 后再 `toString()` 生成新 `String`，下一轮再重复，内容被反复复制，复杂度 O(n²)。正确做法是在循环外建一个 `StringBuilder`，只 append 一次。
- **编译器的 `+` 优化到什么程度**：编译期可折叠的常量拼接（如 `"a" + "b"`）直接合并成一个字面量；但涉及变量的拼接，JDK 8 只把**单条语句**改写成 `StringBuilder`，跨迭代不会复用同一个 builder。
- **`StringBuffer` 现在还常用吗**：JDK 5 引入 `StringBuilder` 后已很少用于新代码。并发场景下若缓冲区只是方法内的局部变量（栈封闭、不共享），用 `StringBuilder` 就足够。
- **`StringBuilder.toString()` 得到的 `String` 进常量池吗**：不进，它是运行时新建的独立对象；只有显式调用 `intern()` 才会尝试纳入常量池。
- **三者底层存储**：JDK 8 都是 `char[]`；JDK 9 起都改为 `byte[]` 加编码标识（紧凑字符串）。

## 异常体系是怎样的？受检异常和非受检异常有什么区别？

结论：所有异常都继承自 `Throwable`，其下分 `Error` 与 `Exception` 两支。`Error` 表示 JVM 层面的严重问题；`Exception` 再按"是否强制处理"分为**受检异常**与**非受检异常**。

- **`Error`**：JVM 自身错误或资源耗尽，如 `OutOfMemoryError`、`StackOverflowError`。属不可恢复的问题，程序不应捕获处理。
- **受检异常（checked）**：继承 `Exception` 但不继承 `RuntimeException`，如 `IOException`、`SQLException`。编译器**强制**要求处理：要么 `try-catch`，要么在方法签名上 `throws`。
- **非受检异常（unchecked）**：`RuntimeException` 及其子类，如 `NullPointerException`、`IndexOutOfBoundsException`、`IllegalArgumentException`。编译器不强制处理。

设计意图：受检异常用于调用方**有可能合理恢复**的情形（如网络超时后重试）；非受检异常多表示**程序缺陷**（空指针、越界），期望通过修复代码而不是 `catch` 来解决。

### 高频延伸
- **`catch` 的书写顺序有讲究吗**：有。子类异常必须写在父类异常**之前**，否则编译报错——父类分支会提前捕获，子类分支永远不可达。
- **`finally` 一定会执行吗**：正常情况下一定执行（含 `return`、抛异常的路径）；但 `System.exit()`、JVM 崩溃时不会。另外 `finally` 中若 `return` 或再次抛异常，会**覆盖**前面的返回值或异常。
- **`throw` 和 `throws` 有什么区别**：`throw` 是一条语句，抛出一个异常对象；`throws` 出现在方法签名上，声明该方法可能抛出哪些受检异常。
- **为什么很多框架偏爱非受检异常**：受检异常会污染方法签名、导致层层 `throws` 或空 `catch`；Spring 等框架默认把受检异常包装成非受检，交由上层按需处理。
- **资源释放怎么写更稳**：JDK 7+ 用 try-with-resources，自动关闭实现 `AutoCloseable` 的资源，替代 `finally` 里手写 `close()`，也避免 `close()` 自身抛异常时吞掉业务异常；最常见的流资源写法见 IO 模块的[『字节流和字符流有什么区别？』](/java/io/#字节流和字符流有什么区别)。

## try-catch-finally 中 return 与 finally 的执行顺序？

结论：`finally` 在方法**真正返回之前**执行，顺序是 `try` →（有异常时）`catch` → `finally` → 真正 `return`。由此引出两个常考结论：`finally` 中修改局部变量**改不了**已经确定的返回值；而 `finally` 中写 `return` 会**覆盖**前面的返回值。

原因是：`try` 中执行到 `return x` 时，会先把返回值（基本类型的数值、或引用的副本）计算出来并保存到栈帧中，再执行 `finally`，最后返回**保存下来的那个值**。所以 `finally` 里对变量重新赋值，改的是局部变量槽，不是已保存的返回值。

```java
static int keepValue() {
    int x = 1;
    try {
        return x;      // 返回值 1 在此处已被保存
    } finally {
        x = 2;         // 只改了局部变量，返回的仍是 1
    }
}

static int overrideValue() {
    try {
        return 1;
    } finally {
        return 2;      // finally 中的 return 会覆盖，最终返回 2
    }
}
```

但要区分"变量本身"与"对象内容"：`finally` 中修改**对象内部状态**（如 `list.add(...)`）调用方仍然可见，因为引用副本与调用方引用指向同一个对象。

### 高频延伸
- **`try` 里 `return`、`finally` 里 `x++`，最终返回哪个值**：返回 `try` 里保存的旧值。`finally` 的 `x++` 只改了局部变量，不影响已保存的返回值。
- **返回引用类型时同理吗**：同理，保存的是引用副本；`finally` 里让变量指向新对象不影响返回值，但修改该对象的内容会影响（同一个对象）。
- **`finally` 里 `return` 会怎样**：会直接覆盖 `try`/`catch` 的返回值，并**吞掉**正在抛出的异常——这是明确应当避免的写法。
- **`finally` 会不执行的情况**：`try` 块中调用 `System.exit()`、JVM 崩溃、或用 `Runtime.getRuntime().halt()` 强制终止时不会执行。
- **`finally` 与 try-with-resources 的关系**：JDK 7+ 的 try-with-resources 在语义上等价于在 `finally` 中调用 `close()`，但它用"被抑制异常"（`addSuppressed`）正确处理"关闭时也抛异常"的情况，避免覆盖业务异常。

