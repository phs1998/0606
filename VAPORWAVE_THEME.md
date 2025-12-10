# 蒸汽波主题使用指南

## 概述

本项目已集成完整的蒸汽波（Vaporwave）主题变量系统，包含霓虹色调、复古元素、玻璃拟态、VHS故障效果等经典蒸汽波风格特征。

## 主题变量

### 颜色变量

#### 霓虹色调
- `--vapor-pink`: #ff00ff (粉红色)
- `--vapor-pink-bright`: #ff66ff (亮粉色)
- `--vapor-pink-dim`: #cc00cc (暗粉色)
- `--vapor-cyan`: #00ffff (青色)
- `--vapor-cyan-bright`: #66ffff (亮青色)
- `--vapor-cyan-dim`: #00cccc (暗青色)
- `--vapor-purple`: #9d00ff (紫色)
- `--vapor-purple-bright`: #cc66ff (亮紫色)
- `--vapor-purple-dim`: #7a00cc (暗紫色)
- `--vapor-blue`: #0066ff (蓝色)
- `--vapor-blue-bright`: #3399ff (亮蓝色)
- `--vapor-blue-dim`: #0052cc (暗蓝色)

#### 荧光色
- `--vapor-neon-green`: #39ff14 (霓虹绿)
- `--vapor-neon-yellow`: #ffff00 (霓虹黄)
- `--vapor-neon-orange`: #ff6600 (霓虹橙)

#### 复古背景色
- `--retro-bg-dark`: #1a0a2e (深色背景)
- `--retro-bg-darker`: #0f0521 (更深背景)
- `--retro-bg-light`: #2d1b4e (浅色背景)

### 渐变组合

- `--vapor-gradient-pink-purple`: 粉紫渐变
- `--vapor-gradient-cyan-blue`: 青蓝渐变
- `--vapor-gradient-rainbow`: 彩虹渐变（粉-紫-蓝-青）

### 效果变量

#### 网格背景
- `--grid-bg`: 标准网格背景
- `--grid-bg-dense`: 密集网格背景

#### VHS故障效果
- `--scanlines`: 扫描线效果
- `--vhs-chroma`: 色差效果

#### 玻璃拟态
- `--glass-bg`: 玻璃背景色
- `--glass-border`: 玻璃边框色
- `--glass-blur`: 玻璃模糊效果

#### 毛玻璃效果
- `--frosted-glass`: 毛玻璃背景
- `--frosted-blur`: 毛玻璃模糊

#### 发光效果
- `--glow-pink`: 粉色发光
- `--glow-cyan`: 青色发光
- `--glow-purple`: 紫色发光
- `--glow-rainbow`: 彩虹发光

## CSS 实用类

### 玻璃拟态效果
```html
<div class="vapor-glass">
  <!-- 内容 -->
</div>
```

### 毛玻璃效果
```html
<div class="vapor-frosted">
  <!-- 内容 -->
</div>
```

### 霓虹文字
```html
<h1 class="vapor-neon-text">霓虹粉文字</h1>
<h1 class="vapor-neon-text-cyan">霓虹青文字</h1>
<h1 class="vapor-neon-text-purple">霓虹紫文字</h1>
```

### 发光边框
```html
<div class="vapor-glow-border">粉色发光边框</div>
<div class="vapor-glow-border-cyan">青色发光边框</div>
```

### 渐变背景
```html
<div class="vapor-gradient-bg">
  <!-- 流动的彩虹渐变背景 -->
</div>
```

### VHS故障效果
```html
<div class="vapor-vhs-effect">
  <!-- VHS故障效果 -->
</div>
```

### 扫描线覆盖
```html
<div class="vapor-scanlines relative">
  <!-- 扫描线效果 -->
</div>
```

### 网格背景
```html
<div class="vapor-grid-bg">标准网格</div>
<div class="vapor-grid-bg-dense">密集网格</div>
```

### 复古Windows 95按钮
```html
<button class="vapor-retro-button">点击我</button>
```

## Tailwind CSS 类名

