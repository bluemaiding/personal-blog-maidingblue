const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const ARTICLE_CATEGORIES = ['散文', '小说', '作文', '随笔', '杂文', '古诗词', '现代诗', '学术性论文', '技术性文档', '年度总结', '纪念', '碎碎念'];
const WIKI_CATEGORIES = [{ value: 'circuits', label: '电子电路' }, { value: 'it', label: '信息技术' }, { value: 'skills', label: '实用技能' }];
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const decode = value => value.replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const plain = value => decode(value.replace(/<[^>]*>/g, '')).trim();
function executable(candidates) {
  for (const candidate of candidates.filter(Boolean)) {
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) return candidate;
    for (const dir of (process.env.PATH || '').split(path.delimiter)) {
      const file = path.join(dir, candidate); if (fs.existsSync(file) && !file.includes('WindowsApps')) return file;
    }
  }
  return '';
}
function discoverTools() {
  const bundled = path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies');
  const python = executable([process.env.BLOG_PYTHON, path.join(bundled, 'python/python.exe'), 'python.exe', 'python3', 'python']);
  const pandoc = executable([process.env.BLOG_PANDOC, 'pandoc.exe', 'pandoc', 'D:/软件安装/Pandoc/pandoc.exe']);
  return { python, pandoc, node: process.execPath };
}
function run(command, args, { cwd, input, timeout = 120000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = ''; const timer = setTimeout(() => { child.kill(); reject(new Error('操作超时，请重试。')); }, timeout);
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; }); child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => { clearTimeout(timer); code === 0 ? resolve(stdout) : reject(new Error(stderr.trim() || `操作失败（${code}）。`)); });
    child.stdin.on('error', () => {}); child.stdin.end(input || '');
  });
}
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/); const meta = {};
  if (!m) return { meta, body: raw };
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) { let value = kv[2].trim(); if (/^".*"$/.test(value)) { try { value = JSON.parse(value); } catch { value = value.slice(1, -1); } } else value = value.replace(/^'|'$/g, ''); meta[kv[1]] = value; }
  }
  return { meta, body: raw.slice(m[0].length) };
}
function validateOptions(options) {
  if (!['article', 'wiki'].includes(options.target)) throw new Error('请选择文章或 Wiki。');
  if (options.target === 'wiki' && !WIKI_CATEGORIES.some(c => c.value === options.category)) throw new Error('Wiki 分类无效。');
  if (options.target === 'article' && !ARTICLE_CATEGORIES.includes(options.category)) throw new Error('文章分类无效。');
  if (options.target === 'article' && (!/^\d{4}$/.test(String(options.year)) || !['现代文', '文言文'].includes(options.form) || !['zh', 'en'].includes(options.lang))) throw new Error('请检查年份、文体与语种。');
  if (options.group && /[\r\n\x00-\x1f]/.test(options.group)) throw new Error('Wiki 分组不能包含换行或控制字符。');
}
function verifyName(name) {
  if (!name || name.includes('..') || /[\\/\x00-\x1f:]/.test(name) || name.length > 240) throw new Error('文件名无效，请使用普通文件名。');
}
function rewriteAssets(html, markdown, attachments, id) {
  const used = new Map();
  function replace(reference) {
    const original = decode(reference);
    if (/^(https?:|data:image\/(?:png|jpeg|gif|webp);|#|\/assets\/)/i.test(original)) return reference;
    if (/^[a-z]+:/i.test(original) || original.startsWith('/') || original.includes('\\')) throw new Error('图片路径无效：' + original);
    let normalized; try { normalized = decodeURIComponent(original).replace(/^\.\//, ''); } catch { throw new Error('图片路径无法读取：' + original); }
    const matches = attachments.filter(a => a.name === normalized || a.name.endsWith('/' + normalized) || path.posix.basename(a.name) === path.posix.basename(normalized));
    if (matches.length !== 1) throw new Error(`请在“添加配图”中选择 ${original}${matches.length > 1 ? '（存在同名图片，请重命名）' : ''}，然后重新预览。`);
    const asset = matches[0]; const extension = path.posix.extname(asset.name).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.avif'].includes(extension)) throw new Error('不支持的图片类型：' + extension);
    const digest = crypto.createHash('sha256').update(Buffer.from(asset.data, 'base64')).digest('hex').slice(0, 16);
    const relative = `assets/published/${id}/${digest}${extension}`;
    used.set(relative, { path: relative, data: asset.data }); return '/' + relative;
  }
  html = html.replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/gi, (_, start, src, end) => start + esc(replace(src)) + end);
  markdown = markdown.replace(/(!\[[^\]]*\]\()([^\s)]+)([^)]*\))/g, (_, start, src, end) => start + replace(src) + end)
    .replace(/(<img\b[^>]*\bsrc=")([^"]+)(")/gi, (_, a, src, b) => a + esc(replace(src)) + b);
  return { html, markdown, assets: [...used.values()] };
}
async function convertUpload(root, upload, options) {
  verifyName(upload.name); validateOptions(options);
  const tools = discoverTools();
  if (!tools.python || !tools.pandoc) throw new Error('未找到 Python 或 Pandoc，请在设置中填写程序路径。');
  const extension = path.extname(upload.name).toLowerCase();
  let raw = Buffer.from(upload.data, 'base64').toString('utf8').replace(/^\uFEFF/, '');
  const { meta, body: prose } = parseFrontmatter(raw);
  if (extension === '.md' || extension === '.markdown') upload = { ...upload, data: Buffer.from(prose).toString('base64') };
  const result = JSON.parse(await run(tools.python, [path.join(__dirname, 'convert.py')], { input: JSON.stringify({ ...upload, pandoc: tools.pandoc }) }));
  const heading = result.html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  let title = String(options.title || meta.title || (extension === '.docx' && result.title) || (heading && plain(heading[1])) || (extension === '.txt' && prose.trim().split(/\r?\n/)[0]) || path.basename(upload.name, extension)).trim();
  if (!title || title.length > 250 || /[\r\n\x00-\x1f]/.test(title)) throw new Error('标题需为 1–250 个字符，且不能换行。');
  let html = result.html;
  // The page heading is outside the article; remove only the leading document title.
  html = html.replace(/^(\s*)<(h1|p)\b[^>]*>([\s\S]*?)<\/\2>/i, (all, space, tag, text) => plain(text) === (extension === '.docx' ? result.title : heading && plain(heading[1]) || title) ? space : all);
  const id = crypto.randomUUID();
  const rewritten = rewriteAssets(html, result.markdown, [...result.assets, ...(upload.attachments || [])], id);
  return { id, title, titleStyle: extension === '.docx' ? result.titleStyle : '', titleRuns: title === result.title ? result.titleRuns : [], fonts: result.fonts, body: rewritten.html, wikiBody: rewritten.markdown,
    assets: rewritten.assets, options: { ...options, title }, sourceName: upload.name, sourceHash: crypto.createHash('sha256').update(upload.data).digest('hex'), created: new Date().toISOString() };
}
function reading(body) {
  const text = plain(body); const cjk = (text.match(/[一-鿿]/g) || []).length;
  const words = (text.replace(/[一-鿿]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
  const minutes = Math.max(1, Math.ceil(cjk / 300 + words / 200));
  return cjk >= words ? [`${cjk} 字`, `约 ${minutes} 分钟`] : [`${words} words`, `${minutes} min`];
}
function articleHtml(draft, template) {
  const title = esc(draft.title); const o = draft.options; const stats = reading(draft.body);
  const titleContent = draft.titleRuns?.length ? draft.titleRuns.map(r => `<span${r.font ? ` style="font-family: &quot;${esc(r.font.replace(/["\\<>]/g, ''))}&quot;, serif"` : ''}>${esc(r.text)}</span>`).join('') : title;
  const values = [o.year, o.category, o.form, o.lang === 'en' ? 'English' : '中文', ...stats];
  let html = template.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title} - Bluemaiding</title>`)
    .replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${title} - Bluemaiding">`)
    .replace(/<h1 class="article-title"[^>]*>[\s\S]*?<\/h1>/, () => `<h1 class="article-title"${draft.titleStyle ? ` style="${esc(draft.titleStyle)}"` : ''}>${titleContent}</h1>`)
    .replace(/<div class="article-meta">[\s\S]*?<\/div>/, '<div class="article-meta">' + values.map(v => `<span>${esc(v)}</span>`).join('<span>·</span>') + '</div>')
    .replace(/<article class="article-content"[^>]*>[\s\S]*?<\/article>/, () => `<article class="article-content">\n${draft.body}\n</article>`);
  if (!html.includes('article-math.js')) html = html.replace('</body>', '    <script src="../js/article-math.js"></script>\n</body>');
  return html.replace(/<html lang="[^"]*"/, `<html lang="${o.lang === 'en' ? 'en' : 'zh-CN'}"`);
}
module.exports = { ARTICLE_CATEGORIES, WIKI_CATEGORIES, esc, plain, parseFrontmatter, run, discoverTools, convertUpload, articleHtml, validateOptions };
