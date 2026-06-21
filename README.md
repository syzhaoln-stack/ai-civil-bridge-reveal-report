# AI辅助土木工程制图与桥梁模型生成实践分享

这是一个 Quarto + RevealJS 汇报图测试项目，用于展示 `lecture-image-pack` 的“逐字稿转教学信息图”思路，并嵌入一个可交互的参数化提篮拱桥模型。

在线预览入口发布后使用仓库的 GitHub Pages 地址即可访问；本地打开 `index.html` 或 `slides.html` 也可以预览。

## 内容

- `index.html` / `slides.html`：RevealJS 幻灯片
- `slides.qmd`：Quarto 源文件
- `styles.css`：演示主题与信息图组件
- `images/`：image gen 生成的汇报图素材
- `models/basket-arch-parametric.html`：可调参数的 Three.js 提篮拱桥模型
- `prompts/`：本次 image gen 使用的 prompt
- `PLAN-images.md`：按 `lecture-image-pack` 思路生成的汇报图规划

## 本地渲染

需要先安装 Quarto。

```powershell
& "C:\Program Files\Quarto\bin\quarto.exe" render slides.qmd
```

也可以用 Pandoc 兼容脚本生成 RevealJS：

```powershell
.\render-pandoc.ps1
```
