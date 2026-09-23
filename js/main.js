/**
 * Bluemaiding - Personal Blog
 * Main JavaScript
 */

// ========================================
// Data - Posts & Projects
// ========================================

const posts = [
    {
        id: 1,
        title: '开始我的数字花园',
        excerpt: '在这个信息爆炸的时代，我决定搭建一个属于自己的数字花园。这里没有算法推荐，没有流量焦虑，只有纯粹的文字和思考。',
        date: '2026-06-08',
        tags: ['随笔', '博客'],
        url: 'posts/hello-world.html'
    }
];

// ========================================
// Render Projects — 实时从 GitHub API 取真实仓库，不硬编码
// ========================================

const GITHUB_USER = 'bluemaiding';
const PROJECT_ICONS = { HTML: '🧩', CSS: '🎨', C: '🔌', 'C++': '🔌', Python: '🐍', Dart: '📱', JavaScript: '📦' };

function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function projectsState(msg) {
    return `<div style="grid-column:1/-1;text-align:center;padding:2.5rem 1rem;color:var(--text-tertiary)">${msg}</div>`;
}

async function renderProjects() {
    if (!projectsList) return;
    projectsList.innerHTML = projectsState('正在从 GitHub 加载仓库列表…');

    try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const repos = await res.json();
        if (!Array.isArray(repos) || !repos.length) throw new Error('没有公开仓库');

        projectsList.innerHTML = repos.map(repo => {
            const tech = [repo.language, ...(repo.topics || [])].filter(Boolean);
            return `
        <div class="project-card">
            <div class="project-icon">${PROJECT_ICONS[repo.language] || '📦'}</div>
            <h3 class="project-name">${esc(repo.name)}</h3>
            <p class="project-desc">${esc(repo.description || '暂无描述')}</p>
            <div class="project-tech">
                ${(tech.length ? tech : ['GitHub']).map(t => `<span>${esc(t)}</span>`).join('')}
            </div>
            <div class="project-links">
                <a href="${esc(repo.html_url)}" class="project-link" target="_blank" rel="noopener noreferrer">
                    GitHub ★${repo.stargazers_count} →
                </a>
            </div>
        </div>`;
        }).join('');
    } catch (err) {
        projectsList.innerHTML = projectsState(`GitHub 加载失败（${esc(err.message)}），可直接访问
            <a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener noreferrer">github.com/${GITHUB_USER}</a>`);
    }
}

// ========================================
// Back to Top
// ========================================

function handleScroll() {
    const scrolled = window.scrollY > 300;
    if (backToTop) backToTop.classList.toggle('visible', scrolled);

    const progressFill = document.getElementById('readingProgress');
    if (progressFill) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progressFill.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + '%';
    }

    // Nav shadow on scroll — 文章详情页导航不加阴影
    const isArticle = document.body.classList.contains('article-page');
    if (window.scrollY > 10 && !isArticle) {
        nav.style.boxShadow = '0 1px 8px var(--shadow)';
    } else {
        nav.style.boxShadow = 'none';
    }
}

window.addEventListener('scroll', handleScroll, { passive: true });

// about / projects 页没有返回顶部按钮，缺元素时跳过（否则这里抛错会中断整个脚本）
const backToTop = document.getElementById('backToTop');
if (backToTop) {
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========================================
// Smooth Scroll for Anchor Links
// ========================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ========================================
// Additional DOM Elements (for posts page)
// ========================================

const projectsList = document.getElementById('projectsList');
const yearSpan = document.getElementById('year');
const themeToggle = document.getElementById('themeToggle');

function getPreferredTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
}
setTheme(getPreferredTheme());
if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}

