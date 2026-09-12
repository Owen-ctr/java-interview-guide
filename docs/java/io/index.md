# IO

本模块覆盖 Java IO / NIO / 网络编程等面试常考点。题目按「基础流模型 → IO 模型与 NIO → 高性能手段 → 序列化」组织，由浅入深。

**阅读路线**：按由浅入深分三档，初学者顺「入门必答 → 进阶追问 → 深入原理」读即可。

- **入门必答**：[『字节流和字符流有什么区别？』](#字节流和字符流有什么区别)、[『BIO、NIO、AIO 有什么区别？』](#bio、nio、aio-有什么区别)
- **进阶追问**：[『NIO 的三大核心组件是什么？』](#nio-的三大核心组件是什么)、[『序列化是什么？serialVersionUID 有什么用？』](#序列化是什么-serialversionuid-有什么用)、[『反序列化为什么会有安全风险？』](#反序列化为什么会有安全风险)
- **深入原理**：[『什么是 IO 多路复用？select、poll、epoll 有什么区别？』](#什么是-io-多路复用-select、poll、epoll-有什么区别)、[『什么是零拷贝？有哪些实现方式？』](#什么是零拷贝-有哪些实现方式)

## 字节流和字符流有什么区别？

结论：**字节流以 byte 为单位、处理一切二进制数据；字符流以 char 为单位、专管文本并负责编解码**。字符流本质上是套在字节流之上的一层编码转换——`InputStreamReader` 把字节按指定字符集解码成字符。

- **基本单位**：字节流（`InputStream`/`OutputStream`）读写 1 个字节（或字节数组）；字符流（`Reader`/`Writer`）读写 1 个字符（或字符数组）。
- **适用场景**：字节流用于图片、音视频、压缩包等一切二进制内容；字符流用于文本文件与文本协议。
- **编码问题**：字符流必然遇到字符集（`GBK`/`UTF-8`）问题，用错就乱码；字节流不关心编码，原样搬运。
- **桥接关系**：`InputStreamReader` / `OutputStreamWriter` 是两者之间的桥梁，构造时应**显式指定 `Charset`**，不要依赖平台默认编码——那是乱码事故最常见的根因。
- **缓冲**：两者都该套缓冲（`BufferedInputStream`、`BufferedReader`），否则每次读写都可能触发一次系统调用，性能极差。

```java
// 按行读文本：显式指定编码，别用平台默认
try (BufferedReader reader = new BufferedReader(
        new InputStreamReader(new FileInputStream("data.txt"), StandardCharsets.UTF_8))) {
    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
}   // 自动 close，异常路径也不会漏

// 复制二进制：用字节流 + 缓冲区，别按字符处理
try (InputStream in = new BufferedInputStream(new FileInputStream("a.jpg"));
     OutputStream out = new BufferedOutputStream(new FileOutputStream("b.jpg"))) {
    byte[] buf = new byte[8192];
    int n;
    while ((n = in.read(buf)) != -1) {
        out.write(buf, 0, n);
    }
}
```

### 高频延伸
- **为什么要有字符流，直接用字节流不行吗**：字节流得自己处理"一个字符可能由多个字节组成"（UTF-8 里汉字占 3 字节）与编码边界，极易出错；字符流把这层封装好，还提供了按行读取的 `readLine()`。
- **装饰器模式在 IO 里体现在哪**：`FilterInputStream` 一族（`BufferedInputStream`、`DataInputStream`）正是装饰器——接口不变、层层叠加能力。`new BufferedReader(new InputStreamReader(new FileInputStream(...)))` 是装饰器模式的教科书案例。
- **为什么必须用 try-with-resources**：`AutoCloseable` 保证异常路径下也会关闭；手写 `finally` 里的 `close()` 一旦自身抛异常，会覆盖业务异常。多个资源会按**逆序关闭**（见[『异常体系是怎样的？受检异常和非受检异常有什么区别？』](/java/basis/#异常体系是怎样的-受检异常和非受检异常有什么区别)）。
- **`flush()` 和 `close()` 是什么关系**：`close()` 内部通常先 `flush()`；但缓冲数据不会自动写出，**需要立刻可见时（如网络通信）必须显式 `flush()`**。
- **`System.out` 是什么流**：它是 `PrintStream`（字节流），底层一般带缓冲；`System.err` 同理。这也是重定向输出时打印顺序偶尔会乱的原因。

## BIO、NIO、AIO 有什么区别？

结论：三者是三种 IO 模型——**BIO 同步阻塞**（一连接一线程）、**NIO 同步非阻塞**（一个线程靠多路复用管多个连接）、**AIO 异步非阻塞**（操作系统完成后回调）。核心区别是"**谁在等数据**"以及"线程要不要一直陪着"。

- **BIO（Blocking IO）**：`read()` 会一直阻塞到有数据。服务端通常一线程处理一连接（`accept()` 阻塞、随后 `read()` 阻塞）。连接一多线程就爆炸，这是 C10K 问题的根源。
- **NIO（Non-blocking IO，JDK 1.4）**：基于**通道 + 缓冲区 + 选择器**。用一个 `Selector` 轮询多个通道的就绪事件，只对就绪的通道做读写，因此少量线程就能支撑大量连接。
- **AIO（Asynchronous IO，JDK 7）**：发起读写后立即返回，**由操作系统完成后回调**（`CompletionHandler`），应用层完全不阻塞。但 Linux 上底层支持受限（多用 epoll 模拟），实际收益不明显。

一句话对照：**BIO 是"线程等数据"，NIO 是"线程问数据好了没"，AIO 是"数据好了叫我"。**

- **同步 vs 异步**：BIO/NIO 都由应用自己发起读写（同步）；AIO 由操作系统完成后通知应用（异步）。
- **阻塞 vs 非阻塞**：BIO 的读写调用会阻塞；NIO 的读写立即返回，没数据就返回 0。

### 高频延伸
- **NIO 到底是"非阻塞"还是"多路复用"**：这是两个层面。**非阻塞**指单次读写不阻塞；**多路复用**指用一个 `Selector` 同时监听多个通道。NIO 通常把两者一起用，这才是它能以少量线程扛住大量连接的原因。
- **BIO 为什么撑不住高并发**：线程模型是"一连接一线程"，线程创建与上下文切换都有成本，且线程栈占内存（默认约 1MB）。几千连接就要几千线程，内存与调度都撑不住。
- **AIO 为什么没有流行起来**：Linux 上原生 AIO 支持不完整、JDK 实现多用 epoll 模拟，性能没显著优于 NIO，还带来更高的编程复杂度；同时基于 NIO 的 Netty 等框架生态已经非常成熟。
- **主流框架为什么都选 NIO**：AIO 在 Linux 上收益不明显、复杂度更高，而基于 epoll 的 NIO 更可控、跨平台表现更一致——所以 Netty 这类框架都建立在 NIO 之上。
- **"同步非阻塞"具体怎么体现**：`channel.read(buf)` 立即返回，返回值表示读到了多少字节、可能是 0；应用先去做别的事，等 `Selector` 通知"这个通道可读了"再回来读。

## NIO 的三大核心组件是什么？

结论：**Channel（通道）**、**Buffer（缓冲区）**、**Selector（选择器）**。数据总是**先读进 Buffer、再从 Buffer 写进 Channel**；Selector 让一个线程能同时监听多个 Channel 的就绪事件。

- **Channel（通道）**：双向的，既能读也能写（对比 `InputStream`/`OutputStream` 是单向的）。常见实现：`FileChannel`、`SocketChannel`、`ServerSocketChannel`、`DatagramChannel`。
- **Buffer（缓冲区）**：本质是一块内存 + 三个指针（`position`、`limit`、`capacity`）。所有读写都要经过它，**不存在从 Channel 直接到应用的数据通路**。
- **Selector（选择器）**：把多个 Channel 注册到一个 Selector 上，用一个线程 `select()` 轮询就绪事件（`OP_ACCEPT`、`OP_READ`、`OP_WRITE`）。这是"少量线程管理大量连接"的关键。

Buffer 的关键操作与两个模式：

- `flip()`：**写模式切到读模式**——`limit` 设为当前 `position`、`position` 归零。
- `clear()`：回到写模式（`position = 0`、`limit = capacity`），数据并未真正擦除。
- `compact()`：把**未读数据**搬到自己前面，再切回写模式。
- `rewind()`：`position` 归零但不动 `limit`，用于重读一遍；`mark()` / `reset()` 用于打标记与回退。
- **直接内存缓冲**：`allocateDirect()` 分配的 `DirectByteBuffer` 不走 JVM 堆、少一次拷贝，适合长期复用；但分配与回收成本高，且回收依赖 GC（见[『JVM 的运行时数据区由哪些部分组成？』](/java/jvm/#jvm-的运行时数据区由哪些部分组成)）。

```java
// NIO 服务端骨架：一个线程 + 一个 Selector 管理多个连接
ServerSocketChannel server = ServerSocketChannel.open();
server.bind(new InetSocketAddress(8080));
server.configureBlocking(false);                  // 必须非阻塞
Selector selector = Selector.open();
server.register(selector, SelectionKey.OP_ACCEPT);

while (true) {
    selector.select();                            // 阻塞直到有就绪事件
    Iterator<SelectionKey> it = selector.selectedKeys().iterator();
    while (it.hasNext()) {
        SelectionKey key = it.next();
        if (key.isAcceptable()) { /* 接入新连接，注册 OP_READ */ }
        else if (key.isReadable()) { /* 从 Buffer 读数据 */ }
        it.remove();                              // 必须移除，否则会重复处理
    }
}
```

### 高频延伸
- **为什么说 `flip()` 最容易踩坑**：写完之后**必须** `flip()` 才能读，否则读的是"从 position 到 limit"的空区间；读完想再写又要 `clear()` 或 `compact()`。漏掉 `clear()` 会让残留数据混进下一次读。
- **`clear()` 和 `compact()` 有什么区别**：`clear()` 直接丢弃全部内容回到写模式；`compact()` 把**未读数据**搬到自己前面再切回写模式——用于"还没读完就要继续写"的场景。
- **堆内 Buffer 和直接内存 Buffer 怎么选**：堆内 `allocate()` 分配快、随 GC 回收，但要经过一次"堆内 → 直接内存"的拷贝；`allocateDirect()` 少一次拷贝、适合大量 IO，但分配慢、回收不可控。**高频小量用堆内，长期复用的大缓冲用直接内存**。
- **`selectedKeys` 处理完为什么必须 `remove`**：`select()` 只是**追加**就绪的 key，不会替你清理；不 `remove` 会让同一个 key 被反复处理（尤其 `OP_WRITE`，很容易把 CPU 拉满）。
- **`FileChannel` 能注册到 `Selector` 吗**：不能。`Selector` 只能用于 `SelectableChannel`（网络通道），而 `FileChannel` 不是可选择的——文件 IO 在多数操作系统上并没有"就绪"语义。

## 什么是 IO 多路复用？select、poll、epoll 有什么区别？

结论：**IO 多路复用**指用**一个线程同时监听多个 fd**、哪个就绪就处理哪个，从而不必为每个连接开一个线程。三者是递进关系——**select 有 fd 上限且每次全量拷贝，poll 去掉了上限，epoll 用红黑树 + 就绪链表把复杂度降到 O(1)**。

- **select**：把关注的 fd 集合从用户态**全量拷贝**到内核态，内核线性扫描；返回后应用还要再遍历一遍才知道哪个就绪。fd 上限通常是 **1024**（`FD_SETSIZE`），且每次调用都要重新设置集合。
- **poll**：用 `pollfd` 数组替代位图，**没有 1024 上限**；但仍是"全量拷贝 + 线性扫描"，复杂度 O(n)，fd 一多就退化成轮询。
- **epoll**：三个系统调用分工明确——
  - `epoll_create` 创建 epoll 实例（内核里一棵**红黑树**存放所有注册的 fd）；
  - `epoll_ctl` 增删改关注的 fd，**只需注册一次**，不必每次重复传入；
  - `epoll_wait` 直接返回**就绪链表**中的 fd，复杂度 O(1)，与总 fd 数无关。
- **为什么 epoll 快**：省掉了"每次全量拷贝"与"线性扫描"，只返回就绪项，因此 fd 越多优势越明显。这也是 Nginx、Redis、Netty 在 Linux 上高性能的底层原因。

### 高频延伸
- **水平触发（LT）和边缘触发（ET）有什么区别**：**LT** 是默认模式——只要缓冲区还有数据没读完，`epoll_wait` 会**持续通知**；**ET** 只在状态**变化**时通知一次，必须一次读到 `EAGAIN`，否则会丢事件。ET 效率更高但写法更严格，要求 fd 设为非阻塞。
- **epoll 一定比 select 快吗**：不一定。**连接数少且大多活跃**时，select 的全量扫描反而可能更快（省去了 epoll 的红黑树维护开销）；epoll 的优势在**大量连接、少量活跃**的场景。
- **Java 里怎么用到 epoll**：JDK 在 Linux 上的 `Selector` 默认就是 epoll 实现（`EPollSelectorImpl`）；Netty 还提供了 `EpollEventLoopGroup`，以支持 ET 模式等原生能力。
- **多路复用是"异步"吗**：不是。它属于**同步非阻塞**——`epoll_wait` 本身会阻塞，且数据就绪后仍要由应用自己发起 `read`/`write`。真正的异步是内核把数据读完再通知应用（AIO / `io_uring`）。
- **select 的 1024 上限能突破吗**：重新编译内核调整 `FD_SETSIZE` 可行但不现实；工程上的解法是换 epoll，或用多线程各自 select（一些早期并发模型就是这么做的）。

## 什么是零拷贝？有哪些实现方式？

结论：**零拷贝**指减少或消除数据在**内核态与用户态之间的拷贝**。传统的 `read` + `write` 要经历 **4 次拷贝、4 次上下文切换**；`mmap`、`sendfile`、`splice` 能把它降到 2 次甚至 0 次 **CPU 拷贝**。

传统"读文件再发到网络"的 4 次拷贝：

1. DMA 把数据从**磁盘**拷到**内核缓冲区**；
2. CPU 把数据从内核缓冲区拷到**用户缓冲区**（`read` 返回）；
3. CPU 把数据从用户缓冲区拷到**内核 socket 缓冲区**（`write`）；
4. DMA 把数据从 socket 缓冲区拷到**网卡**。

外加上下文切换 4 次（`read` 前后、`write` 前后各一次）。第 2、3 步纯属"搬来搬去"，零拷贝的核心就是干掉这两步。

常见实现：

- **`mmap` + `write`**：把内核缓冲区**映射**到用户空间，`write` 时数据直接从内核缓冲区写入 socket 缓冲区——省掉第 2 步的 CPU 拷贝，但**上下文切换仍是 4 次**，且多了映射与缺页成本。
- **`sendfile`（Linux 2.1+）**：应用完全不经手数据，由内核把文件内容直接送到 socket——**只剩 2 次 DMA 拷贝**，上下文切换降到 2 次。Nginx、Kafka 大量使用。
- **`sendfile` + DMA gather（Linux 2.4+）**：网卡支持 scatter-gather 时，socket 缓冲区只保存"数据位置与长度"的描述符，DMA 按描述符直接取数——这才是**真正意义上的零 CPU 拷贝**。
- **`splice` / `tee`（Linux 2.6+）**：在两个 fd 之间通过管道传递数据，不经过用户态，也不要求网卡支持。
- **Java 的入口**：`FileChannel.transferTo()` / `transferFrom()` 在 Linux 上会走到 `sendfile`；`MappedByteBuffer` 走 `mmap`。

```java
// Java 里最典型的零拷贝用法：文件 → 网络的通道间传输
try (FileChannel in = FileChannel.open(Paths.get("a.mp4"), StandardOpenOption.READ);
     SocketChannel out = SocketChannel.open(new InetSocketAddress("host", 8080))) {
    long size = in.size();
    long pos = 0;
    while (pos < size) {
        pos += in.transferTo(pos, size - pos, out);   // 底层可能是 sendfile
    }
}

// mmap：把文件映射进内存，省掉一次内核 → 用户的拷贝
try (FileChannel in = FileChannel.open(Paths.get("a.mp4"), StandardOpenOption.READ)) {
    MappedByteBuffer buf = in.map(FileChannel.MapMode.READ_ONLY, 0, in.size());
    // buf.get(...) 直接读映射区
}
```

### 高频延伸
- **零拷贝是"完全没有拷贝"吗**：不是。它省的是**CPU 参与的拷贝**，DMA 拷贝依然存在（数据总得从磁盘到网卡）。更准确的说法是"减少数据在用户态与内核态之间的来回搬运"。
- **`mmap` 和 `sendfile` 怎么选**：只做"文件 → 网络"转发就用 `sendfile`（省得最干净）；需要**在用户态访问或修改数据**时才用 `mmap`（把文件映射成内存、可直接读写，但要承担缺页与一致性开销）。
- **Kafka 为什么快，和零拷贝什么关系**：生产者写入页缓存、消费者用 `sendfile` 把页缓存直接送到 socket，全程避开用户态拷贝；再配合**顺序写**与**批量发送**，共同构成它的高吞吐基础。
- **零拷贝有什么代价**：`sendfile` 期间应用**看不到数据**（无法加密、压缩或二次加工）；`mmap` 有缺页中断，文件被截断时还可能触发 `SIGBUS`。所以它只在"纯转发"场景适用。
- **Java 的 `transferTo` 一定零拷贝吗**：不一定。它单次最多传 2GB（受 `Integer.MAX_VALUE` 限制），超出要循环；而且在部分平台或通道实现上会退化成普通读写循环。要结合具体实现与操作系统支持判断。

## 序列化是什么？serialVersionUID 有什么用？

结论：**序列化**是把对象转成字节流以便存储或传输，**反序列化**是还原回对象，由 `Serializable` 接口启用。**`serialVersionUID` 是版本号**——反序列化时会比对字节流中记录的 UID 与本地类的 UID，不一致就抛 `InvalidClassException`。

- **怎么启用**：类实现 `Serializable`（一个不含方法的标记接口）即可，无需实现任何方法；用 `ObjectOutputStream.writeObject()` 写出、`ObjectInputStream.readObject()` 读入。
- **`serialVersionUID` 的作用**：显式声明（`private static final long serialVersionUID = 1L;`）后，即使增删字段，只要 UID 不变就仍能反序列化——新增字段取默认值、缺失字段被忽略，这是**跨版本兼容**的关键。
- **不声明会怎样**：JVM 会**根据类结构自动算**一个 UID；改动字段、方法甚至修饰符都可能让它变化，导致旧数据反序列化失败。所以 IDE 会提示"必须显式声明"。
- **`transient` 的用途**：被 `transient` 修饰的字段**不参与序列化**，反序列化后取默认值。常用于密码、缓存、以及可由其他字段推导出的冗余值。
- **`Externalizable`**：继承 `Serializable` 但要求自己实现 `writeExternal` / `readExternal`，可控性更强（连字段顺序都能自己定），代价是必须提供**公开无参构造器**。

```java
public class User implements Serializable {
    private static final long serialVersionUID = 1L;   // 显式声明，别让 JVM 替你算
    private String name;
    private transient String password;                 // 不参与序列化
}
```

### 高频延伸
- **`transient` 和 `static` 字段会被序列化吗**：都不会。`static` 属于类而不属于对象，不参与；`transient` 被显式排除。反序列化后两者都取"当前类里的值"或类型默认值。
- **`serialVersionUID` 不一致一定会失败吗**：会抛 `InvalidClassException`。反序列化时 JVM 先比对字节流里记录的值与本地类的值，不一致直接拒绝——这正是它作为"版本闸门"的意义。
- **序列化有哪些坑**：它**不走构造器**（反序列化由 JVM 直接还原字段）、不受 `final` 约束（`final` 字段也能被反序列化改写）、单例类反序列化会得到**新实例**（除非实现 `readResolve`）。
- **为什么不推荐用 Java 原生序列化**：字节流**体积大**（携带大量类型元信息）、**性能一般**、**跨语言不友好**，而且**反序列化有安全风险**（见[『反序列化为什么会有安全风险？』](#反序列化为什么会有安全风险)）。现代实践多用 JSON（Jackson）、Protobuf 等。
- **`Serializable` 为什么是空接口**：它只是给 JVM 的**标记**，告诉运行时为该类启用序列化机制；具体逻辑由 `ObjectOutputStream` / `ObjectInputStream` 通过反射与 `ObjectStreamClass` 完成，因此不需要类自己实现方法。

## 反序列化为什么会有安全风险？

结论：反序列化会**依据字节流里的类信息还原对象，并触发其中约定的方法**（`readObject`、`readResolve`、`finalize` 等）。攻击者可以伪造字节流，让服务端加载并执行意料之外的类，进而造成**远程代码执行（RCE）**。这是 Java 生态最危险的漏洞类型之一。

攻击链的基本思路：

1. 找到一个 **classpath 上已存在**、且 `readObject` 中会执行危险逻辑的类（即所谓 **gadget**，如老版本 Commons Collections 中的相关类）；
2. 把这些 gadget 按特定嵌套关系序列化成字节流，使还原过程中的调用链最终执行任意命令；
3. 把字节流发给目标服务（RPC、MQ、缓存入口等），服务端一旦反序列化就触发执行。

防护手段：

- **不反序列化不可信数据**——这是根本原则，能不用原生序列化就不用。
- **`ObjectInputFilter`（JDK 9+）或黑白名单**：JDK 9 引入 `ObjectInputFilter`，可在 `readObject` 前校验类名、数组长度、引用深度等；旧版本可用 JEP 290 的回移植或自行实现 `resolveClass` 白名单。
- **改用数据格式**：用 JSON（Jackson）、Protobuf 等替换原生序列化。注意 JSON **也不是绝对安全**——Jackson 的多态类型处理历史上同样出过 RCE，因此**不要开启任意类型的多态反序列化**。
- **依赖治理**：及时升级含 gadget 的库（如老版本 Commons Collections），收紧 classpath 上可用的类。

### 高频延伸
- **为什么反序列化能执行代码**：因为它**不走构造器**而由 JVM 还原字段，期间会调用一批约定方法——`readObject`、`readObjectNoData`、`readResolve`、`writeReplace`，以及 `finalize`。gadget 链正是利用这些"会被自动调用"的方法串起连锁调用。
- **`readResolve` 有什么正当用途**：可以在反序列化时**替换返回的对象**，常用于保护单例（返回已有实例）。但它同时也是一条可利用的链。
- **JDK 9+ 的 `ObjectInputFilter` 怎么用**：通过 `ObjectInputStream.setObjectInputFilter(...)` 或全局 `-Djdk.serialFilter=...` 配置，可按类名白名单、包名模式、最大深度、最大数组长度等维度限制——**白名单比黑名单可靠得多**。
- **JSON 反序列化就没风险了吗**：不是。Jackson 的 `@JsonTypeInfo` 与旧版 `enableDefaultTyping` 能通过构造特定 JSON 触发实例化任意类，历史 RCE 多源于此。对策是**显式指定目标类型、禁用任意多态**。
- **微服务里怎么落地防护**：内网接口也不该默认信任；RPC 框架优先用 Protobuf 这类强类型协议；对必须走原生序列化的老系统，在边界处加 `ObjectInputFilter` 白名单，并监控异常的反序列化请求。
