const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { ARTICLE_CATEGORIES, WIKI_CATEGORIES, convertUpload, discoverTools, articleHtml, esc } = require('./content.cjs');
const { saveDraft, pushSaved, listRecords, git } = require('./repository.cjs');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
async function startServer({ root = path.resolve(__dirname, '..'), port = 3210, writeRuntime = true } = {}) {
  const drafts = new Map(); const token = crypto.randomBytes(32).toString('hex'); const jobs = new Map(); let mutating = false;
  const settingsFile = path.join(root, '.publisher-state/tools.json');
  const settings = JSON.parse(await fs.readFile(settingsFile, 'utf8').catch(() => '{}'));
  if (settings.python) process.env.BLOG_PYTHON = settings.python; if (settings.pandoc) process.env.BLOG_PANDOC = settings.pandoc;
  const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
  async function body(req) {
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 100 * 1024 * 1024) throw new Error('文件过大，请将文档和配图控制在 70 MB 以内。'); chunks.push(chunk); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  }
  async function locked(action) {
    if (mutating) throw new Error('正在处理另一项发布，请稍候。'); mutating = true;
    try { return await action(); } finally { mutating = false; }
  }
  async function template() {
    const files = (await fs.readdir(path.join(root, 'posts'))).filter(f => /^article-\d+\.html$/.test(f)).sort((a, b) => Number(b.match(/\d+/)[0]) - Number(a.match(/\d+/)[0]));
    return fs.readFile(path.join(root, 'posts', files[0] || 'hello-world.html'), 'utf8');
  }
  const server = http.createServer(async (req, res) => {
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      if (req.headers.host !== `127.0.0.1:${server.address().port}`) return json(res, 403, { error: '请通过本机发布器入口打开。' });
      const url = new URL(req.url, origin); let pathname;
      try { pathname = decodeURIComponent(url.pathname); } catch { return json(res, 400, { error: '路径无效。' }); }
      if (pathname === '/health') return json(res, 200, { app: 'bluemaiding-publisher', root });
      if (pathname.startsWith('/api/')) {
        if (req.headers['x-publisher-token'] !== token || (req.method !== 'GET' && req.headers.origin !== origin)) return json(res, 403, { error: '发布窗口已过期，请从启动器重新打开。' });
        if (req.method === 'GET' && pathname === '/api/config') {
          const records = await listRecords(root);
          const groups = new Set(); const data = await fs.readFile(path.join(root, 'js/wiki-data.js'), 'utf8').catch(() => '');
          for (const m of data.matchAll(/"group":\s*"([^"]+)"/g)) groups.add(m[1]);
          return json(res, 200, { root, articleCategories: ARTICLE_CATEGORIES, wikiCategories: WIKI_CATEGORIES, groups: [...groups], records, tools: discoverTools(), branch: (await git(root, 'branch', '--show-current')).trim(), remote: (await git(root, 'remote', 'get-url', 'origin')).trim() });
        }
        if (req.method === 'GET' && pathname.startsWith('/api/jobs/')) {
          const job = jobs.get(pathname.split('/').at(-1)); return json(res, job ? 200 : 404, job || { error: '未找到发布任务。' });
        }
        if (req.method !== 'POST') return json(res, 405, { error: '不支持的操作。' });
        const data = await body(req);
        if (pathname === '/api/preview') {
          const draft = await convertUpload(root, data.upload, data.options); drafts.set(draft.id, draft);
          return json(res, 200, { id: draft.id, title: draft.title, fonts: draft.fonts, titleStyle: draft.titleStyle, preview: '/preview/' + draft.id });
        }
        if (pathname === '/api/save') {
          const draft = drafts.get(data.id); if (!draft) throw new Error('预览已失效，请重新预览。');
          return json(res, 200, await locked(() => saveDraft(root, draft)));
        }
        if (pathname === '/api/push') {
          if (mutating) throw new Error('正在处理另一项发布，请稍候。');
          const id = crypto.randomUUID(); const job = { id, status: 'running', messages: ['准备发布…'], record: null, error: '' }; jobs.set(id, job);
          locked(() => pushSaved(root, data.id, message => job.messages.push(message))).then(record => { job.record = record; job.status = 'done'; }).catch(error => { job.error = error.message; job.status = 'failed'; });
          return json(res, 202, { id });
        }
        if (pathname === '/api/settings') {
          const tools = {};
          for (const key of ['python', 'pandoc']) {
            if (data[key]) { if (!path.isAbsolute(data[key]) || !(await fs.stat(data[key])).isFile()) throw new Error('程序路径无效：' + key); tools[key] = data[key]; }
          }
          await fs.mkdir(path.dirname(settingsFile), { recursive: true }); await fs.writeFile(settingsFile, JSON.stringify(tools));
          process.env.BLOG_PYTHON = tools.python || ''; process.env.BLOG_PANDOC = tools.pandoc || '';
          return json(res, 200, { tools: discoverTools() });
        }
        return json(res, 404, { error: '操作不存在。' });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: '不支持的操作。' });
      let file, content;
      if (pathname === '/' || pathname === '/publisher') {
        content = (await fs.readFile(path.join(__dirname, 'ui/index.html'), 'utf8')).replace('__SESSION_TOKEN__', token);
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; frame-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
      } else if (pathname.startsWith('/preview/')) {
        const draft = drafts.get(pathname.split('/').at(-1)); if (!draft) return json(res, 404, { error: '预览已失效。' });
        const opts = draft.options.target === 'wiki' ? { ...draft.options, target: 'article', category: WIKI_CATEGORIES.find(c => c.value === draft.options.category).label, year: new Date().getFullYear(), lang: 'zh', form: draft.options.group || 'Wiki' } : draft.options;
        content = articleHtml({ ...draft, options: opts }, await template()).replaceAll('../', '/')
          .replace(/<script src="\/js\/main.js"><\/script>/, '')
          .replace(/<nav\b[\s\S]*?<\/nav>/, '').replace(/<footer\b[\s\S]*?<\/footer>/, '')
          .replace(/<button class="back-to-top"[\s\S]*?<\/button>/, '')
          .replace(/<a[^>]*class="back-link"[^>]*>[\s\S]*?<\/a>/, '')
          .replace('</head>', '<link rel="stylesheet" href="/publisher-preview.css"></head>');
        res.setHeader('Content-Security-Policy', "default-src 'self' https: data:; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https:; frame-src 'none'; connect-src 'none'; object-src 'none'");
      } else if (['/publisher.css', '/publisher.js', '/publisher-preview.css'].includes(pathname)) file = path.join(__dirname, 'ui', pathname.slice(1));
      else {
        const asset = [...drafts.values()].flatMap(d => d.assets).find(a => '/' + a.path === pathname);
        if (asset) {
          res.writeHead(200, { 'Content-Type': mime[path.extname(pathname)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox" });
          return res.end(Buffer.from(asset.data, 'base64'));
        }
        if (!/^\/(?:index\.html|avator\.png|css\/|js\/|posts\/|wiki\/|assets\/)/.test(pathname) || pathname.split('/').some(p => p.startsWith('.') || p.includes('\\'))) return json(res, 404, { error: '文件不存在。' });
        file = path.resolve(root, '.' + pathname); if (!file.startsWith(path.resolve(root) + path.sep)) return json(res, 403, { error: '路径无效。' });
        // Do not follow a symlink out of the selected repository.
        const real = await fs.realpath(file); if (!real.startsWith(await fs.realpath(root) + path.sep)) return json(res, 403, { error: '路径无效。' });
      }
      if (!content && file) content = await fs.readFile(file);
      if (pathname.startsWith('/assets/')) res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
      res.writeHead(200, { 'Content-Type': pathname === '/' || pathname === '/publisher' || pathname.startsWith('/preview/') ? mime['.html'] : mime[path.extname(pathname)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' }); res.end(content);
    } catch (error) { if (!res.headersSent) json(res, error.code === 'ENOENT' ? 404 : 400, { error: error.code === 'ENOENT' ? '文件不存在或已移动。' : error.message }); else res.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  if (writeRuntime) {
    await fs.mkdir(path.join(root, '.publisher-state'), { recursive: true });
    await fs.writeFile(path.join(root, '.publisher-state/server.json'), JSON.stringify({ port: server.address().port, pid: process.pid, root }));
  }
  return { server, port: server.address().port, token, root };
}
if (require.main === module) startServer({ port: Number(process.env.BLOG_PUBLISHER_PORT || 3210) }).then(app => console.log(`博客发布器：http://127.0.0.1:${app.port}/publisher`)).catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { startServer };
