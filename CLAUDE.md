# Bluemaiding Blog

Personal blog hosted on Cloudflare Pages at `bluemaiding.pages.dev`.

## Tech Stack
- Pure HTML + CSS + JavaScript (no framework, no build step)
- CSS variables for theming (light/dark mode with localStorage persistence)
- Fonts: Inter, Noto Serif SC, JetBrains Mono (Google Fonts)

## Structure
```
index.html          — Home page (Hero + latest posts preview)
about.html          — About page (avatar, bio, skills, contact)
posts.html          — Posts listing page
projects.html       — Projects showcase page
css/style.css       — All styles
js/main.js          — Renders posts/projects from inline data arrays, theme toggle, mobile menu
posts/              — Individual article pages (hello-world.html as template)
_redirects          — Cloudflare Pages SPA routing: /* -> /index.html 200
```

## Key Design Decisions
- Multi-page structure: Home, About, Posts, Projects are separate pages with shared nav
- Data-driven content: posts and projects defined as arrays in main.js
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
- **Add a post**: add entry to `posts` array in js/main.js
- **Add a project**: add entry to `projects` array in js/main.js
- **New article page**: copy posts/hello-world.html as template
- **Change colors**: edit CSS variables in `:root` and `[data-theme="dark"]` in style.css
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
