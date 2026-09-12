# 面向对象与语言特性

## 抽象类和接口的区别？

<Badge type="info" text="难度：基础" />

### 一句话答案
抽象类强调「is-a」复用、可含普通方法与构造器、单继承；接口强调「can-do」能力契约，Java8 起可有默认方法、支持多实现。

### 详细解析
- **抽象类**：`abstract` 修饰，不能实例化，可包含成员变量、构造器、具体方法；子类单继承。
- **接口**：`interface`，默认 `public abstract` 方法、`public static final` 常量；Java8 有 `default`/`static` 方法，Java9 有私有方法；类可实现多个接口。
- **选择**：表示本质类别用抽象类；表示能力/规范用接口。

---

## 重载（Overload）和重写（Override）的区别？

<Badge type="info" text="难度：基础" />

### 一句话答案
重载是同一类内方法名相同、参数列表不同（编译期多态）；重写是子类覆盖父类方法（运行期多态），方法签名须一致。

### 详细解析
- **重载**：参数类型/个数/顺序不同即可，与返回类型、访问修饰符无关；编译时按实参决定调用哪个。
- **重写**：子类方法名、参数、返回类型（协变返回允许子类）须与父类一致；访问修饰符不能比父类更严格；不能抛更宽泛的受检异常。

---

## 八种基本数据类型和自动装箱/拆箱？

<Badge type="info" text="难度：基础" />

### 一句话答案
八种基本类型：byte/short/int/long/float/double/char/boolean；对应包装类；自动装箱是基本类型→包装类（valueOf），拆箱反之（xxxValue），发生在赋值/运算时。

### 详细解析
- **位数**：byte(8) short(16) int(32) long(64) float(32) double(64) char(16) boolean(1)。
- **缓存**：Integer 等缓存 -128~127；`Integer a=128; Integer b=128; a==b` 为 false（超出缓存 new 新对象）。
- **坑**：包装类默认 null，自动拆箱时若 null 会抛 `NullPointerException`。

---

## final、finally、finalize 有什么区别？

<Badge type="info" text="难度：基础" />

### 一句话答案
`final` 修饰类/方法/变量表示不可变；`finally` 是异常处理的统一收尾块；`finalize` 是对象被 GC 前回调的方法（已废弃，不推荐）。

### 详细解析
- **final**：类不可继承、方法不可重写、变量引用不可再指向别的对象（基本类型值不可变）。
- **finally**：`try/catch` 后无论是否异常都会执行（常用于关闭资源），仅 `System.exit` 等少数情况不执行。
- **finalize**：`Object` 方法，GC 前可能调用，时机不确定且影响 GC 性能，JDK9 起标记为废弃。

---

## Java 异常体系是怎样的？Checked 和 Unchecked 区别？

<Badge type="tip" text="难度：进阶" />

### 一句话答案
Throwable 分 Error（严重、不应捕获）和 Exception；Exception 分 Checked（编译期强检，如 IOException）和 RuntimeException（Unchecked，如 NPE）。

### 详细解析
- **Error**：如 `OutOfMemoryError`，通常由 JVM 抛出，不应也不建议捕获。
- **Checked Exception**：继承 Exception 但不继承 RuntimeException，编译期必须 try-catch 或 throws。
- **Unchecked / RuntimeException**：如 `NullPointerException`、`IllegalArgumentException`，编译期不强制处理。
- 设计原则：可恢复用 Checked，程序错误用 RuntimeException。
