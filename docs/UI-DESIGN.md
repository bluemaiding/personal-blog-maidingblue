# Spring notebook UI

The blog uses a pale green and apricot palette with blue ink and white text on blue actions. The homepage is a notebook spread: an introduction beside a portrait card linking to articles, the Wiki, and photographs.

## Shared palette

| Role | Color |
| --- | --- |
| Garden background | `#e5efdb` |
| Apricot highlights | `#f8dcc3` |
| Paper | `#fffdf7` |
| Heading ink | `#234f78` |
| Actions | `#2e6394` |
| Supporting text | `#4c6a83` |

`css/garden.css` owns the shared visual system. The original page styles are retained in `@layer legacy`; the shared stylesheet takes precedence. `index.html` and `memory.html` load it directly, while the standalone article, about, and project pages receive it through `css/style.css`.

## Reading and navigation

- Keep the existing title, Chinese body, English body, translation, and metadata font roles. English reading text keeps Times New Roman first.
- Keep navigation links visible on narrow screens. Article directories appear above the reading surface on mobile; Wiki groups start expanded.
- Article categories are flat buttons, including 碎碎念; additional categories in generated article data appear automatically. Independent native dropdowns filter language and form, combined with category as an intersection. Results stay in chronological groups. Reset clears all three filters; empty categories stay empty until real articles are added. Verify with `node tests/article-filters.cjs` using the same Playwright configuration as the Wiki suite.
- Keep actual equations as KaTeX. Older Wiki notes wrap ordinary terms in inline or display `\text{...}`; recognized text-only wrappers become wrapping text spans at render time. Source Markdown stays intact. Both dollar and backslash math delimiters are protected before Markdown parsing. A scoped inline extension handles bold text beside Chinese punctuation without rewriting code or escaped Markdown.
- Default standalone pages to the light palette, preserving explicit saved dark preferences and the theme switch.
- Respect reduced motion, show keyboard focus, allow photo-page zoom, and label contact fields.

## Verification

Use an HTTP server, for example `python -m http.server 3000 --bind 127.0.0.1`. Browser checks cover homepage routes, archive category and language filters, Wiki layout and actual equations, article font roles and theme switching, gallery navigation, and horizontal overflow at desktop and narrow mobile widths. Screenshots and the browser verification script for this revision are saved in the chat's visualization directory, outside the deployed site.

Run the Wiki regression suite with `node tests/wiki-rendering.cjs` while the HTTP preview is running. It requires Playwright and Chrome; set `PLAYWRIGHT_MODULE` to a shared installation path if needed, `PLAYWRIGHT_CHANNEL` to select another installed browser, and `BLOG_URL` to use another preview address. It reproduces Chinese bold punctuation, checks the introduction at five widths, checks all Wiki entries at desktop and mobile sizes, and exercises both math delimiter families, code preservation, and HTML sanitization.

Content generation and deployment remain as described in `CLAUDE.md`: the existing article/Wiki generators and Cloudflare static hosting still apply. UI edits do not require a build step.
