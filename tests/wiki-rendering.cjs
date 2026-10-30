// Browser regression checks. Requires Playwright and a local HTTP preview.
// PLAYWRIGHT_MODULE can point to a shared Playwright installation.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const base = process.env.BLOG_URL || 'http://127.0.0.1:3000';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const failures = [];
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  async function check(name, action) {
    try { await action(); console.log('PASS ' + name); }
    catch (error) { failures.push(name + ': ' + error.message); console.error('FAIL ' + failures.at(-1)); }
  }
  async function visit(slug) {
    await page.goto(base + '/index.html#wiki/' + slug, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('#wikiContent') && !document.querySelector('#wikiContent .wiki-state'));
  }
  const fixture = String.raw`# Rendering regression

**勘误表（$\text{errata}$）**尤其关键。**关键：**正文，**$x_i$：**下标。

中文**加粗**正常，English **bold** stays bold, ***中文斜粗*** works.

Inline: $x_i + \frac{1}{2}$ and \(a_b + \frac{2}{3}\).

$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$

\[ E = mc^2 \]

\$100 is a price. \*\*escaped stars\*\* should remain literal.

INLINE_CODE_FIXTURE

~~~tex
$code_unchanged$ **literal** \(not_math\)
~~~

$\text{Preserved by maiding\_blue, Department of Electronic Information and Science, Nanjing University}$

<img src=x onerror="window.__unsafe = true">
`.replace('INLINE_CODE_FIXTURE', '`$code_unchanged$ **literal**`');
  await page.route('**/wiki/__rendering_fixture__.md', route => route.fulfill({ contentType: 'text/markdown', body: fixture }));
  try {
    await visit('nova-nansu-lecture-notes');
    await check('Chinese punctuation does not expose bold delimiters', async () => {
      const item = page.locator('#wikiContent li').filter({ hasText: '勘误表 errata' }).first();
      assert(!(await item.innerText()).includes('**'));
      assert((await item.locator('strong').allTextContents()).some(text => text.includes('勘误表（errata）')));
      if (process.env.BLOG_SCREENSHOT_DIR) await item.screenshot({ path: path.join(process.env.BLOG_SCREENSHOT_DIR, 'wiki-bold-fixed.png') });
    });
    await visit('intro');
    for (const width of [1440, 900, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await check('Introduction text stays inside its reading panel at ' + width + 'px', async () => {
        assert(await page.locator('#wikiContent').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      });
      if (width === 1440 && process.env.BLOG_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.BLOG_SCREENSHOT_DIR, 'wiki-intro-fixed.png') });
    }
    await page.evaluate(() => renderWikiContent({ title: 'Rendering regression', catLabel: 'Test', tags: [], reading: '', src: 'wiki/__rendering_fixture__.md' }));
    await check('Both dollar and backslash math delimiters render', async () => {
      assert.equal(await page.locator('#wikiContent .katex-display').count(), 2);
      assert(await page.locator('#wikiContent .katex').count() >= 5);
      assert.equal(await page.locator('.katex-error, .katex-parse-error').count(), 0);
    });
    await check('Text-only math wraps; real equations stay mathematical', async () => {
      assert(await page.locator('#wikiContent').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      assert.equal(await page.locator('#wikiContent .katex-display').first().evaluate(el => getComputedStyle(el).display), 'block');
    });
    await check('Code and escaped Markdown remain literal', async () => {
      assert.equal(await page.locator('#wikiContent pre code').textContent(), '$code_unchanged$ **literal** \\(not_math\\)\n');
      assert.equal(await page.locator('#wikiContent p code').textContent(), '$code_unchanged$ **literal**');
      assert((await page.locator('#wikiContent').innerText()).includes('$100'));
      assert((await page.locator('#wikiContent').innerText()).includes('**escaped stars**'));
    });
    await check('HTML stays sanitized', async () => {
      assert.equal(await page.locator('#wikiContent [onerror]').count(), 0);
      assert.equal(await page.evaluate(() => !!window.__unsafe), false);
    });
    const docs = await page.evaluate(() => BLOG_WIKI.map(({ slug }) => slug));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const slug of docs) {
        await visit(slug);
        await check('Wiki reading panel fits: ' + slug + ' at ' + width + 'px', async () => {
          assert(await page.locator('#wikiContent').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
          assert.equal(await page.locator('#wikiContent .katex-error, #wikiContent .katex-parse-error').count(), 0);
        });
      }
    }
    await check('No runtime errors', async () => assert.deepEqual(runtimeErrors, []));
  } finally { await browser.close(); }
  assert.equal(failures.length, 0, failures.join('\n'));
})().catch(error => { console.error(error); process.exitCode = 1; });