### 颜色类
```html
<div class="bg-vapor-pink">粉色背景</div>
<div class="text-vapor-cyan">青色文字</div>
<div class="border-vapor-purple">紫色边框</div>
```

### 渐变背景
```html
<div class="bg-vapor-gradient-rainbow">彩虹渐变</div>
<div class="bg-vapor-gradient-pink-purple">粉紫渐变</div>
<div class="bg-vapor-gradient-cyan-blue">青蓝渐变</div>
```

### 网格背景
```html
<div class="bg-vapor-grid">标准网格</div>
<div class="bg-vapor-grid-dense">密集网格</div>
```

### 阴影效果
```html
<div class="shadow-vapor-glow-pink">粉色发光阴影</div>
<div class="shadow-vapor-glow-cyan">青色发光阴影</div>
<div class="shadow-vapor-glow-rainbow">彩虹发光阴影</div>
```

### 动画效果
```html
<div class="animate-neon-flicker">霓虹闪烁</div>
<div class="animate-gradient-flow">渐变流动</div>
<div class="animate-vhs-glitch">VHS故障</div>
<div class="animate-scanline-move">扫描线移动</div>
<div class="animate-glow-pulse">发光脉冲</div>
<div class="animate-rainbow-gradient">彩虹渐变流动</div>
```

## 使用示例

### 完整的蒸汽波卡片
```html
<div class="vapor-glass vapor-grid-bg p-6 rounded-lg relative">
  <div class="vapor-scanlines"></div>
  <h2 class="vapor-neon-text-cyan text-2xl mb-4">蒸汽波标题</h2>
  <p class="text-retro-text">这是蒸汽波风格的卡片内容</p>
  <button class="vapor-glow-border-cyan px-4 py-2 mt-4">
    点击按钮
  </button>
</div>
```

### 蒸汽波按钮
```html
<button class="
  bg-vapor-gradient-pink-purple 
  vapor-glow-border 
  px-6 py-3 
  rounded-lg 
  text-white 
  font-bold
  animate-glow-pulse
  hover:animate-neon-flicker
">
  蒸汽波按钮
</button>
```

### 蒸汽波文字效果
```html
<h1 class="
  vapor-neon-text 
  text-4xl 
  font-bold
  animate-neon-flicker
">
  VAPORWAVE
</h1>
```

### 带VHS效果的容器
```html
<div class="
  vapor-vhs-effect 
  bg-retro-bg-dark 
  p-8 
  rounded-xl
  border-2 
  border-vapor-cyan
  shadow-vapor-glow-cyan
">
  <p class="vapor-neon-text-cyan">VHS故障效果内容</p>
</div>
```

## 动画说明

1. **neon-flicker**: 霓虹灯闪烁效果，模拟真实霓虹灯的不规则闪烁
2. **gradient-flow**: 渐变流动效果，让渐变背景产生流动感
3. **vhs-glitch**: VHS故障效果，模拟老式录像带的故障画面
4. **scanline-move**: 扫描线移动，模拟CRT显示器的扫描线
5. **glow-pulse**: 发光脉冲，让发光效果产生呼吸感
6. **rainbow-gradient**: 彩虹渐变流动，让彩虹渐变产生流动效果

## 最佳实践

1. **组合使用**: 将多个效果组合使用可以创造出更丰富的视觉体验
2. **适度使用**: 不要过度使用效果，保持页面可读性
3. **性能考虑**: 动画效果会消耗性能，在移动设备上谨慎使用
4. **对比度**: 确保文字和背景有足够的对比度以保证可读性
5. **主题一致性**: 在整个应用中保持蒸汽波风格的一致性

## 浏览器兼容性

- 现代浏览器（Chrome, Firefox, Safari, Edge）完全支持
- 需要 `backdrop-filter` 支持（IE不支持）
- CSS变量需要现代浏览器支持

## 扩展

如需添加新的蒸汽波效果，可以在 `globals.css` 中的 `:root` 部分添加新的CSS变量，并在 `tailwind.config.ts` 中扩展主题配置。









