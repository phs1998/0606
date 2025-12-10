# 个人主页背景图片设置指南

## 功能说明

已实现个人主页背景更换功能，用户可以在修改资料页面选择预设的背景图片。

## 已实现的功能

1. ✅ 背景图片选择系统
2. ✅ 默认背景（当前蒸汽波风格CSS渐变）
3. ✅ 背景预览和选择界面
4. ✅ 背景实时更新（他人查看主页时也会看到新背景）
5. ✅ 背景图片自动覆盖整个个人主页

## 如何添加您提供的背景图片

### 步骤 1：准备图片文件

根据您提供的图片，需要将它们处理成统一的尺寸：

1. **推荐尺寸**：1920x1080 像素（16:9 比例）
2. **文件格式**：JPG 或 PNG
3. **文件大小**：建议每个文件不超过 2MB

### 步骤 2：将图片放入项目

将处理好的图片文件放入 `public/backgrounds/` 目录，建议命名如下：

- `vaporwave-stairs.jpg` - 蒸汽波楼梯场景
- `tokyo-tower.jpg` - 东京塔夜景
- `neon-profile.jpg` - 霓虹侧影
- `arcade-girl.jpg` - 街机少女
- `pool-party.jpg` - 泳池派对

### 步骤 3：更新配置文件

图片文件放置好后，系统会自动识别。配置文件 `src/lib/backgrounds.ts` 中已经预定义了这些背景的配置。

如果图片文件名不同，请修改 `src/lib/backgrounds.ts` 中的 `BACKGROUND_OPTIONS` 数组：

```typescript
{
  id: 'your-background-id',
  name: '背景名称',
  url: '/backgrounds/your-filename.jpg',
}
```

## 图片处理建议

### 使用在线工具裁剪图片

1. 访问 [Photopea](https://www.photopea.com/) 或 [Canva](https://www.canva.com/)
2. 上传您的图片
3. 将图片裁剪为 1920x1080 尺寸
4. 导出为 JPG 格式（质量 80-90%）

### 使用命令行工具（如果安装了 ImageMagick）

```bash
# 调整图片尺寸并保持比例，然后裁剪到 1920x1080
magick input.jpg -resize 1920x1080^ -gravity center -extent 1920x1080 output.jpg
```

## 功能特点

1. **默认背景**：如果用户未选择背景，将使用默认的蒸汽波渐变背景
2. **实时更新**：更换背景后，所有查看该用户主页的人都会立即看到新背景
3. **响应式设计**：背景图片会自动适配不同屏幕尺寸
4. **性能优化**：背景图片使用 CSS `background-size: cover` 确保完整覆盖

## 使用说明

1. 用户登录后，进入"个人资料"页面
2. 在"基本资料"标签页中，找到"个人主页背景"部分
3. 点击任意背景缩略图进行选择
4. 点击"保存资料"按钮保存更改

## 注意事项

- 所有背景图片都会覆盖整个个人主页区域
- 背景图片会自动适配不同屏幕尺寸
- 建议使用高质量图片以获得最佳显示效果
- 图片文件应放在 `public/backgrounds/` 目录下，这样可以通过 `/backgrounds/filename.jpg` 访问

## 技术实现

- 背景ID存储在 `user_profiles.background_image_url` 字段中
- 背景图片URL通过 `src/lib/backgrounds.ts` 中的配置映射
- `ProfilePreview` 组件自动根据背景ID加载对应的背景图片
- 如果背景图片加载失败，会自动回退到默认CSS渐变背景







