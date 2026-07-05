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
// Blog Articles Data (from D:\Blue\G. In The Lines)
// ========================================

const BLOG_ARTICLES = [
  {
    "id": 0,
    "title": "When...",
    "year": "2025",
    "category": "现代诗",
    "lang": "en",
    "classical": false,
    "url": "posts/article-0.html"
  },
  {
    "id": 1,
    "title": "故然慢",
    "year": "2024",
    "category": "古诗词",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-1.html"
  },
  {
    "id": 2,
    "title": "青玉案·春雷乍动小池寒",
    "year": "2024",
    "category": "古诗词",
    "lang": "zh",
    "classical": true,
    "url": "posts/article-2.html"
  },
  {
    "id": 3,
    "title": "语文学业考忽觉毕业将至有感而乱作",
    "year": "2024",
    "category": "作文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-3.html"
  },
  {
    "id": 4,
    "title": "《钗头凤·懒卷帘》",
    "year": "2023",
    "category": "古诗词",
    "lang": "zh",
    "classical": true,
    "url": "posts/article-4.html"
  },
  {
    "id": 5,
    "title": "《风桥夜题》",
    "year": "2023",
    "category": "古诗词",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-5.html"
  },
  {
    "id": 6,
    "title": "《花间辞》 ",
    "year": "2023",
    "category": "古诗词",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-6.html"
  },
  {
    "id": 7,
    "title": "M星上的最后一夜",
    "year": "2023",
    "category": "小说",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-7.html"
  },
  {
    "id": 9,
    "title": "《无题》",
    "year": "2022",
    "category": "古诗词",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-9.html"
  },
  {
    "id": 10,
    "title": "《长夜行》",
    "year": "2022",
    "category": "小说",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-10.html"
  },
  {
    "id": 11,
    "title": "《中秋词》",
    "year": "2022",
    "category": "古诗词",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-11.html"
  },
  {
    "id": 12,
    "title": "2060——一个会呼吸的年代",
    "year": "2022",
    "category": "小说",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-12.html"
  },
  {
    "id": 13,
    "title": "必修上册-古诗单元-生命之歌",
    "year": "2022",
    "category": "作文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-13.html"
  },
  {
    "id": 14,
    "title": "读书笔记1 局外人",
    "year": "2022",
    "category": "作文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-14.html"
  },
  {
    "id": 15,
    "title": "读书笔记2 长安十二时辰",
    "year": "2022",
    "category": "作文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-15.html"
  },
  {
    "id": 16,
    "title": "作文4-走自食其力路    谱自强不息歌",
    "year": "2022",
    "category": "作文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-16.html"
  },
  {
    "id": 17,
    "title": "《2020年7月15日》",
    "year": "2021",
    "category": "其他",
    "lang": "en",
    "classical": false,
    "url": "posts/article-17.html"
  },
  {
    "id": 18,
    "title": "《仇》",
    "year": "2021",
    "category": "小说",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-18.html"
  },
  {
    "id": 19,
    "title": "《礼物》",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-19.html"
  },
  {
    "id": 20,
    "title": "《三角梅》",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-20.html"
  },
  {
    "id": 21,
    "title": "《三色堇》",
    "year": "2021",
    "category": "小说",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-21.html"
  },
  {
    "id": 22,
    "title": "《行走》",
    "year": "2021",
    "category": "散文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-22.html"
  },
  {
    "id": 24,
    "title": "《一棵通往天堂的樟树》",
    "year": "2021",
    "category": "小说",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-24.html"
  },
  {
    "id": 25,
    "title": "2020年6月21日",
    "year": "2021",
    "category": "其他",
    "lang": "en",
    "classical": false,
    "url": "posts/article-25.html"
  },
  {
    "id": 26,
    "title": "爱夜说 2020年4月16日语文作业",
    "year": "2021",
    "category": "随笔",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-26.html"
  },
  {
    "id": 27,
    "title": "材料作文",
    "year": "2021",
    "category": "作文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-27.html"
  },
  {
    "id": 28,
    "title": "读北岛《过节》",
    "year": "2021",
    "category": "学术性论文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-28.html"
  },
  {
    "id": 29,
    "title": "封宅记",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": true,
    "url": "posts/article-29.html"
  },
  {
    "id": 30,
    "title": "芙蕖",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": true,
    "url": "posts/article-30.html"
  },
  {
    "id": 32,
    "title": "给自己的最好礼物",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-32.html"
  },
  {
    "id": 33,
    "title": "故去的老院",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": true,
    "url": "posts/article-33.html"
  },
  {
    "id": 34,
    "title": "唤我阿离",
    "year": "2021",
    "category": "小说",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-34.html"
  },
  {
    "id": 35,
    "title": "九上期中作文 成功的经历，也很重要",
    "year": "2021",
    "category": "作文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-35.html"
  },
  {
    "id": 36,
    "title": "老胡传",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": true,
    "url": "posts/article-36.html"
  },
  {
    "id": 37,
    "title": "那双美丽的眼睛",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-37.html"
  },
  {
    "id": 38,
    "title": "闹剧",
    "year": "2021",
    "category": "小说",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-38.html"
  },
  {
    "id": 39,
    "title": "闹剧（其二）",
    "year": "2021",
    "category": "小说",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-39.html"
  },
  {
    "id": 40,
    "title": "逆行路上，你我相伴",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-40.html"
  },
  {
    "id": 41,
    "title": "浅谈自己的责任",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-41.html"
  },
  {
    "id": 42,
    "title": "沁园春",
    "year": "2021",
    "category": "古诗词",
    "lang": "zh",
    "classical": true,
    "url": "posts/article-42.html"
  },
  {
    "id": 43,
    "title": "如梦令·寻就",
    "year": "2021",
    "category": "古诗词",
    "lang": "zh",
    "classical": true,
    "url": "posts/article-43.html"
  },
  {
    "id": 44,
    "title": "三格情书-我喜欢你，因为你的样子",
    "year": "2021",
    "category": "现代诗",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-44.html"
  },
  {
    "id": 45,
    "title": "社团之争",
    "year": "2021",
    "category": "纪念",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-45.html"
  },
  {
    "id": 46,
    "title": "书斋铭",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": true,
    "url": "posts/article-46.html"
  },
  {
    "id": 48,
    "title": "死侍",
    "year": "2021",
    "category": "小说",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-48.html"
  },
  {
    "id": 49,
    "title": "温情让美好长久",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-49.html"
  },
  {
    "id": 53,
    "title": "武汉，我们想你",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-53.html"
  },
  {
    "id": 54,
    "title": "细微之处见真情",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-54.html"
  },
  {
    "id": 55,
    "title": "细微之处见真情（原版）",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-55.html"
  },
  {
    "id": 56,
    "title": "小城日落",
    "year": "2021",
    "category": "散文",
    "lang": "zh",
    "classical": true,
    "url": "posts/article-56.html"
  },
  {
    "id": 57,
    "title": "夜",
    "year": "2021",
    "category": "随笔",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-57.html"
  },
  {
    "id": 58,
    "title": "永远的目送（千屿）",
    "year": "2021",
    "category": "散文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-58.html"
  },
  {
    "id": 59,
    "title": "鸢尾花开的夏天",
    "year": "2021",
    "category": "小说",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-59.html"
  },
  {
    "id": 60,
    "title": "原来如此",
    "year": "2021",
    "category": "其他",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-60.html"
  },
  {
    "id": 61,
    "title": "作文《这样的人，让我（敬佩）》",
    "year": "2021",
    "category": "作文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-61.html"
  },
  {
    "id": 62,
    "title": "伟大\"的歧途：《了不起的盖茨比》与《远大前程》中\"Great\"寓意的再审视",
    "year": "2026",
    "category": "学术性论文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-62.html"
  },
  {
    "id": 63,
    "title": "守望谁？——《麦田里的守望者》中\"守望者\"意象的重释",
    "year": "2026",
    "category": "学术性论文",
    "lang": "zh",
    "classical": false,
    "url": "posts/article-63.html"
  }
];

