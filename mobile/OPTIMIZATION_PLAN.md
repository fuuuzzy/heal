# 移动端存钱App优化计划

## 上下文

**项目**: "一起存" 情侣共同储蓄追踪App
**目标**: 结合2026年最新储蓄类产品交互和样式趋势，对移动端进行全面优化升级

### 当前状态分析

**优点**:
- 完整的功能实现（计划管理、格子填充、伴侣绑定）
- Light/Dark主题支持，与Web端配色一致
- 文件结构清晰，expo-router路由

**需要优化的方面**:
1. **底部导航**: 缺少iOS风格的液态玻璃效果
2. **视觉设计**: 使用SpaceMono字体（过于通用），缺少品牌特色
3. **动画效果**: 完全缺失，Web端有丰富的动画（cell-breathe、shimmer、stamp-press等）
4. **交互反馈**: 无触觉反馈（haptics），用户操作无感知确认
5. **加载状态**: 仅使用ActivityIndicator，缺少骨架屏
6. **布局间距**: 部分页面间距不够精致，缺少统一的间距系统

---

## 设计方向

### 美学定位
**「温暖金融」** - 将存钱变成仪式感，而非冷冰冰的数字追踪

**关键词**: 温暖、仪式感、亲密、成长、庆祝

### 核心差异化
1. **存钱格子有生命** - 空格子会"呼吸"，已填充格子会"发光"
2. **每次存入都是仪式** - 印章落下动画 + 触觉反馈
3. **里程碑值得庆祝** - 完成时撒花庆祝动画
4. **伴侣互动有温度** - 心跳动画、双人进度对比可视化
5. **布局精致美观** - 统一间距系统，舒适的视觉呼吸感
6. **iOS原生体验** - 液态玻璃底部导航栏

---

## 实施计划

### Phase 1: 基础设施 (基础设施层)

#### 1.1 字体系统升级
**文件**: `mobile/app/_layout.tsx`

替换 SpaceMono 为 **Noto Sans SC**（用户选择）:
- 专为中文设计，清晰现代，适合金融App
- 使用 expo-google-fonts 快速集成

#### 1.2 动画库集成
**新增依赖**:
- `expo-haptics` - 触觉反馈
- `expo-blur` - iOS毛玻璃效果
- `react-native-confetti-cannon` - 庆祝动画

#### 1.3 全局动画配置
**新文件**: `mobile/constants/animations.ts`

定义统一的动画配置：
- `timing.spring` - 弹簧动画配置
- `timing.fade` - 淡入淡出
- `cell.breathe` - 格子呼吸动画
- `cell.shimmer` - 格子闪光效果

---

### Phase 2: 底部导航栏 - iOS 液态玻璃效果 (重要)

#### 2.1 液态玻璃 Tab Bar
**文件**: `mobile/app/(tabs)/_layout.tsx`

**视觉效果**:
- 背景: 模糊透明效果（BlurView）
- Light模式: 浅色毛玻璃 + 微妙边框
- Dark模式: 深色毛玻璃 + 微妙边框
- 自动跟随系统: 使用 `useColorScheme()` 动态切换

**交互效果**:
- Tab切换: 平滑过渡动画
- 选中状态: 图标放大 + 颜色变化
- 触觉反馈: 切换时轻触感

**技术实现**:
```typescript
import { BlurView } from 'expo-blur';

// Tab Bar 背景
<BlurView
  intensity={80}
  tint={colorScheme === 'dark' ? 'dark' : 'light'}
  style={styles.tabBarBlur}
/>
```

#### 2.2 图标优化
- 使用 SF Symbols 风格图标（iOS原生感）
- 选中态: 实心图标 + 金色
- 未选中态: 线性图标 + 灰色

---

### Phase 3: 核心组件优化

#### 3.1 格子网格 (Grid) - 最关键交互
**文件**: `mobile/app/plan/[id].tsx`

**优化点**:
- 空格子添加"呼吸"动画（scale微动 + opacity变化）
- 点击时触觉反馈 + 缩放动画
- 已填充格子添加shimmer效果
- 待撤销格子添加脉冲动画
- 长按显示承诺详情（替代Alert）

**新增组件**: `mobile/components/Cell.tsx`

#### 3.2 进度条
**新文件**: `mobile/components/AnimatedProgressBar.tsx`

- 进度变化时平滑动画过渡
- 添加渐变色效果
- 里程碑节点标记（25%/50%/75%/100%）

#### 3.3 骨架屏
**新文件**: `mobile/components/Skeleton.tsx`

替代所有 `ActivityIndicator`：
- Dashboard 骨架屏
- 计划卡片骨架屏
- 格子网格骨架屏

---

### Phase 4: 页面优化

#### 4.1 仪表盘 (Dashboard)
**文件**: `mobile/app/(tabs)/index.tsx`

**优化**:
- 统计卡片入场动画（staggered reveal）
- 存款金额数字滚动动画
- 连续存款火焰图标闪烁动画
- 计划卡片添加阴影层次

#### 4.2 计划详情页
**文件**: `mobile/app/plan/[id].tsx`

**优化**:
- 格子网格入场动画（逐个淡入）
- 存入模态框改为底部抽屉（bottom sheet）
- 提交后触发"印章落下"动画
- 达成里程碑时撒花庆祝

