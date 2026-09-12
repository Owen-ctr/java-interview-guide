# 框架 · 高频面试题

<Badge type="info" text="模块：框架（Spring / MyBatis）" />
<Badge type="tip" text="建议优先级：中" />

---

## 说说 Spring Bean 的生命周期？

<Badge type="warning" text="难度 ⭐⭐⭐⭐" /> 出现频率：高 ｜ 标签：Spring·Bean

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

::: tip 延伸
`BeanPostProcessor` 是 Spring 扩展点的核心，AOP、事务等大量功能都通过它织入。
:::

---

## Spring 是怎么解决循环依赖的？

<Badge type="warning" text="难度 ⭐⭐⭐⭐" /> 出现频率：高 ｜ 标签：Spring·IOC

### 一句话答案
基于三级缓存（singletonObjects / earlySingletonObjects / singletonFactories）+ 提前暴露「半成品 Bean」的引用，解决单例 Bean 的 setter/字段注入循环依赖。

### 详细解析
- **一级 singletonObjects**：成品单例 Bean。
- **二级 earlySingletonObjects**：提前暴露的早期对象。
- **三级 singletonFactories**：早期暴露工厂（用于生成 AOP 代理后的早期引用）。
- 流程：A 创建中先把自己早期引用放进三级缓存 → 填充属性发现依赖 B → B 创建又依赖 A → 从三级缓存拿到 A 的早期引用完成 B → B 成品回流完成 A。
- **构造器注入**无法解决（必须先实例化），会抛 `BeanCurrentlyInCreationException`。
