# Java 基础

本模块覆盖 Java 语言基础、面向对象、字符串、异常等面试常考点。

## == 和 equals 有什么区别？

核心结论：`==` 的语义由 Java 语言规定、不可被类重写——作用于基本类型时比较数值，作用于引用类型时比较两个引用是否指向同一个对象（引用同一性）。`equals` 是 `Object` 定义的方法，默认实现即 `return (this == obj)`，因此未重写的类，`equals` 与 `==` 对引用类型完全等价；只有 `String`、`Integer` 以及正确重写了 `equals` 的类，才会转而比较对象的"逻辑内容"。二者真正的区别来自 `equals` 是否被正确重写，`equals` 并不天然比较内容。

从语义上看：

- **`==` 比较值或引用，且不可重写**：对基本类型（`int`、`long`、`double` 等）比较其数值；对引用类型比较两个引用是否指向同一对象，与对象内部状态无关。
- **`equals` 的语义可由类自定义**：`Object.equals` 默认比较引用，子类可重写以定义逻辑相等（如比较字段）。`String`、`Integer` 等已重写，故按内容比较。

需注意：`equals` 能否比较内容，取决于该类是否提供了相应的重写实现；未重写的类用 `equals` 与用 `==` 没有区别。

### 高频延伸（面试官爱追问）
- **Integer 缓存**：`Integer a = 127, b = 127` 时 `a == b` 为 `true`，换成 `128` 却为 `false`。原因：`Integer` 对 `-128~127` 做了自动装箱缓存，区间内取值复用同一对象；超出范围每次自动装箱都新建对象，引用不同。所以包装类型判等应使用 `equals`，而不是 `==`。
- **String 示例**：`String s1 = new String("abc")` 与 `String s2 = "abc"`，`s1 == s2` 为 `false`、`s1.equals(s2)` 为 `true`。关键在于**是否复用同一个对象**：字面量 `"abc"` 纳入字符串常量池（`s2` 指向池对象），而 `new String(...)` 必然新建一个独立对象（`s1` 指向它）。二者都在堆中（JDK 7 起字符串常量池也已移入堆），差异在**对象同一性**而非所在区域，因此二者不是同一个对象，故 `==`（比引用）为 `false`，而 `.equals`（比字符内容）为 `true`。这正是"`==` 比引用、`equals` 比内容"的典型例证。
- **拆箱混用的隐蔽坑**：`int a = 128; Integer b = 128;` 时 `a == b` 为 `true`，而 `Integer c = 128, d = 128;` 时 `c == d` 为 `false`。根因是 `==` 的语义取决于操作数类型——前者一边是基本类型、一边是包装类型，`==` 触发自动拆箱后按数值比较（故为 `true`）；后者两边都是 `Integer`（引用类型），不拆箱、直接比引用，而 `128` 超出装箱缓存范围（`-128~127`），`c`、`d` 各自新建、引用不同（故为 `false`）。同样是"两个 128"，`==` 一个比的是值、一个比的是引用，这正是它最隐蔽之处，也说明包装类型判等应当用 `equals`。
- **不止 Integer 有缓存**：`Byte`、`Short`、`Integer`、`Long` 缓存 `-128~127`（`Byte` 恰好覆盖全部取值），`Character` 缓存 `0~127`，`Integer` 的上界还可用 `-XX:AutoBoxCacheMax` 调大；而 `Float`、`Double` 没有缓存，因此 `Double x = 1.0, y = 1.0;` 的 `x == y` 恒为 `false`。
- **null 安全**：`null.equals(x)` 会抛 `NullPointerException`，而 `==` 不会；判空应写成 `null == x`，或直接用 null 安全的 `Objects.equals(a, b)`。
- **与 hashCode 的联动**：`equals` 能定义内容相等，但哈希集合（`HashMap`、`HashSet`）先以 `hashCode` 定位桶、再以 `equals` 判定相等；若只重写 `equals` 而不重写 `hashCode`，会出现"存入后无法取出"的异常（详见下一题）。

## 为什么重写 equals() 必须重写 hashCode()？

Java 规范对 `equals` 与 `hashCode` 存在强约束：如果两个对象根据 `equals` 比较相等，那么它们的 `hashCode` 必须相等；反之并不要求——`hashCode` 相等的对象 `equals` 可以不等，这对应哈希冲突，是被允许的。