#### 4.3 创建计划页
**文件**: `mobile/app/plan/new.tsx`

**优化**:
- 格子数量选择添加可视化预览
- 创建成功后庆祝动画
- 表单字段添加浮动标签效果

#### 4.4 伴侣页
**文件**: `mobile/app/(tabs)/partner.tsx`

**优化**:
- 已绑定状态：心跳动画、双人进度对比条
- 邀请码生成时添加复制按钮
- 绑定成功时双人头像"靠近"动画

#### 4.5 登录/注册页
**文件**: `mobile/app/(auth)/login.tsx`, `mobile/app/(auth)/register.tsx`

**优化**:
- Logo 添加微动画（呼吸/脉动）
- 输入框聚焦时标签浮动动画
- 错误提示添加抖动动画

---

### Phase 5: 新增交互功能

#### 5.1 触觉反馈系统
**新文件**: `mobile/utils/haptics.ts`

#### 5.2 庆祝动画组件
**新文件**: `mobile/components/Celebration.tsx`

#### 5.3 底部抽屉组件
**新文件**: `mobile/components/BottomSheet.tsx`

---

### Phase 6: 布局与间距优化 (重要)

#### 6.1 全局间距系统
**文件**: `mobile/constants/theme.ts`

**优化**:
- 重新审视 `spacing` 常量，确保视觉呼吸感
- 卡片内边距统一 (p-4/p-5/p-6)
- 列表项间距统一 (gap-3/gap-4)
- 屏幕边距统一 (px-4 或 px-5)

#### 6.2 卡片设计规范
- 圆角统一为 16px (rounded-2xl)
- 阴影层次: 轻微阴影 (shadow-sm) + 边框
- 卡片间距: 垂直 12px，水平 16px

#### 6.3 各页面布局细节

**Dashboard**:
- 头部区域: 头像 + 欢迎语垂直居中
- 统计卡片: 等宽三列，间距 8px
- 计划列表: 卡片左右对齐屏幕边缘

**格子网格**:
- 网格居中显示
- 格子间距: 6px
- 整体网格与屏幕边缘留白: 16px

**表单页面**:
- 输入框高度: 48-52px
- 标签与输入框间距: 8px
- 字段之间间距: 20px

**按钮**:
- 主按钮高度: 48px
- 圆角: 12px
- 文字: 16px / font-weight 600

---

## 关键文件清单

| 文件路径 | 操作类型 | 说明 |
|---------|---------|------|
| `mobile/app/_layout.tsx` | 修改 | 字体加载 |
| `mobile/app/(tabs)/_layout.tsx` | 修改 | 液态玻璃Tab Bar |
| `mobile/constants/theme.ts` | 修改 | 添加阴影、渐变、间距配置 |
| `mobile/constants/animations.ts` | 新增 | 动画配置 |
| `mobile/utils/haptics.ts` | 新增 | 触觉反馈工具 |
| `mobile/components/Cell.tsx` | 新增 | 带动画的格子组件 |
| `mobile/components/AnimatedProgressBar.tsx` | 新增 | 动画进度条 |
| `mobile/components/Skeleton.tsx` | 新增 | 骨架屏组件 |
| `mobile/components/Celebration.tsx` | 新增 | 庆祝动画组件 |
| `mobile/components/BottomSheet.tsx` | 新增 | 底部抽屉组件 |
| `mobile/app/(tabs)/index.tsx` | 修改 | Dashboard优化 |
| `mobile/app/(tabs)/partner.tsx` | 修改 | 伴侣页优化 |
| `mobile/app/(tabs)/archive.tsx` | 修改 | 归档页优化 |
| `mobile/app/(auth)/login.tsx` | 修改 | 登录页优化 |
| `mobile/app/(auth)/register.tsx` | 修改 | 注册页优化 |
| `mobile/app/plan/[id].tsx` | 修改 | 计划详情页优化 |
| `mobile/app/plan/new.tsx` | 修改 | 创建计划页优化 |

---

## 依赖安装

```bash
cd mobile
npx expo install expo-haptics expo-blur react-native-confetti-cannon
npx expo install @expo-google-fonts/noto-sans-sc
```

---

## 验证计划

### 功能验证
1. 启动App，验证字体正确加载
2. 测试底部导航栏液态玻璃效果（Light/Dark/Auto）
3. 测试所有页面动画流畅度（60fps）
4. 测试触觉反馈在各场景正常触发

### 视觉验证
1. Light/Dark主题切换无闪烁
2. 格子动画（呼吸、shimmer）视觉效果
3. 进度条动画平滑
4. 布局间距舒适美观

### 性能验证
1. 动画不阻塞主线程
2. 内存无泄漏
3. 列表滚动流畅

---

## 预期成果

优化后的App将具备：
1. **iOS原生体验** - 液态玻璃底部导航栏
2. **视觉独特性** - 温暖、有仪式感的设计语言
3. **交互愉悦性** - 每个操作都有即时、有意义的反馈
4. **布局精致** - 统一间距系统，舒适美观
5. **功能完整性** - 保留所有现有功能
6. **2026年水准** - 符合最新储蓄类App的交互标准
