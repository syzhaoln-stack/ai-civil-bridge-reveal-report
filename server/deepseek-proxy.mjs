import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 8787);
const apiBase = (process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com").replace(/\/$/, "");
const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
};

const systemPrompt = `你是土木工程三维建模和 Three.js 专家。请根据用户说明生成一个可运行的单文件 HTML。

硬性要求：
1. 输出必须包含两部分：简短说明文字，以及完整 HTML 代码。
2. HTML 必须是单文件：CSS 与 JS 写在文件内；除 Three.js CDN 外不依赖外部素材。
3. 使用 Three.js v0.160.0 import map，并使用 OrbitControls 支持旋转、缩放、平移。
4. 桥梁模型坐标必须遵守：x=桥向，y=横桥向，z=高度。Three.js 中必须定义 function V(mx, my, mz) { return new THREE.Vector3(mx, mz, -my); }，所有结构几何均通过 V() 转换。
5. 结构包括主梁、横梁、左右提篮拱肋、吊杆；拱肋按抛物线，且支持提篮拱内倾。
6. 必须有中文 UI、参数化滑块：跨度、拱高、横梁间距。滑块变化要重建模型。
7. 必须有按钮导出 FEM 节点坐标与单元信息；节点使用模型坐标，去重精度 0.001m。
8. 必须有按钮导出 OBJ；OBJ 坐标使用桥梁模型坐标，不使用 Three.js 映射坐标。
9. 输出代码要可直接保存为 .html 并打开预览。

优先返回 JSON，格式为：
{
  "explanation": "简短说明",
  "html_code": "<!DOCTYPE html>..."
}
如果不能返回 JSON，则用 Markdown 输出，并将 HTML 放入 \`\`\`html 代码块。`;

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error("请求体过大"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function extractHtmlFromContent(content) {
  const trimmed = content.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.html_code) {
      return {
        explanation: parsed.explanation || parsed.text || "",
        html: parsed.html_code,
        raw: content,
      };
    }
  } catch {
    // Fall through to Markdown / raw HTML extraction.
  }

  const fence = trimmed.match(/```html\s*([\s\S]*?)```/i) || trimmed.match(/```\s*([\s\S]*?<\/html>)\s*```/i);
  if (fence) {
    const html = fence[1].trim();
    const explanation = trimmed.replace(fence[0], "").trim();
    return { explanation, html, raw: content };
  }

  const htmlStart = trimmed.indexOf("<!DOCTYPE html");
  if (htmlStart >= 0) {
    return {
      explanation: trimmed.slice(0, htmlStart).trim(),
      html: trimmed.slice(htmlStart).trim(),
      raw: content,
    };
  }

  const looseStart = trimmed.indexOf("<html");
  if (looseStart >= 0) {
    return {
      explanation: trimmed.slice(0, looseStart).trim(),
      html: `<!DOCTYPE html>\n${trimmed.slice(looseStart).trim()}`,
      raw: content,
    };
  }

  return { explanation: trimmed, html: "", raw: content };
}

async function callDeepSeek(prompt) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    const error = new Error("未检测到 DEEPSEEK_API_KEY。请在启动代理的同一个 PowerShell 中设置环境变量。");
    error.status = 503;
    throw error;
  }

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 12000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`DeepSeek API 返回 ${response.status}: ${detail.slice(0, 800)}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const extracted = extractHtmlFromContent(content);
  return {
    model,
    usage: data.usage || null,
    finishReason: data.choices?.[0]?.finish_reason || null,
    ...extracted,
  };
}

function safePathFromUrl(url) {
  const pathname = decodeURIComponent(new URL(url, "http://local").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.slice(1);
  const resolved = path.resolve(rootDir, relative);
  if (!resolved.startsWith(rootDir)) return null;
  return resolved;
}

async function serveStatic(req, res) {
  const filePath = safePathFromUrl(req.url);
  if (!filePath || !existsSync(filePath)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "content-type": contentTypes[ext] || "application/octet-stream" });
  createReadStream(filePath).pipe(res);
}

async function handleApi(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Only POST is supported." });
    return;
  }

  try {
    const body = await parseBody(req);
    const prompt = String(body.prompt || "").trim();
    if (!prompt) {
      sendJson(res, 400, { error: "prompt 不能为空" });
      return;
    }

    const result = await callDeepSeek(prompt);
    const saved = {};
    if (body.save && result.html) {
      const modelPath = path.join(rootDir, "models", "deepseek-generated-basket-arch.html");
      const notePath = path.join(rootDir, "deepseek-output", "deepseek-generated-basket-arch.md");
      await mkdir(path.dirname(modelPath), { recursive: true });
      await mkdir(path.dirname(notePath), { recursive: true });
      await writeFile(modelPath, result.html, "utf8");
      await writeFile(notePath, `# DeepSeek 生成说明\n\n${result.explanation || "(无说明)"}\n\n## 使用模型\n\n${result.model}\n`, "utf8");
      saved.html = path.relative(rootDir, modelPath).replace(/\\/g, "/");
      saved.note = path.relative(rootDir, notePath).replace(/\\/g, "/");
    }

    sendJson(res, 200, { ...result, saved });
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || String(error) });
  }
}

createServer(async (req, res) => {
  if (req.url.startsWith("/api/deepseek")) {
    await handleApi(req, res);
    return;
  }
  await serveStatic(req, res);
}).listen(port, () => {
  console.log(`DeepSeek bridge lab: http://localhost:${port}/ai-lab.html`);
  console.log(`Model: ${model}`);
  console.log(`API key loaded: ${process.env.DEEPSEEK_API_KEY ? "yes" : "no"}`);
});
