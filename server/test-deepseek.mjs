const apiBase = (process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com").replace(/\/$/, "");
const key = process.env.DEEPSEEK_API_KEY;
const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

function fail(message, detail = "") {
  console.error(`FAIL: ${message}`);
  if (detail) console.error(detail.replace(/sk-[0-9a-fA-F]{8,}/g, "sk-***"));
  process.exitCode = 1;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json; charset=utf-8",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw text for diagnostics.
  }
  if (!response.ok) {
    const error = new Error(text || response.statusText);
    error.status = response.status;
    error.payload = json;
    throw error;
  }
  return json;
}

async function testModels() {
  const data = await requestJson("/models", { method: "GET", headers: { "content-type": undefined } });
  const ids = (data?.data || []).map(item => item.id);
  console.log(`OK models: ${ids.join(", ") || "(empty)"}`);
  if (!ids.includes(model)) {
    console.log(`WARN selected model "${model}" is not listed by /models.`);
  }
}

async function testChat() {
  const data = await requestJson("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "请只回复两个字：可用" }],
      temperature: 0,
      max_tokens: 64,
    }),
  });
  const content = data?.choices?.[0]?.message?.content || "";
  console.log(`OK chat: model=${data?.model || model}, finish=${data?.choices?.[0]?.finish_reason || "?"}, text="${content}"`);
}

async function testJsonMode() {
  const data = await requestJson("/chat/completions", {
    method: "POST",
    body: JSON.stringify({
      model,
      thinking: { type: "disabled" },
      response_format: { type: "json_object" },
      messages: [{
        role: "user",
        content: "返回 JSON：{\"explanation\":\"测试\",\"html_code\":\"<!DOCTYPE html><html><body>OK</body></html>\"}",
      }],
      temperature: 0,
      max_tokens: 200,
    }),
  });
  const content = data?.choices?.[0]?.message?.content || "";
  const parsed = JSON.parse(content);
  console.log(`OK json_mode: explanation="${parsed.explanation}", html_chars=${(parsed.html_code || "").length}`);
}

if (!key) {
  fail("DEEPSEEK_API_KEY is not set.");
} else {
  try {
    await testModels();
    await testChat();
    await testJsonMode();
  } catch (error) {
    fail(`DeepSeek request failed${error.status ? ` (HTTP ${error.status})` : ""}.`, error.message);
  }
}
