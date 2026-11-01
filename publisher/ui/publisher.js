const $ = id => document.getElementById(id);
const token = document.querySelector('meta[name="publisher-token"]').content;
let config, selectedFile, draft, saved, busy = false, dirty = true, previewVersion = 0;
const target = () => document.querySelector('input[name="target"]:checked').value;
function status(message, type = '') { $('status').textContent = message; $('status').className = 'status ' + type; }
async function api(route, data) {
  const response = await fetch('/api/' + route, { method: data === undefined ? 'GET' : 'POST', headers: { 'X-Publisher-Token': token, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error || '操作失败，请重试。'); return result;
}
function buttons() {
  const enabled = !!selectedFile && !busy;
  $('preview').disabled = !enabled; $('save').disabled = !enabled || !!saved; $('publish').disabled = !enabled || !!saved?.pushed;
  document.querySelectorAll('input,select').forEach(input => { input.disabled = busy; });
  document.querySelectorAll('.record button, #refresh, #settingsSave').forEach(button => button.disabled = busy);
}
function invalidate() {
  dirty = true; saved = null; draft = null; previewVersion++; $('resultLink').hidden = true; $('previewState').textContent = '内容已变更，需重新预览';
  $('previewFrame').hidden = true; $('emptyPreview').hidden = false; buttons();
}
function categories() {
  const wiki = target() === 'wiki';
  const items = wiki ? config.wikiCategories : config.articleCategories.map(value => ({ value, label: value }));
  $('category').replaceChildren(...items.map(item => new Option(item.label, item.value)));
  if (!wiki) $('category').value = '碎碎念';
  $('yearField').hidden = wiki; $('articleFields').hidden = wiki; $('wikiFields').hidden = !wiki;
}
function options() { return { target: target(), category: $('category').value, title: $('title').value.trim(), year: $('year').value, lang: $('lang').value, form: $('form').value, group: $('group').value.trim() }; }
async function encode(file) {
  if (file.size > 70 * 1024 * 1024) throw new Error('文件超过 70 MB，请拆分后再上传。');
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onerror = () => reject(new Error('文件无法读取，请重新选择。')); reader.onload = () => resolve({ name: file.name, data: reader.result.split(',')[1] }); reader.readAsDataURL(file); });
}
async function preview() {
  if (!dirty && draft) return draft;
  if (!selectedFile) throw new Error('请先选择文件。');
  status('正在转换文件并准备预览…', 'working'); $('previewState').textContent = '正在转换…';
  const version = previewVersion;
  const upload = await encode(selectedFile); upload.attachments = await Promise.all([...$('attachments').files].map(encode));
  const result = await api('preview', { upload, options: options() });
  if (version !== previewVersion) throw new Error('文件或设置已改变，请重新预览。');
  draft = result; dirty = false; $('title').value = result.title;
  $('emptyPreview').hidden = true; $('previewFrame').hidden = false; $('previewFrame').src = result.preview;
  $('previewState').textContent = '当前文件的转换结果';
  $('formatNote').textContent = result.fonts.length ? '已保留 Word 字体：' + result.fonts.join('、') + '。阅读设备需安装相应字体。' : 'Markdown 公式会显示在预览中；原文件保持不变。';
  status('预览已生成。确认标题和分类后即可发布。'); return result;
}
async function execute(action) {
  if (busy) return; busy = true; buttons();
  try { await action(); } catch (error) { status(error.message, 'error'); if (!draft) $('previewState').textContent = '预览未完成'; }
  finally { busy = false; buttons(); }
}
async function save() {
  if (saved) return saved;
  const current = await preview(); status('正在保存内容并更新博客目录…', 'working');
  saved = await api('save', { id: current.id });
  $('resultLink').href = '/' + saved.url; $('resultLink').hidden = false;
  status('已保存到本地博客，尚未推送 GitHub。'); await refresh(); return saved;
}
async function push(id) {
  $('logs').replaceChildren(); status('正在发布，请稍候…', 'working');
  const task = await api('push', { id });
  for (;;) {
    const job = await api('jobs/' + task.id);
    $('logs').replaceChildren(...job.messages.map(message => { const li = document.createElement('li'); li.textContent = message; return li; }));
    if (job.status === 'done') { if (saved?.id === id) saved = job.record; status('已推送 GitHub。Cloudflare 正在接手网站部署。'); await refresh(); return; }
    if (job.status === 'failed') { await refresh(); throw new Error(job.error); }
    await new Promise(resolve => setTimeout(resolve, 700));
  }
}
async function refresh() {
  config = await api('config');
  $('connection').textContent = '本地已连接 · ' + (config.branch || '未选择分支');
  $('repository').textContent = config.root + ' · ' + config.remote;
  $('pandocPath').value = config.tools.pandoc; $('pythonPath').value = config.tools.python;
  $('groups').replaceChildren(...config.groups.map(value => new Option(value, value)));
  $('records').replaceChildren(...config.records.map(record => {
    const row = document.createElement('div'); row.className = 'record';
    const info = document.createElement('div'), a = document.createElement('a'), meta = document.createElement('div');
    a.className = 'record-title'; a.textContent = record.title; a.href = '/' + record.url; a.target = '_blank'; a.rel = 'noopener';
    meta.className = 'record-meta'; meta.textContent = (record.target === 'wiki' ? 'Wiki' : '文章') + ' · ' + new Date(record.created).toLocaleString('zh-CN') + ' · ' + (record.pushed ? '已推送 GitHub' : record.commit ? '已提交，待推送' : '已保存，待发布');
    info.append(a, meta); row.append(info);
    if (!record.pushed) { const button = document.createElement('button'); button.className = 'secondary'; button.textContent = record.commit ? '重试推送' : '推送 GitHub'; button.disabled = busy; button.onclick = () => execute(() => push(record.id)); row.append(button); }
    return row;
  }));
}
async function choose(file) {
  if (!file) return;
  if (!/\.(md|markdown|docx|txt)$/i.test(file.name)) { status('请选择 Markdown、Word（.docx）或 TXT 文件。', 'error'); return; }
  selectedFile = file; $('title').value = ''; $('fileLabel').textContent = file.name; $('fileHint').textContent = (file.size / 1024).toFixed(1) + ' KB · 原文件不会被修改';
  $('logs').replaceChildren(); invalidate(); await execute(preview);
}
$('file').addEventListener('change', () => choose($('file').files[0]));
$('attachments').addEventListener('change', () => { $('attachmentCount').textContent = '已选择 ' + $('attachments').files.length + ' 张配图'; invalidate(); });
for (const event of ['dragover', 'dragleave', 'drop']) $('dropZone').addEventListener(event, e => { e.preventDefault(); $('dropZone').classList.toggle('dragging', event === 'dragover'); if (event === 'drop' && !busy) choose(e.dataTransfer.files[0]); });
document.querySelectorAll('[name="target"]').forEach(input => input.addEventListener('change', () => { categories(); invalidate(); }));
for (const id of ['title', 'category', 'year', 'lang', 'form', 'group']) $(id).addEventListener('input', invalidate);
$('preview').onclick = () => execute(preview);
$('save').onclick = () => execute(save);
$('publish').onclick = () => execute(async () => { const record = await save(); await push(record.id); });
$('refresh').onclick = () => execute(refresh);
$('settingsSave').onclick = () => execute(async () => { await api('settings', { pandoc: $('pandocPath').value.trim(), python: $('pythonPath').value.trim() }); await refresh(); invalidate(); status('本机程序路径已保存。'); });
$('year').value = new Date().getFullYear();
refresh().then(() => { categories(); buttons(); }).catch(error => status('连接失败：' + error.message + '。请重新双击启动器。', 'error'));