// ========================================
// Intersection Observer for Animations
// ========================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe sections for scroll animations
document.querySelectorAll('.section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// ========================================
// Article Page Nav — 与主页导航保持一致（注入，不改 60+ 静态文章页）
// ========================================

const SITE_NAV = [
    ['首页', 'index.html'],
    ['文章', 'index.html#articles'],
    ['Wiki', 'index.html#wiki'],
    ['纪念', 'memory.html'],
    ['项目', 'projects.html'],
    ['联系', 'index.html#contact'],
];

function injectSiteNav() {
    const navInner = document.querySelector('body.article-page .nav-inner');
    if (!navInner || navInner.querySelector('.nav-links')) return;
    const prefix = location.pathname.includes('/posts/') ? '../' : '';

    const logo = navInner.querySelector('.nav-logo');
    if (logo) {
        logo.textContent = 'maiding_blue';
        logo.setAttribute('href', prefix + 'index.html');
    }

    const links = document.createElement('div');
    links.className = 'nav-links';
    links.innerHTML = SITE_NAV.map(([label, href]) =>
        `<a href="${prefix}${href}" class="nav-link${label === '文章' ? ' active' : ''}">${label}</a>`
    ).join('');
    navInner.insertBefore(links, navInner.querySelector('.nav-actions'));

    const actions = navInner.querySelector('.nav-actions');
    if (actions && !document.getElementById('mobileMenuBtn')) {
        actions.insertAdjacentHTML('beforeend',
            '<button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="菜单"><span></span><span></span><span></span></button>');
        const menu = document.createElement('div');
        menu.className = 'mobile-menu';
        menu.id = 'mobileMenu';
        menu.innerHTML = SITE_NAV.map(([label, href]) =>
            `<a href="${prefix}${href}" class="mobile-link">${label}</a>`
        ).join('');
        actions.closest('nav').after(menu);
    }
}
injectSiteNav();

// ========================================
// Article Page Reading Progress — 细进度条固定在顶部导航下沿
// ========================================

function injectReadingProgress() {
    const navEl = document.querySelector('body.article-page .nav');
    if (!navEl) return;
    navEl.insertAdjacentHTML('beforeend',
        '<div class="reading-progress" aria-hidden="true"><div class="reading-progress-fill" id="readingProgress"></div></div>');
}
injectReadingProgress();

// ========================================
// Article Page TOC — 左侧体裁目录（两级下拉），右侧阅读区 ≈1:3
// 仅文章详情页生效；体裁清单来自 js/articles-data.js
// ========================================

const TOC_GROUPS = [
    ['文学', ['散文', '小说', '作文', '随笔', '杂文']],
    ['诗歌', ['古诗词', '现代诗']],
    ['论文', ['学术性论文']],
    ['技术性文档', ['技术性文档']],
    ['年度总结', ['年度总结']],
];

function buildArticleToc(articles, prefix) {
    const byCat = {};
    articles.forEach(a => { (byCat[a.category] = byCat[a.category] || []).push(a); });
    const used = new Set();
    const groups = TOC_GROUPS.map(([g, subs]) => {
        const list = subs.filter(c => byCat[c]).map(c => { used.add(c); return [c, byCat[c]]; });
        return [g, list];
    }).filter(([, list]) => list.length);
    const rest = Object.keys(byCat).filter(c => !used.has(c));
    if (rest.length) groups.push(['其他', rest.map(c => [c, byCat[c]]).sort((a, b) => a[0].localeCompare(b[0], 'zh'))]);

    // 本地 serve 会去掉 .html（clean URL），两边都去后缀再匹配
    const current = location.pathname.split('/').pop().replace(/\.html$/, '');
    const isCurrent = a => a.url.replace(/\.html$/, '').endsWith('/' + current);
    let html = '<div class="toc-head"><span class="toc-title">文体目录</span><button class="toc-close" id="tocClose" aria-label="关闭目录">×</button></div>';
    groups.forEach(([g, subs], gi) => {
        const hasCurrent = subs.some(([, list]) => list.some(isCurrent));
        html += `<div class="toc-group${hasCurrent ? ' open' : ''}" data-g="g${gi}">
            <button class="toc-group-head">${g}<span class="toc-count">${subs.reduce((n, [, l]) => n + l.length, 0)}</span><span class="toc-caret">▸</span></button>
            <div class="toc-children">`;
        subs.forEach(([cat, list], ci) => {
            const subCurrent = list.some(isCurrent);
            const items = [...list].sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
            html += `<div class="toc-sub${subCurrent ? ' open' : ''}" data-g="g${gi}s${ci}">
                <button class="toc-sub-head">${cat}<span class="toc-count">${list.length}</span><span class="toc-caret">▸</span></button>
                <div class="toc-articles">
                    ${items.map(a => `<a class="toc-article${isCurrent(a) ? ' current' : ''}" href="${prefix}${a.url}">${a.title}</a>`).join('')}
                </div>
            </div>`;
        });
        html += '</div></div>';
    });

    const aside = document.createElement('aside');
    aside.className = 'article-toc';
    aside.id = 'articleToc';
    aside.innerHTML = html;
    aside.addEventListener('click', e => {
        const head = e.target.closest('.toc-group-head, .toc-sub-head');
        if (head) { head.parentElement.classList.toggle('open'); return; }
        if (e.target.id === 'tocClose') document.body.classList.remove('toc-open');
    });

    const fab = document.createElement('button');
    fab.className = 'toc-fab';
    fab.id = 'tocFab';
    fab.innerHTML = '☰ 目录';
    fab.addEventListener('click', () => document.body.classList.toggle('toc-open'));
    document.body.append(fab);
    return aside;
}

function initArticleToc() {
    if (!document.body.classList.contains('article-page')) return;
    const header = document.querySelector('.article-header');
    const content = document.querySelector('.article-content');
    const footer = document.querySelector('.article-footer');
    if (!header || !content) return;
    const prefix = location.pathname.includes('/posts/') ? '../' : '';
    const s = document.createElement('script');
    s.src = prefix + 'js/articles-data.js';
    s.onload = () => {
        if (typeof BLOG_ARTICLES === 'undefined') return;
        const layout = document.createElement('div');
        layout.className = 'reading-layout';
        header.before(layout);
        const main = document.createElement('div');
        main.className = 'reading-main';
        [header, content, footer].forEach(el => el && main.appendChild(el));
        layout.appendChild(buildArticleToc(BLOG_ARTICLES, prefix));
        layout.appendChild(main);
    };
    document.body.appendChild(s);
}
initArticleToc();

// ========================================
// Mobile Menu Toggle
// ========================================

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
    });
    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });
}

// ========================================
// Initialize
// ========================================

renderProjects();
handleScroll();

console.log('%c🌸 Bluemaiding ready', 'color:#2563eb;font-weight:bold');
