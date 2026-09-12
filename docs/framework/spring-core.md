# Spring 核心

## 说说 Spring Bean 的生命周期？

<Badge type="warning" text="难度：深入" />

### 一句话答案
Bean 经历：实例化 → 属性填充 → Aware 回调 → 初始化（@PostConstruct / InitializingBean / 自定义 init-method）→ 就绪使用 → 容器关闭时销毁（@PreDestroy / DisposableBean）。

### 详细解析
1. 实例化（构造器创建对象）
2. 属性赋值（依赖注入，如 `@Autowired`）
3. 若实现 Aware 接口（BeanNameAware 等）依次回调
4. `BeanPostProcessor` 前置处理
5. 初始化：`@PostConstruct` → `InitializingBean.afterPropertiesSet()` → 自定义 `init-method`
6. `BeanPostProcessor` 后置处理（AOP 代理常在此生成）
7. 容器关闭时销毁：`@PreDestroy` → `DisposableBean.destroy()` → 自定义 `destroy-method`

:::: tip 延伸
`BeanPostProcessor` 是 Spring 扩展点的核心，AOP、事务等大量功能都通过它织入。
::::

---

## Spring 是怎么解决循环依赖的？

<Badge type="warning" text="难度：深入" />

### 一句话答案
基于三级缓存（singletonObjects / earlySingletonObjects / singletonFactories）+ 提前暴露「半成品 Bean」的引用，解决单例 Bean 的 setter/字段注入循环依赖。

### 详细解析
- **一级 singletonObjects**：成品单例 Bean。
- **二级 earlySingletonObjects**：提前暴露的早期对象。
- **三级 singletonFactories**：早期暴露工厂（用于生成 AOP 代理后的早期引用）。
- 流程：A 创建中先把自己早期引用放进三级缓存 → 填充属性发现依赖 B → B 创建又依赖 A → 从三级缓存拿到 A 的早期引用完成 B → B 成品回流完成 A。
- **构造器注入**无法解决（必须先实例化），会抛 `BeanCurrentlyInCreationException`。

---

## 说说 AOP 的实现原理？

<Badge type="warning" text="难度：深入" />

### 一句话答案
Spring AOP 基于动态代理：被代理类有接口用 JDK 动态代理，否则用 CGLIB 子类代理；在 `BeanPostProcessor` 阶段织入增强（Advice），运行时生成代理对象执行切面逻辑。

### 详细解析
- **JDK 动态代理**：基于接口，生成实现接口的代理类，`InvocationHandler` 包裹原方法。
- **CGLIB**：通过继承生成子类、重写方法并加拦截，无法代理 final 类/方法。
- **织入时机**：在 Bean 初始化后的 `BeanPostProcessor` 中判断是否满足切点，满足则包成代理。

---

## Spring 事务的传播机制？

<Badge type="warning" text="难度：深入" />

### 一句话答案
传播行为定义「当前方法事务与已存在事务的关系」，常用：REQUIRED（加入/新建）、REQUIRES_NEW（挂起旧事务新建）、NESTED（嵌套保存点）、SUPPORTS、NOT_SUPPORTED、MANDATORY、NEVER。

### 详细解析
- **REQUIRED**（默认）：有则加入，无则新建。
- **REQUIRES_NEW**：总是新建并挂起外层事务，内层提交/回滚不影响外层。
- **NESTED**：在外部事务中建保存点，内层回滚只回到保存点，依赖数据库 savepoint。
- **失效场景**：同类方法自调用、非 public、异常被吞都会导致事务不生效。

---

## Spring MVC 的一次请求流程？

<Badge type="tip" text="难度：进阶" />

### 一句话答案
请求 → DispatcherServlet → HandlerMapping 找 Controller → HandlerAdapter 执行 → 方法入参绑定/校验 → 业务 → 返回数据/视图 → 视图解析/消息转换 → 响应。

### 详细解析
- **核心组件**：DispatcherServlet（前端控制器）、HandlerMapping、HandlerAdapter、ViewResolver、HttpMessageConverter（JSON 序列化）。
- **拦截器**：`HandlerInterceptor` 的 pre/post/after 可在请求前后织入逻辑（登录校验、日志）。
- **异常处理**：`@ControllerAdvice` + `@ExceptionHandler` 统一异常处理。
