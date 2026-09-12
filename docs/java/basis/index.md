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

---

## == 和 equals 的区别？

<Badge type="warning" text="难度 ⭐⭐" /> 出现频率：高 ｜ 标签：基础·Object

### 一句话答案
`==` 比较基本类型比的是值、比较引用类型比的是内存地址；`equals` 默认也比地址，但通常被重写为比较「逻辑相等」（如 String 比内容）。

### 详细解析
- **基本类型**：`==` 直接比较值；基本类型没有 `equals`（需由其包装类调用）。
- **引用类型**：`==` 比较是否为同一个对象（地址）；`equals` 不重写时等价于 `==`，重写后按业务比较（如 String、Integer 比较内容）。
- **Integer 缓存坑**：`Integer.valueOf(-128~127)` 走缓存，`new Integer(1) == Integer.valueOf(1)` 为 false，但 `Integer.valueOf(1).equals(Integer.valueOf(1))` 为 true。

---

## final、finally、finalize 有什么区别？

<Badge type="warning" text="难度 ⭐⭐" /> 出现频率：中 ｜ 标签：基础·关键字

### 一句话答案
`final` 修饰类/方法/变量表示不可变；`finally` 是异常处理的统一收尾块；`finalize` 是对象被 GC 前回调的方法（已废弃，不推荐）。

### 详细解析
- **final**：类不可继承、方法不可重写、变量引用不可再指向别的对象（基本类型值不可变）。
- **finally**：`try/catch` 后无论是否异常都会执行（常用于关闭资源），仅 `System.exit` 等少数情况不执行。
- **finalize**：`Object` 方法，GC 前可能调用，时机不确定且影响 GC 性能，JDK9 起标记为废弃。

---

## 重载（Overload）和重写（Override）的区别？

<Badge type="warning" text="难度 ⭐⭐" /> 出现频率：高 ｜ 标签：基础·多态

### 一句话答案
重载是同一类内方法名相同、参数列表不同（编译期多态）；重写是子类覆盖父类方法（运行期多态），方法签名须一致。

### 详细解析
- **重载**：参数类型/个数/顺序不同即可，与返回类型、访问修饰符无关；编译时按实参决定调用哪个。
- **重写**：子类方法名、参数、返回类型（协变返回允许子类）须与父类一致；访问修饰符不能比父类更严格；不能抛更宽泛的受检异常。

---

## 八种基本数据类型和自动装箱/拆箱？

<Badge type="warning" text="难度 ⭐⭐" /> 出现频率：中 ｜ 标签：基础·类型

### 一句话答案
八种基本类型：byte/short/int/long/float/double/char/boolean；对应包装类；自动装箱是基本类型→包装类（valueOf），拆箱反之（xxxValue），发生在赋值/运算时。

### 详细解析
- **位数**：byte(8) short(16) int(32) long(64) float(32) double(64) char(16) boolean(1)。
- **缓存**：Integer 等缓存 -128~127；`Integer a=128; Integer b=128; a==b` 为 false（超出缓存 new 新对象）。
- **坑**：包装类默认 null，自动拆箱时若 null 会抛 `NullPointerException`。

---

## 抽象类和接口的区别？

<Badge type="warning" text="难度 ⭐⭐" /> 出现频率：高 ｜ 标签：基础·OO

### 一句话答案
抽象类强调「is-a」复用、可含普通方法与构造器、单继承；接口强调「can-do」能力契约，Java8 起可有默认方法、支持多实现。

### 详细解析
- **抽象类**：`abstract` 修饰，不能实例化，可包含成员变量、构造器、具体方法；子类单继承。
- **接口**：`interface`，默认 `public abstract` 方法、`public static final` 常量；Java8 有 `default`/`static` 方法，Java9 有私有方法；类可实现多个接口。
- **选择**：表示本质类别用抽象类；表示能力/规范用接口。
