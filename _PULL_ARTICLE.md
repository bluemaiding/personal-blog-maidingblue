# 从本地文档 Pull 文章到博客

把 docx（或 txt/md）转成博客文章页 `posts/article-N.html` 并同步主页。
作者文章通常存在 `D:\Blue\G. In The Lines\<年份>\` 下（docx + pdf）。

## 流程（约 4 步）

```bash
# 1) 查下一个编号（当前最新是 article-66，下一个是 67）
ls posts/ | grep -oP 'article-\d+' | sort -t- -k2 -n | tail -1

# 2) docx -> html（pandoc），临时文件放项目根
pandoc "D:\Blue\G. In The Lines\2026年\文件名.docx" -o _tmp.html
```

3) 读 `_tmp.html` 拿正文，复制最新一篇 article 建 `posts/article-N.html`，改：
   - `<title>` / `<meta name="description">` / `<h1 class="article-title">`
   - `.article-meta` 五段：`年份 · 分类 · 文体 · 语种`（字数/时间由脚本注入，不用手写）
   - 正文放进 `<article class="article-content">`

4) 同步 + 清理（顺序固定）：

```bash
node _reading.js apply   # 注入「字数 · 阅读时间」到 .article-meta
node _gen-data.js        # 刷新 js/articles-data.js → 主页列表自动更新
rm -f _tmp.html
```

## meta 字段约定

- **分类**（第二个 span）候选：小说 / 作文 / 古诗词 / 随笔 / 散文 / 学术性论文 / 现代诗 / 年度总结 / 纪念
  - 读后感/读书笔记 → **随笔**
- **文体**（第三个 span）：现代文 / 文言文（文言文会触发主页 classical 标识）
- **语种**（第四个 span）：中文 / English（English 前缀触发 en）
- 编号需是整数，无 gaps 也没关系（_gen-data 按 id 降序排，最新在最前）

## 保留原文样式（重要）

- pandoc 输出保留 `<em>`/`<strong>`，直接照搬即可（如斜体署名、外文）
- **中文弯引号坑**：docx 里的弯引号 `“…”` 经 pandoc 会变成直引号 `"`。需在正文里成对还原（脚本已避开 `<article>` 标签属性）：

```python
python -c "
import io, re
fp = 'posts/article-N.html'
s = io.open(fp, encoding='utf-8').read()
start = s.index('>', s.index('<article class=\"article-content\"')) + 1
end = s.index('</article>', start)
n = 0
def repl(m):
    global n; n += 1
    return '“' if n % 2 else '”'
s = s[:start] + re.sub('\"', repl, s[start:end]) + s[end:]
io.open(fp, 'w', encoding='utf-8').write(s)
print(n // 2, '对弯引号还原')
"
```

## 验证

```bash
node _reading.js 2>/dev/null | grep article-N    # 字数/时间（应等于页面 meta）
python -c "import io;s=io.open('posts/article-N.html',encoding='utf-8').read();print('“',s.count('“'),' ”',s.count('”'))"  # 两数相等=配对正确
npx serve . -l 3000                              # 预览 http://localhost:3000/posts/article-N.html
```

## 依赖

- pandoc（Windows 下已装于 `/d/软件安装/Pandoc/pandoc`）
- Node（跑 `_reading.js` / `_gen-data.js`）
