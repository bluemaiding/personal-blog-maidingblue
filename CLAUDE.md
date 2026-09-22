# Bluemaiding Blog

Personal blog hosted on Cloudflare Pages at `bluemaiding.pages.dev`.

## Tech Stack
- Pure HTML + CSS + JavaScript (no framework, no build step)
- CSS variables for theming (light/dark mode with localStorage persistence)
- Fonts: Inter, Noto Serif SC, JetBrains Mono (Google Fonts)

## Structure
```
index.html          — Home + 单页应用(SPA)：文章/项目/联系 为 #page-* 区段；文章列表含
                       时间/语种/文体 三视图 + 分类筛选，直达用 #articles（自带内联 CSS/JS）
                       Wiki 为 #page-wiki 区段（导航「Wiki」），直达 #wiki，正文走 #wiki/<slug>
about.html          — 关于页（独立页，使用 css/style.css + js/main.js）
projects.html       — 项目页（独立页）
css/style.css       — about / projects / 文章详情页 的样式
js/main.js          — 主题切换、项目渲染、导航/滚动/移动菜单（供 about/projects/文章详情页）
js/articles-data.js — 文章列表数据（由 _gen-data.js 从 posts/*.html 自动生成，唯一数据源）
js/wiki-data.js     — Wiki 目录数据（由 _gen-wiki.js 从 wiki/**/*.md 自动生成）
_gen-data.js        — 从文章页提取元数据 → js/articles-data.js
_gen-wiki.js        — 扫描 wiki/<分类>/**/*.md 的 frontmatter + 字数 → js/wiki-data.js
wiki/               — Wiki 源文件(.md)：circuits=电子电路 / it=信息技术 / basics=基础入门帖；
                       分类下的子目录名 = 侧栏分组名
_reading.js         — 给各文章页 .article-meta 注入「字数 · 阅读时间」(node _reading.js apply)
_PULL_ARTICLE.md    — 从本地 docx 拉文章进博客的完整流程（pandoc + 弯引号还原 + 同步）
posts/              — 文章详情页（hello-world.html 可作模板）
_redirects          — (可选) Cloudflare SPA 回退 /* -> /index.html 200
```

## Key Design Decisions
- 混合架构：index.html 是 SPA（文章列表已并入其 `#page-articles`，hash 路由 `#articles` 直达）；about / projects / 文章详情页 为独立多页，共享 `css/style.css` + `js/main.js`
- 文章数据单一来源：`_gen-data.js` 从每个 `posts/article-*.html` 的 `.article-meta` 提取 年份/类别/文体/语言 → `js/articles-data.js`（修改文章后重跑即可，避免多处数据漂移）
- 字数/阅读时间直接 baked 进各文章页 `.article-meta`（中文 300 字/分钟、英文 200 词/分钟）
- Wiki 是「运行时渲染」：`.md` 原样发布，页面用 CDN 的 marked + DOMPurify + highlight.js + KaTeX 现场渲染，
  所以没有 md→html 构建步骤；`_gen-wiki.js` 只生成目录（标题/分组/字数）。首次进 Wiki 才注入这些 CDN 依赖，
  Verilog/VHDL 语言包单独补（highlight.js common 包不含 HDL）。本地预览必须用 http（`npx serve`），
  直接 file:// 打开时浏览器 fetch 不到 .md
- 数学式（`$…$` / `$$…$$`）在交给 marked 之前先摘成 `%%MATHn%%` 占位、渲染后回填再交给 KaTeX，
  否则 marked 会把 `$x_i$` 的 `_` 当斜体、把 `\` 当转义；代码块内的 `$` 不参与
- Wiki 顶部分类 tab 用 `.wiki-tab`（刻意不复用 `.category-tab` 的类名绑定：`initCategoryTabs()` 全局选中
  `.category-tab` 并写文章筛选状态），样式与 `.category-tab` 共享同一组规则
- hash 路由支持二级段：`#wiki/<slug>` 深链到具体条目；slug 非 ASCII 文件名退化为 `<分类>-N`
- 项目区一律实时取 GitHub API，不硬编码（原先的假数据已删：不存在的 ESP32 Smart Home、编造的 ★8/fork2、
  已改名的 website-personally-use、404 的 data-scripts、链接为 # 的「个人知识库」）；首页预览挑 `CONFIG.pinned`
- `backdrop-filter: blur(12px)` nav glass effect
- IntersectionObserver for scroll fade-in animations
- Mobile hamburger menu at 768px breakpoint
- External links (GitHub, Twitter, Email) open in new tabs with `target="_blank"`

## External Links (configured)
- GitHub: https://github.com/bluemaiding
- X (Twitter): https://x.com/bluemaiding
- Email: mailto:bluemaiding@126.com
- All external links use `target="_blank" rel="noopener noreferrer"`

## How to Edit
- **Personal info**: edit name/bio/skills in index.html
- **Add a post**: 在 `posts/` 新建 `article-X.html`（可复制 hello-world.html），填好 `<div class="article-meta">` 的 年份/类别/文体/语言；然后 `node _reading.js apply`（注入字数）+ `node _gen-data.js`（刷新列表数据）
- **Add a wiki entry**: 把 `.md` 放进 `wiki/circuits|it|basics/`（= 电子电路/信息技术/基础入门帖），可再建子目录当分组；
  文件开头可选 frontmatter `title / group / date / order / tags`（不写也能渲染）；然后 `node _gen-wiki.js` 刷新目录。
  细节与示例见 `wiki/basics/wiki-writing-guide.md`（上线后可删）
- **Pull a post from local docx**: 按 `_PULL_ARTICLE.md` 走（pandoc 转换 → 还原中文弯引号 → `node _reading.js apply` → `node _gen-data.js`）
- **Add a project**: 不用改代码——项目卡片全部实时来自 GitHub API（`users/bluemaiding/repos`），在 GitHub 建仓库即自动上站。
  首页预览挑 `CONFIG.pinned`（index.html）里列的仓库名，仓库改名后要同步；`projects.html` 由 js/main.js 渲染全部仓库
- **New article page**: copy posts/hello-world.html as template
- **Change colors**: index 内联 CSS 用自己的变量；about/projects/文章页 用 style.css 的 `:root` / `[data-theme="dark"]`
- **Change social links**: replace `github.com/bluemaiding`, `x.com/bluemaiding`, `bluemaiding@126.com` across all files

## Deploy
1. Push to GitHub
2. Cloudflare Pages → connect repo → no build command → output dir `/`
3. Custom domain: `bluemaiding.pages.dev`

## Local Preview
```bash
cd blog
npx serve . -l 3000
```
