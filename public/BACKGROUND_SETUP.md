# 背景图片设置说明

## 如何设置登录页面背景图片

1. **准备图片文件**
   - 找到 `D:\FlashCenter` 路径下的图片文件
   - 如果是文件夹，找到其中的图片文件（支持 .jpg, .png, .webp 等格式）

2. **复制图片到项目**
   - 将图片文件复制到 `public` 目录
   - 重命名为 `flashcenter.jpg`（或根据实际文件扩展名命名）

3. **更新代码中的路径**（如果需要）
   - 如果文件名不是 `flashcenter.jpg`，请修改 `src/app/page.tsx` 中的路径
   - 当前路径：`url(/flashcenter.jpg)`
   - 如果文件在 `public/backgrounds/` 目录下，路径应为：`url(/backgrounds/flashcenter.jpg)`

4. **验证**
   - 启动开发服务器后，背景图片应该正常显示
   - 图片会等比例缩放，完整显示，并带有浅米色半透明遮罩层（透明度 85%）

## 当前背景设置
- 图片路径：`/flashcenter.jpg` (即 `public/flashcenter.jpg`)
- 显示方式：contain（等比例缩放，主体完整显示）
- 遮罩层：浅米色 (#FAF5F0)，透明度 85%

