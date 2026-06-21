$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$slides = Join-Path $root "slides.qmd"
$out = Join-Path $root "slides.html"
$css = Join-Path $root "styles.css"

pandoc $slides `
  --to revealjs `
  --standalone `
  --slide-level=2 `
  --css $css `
  -V revealjs-url="https://unpkg.com/reveal.js@5.1.0" `
  -V transition="slide" `
  -V controls="true" `
  -V progress="true" `
  -o $out

Write-Host "Rendered: $out"