// ========================================
// Render Blog Articles
// ========================================

let currentView = 'time';
let currentCategory = 'all';

const CATEGORY_GROUPS = {
    '文学': ['散文', '小说', '作文', '随笔', '杂文'],
    '诗歌': ['古诗词', '现代诗'],
    '论文': ['学术性论文']
};

function renderArticles() {
    if (!postsList) return;
    const view = currentView;
    if (view === 'time') renderByTime();
    else if (view === 'lang') renderByLang();
    else if (view === 'form') renderByForm();
}

function getFilteredArticles() {
    if (currentCategory === 'all') return BLOG_ARTICLES;
    if (CATEGORY_GROUPS[currentCategory]) {
        return BLOG_ARTICLES.filter(a => CATEGORY_GROUPS[currentCategory].includes(a.category));
    }
    return BLOG_ARTICLES.filter(a => a.category === currentCategory);
}

function renderByTime() {
    const articles = getFilteredArticles();
    if (articles.length === 0) {
        postsList.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-tertiary)">暂无此类文章</div>';
        return;
    }
    const groups = {};
    articles.forEach(a => {
        if (!groups[a.year]) groups[a.year] = [];
        groups[a.year].push(a);
    });
    const years = Object.keys(groups).sort((a, b) => {
        const aNum = parseInt(a) || 0;
        const bNum = parseInt(b) || 0;
        return bNum - aNum;
    });

    let html = '<div class="article-groups">';
    years.forEach(year => {
        const items = groups[year];
        const yearLabel = year === '2021' ? '2021 及以前' : year;
        html += `
            <div class="article-group">
                <div class="article-group-header">
                    <div class="article-group-year">${yearLabel}</div>
                    <div class="article-group-count">${items.length} 篇</div>
                </div>
                <div class="article-items">
                    ${items.map(a => `
                        <a href="${a.url}" class="article-item">
                            <span class="article-item-title">${a.title}</span>
                            <span class="article-item-category">${a.category}</span>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    });
    html += '</div>';
    postsList.innerHTML = html;
}

