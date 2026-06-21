# AI辅助土木工程制图与桥梁模型生成实践分享

这是一个 Quarto + RevealJS 汇报图测试项目，用于展示 `lecture-image-pack` 的“逐字稿转教学信息图”思路，并嵌入一个可交互的参数化提篮拱桥模型。

在线预览：

https://syzhaoln-stack.github.io/ai-civil-bridge-reveal-report/

学生跟做样例：

https://syzhaoln-stack.github.io/ai-civil-bridge-reveal-report/student-bridge-agent.html

OBJ 查看器：

https://syzhaoln-stack.github.io/ai-civil-bridge-reveal-report/obj-viewer.html

本地打开 `index.html` 或 `slides.html` 也可以预览。

## 内容

- `index.html` / `slides.html`：RevealJS 幻灯片
- `slides.qmd`：Quarto 源文件
- `styles.css`：演示主题与信息图组件
- `images/`：image gen 生成的汇报图素材
- `models/basket-arch-parametric.html`：可调参数的 Three.js 提篮拱桥模型
- `ai-lab.html`：DeepSeek 桥梁模型生成实验室前端
- `student-bridge-agent.html`：学生跟做页面，从拱桥提示词到桥梁建模 Agent/Skill
- `obj-viewer.html`：OBJ 三维模型查看器，可嵌入电子教材并支持上传 OBJ
- `server/deepseek-proxy.mjs`：本地 DeepSeek API 代理，避免把 API Key 暴露到浏览器
- `prompts/`：本次 image gen 使用的 prompt
- `PLAN-images.md`：按 `lecture-image-pack` 思路生成的汇报图规划

## DeepSeek 交互生成实验室

GitHub Pages 可以预览 `ai-lab.html` 的交互界面，但不能安全保存 API Key。真正生成模型时，请在本地或部署平台运行代理服务。

本地运行：

```powershell
$env:DEEPSEEK_API_KEY="你的key"
.\server\start-deepseek-lab.ps1
```

然后打开：

```text
http://localhost:8787/ai-lab.html
```

默认使用 `deepseek-v4-flash`，也可以这样切换：

```powershell
.\server\start-deepseek-lab.ps1 -Model deepseek-v4-flash -Port 8787
```

## 本地渲染

需要先安装 Quarto。

```powershell
& "C:\Program Files\Quarto\bin\quarto.exe" render slides.qmd
```

也可以用 Pandoc 兼容脚本生成 RevealJS：

```powershell
.\render-pandoc.ps1
```
