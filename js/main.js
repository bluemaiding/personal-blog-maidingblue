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

    // Nav shadow on scroll
    if (window.scrollY > 10) {
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
