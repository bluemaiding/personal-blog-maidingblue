// New publications use Pandoc math spans; code examples stay literal.
(() => {
    const content = document.querySelector('.article-content');
    if (!content || !content.querySelector('.math')) return;
    const cdn = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/';
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = cdn + 'katex.min.css'; document.head.append(css);
    const script = document.createElement('script'); script.src = cdn + 'katex.min.js';
    script.onload = () => {
        content.querySelectorAll('.math').forEach(node => {
            const raw = node.textContent.trim();
            const display = node.classList.contains('display');
            const tex = raw.replace(/^(?:\\\(|\\\[|\$\$?)/, '').replace(/(?:\\\)|\\\]|\$\$?)$/, '');
            try { window.katex.render(tex, node, { displayMode: display, throwOnError: true, trust: false, strict: 'ignore' }); }
            catch { node.classList.add('math-error'); node.title = '公式无法解析，已保留 LaTeX 原文'; }
        });
    };
    script.onerror = () => {
        const note = document.createElement('p'); note.className = 'math-load-note';
        note.textContent = '公式组件暂时未能加载，当前显示 LaTeX 原文。'; content.prepend(note);
    };
    document.head.append(script);
})();
