// 一次性脚本：统计每篇文章字数/阅读时间，可选写入各文章页 meta。
//   node _reading.js        只读，打印结果
//   node _reading.js apply  写入各 posts/*.html 的 .article-meta
// 口径：按文章 meta 声明的语种计字（双语“中文 / English”按中文）；中文 300 字/分钟，英文 200 词/分钟。
const fs = require("fs");
const path = require("path");
const dir = "posts";
const APPLY = process.argv.includes("apply");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".html")).sort();

function extractContent(html) {
  const m = html.match(/<article[^>]*class="[^"]*article-content[^"]*"[^>]*>([\s\S]*?)<\/article>/);
  return (m ? m[1] : html).replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ");
}
function compute(text) {
  const cjk = (text.match(/[一-鿿]/g) || []).length;
  const words = (text.replace(/[一-鿿]/g, " ").match(/[A-Za-z0-9]+/g) || []).length;
  const lang = cjk >= words ? "zh" : "en";          // 按实际内容判定语种（meta 标签不可靠）
  const minutes = Math.max(1, Math.ceil(cjk / 300 + words / 200)); // 阅读时间综合两种语言
  return { cjk, words, minutes, lang };
}

const map = {};
let injected = 0, noMeta = 0;
const skippedNames = [];

for (const f of files) {
  const fp = path.join(dir, f);
  let html = fs.readFileSync(fp, "utf8");
  const text = extractContent(html);
  const { cjk, words, minutes, lang } = compute(text);
  if (/内容读取失败/.test(text) || cjk + words < 30) { skippedNames.push(f); continue; } // 占位/空，跳过
  const url = "posts/" + f;
  const countLabel = lang === "en" ? `${words} words` : `${cjk} 字`;
  const timeLabel = lang === "en" ? `${minutes} min` : `约 ${minutes} 分钟`;
  map[url] = `${countLabel} · ${timeLabel}`;

  if (APPLY) {
    const re = /(<div class="[^"]*article-meta[^"]*">)([\s\S]*?)(\s*<\/div>)/;
    const m = html.match(re);
    if (!m) { noMeta++; continue; }
    // 先移除上次注入的字数/阅读时间，便于内容更新后重新统计（幂等）
    // 兼容早期双语文稿遗留的「387+741 字」格式（中文+英文词数相加），带可选 + 号
    const cleaned = m[2].replace(/\s*<span>·<\/span>\s*<span>(\d+(?:\s*\+\s*\d+)?\s*字|\d+(?:\s*\+\s*\d+)?\s*words)<\/span>\s*<span>·<\/span>\s*<span>(约\s*\d+\s*分钟|\d+\s*min)<\/span>\s*$/, "");
    const trimmed = cleaned.replace(/\s+$/, "");
    const newHtml = html.replace(re, `${m[1]}${trimmed}\n                <span>·</span>\n                <span>${countLabel}</span>\n                <span>·</span>\n                <span>${timeLabel}</span>\n            </div>`);
    fs.writeFileSync(fp, newHtml);
    injected++;
  }
}

if (APPLY) console.log(`\n[写入 ${injected}] [无meta ${noMeta}] [占位/空跳过 ${skippedNames.length}]`);
else console.log(`DRY RUN — 未写入。占位/空跳过 ${skippedNames.length} 篇：${skippedNames.join(", ")}\n`);

console.log("const READING_META = {");
for (const url of Object.keys(map)) console.log(`  ${JSON.stringify(url)}: ${JSON.stringify(map[url])},`);
console.log("};");
