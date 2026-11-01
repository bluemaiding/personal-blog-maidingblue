const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { convertUpload, discoverTools } = require('../publisher/content.cjs');
const { saveDraft, pushSaved, readRecord } = require('../publisher/repository.cjs');
const source = path.resolve(__dirname, '..');
const git = (root, ...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });
const upload = (name, text) => ({ name, data: Buffer.from(text).toString('base64') });
const options = { target: 'article', category: '碎碎念', year: '2026', lang: 'zh', form: '现代文' };
async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'blog-publisher-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const root = path.join(dir, 'blog'); await fs.mkdir(root);
  for (const name of ['posts', 'js', 'wiki']) await fs.mkdir(path.join(root, name));
  for (const name of ['_gen-data.js', '_gen-wiki.js']) await fs.copyFile(path.join(source, name), path.join(root, name));
  await fs.copyFile(path.join(source, 'posts/article-67.html'), path.join(root, 'posts/article-1.html'));
  await fs.writeFile(path.join(root, '.gitignore'), '.publisher-state/\n');
  git(root, 'init', '-b', 'main'); git(root, 'config', 'user.name', 'Publisher test'); git(root, 'config', 'user.email', 'publisher@example.invalid');
  git(root, 'add', '.'); git(root, '-c', 'core.hooksPath=NUL', 'commit', '-m', 'Fixture');
  const remote = path.join(dir, 'remote.git'); git(root, 'init', '--bare', remote); git(root, 'remote', 'add', 'origin', remote);
  git(root, '-c', 'http.proxy=', 'push', '-u', 'origin', 'main');
  return { dir, root, remote };
}
test('Markdown keeps title, all math delimiters and literal code; does not repeat title', async () => {
  const draft = await convertUpload(source, upload('测试.md', String.raw`# 我的公式

行内 $x_i$ 和 \(a_b\)。

$$\sum_{i=1}^n i$$

\[ E=mc^2 \]

\`PLACEHOLDER\`
`.replace('\\`PLACEHOLDER\\`', () => '`$literal_code$`')), options);
  assert.equal(draft.title, '我的公式');
  assert.match(draft.body, /x_i/); assert.match(draft.body, /a_b/); assert.match(draft.body, /E=mc/);
  assert.match(draft.body, /<code>\$literal_code\$<\/code>/);
  assert.doesNotMatch(draft.body, /<h1[^>]*>我的公式/);
});
test('save article only touches its files; retry push never duplicates the post or commit', async t => {
  const { root, remote } = await fixture(t);
  await fs.writeFile(path.join(root, 'unrelated.txt'), 'Unrelated local work');
  const draft = await convertUpload(root, upload('新文章.md', '# 新文章\n\n正文 $x_i$。'), options);
  const record = await saveDraft(root, draft);
  assert.equal(record.url, 'posts/article-2.html');
  const html = await fs.readFile(path.join(root, record.url), 'utf8');
  assert.match(html, /article-math\.js/); assert.match(html, /碎碎念/);
  const data = await fs.readFile(path.join(root, 'js/articles-data.js'), 'utf8'); assert.match(data, /新文章/);
  git(root, 'remote', 'set-url', 'origin', path.join(remote, 'missing'));
  await assert.rejects(pushSaved(root, record.id, () => {}));
  const committed = git(root, 'rev-parse', 'HEAD').trim();
  assert.equal((await readRecord(root, record.id)).commit, committed);
  git(root, 'remote', 'set-url', 'origin', remote);
  const done = await pushSaved(root, record.id, () => {});
  assert.equal(done.pushed, true); assert.equal(git(root, 'rev-parse', 'HEAD').trim(), committed);
  assert.match(git(root, 'status', '--porcelain'), /unrelated.txt/);
  assert.equal(git(root, 'show', '--format=', '--name-only', 'HEAD').includes('unrelated.txt'), false);
  assert.equal(git(root, 'ls-remote', 'origin', 'refs/heads/main').split(/\s/)[0], committed);
});
test('Wiki saves math source, selected category, group, and stable slug', async t => {
  const { root } = await fixture(t);
  const raw = '# 数学笔记\n\n$$x_i^2$$\n';
  const draft = await convertUpload(root, upload('中文文件.md', raw), { ...options, target: 'wiki', category: 'it', group: '学习笔记' });
  const record = await saveDraft(root, draft);
  const wikiFile = record.files.find(f => f.endsWith('.md'));
  assert.match(wikiFile, /^wiki\/it\/note-[a-z0-9-]+\.md$/);
  assert.match(await fs.readFile(path.join(root, wikiFile), 'utf8'), /\$\$x_i\^2\$\$/);
  assert.match(await fs.readFile(path.join(root, 'js/wiki-data.js'), 'utf8'), /学习笔记/);
});
test('rejects invalid categories, path escapes and missing images with actionable messages', async () => {
  await assert.rejects(convertUpload(source, upload('../evil.md', '# 标题'), options), /文件名/);
  await assert.rejects(convertUpload(source, upload('ok.md', '# 标题'), { ...options, target: 'wiki', category: '../evil' }), /分类/);
  await assert.rejects(convertUpload(source, upload('ok.md', '# 图片\n\n![图](missing.png)'), options), /missing.png/);
});
test('staged unrelated edits block commit; changed saved content also blocks commit', async t => {
  const { root } = await fixture(t);
  const draft = await convertUpload(root, upload('ok.md', '# 标题\n\n正文'), options);
  const record = await saveDraft(root, draft);
  await fs.writeFile(path.join(root, 'other.txt'), 'keep'); git(root, 'add', 'other.txt');
  await assert.rejects(pushSaved(root, record.id, () => {}), /暂存/);
  git(root, 'restore', '--staged', 'other.txt');
  await fs.appendFile(path.join(root, record.url), '\nchanged');
  await assert.rejects(pushSaved(root, record.id, () => {}), /修改/);
});
test('DOCX preserves inherited, theme, paragraph and individual run fonts (article and Wiki)', async t => {
  const tools = discoverTools();
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'publisher-docx-')); t.after(() => fs.rm(tmp, { recursive: true, force: true }));
  const file = path.join(tmp, 'fonts.docx');
  execFileSync(tools.python, [path.join(__dirname, 'publisher-docx-fixture.py'), file], { windowsHide: true });
  const doc = { name: 'fonts.docx', data: (await fs.readFile(file)).toString('base64') };
  const article = await convertUpload(source, doc, options);
  assert.equal(article.title, '原字体标题');
  assert.match(article.titleStyle, /楷体/);
  assert.match(article.body, /宋体/); assert.match(article.body, /仿宋/); assert.match(article.body, /Courier New/);
  assert.match(article.body, /Times New Roman/); assert.match(article.body, /font-family:/);
  assert.doesNotMatch(article.body, /BLOGFONT/);
  const wiki = await convertUpload(source, doc, { ...options, target: 'wiki', category: 'skills' });
  assert.match(wiki.wikiBody, /font-family:/); assert.match(wiki.wikiBody, /仿宋/);
});