这一约束与哈希集合的实现机制直接相关。`HashMap`、`HashSet` 等基于哈希表的结构在存取元素时，先用 `hashCode` 定位到桶（bucket），再在桶内用 `equals` 比较。如果只重写了 `equals` 而沿用 `Object` 默认的 `hashCode`（该实现尽力为不同对象返回不同哈希值，所谓「按对象地址计算」只是常见实现、并非规范要求），两个逻辑相等的对象通常会得到不同的哈希值，被分配到不同的桶中——即使 `equals` 返回 `true`，用其中之一去 `get` 另一个时也定位不到，造成"存得进、取不出"的数据错乱。

重写时需要遵循以下原则：

- `equals` 为 `true` 的对象，`hashCode` 必须相同，这是硬约束。
- `equals` 为 `false` 的对象，`hashCode` 应尽量不同以减少冲突、保证性能，但不强制。
- `hashCode` 用到的字段必须是 `equals` 比较字段的**子集**：只用其中一部分仍然合法（只是冲突更多、查询略慢）；一旦用到 `equals` 未比较的字段，才会出现逻辑相等的对象却算出不同哈希值的矛盾。
- 实际开发中可用 IDE 自动生成、Lombok `@EqualsAndHashCode`，或借助 Java 7+ 的 `Objects.hash(field1, field2...)` 统一实现，避免手写不一致。

### 高频延伸（面试官爱追问）
- `hashCode` 相等但 `equals` 不等是否允许？允许，这正是哈希冲突，只是会让桶内退化为链表/树比较，性能下降。
- 除了「取不出」还会出什么问题？两个逻辑相等的对象能同时放进 `HashSet`（表现为出现「重复」元素），`contains`、`remove` 也会失效，且往往到数据量变化后才暴露。
- 可变对象作为 key 有什么风险？对象成为 key 后若其参与 `hashCode` 的字段被修改，哈希值随之改变，再次查找便定位不到原桶，导致无法检索。
- 为什么 `String`、`Integer` 等包装类适合做 `HashMap` 的 key？因为它们正确重写了 `equals` 与 `hashCode`，且不可变，哈希值稳定。
- 重写 `equals` 本身还需满足五条契约：自反、对称、传递、一致性，以及 `x.equals(null)` 必须返回 `false`。
- `hashCode` 直接返回常量（如 `return 1`）合法吗？合法——契约只要求相等的对象哈希相同；但所有对象会挤进同一个桶，`HashMap` 退化为链表/红黑树，查询从 O(1) 降为 O(log n)/O(n)。契约正确不等于实现可用。

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

### 高频延伸（面试官爱追问）
- **为什么不能说"引用传递"**：引用传递的定义是传递变量本身（即别名），方法内重新赋值会影响调用方；而 Java 中重新赋值**不影响调用方**，所以是按值传递——只不过这个"值"恰好是一个引用。
- **为什么写不出通用的 `swap` 方法**：交换的是两个引用副本，调用方的引用不受影响。要"交换"只能修改对象内部状态，或返回新值交由调用方接收。
- **`String` 作参数为什么"改不动"**：`String` 不可变，方法内的任何"修改"都返回新对象并赋给副本，调用方自然看不到变化。
- **数组和集合为什么能改**：传入的虽是引用副本，但它与调用方引用指向**同一个对象**，修改对象内容双方都可见。
- **为什么这题容易答错**：因为"传引用副本后能改对象内容"这个现象太像引用传递，容易把"能改内容"误当成"能改变量"。区分点始终是：**方法内重新赋值是否影响调用方**。

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

### 高频延伸（面试官爱追问）
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

