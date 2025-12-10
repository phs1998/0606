# 个人主页背景图片

## 说明

此目录用于存放个人主页背景图片。所有背景图片应满足以下要求：

1. **图片尺寸**：建议 1920x1080 或更高分辨率，保持 16:9 比例
2. **图片格式**：支持 JPG、PNG、WebP 等常见格式
3. **文件命名**：使用有意义的名称，如 `vaporwave-stairs.jpg`

## 如何添加新背景

1. 将图片文件放入此目录
2. 在 `src/lib/backgrounds.ts` 中的 `BACKGROUND_OPTIONS` 数组添加新项：

```typescript
{
  id: 'your-background-id',
  name: '背景名称',
  url: '/backgrounds/your-background.jpg',
  thumbnail: '/backgrounds/your-background-thumb.jpg', // 可选，用于选择界面预览
}
```

3. 如果需要缩略图，创建一个小尺寸版本（建议 320x180）并命名为 `your-background-thumb.jpg`

## 图片要求

- **尺寸**：1920x1080 或更高（16:9 比例）
- **文件大小**：建议每个文件不超过 2MB
- **质量**：清晰度足够，适合作为背景使用
- **内容**：适合作为个人主页背景的图片

## 注意事项

- 所有背景图片都会覆盖整个个人主页区域
- 背景图片会自动适配不同屏幕尺寸
- 默认背景使用CSS渐变，不需要图片文件







