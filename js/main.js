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

const projects = [
    {
        name: '倒计时小工具',
        description: '一个简洁的倒计时网页小部件，支持自定义日期和提醒。',
        icon: '⏱️',
        tech: ['HTML', 'CSS', 'JavaScript'],
        url: 'https://github.com/bluemaiding/countdown-widget',
        external: true
    },
    {
        name: '数据分析脚本',
        description: '用 Python 写的一些数据处理小脚本，处理 Excel 和 CSV 文件。',
        icon: '📊',
        tech: ['Python', 'Pandas'],
        url: 'https://github.com/bluemaiding/data-scripts',
        external: true
    },
    {
        name: '个人知识库',
        description: '使用 Markdown 管理的个人知识库，记录学习笔记和读书心得。',
        icon: '📚',
        tech: ['Markdown', 'Obsidian'],
        url: '#',
        external: false
    }
];

// ========================================
// Render Projects
// ========================================

function renderProjects() {
    if (!projectsList) return;

    projectsList.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-icon">${project.icon}</div>
            <h3 class="project-name">${project.name}</h3>
            <p class="project-desc">${project.description}</p>
            <div class="project-tech">
                ${project.tech.map(t => `<span>${t}</span>`).join('')}
            </div>
            <div class="project-links">
                <a href="${project.url}" class="project-link" ${project.external ? 'target="_blank" rel="noopener noreferrer"' : ''}>
                    ${project.external ? '访问 →' : '查看 →'}
                </a>
            </div>
        </div>
    `).join('');
}

// ========================================
// Back to Top
// ========================================

function handleScroll() {
    const scrolled = window.scrollY > 300;
    backToTop.classList.toggle('visible', scrolled);

    // Nav shadow on scroll
    if (window.scrollY > 10) {
        nav.style.boxShadow = '0 1px 8px var(--shadow)';
    } else {
        nav.style.boxShadow = 'none';
    }
}

window.addEventListener('scroll', handleScroll, { passive: true });

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

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
