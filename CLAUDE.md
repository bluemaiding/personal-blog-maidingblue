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
about.html          — 关于页（独立页，使用 css/style.css + js/main.js）
projects.html       — 项目页（独立页）
css/style.css       — about / projects / 文章详情页 的样式
js/main.js          — 主题切换、项目渲染、导航/滚动/移动菜单（供 about/projects/文章详情页）
js/articles-data.js — 文章列表数据（由 _gen-data.js 从 posts/*.html 自动生成，唯一数据源）
_gen-data.js        — 从文章页提取元数据 → js/articles-data.js
_reading.js         — 给各文章页 .article-meta 注入「字数 · 阅读时间」(node _reading.js apply)
posts/              — 文章详情页（hello-world.html 可作模板）
_redirects          — (可选) Cloudflare SPA 回退 /* -> /index.html 200
```

## Key Design Decisions
- 混合架构：index.html 是 SPA（文章列表已并入其 `#page-articles`，hash 路由 `#articles` 直达）；about / projects / 文章详情页 为独立多页，共享 `css/style.css` + `js/main.js`
- 文章数据单一来源：`_gen-data.js` 从每个 `posts/article-*.html` 的 `.article-meta` 提取 年份/类别/文体/语言 → `js/articles-data.js`（修改文章后重跑即可，避免多处数据漂移）
- 字数/阅读时间直接 baked 进各文章页 `.article-meta`（中文 300 字/分钟、英文 200 词/分钟）
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
- **Add a project**: add entry to `projects` array in js/main.js
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
