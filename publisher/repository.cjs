const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { run, articleHtml, parseFrontmatter, validateOptions } = require('./content.cjs');
const hash = buffer => crypto.createHash('sha256').update(buffer).digest('hex');
const stateDir = root => path.join(root, '.publisher-state');
const git = (root, ...args) => run('git', ['-c', 'http.proxy=', '-c', 'https.proxy=', ...args], { cwd: root });
function recordFile(root, id) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('发布记录无效。');
  return path.join(stateDir(root), id + '.json');
}
async function readRecord(root, id) { return JSON.parse(await fs.readFile(recordFile(root, id), 'utf8')); }
async function writeRecord(root, record) {
  await fs.mkdir(stateDir(root), { recursive: true });
  const target = recordFile(root, record.id); await fs.writeFile(target + '.tmp', JSON.stringify(record, null, 2)); await fs.rename(target + '.tmp', target);
}
async function listRecords(root) {
  const files = await fs.readdir(stateDir(root)).catch(() => []);
  const records = [];
  for (const file of files.filter(f => /^[a-f0-9-]{36}\.json$/.test(f))) records.push(await readRecord(root, file.slice(0, -5)));
  return records.sort((a, b) => b.created.localeCompare(a.created));
}
async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }
async function saveDraft(root, draft) {
  validateOptions(draft.options);
  if (await exists(recordFile(root, draft.id))) return readRecord(root, draft.id);
  const article = draft.options.target === 'article';
  const index = article ? 'js/articles-data.js' : 'js/wiki-data.js';
  const pending = (await listRecords(root)).find(record => !record.pushed && record.files.includes(index));
  if (pending) throw new Error(`请先在发布记录中推送“${pending.title}”，再保存下一篇${article ? '文章' : 'Wiki'}。`);
  // Index generation is allowed only if it will not overwrite another unsaved edit.
  if ((await git(root, 'status', '--porcelain', '--', index)).trim()) throw new Error('博客目录索引存在其他未提交修改，请先处理后再保存。');
  if (await exists(path.join(root, index)) && !(await git(root, 'ls-files', '--', index)).trim()) throw new Error('索引文件尚未跟踪，请先提交现有博客文件。');
  let destination, content, url;
  if (article) {
    const files = await fs.readdir(path.join(root, 'posts'));
    const ids = files.filter(f => /^article-\d+\.html$/.test(f)).map(f => Number(f.match(/\d+/)[0]));
    const latest = Math.max(0, ...ids);
    const template = await fs.readFile(path.join(root, 'posts', latest ? `article-${latest}.html` : 'hello-world.html'), 'utf8');
    destination = `posts/article-${latest + 1}.html`; content = articleHtml(draft, template); url = destination;
  } else {
    const slug = 'note-' + draft.id;
    destination = `wiki/${draft.options.category}/${slug}.md`; url = 'index.html#wiki/' + slug;
    const { meta, body } = parseFrontmatter(draft.wikiBody);
    // The current generator is intentionally simple: avoid quotes/newlines in metadata values.
    const oneLine = value => String(value || '').replace(/[\r\n]/g, ' ').replace(/^["']|["']$/g, '');
    content = ['---', 'title: ' + oneLine(draft.title), ...(draft.titleStyle ? ['title_style: ' + oneLine(draft.titleStyle)] : []), ...(draft.titleRuns?.length ? ['title_runs: ' + JSON.stringify(draft.titleRuns)] : []), 'group: ' + oneLine(draft.options.group || meta.group),
      'date: ' + oneLine(meta.date || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' })),
      'tags: ' + oneLine(meta.tags), 'order: ' + (Number.isFinite(Number(meta.order)) && meta.order !== '' ? Number(meta.order) : 100), '---', '', body].join('\n');
  }
  const files = [destination, ...draft.assets.map(a => a.path), index];
  for (const relative of files) {
    if (relative.split('/').includes('..') || path.isAbsolute(relative)) throw new Error('保存路径无效。');
    if (relative !== index && await exists(path.join(root, relative))) throw new Error('目标已存在，请重新预览以创建新文章。');
  }
  const previousIndex = await fs.readFile(path.join(root, index)).catch(() => null);
  const createdFiles = [];
  try {
    for (const [relative, buffer] of [[destination, Buffer.from(content)], ...draft.assets.map(a => [a.path, Buffer.from(a.data, 'base64')])]) {
      await fs.mkdir(path.dirname(path.join(root, relative)), { recursive: true });
      await fs.writeFile(path.join(root, relative), buffer, { flag: 'wx' }); createdFiles.push(relative);
    }
    await run(process.execPath, [article ? '_gen-data.js' : '_gen-wiki.js'], { cwd: root });
    const hashes = {};
    for (const file of files) hashes[file] = hash(await fs.readFile(path.join(root, file)));
    const branch = (await git(root, 'branch', '--show-current')).trim();
    const record = { id: draft.id, title: draft.title, target: draft.options.target, created: new Date().toISOString(), files, hashes, url, branch, commit: null, pushed: false };
    await writeRecord(root, record); return record;
  } catch (error) {
    // Roll back only files created by this operation; existing user work is untouched.
    for (const file of createdFiles) await fs.unlink(path.join(root, file)).catch(() => {});
    if (previousIndex) await fs.writeFile(path.join(root, index), previousIndex); else await fs.unlink(path.join(root, index)).catch(() => {});
    throw error;
  }
}
async function pushSaved(root, id, log = () => {}) {
  const record = await readRecord(root, id);
  if (record.pushed) return record;
  const branch = (await git(root, 'branch', '--show-current')).trim();
  if (!branch || branch !== record.branch) throw new Error('分支已改变，请切回保存文章时的分支再推送。');
  if (!(await git(root, 'remote', 'get-url', 'origin')).trim()) throw new Error('未设置 GitHub 远端 origin。');
  if (!record.commit) {
    if ((await git(root, 'diff', '--cached', '--name-only')).trim()) throw new Error('暂存区有其他修改，请先处理后再发布；面板不会提交这些内容。');
    for (const file of record.files) {
      if (hash(await fs.readFile(path.join(root, file))) !== record.hashes[file]) throw new Error(`保存后 ${file} 被修改，请先处理这些修改再发布。`);
    }
    log('正在提交本次发布的文件…');
    await git(root, 'add', '--', ...record.files);
    try {
      const noHooks = path.join(stateDir(root), 'no-hooks'); await fs.mkdir(noHooks, { recursive: true });
      await git(root, '-c', 'core.hooksPath=' + noHooks, 'commit', '-m', `Publish ${record.target === 'wiki' ? 'Wiki' : 'article'}: ${record.title}`, '--', ...record.files);
    } catch (error) {
      // These paths were unstaged before this attempt; preserve their worktree content.
      await git(root, 'restore', '--staged', '--', ...record.files).catch(() => {}); throw error;
    }
    record.commit = (await git(root, 'rev-parse', 'HEAD')).trim(); await writeRecord(root, record);
  }
  log('正在推送 GitHub…');
  try { await git(root, 'push', 'origin', branch); }
  catch (error) { throw new Error('已保存并提交，推送未完成。可点击“重试推送”。\n' + error.message); }
  log('正在核对远端提交…');
  const remote = (await git(root, 'ls-remote', 'origin', 'refs/heads/' + branch)).trim().split(/\s/)[0];
  const head = (await git(root, 'rev-parse', 'HEAD')).trim();
  if (remote !== head) throw new Error('推送后远端提交未匹配，请点击“重试推送”重新核对。');
  record.pushed = true; record.remoteCommit = remote; await writeRecord(root, record);
  log('GitHub 已收到提交。网站上线时间取决于 Cloudflare 的部署进度。'); return record;
}
module.exports = { git, saveDraft, pushSaved, listRecords, readRecord };
