---
title: Wiki 写作指南
group: 入门
date: 2026-09-22
order: 1
tags: 博客, Markdown
---

# Wiki 写作指南

Wiki 用来放**查阅型**的技术笔记，和文章列表里的随笔/论文分开：文章是从 docx 转出来的固定 HTML，Wiki 直接就是 `.md` 文件，打开页面时才在浏览器里渲染成 HTML，所以**不需要构建步骤**。

## 怎么加一篇

1. 把 `.md` 放进 `wiki/` 下对应分类目录：

| 目录 | 顶部分类 |
| --- | --- |
| `wiki/circuits/` | 电子电路 |
| `wiki/it/` | 信息技术 |
| `wiki/basics/` | 基础入门帖 |

2. 分类下再建子目录，子目录名就是左侧目录里的分组名（例如 `wiki/it/git/` → 分组 `git`）。
3. 跑一次 `node _gen-wiki.js` 刷新目录数据。
4. `npx serve . -l 3000` 本地看效果。

## frontmatter 字段

文件开头可选一段 YAML，不写也能正常显示：

```markdown
---
title: GPIO 电平与上下拉
group: 数字电路
date: 2026-09-22
order: 3
tags: FPGA, 嵌入式
---
```

- `title` 缺省时取正文第一个 `#` 标题，再缺省取文件名
- `group` 缺省取所在子目录名；不想要分组就平铺在分类目录下
- `order` 数字越小越靠前，默认 100
- 文件名/目录名建议用 ASCII，中文名会让 URL 变长（功能不受影响）

## 支持的写法

标准 GitHub Markdown：标题、**粗体**、`行内代码`、表格、引用、任务列表都支持，代码块带语言标记会自动高亮：

```c
void gpio_write(uint32_t pin, uint8_t level) {
    GPIO->ODR = (GPIO->ODR & ~pin) | (level ? pin : 0U);
}
```

> 提示：图片放到 `memory/` 之外自建目录也可以，正文里用相对路径引用即可。

- [x] 表格
- [x] 行内公式：$V_{DD}=3.3\,\text{V}$，$t_{su} \ge 2\,\text{ns}$
- [ ] Mermaid 流程图（当前未接入，需要可以再提）

单独成行的行间公式：

$$\frac{1}{2\pi\sqrt{LC}}$$

数学式里的 `_` 和 `\` 不会被 Markdown 吃掉（渲染前先占位保护），代码块里的 `$` 则不当公式处理。

外部链接会自动在新窗口打开，例如 [Cloudflare Pages](https://pages.cloudflare.com/)。

这篇指南本身也是渲染用的冒烟测试，等你写真实内容时可以删掉。