### 高频延伸（面试官爱追问）
- **JDK 8 之后接口还是"纯抽象"吗**：不是。`default` 方法自带实现，`static` 方法可作工具方法，接口也能包含代码；但接口仍**不能有实例字段**，只能有常量。
- **多个接口的 `default` 方法冲突怎么办**：若一个类实现的两个接口存在同签名的 `default` 方法，编译报错，必须在类中显式重写，并用 `接口名.super.方法名()` 指明调用哪一个。
- **为什么接口能多实现、类却不能多继承**：多继承会带来状态（字段）与构造器层面的"菱形"歧义；接口没有实例状态，冲突只发生在方法层面，可通过强制重写消解。
- **抽象类可以不含抽象方法吗**：可以。此时 `abstract` 的作用就是"禁止被实例化"，常见于**模板基类**——方法全部实现好，但要求必须由子类来使用（例如 `ClassLoader` 是抽象类，却没有任何抽象方法）。注意别与工具类混淆：`Collections`、`Math` 这类工具类是用 `final` 加私有构造器禁止实例化的，并非抽象类。
- **什么时候该选抽象类**：需要维护公共状态、需要 `protected` 成员、或需要在构造阶段完成初始化逻辑时。

## String 为什么被设计成不可变的？

`String` 是不可变类：对象一旦创建，其内部的字符序列就不能再被修改，任何"修改"都会返回新对象。这不是随意选择，而是同时换来了安全性、并发安全与性能。

实现层面的保障：JDK 8 及之前用 `private final char[] value` 存储字符，字段私有且不对外暴露修改途径；JDK 9 起为节省内存改为 `byte[] value` 加一个 `coder` 标识编码（紧凑字符串）。所有看似修改的方法（`substring`、`concat`、`replace`、`toUpperCase`）都返回新对象，原对象保持不变。

设计成不可变的收益：

- **字符串常量池才可行**：字面量会被复用，多个引用指向同一个对象。若可变，一处修改会污染所有使用者，常量池根本无法安全存在。
- **天然线程安全**：不可变对象可无同步地在多线程间共享，无需加锁。
- **`hashCode` 可缓存**：`String` 内部缓存了 `hash`，只计算一次，因此非常适合做 `HashMap` 的 key。
- **安全**：类加载、网络地址、文件路径等都以 `String` 传参（如 `Class.forName`、`URL`）。若可变，攻击者可在校验通过后篡改内容，绕过检查（典型的 TOCTOU 问题）。

### 高频延伸（面试官爱追问）
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

### 高频延伸（面试官爱追问）
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

### 高频延伸（面试官爱追问）
- **`catch` 的书写顺序有讲究吗**：有。子类异常必须写在父类异常**之前**，否则编译报错——父类分支会提前捕获，子类分支永远不可达。
- **`finally` 一定会执行吗**：正常情况下一定执行（含 `return`、抛异常的路径）；但 `System.exit()`、JVM 崩溃时不会。另外 `finally` 中若 `return` 或再次抛异常，会**覆盖**前面的返回值或异常。
- **`throw` 和 `throws` 有什么区别**：`throw` 是一条语句，抛出一个异常对象；`throws` 出现在方法签名上，声明该方法可能抛出哪些受检异常。
- **为什么很多框架偏爱非受检异常**：受检异常会污染方法签名、导致层层 `throws` 或空 `catch`；Spring 等框架默认把受检异常包装成非受检，交由上层按需处理。
- **资源释放怎么写更稳**：JDK 7+ 用 try-with-resources，自动关闭实现 `AutoCloseable` 的资源，替代 `finally` 里手写 `close()`，也避免 `close()` 自身抛异常时吞掉业务异常。

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

### 高频延伸（面试官爱追问）
- **`try` 里 `return`、`finally` 里 `x++`，最终返回哪个值**：返回 `try` 里保存的旧值。`finally` 的 `x++` 只改了局部变量，不影响已保存的返回值。
- **返回引用类型时同理吗**：同理，保存的是引用副本；`finally` 里让变量指向新对象不影响返回值，但修改该对象的内容会影响（同一个对象）。
- **`finally` 里 `return` 会怎样**：会直接覆盖 `try`/`catch` 的返回值，并**吞掉**正在抛出的异常——这是明确应当避免的写法。
- **`finally` 会不执行的情况**：`try` 块中调用 `System.exit()`、JVM 崩溃、或用 `Runtime.getRuntime().halt()` 强制终止时不会执行。
- **`finally` 与 try-with-resources 的关系**：JDK 7+ 的 try-with-resources 在语义上等价于在 `finally` 中调用 `close()`，但它用"被抑制异常"（`addSuppressed`）正确处理"关闭时也抛异常"的情况，避免覆盖业务异常。

