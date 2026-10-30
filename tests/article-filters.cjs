// Run against a local preview with Playwright; configuration matches wiki-rendering.cjs.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.BLOG_URL || 'http://127.0.0.1:3000';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const checks = [];
  async function check(name, action) {
    try { await action(); console.log('PASS ' + name); }
    catch (error) { checks.push(name + ': ' + error.message); console.error('FAIL ' + checks.at(-1)); }
  }
  try {
    await page.goto(base + '/index.html#articles', { waitUntil: 'networkidle' });
    const articles = await page.evaluate(() => BLOG_ARTICLES);
    const visibleUrls = () => page.locator('#postsList .article-item').evaluateAll(items => items.map(item => item.getAttribute('href')).sort());
    const expectArticles = async predicate => assert.deepEqual(await visibleUrls(), articles.filter(predicate).map(a => a.url).sort());
    await check('Every category is directly visible, including 碎碎念', async () => {
      assert.equal(await page.locator('#page-articles .category-dropdown').count(), 0);
      for (const category of [...new Set(articles.map(a => a.category)), '碎碎念', '杂文', '技术性文档']) {
        assert(await page.locator('.category-tab').filter({ hasText: new RegExp('^' + category + '$') }).isVisible());
      }
      await expectArticles(() => true);
    });
    // Assert the selector exists before attempting interactions, to fail promptly on the old UI.
    const selectorsReady = await page.locator('#articleLanguage, #articleForm').count() === 2;
    await check('Language and form have independent dropdown options', async () => {
      assert(selectorsReady);
      assert.deepEqual(await page.locator('#articleLanguage option').evaluateAll(items => items.map(i => i.value)), ['all', 'zh', 'en']);
      assert.deepEqual(await page.locator('#articleForm option').evaluateAll(items => items.map(i => i.value)), ['all', 'modern', 'classical']);
    });
    if (selectorsReady) {
      await check('English alone excludes every Chinese article', async () => {
        await page.locator('#articleLanguage').selectOption('en');
        await expectArticles(a => a.lang === 'en');
        assert((await page.locator('#articlesSubtitle').innerText()).includes(String(articles.filter(a => a.lang === 'en').length)));
      });
      await check('Chinese alone excludes every English article', async () => {
        await page.locator('#articleLanguage').selectOption('zh');
        await expectArticles(a => a.lang === 'zh');
      });
      await check('Category, language and form combine as an intersection', async () => {
        await page.locator('.category-tab[data-cat="古诗词"]').click();
        await page.locator('#articleForm').selectOption('classical');
        await expectArticles(a => a.category === '古诗词' && a.lang === 'zh' && a.classical);
        assert.equal(await page.locator('.category-tab[data-cat="古诗词"]').getAttribute('aria-pressed'), 'true');
      });
      await check('Modern and classical prose can each be selected alone', async () => {
        await page.getByRole('button', { name: '重置筛选' }).click();
        await page.locator('#articleForm').selectOption('modern');
        await expectArticles(a => !a.classical);
        await page.locator('#articleForm').selectOption('classical');
        await expectArticles(a => a.classical);
        await page.locator('.category-tab[data-cat="古诗词"]').click();
      });
      await check('Empty intersections show an honest empty state', async () => {
        await page.locator('#articleLanguage').selectOption('en');
        await expectArticles(a => a.category === '古诗词' && a.lang === 'en' && a.classical);
        assert(await page.locator('#postsList .articles-empty').isVisible());
      });
      await check('Reset clears all three filters and restores the full archive', async () => {
        await page.getByRole('button', { name: '重置筛选' }).click();
        await expectArticles(() => true);
        assert.equal(await page.locator('#articleLanguage').inputValue(), 'all');
        assert.equal(await page.locator('#articleForm').inputValue(), 'all');
        assert.equal(await page.locator('.category-tab.active').getAttribute('data-cat'), 'all');
      });
      await check('New 碎碎念 category is selectable without reclassifying existing articles', async () => {
        await page.locator('.category-tab[data-cat="碎碎念"]').click();
        await expectArticles(a => a.category === '碎碎念');
        assert(await page.locator('#postsList .articles-empty').isVisible());
        await page.getByRole('button', { name: '重置筛选' }).click();
      });
      await check('Selections survive leaving and returning to the archive', async () => {
        await page.locator('#articleLanguage').selectOption('en');
        await page.locator('#navLinks [data-page="home"]').click();
        await page.locator('#navLinks [data-page="articles"]').click();
        await expectArticles(a => a.lang === 'en');
      });
      for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        await check('All categories and filters remain visible at ' + width + 'px', async () => {
          assert(await page.locator('#articleLanguage').isVisible());
          assert(await page.locator('#articleForm').isVisible());
          assert(await page.locator('.category-tab[data-cat="碎碎念"]').isVisible());
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        });
      }
    }
    await check('No browser runtime errors', async () => assert.deepEqual(errors, []));
  } finally { await browser.close(); }
  assert.equal(checks.length, 0, checks.join('\n'));
})().catch(error => { console.error(error); process.exitCode = 1; });