function renderByLang() {
    const articles = getFilteredArticles();
    if (articles.length === 0) {
        postsList.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-tertiary)">暂无此类文章</div>';
        return;
    }
    const zhArticles = articles.filter(a => a.lang === 'zh');
    const enArticles = articles.filter(a => a.lang === 'en');

    let html = '';

    // Chinese section
    html += `<div class="article-group">`;
    html += `<div class="article-section-label">中文 (${zhArticles.length} 篇)</div>`;
    html += `<div class="article-items">`;
    zhArticles.forEach(a => {
        html += `
            <a href="${a.url}" class="article-item">
                <span class="article-item-title">${a.title}</span>
                <span class="article-item-category">${a.year} · ${a.category}</span>
            </a>
        `;
    });
    html += `</div></div>`;

    // English section
    if (enArticles.length > 0) {
        html += `<div class="article-group">`;
        html += `<div class="article-section-label">English (${enArticles.length} articles)</div>`;
        html += `<div class="article-items">`;
        enArticles.forEach(a => {
            html += `
                <a href="${a.url}" class="article-item">
                    <span class="article-item-title">${a.title}</span>
                    <span class="article-item-category">${a.year} · ${a.category}</span>
                </a>
            `;
        });
        html += `</div></div>`;
    }

    postsList.innerHTML = html;
}

function renderByForm() {
    const articles = getFilteredArticles();
    if (articles.length === 0) {
        postsList.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-tertiary)">暂无此类文章</div>';
        return;
    }
    const modern = articles.filter(a => !a.classical);
    const classical = articles.filter(a => a.classical);

    let html = '';

    // Modern Chinese
    html += `<div class="article-group">`;
    html += `<div class="article-section-label">现代文 (${modern.length} 篇)</div>`;
    html += `<div class="article-items">`;
    modern.forEach(a => {
        html += `
            <a href="${a.url}" class="article-item">
                <span class="article-item-title">${a.title}</span>
                <span class="article-item-category">${a.year} · ${a.category}</span>
            </a>
        `;
    });
    html += `</div></div>`;

    // Classical Chinese
    if (classical.length > 0) {
        html += `<div class="article-group">`;
        html += `<div class="article-section-label">文言文 (${classical.length} 篇)</div>`;
        html += `<div class="article-items">`;
        classical.forEach(a => {
            html += `
                <a href="${a.url}" class="article-item">
                    <span class="article-item-title">${a.title}</span>
                    <span class="article-item-category">${a.year} · ${a.category}</span>
                </a>
            `;
        });
        html += `</div></div>`;
    }

    postsList.innerHTML = html;
}

// ========================================
// Category Tab Switching
// ========================================

function initCategoryTabs() {
    // Category buttons
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.cat;
            renderArticles();
        });
    });

    // Dropdown items
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            const parentTab = document.querySelector('.category-tab[data-cat="文学"]');
            if (parentTab) parentTab.classList.add('active');
            currentCategory = item.dataset.cat;
            renderArticles();
        });
    });
}

// ========================================
// View Tab Switching
// ========================================

function initViewTabs() {
    const tabs = document.querySelectorAll('.view-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentView = tab.dataset.view;
            renderArticles();
        });
    });
}

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

renderArticles();
renderProjects();
initCategoryTabs();
initViewTabs();
handleScroll();

console.log('%c🌸 Bluemaiding Blog Ready — ' + BLOG_ARTICLES.length + ' articles loaded', 'color: #2563eb; font-size: 14px; font-weight: bold;');
