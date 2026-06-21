# lecture-image-pack 理解与本次适配

## 这个 skill 的本质

`lecture-image-pack` 不是普通“做 PPT”技能，而是一个讲座逐字稿的信息图生产流水线：

1. 通读逐字稿，按“一图一概念”拆分。
2. 生成 `PLAN-images.md`，记录每张图的编号、视觉模式、承载概念和原文 span。
3. 为每张图写高约束 prompt，尤其锁定关系箭头、执行主体、人机角色和标注归属。
4. 调用图像生成工具批量出 16:9 信息图，并逐张做视觉 QA。
5. 装配成两份 Markdown：图文讲解版和极简图片集。

## 与 Quarto RevealJS 的差异

原 skill 的交付物是“图片 + Markdown”，适合后续转 PPT；本次测试改成“每张图就是一个 RevealJS 页面”，因此：

- 保留：规划表、视觉模式、一图一概念、QA 思路。
- 替换：第一版曾用 HTML/CSS 信息图快速验证 Quarto；当前版已补入 4 张 image gen 生成图，文字仍由 Quarto 层承载以避免中文小字幻觉。
- 暂不做：R2 上传、图片文件一致性审计、逐字稿 100% 装填。

## 当前环境适配

- 已安装 Quarto：`C:\Program Files\Quarto\bin\quarto.exe`
- 推荐渲染命令：

```powershell
& "C:\Program Files\Quarto\bin\quarto.exe" render .\slides.qmd
```

- 注意：在 Windows PowerShell 里用 `Set-Content -Encoding UTF8` 可能写入 UTF-8 BOM，Quarto 1.9.38 在本目录里会因此读不到 front matter。`slides.qmd` 已处理为无 BOM UTF-8。
- `quarto.cmd` 在当前路径下曾出现 `Program Files` 路径解析问题，因此推荐直接调用 `quarto.exe`。

## 本次 image gen 测试

已生成并复制到项目中的图片：

- `images/00-cover.png`
- `images/01-workflow.png`
- `images/05-parametric-bridge.png`
- `images/09-cad-replication.png`

对应 prompt 已保存到 `prompts/`。这批图片采用“图内不放文字，文字由 RevealJS 叠加”的策略，目的是保留 image gen 的视觉表达能力，同时降低中文文字幻觉风险。
