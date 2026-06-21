param(
  [int]$Port = 8787,
  [string]$Model = "deepseek-v4-flash"
)

if (-not $env:DEEPSEEK_API_KEY) {
  Write-Host "未检测到 DEEPSEEK_API_KEY。" -ForegroundColor Yellow
  Write-Host '请先在当前 PowerShell 中运行：$env:DEEPSEEK_API_KEY="你的key"' -ForegroundColor Yellow
  exit 1
}

$env:PORT = "$Port"
$env:DEEPSEEK_MODEL = $Model

Write-Host "启动 DeepSeek 桥梁模型生成实验室..." -ForegroundColor Cyan
Write-Host "地址：http://localhost:$Port/ai-lab.html" -ForegroundColor Cyan
node "$PSScriptRoot\deepseek-proxy.mjs"
