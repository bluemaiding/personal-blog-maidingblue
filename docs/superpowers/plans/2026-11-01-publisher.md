# Blog Publisher Implementation Plan

> 在当前会话按任务逐项实施；按用户自主执行偏好继续完成，不另开会话。

**Goal:** 双击使用的本地文章 / Wiki 发布面板，支持保留 DOCX 字体和 Markdown LaTeX，并显式推送 GitHub。

**Architecture:** Node 内置 HTTP 服务处理上传、转换、预览和发布；Python 标准库读取 OOXML 字体，Pandoc 转换内容；既有 Node 脚本生成目录。

**Tech Stack:** Node 24、Python 标准库、Pandoc、原生 HTML/CSS/JS、Git、Playwright。

## Global Constraints

原文件不改；正文不改写。DOCX 保持原字体；Markdown 保留 LaTeX。仅回环地址、写入会话校验、不自动覆盖、不强推、不混入其他改动。

## Tasks

- [x] 1. `tests/publisher.cjs`：使用临时博客和 bare Git 仓库；先运行 `node --test tests/publisher.cjs` 验证缺失模块失败。覆盖标题、公式、Word 字体、索引、附件、保存及推送重试。
- [x] 2. `publisher/convert.py` 与 `publisher/content.cjs`：以 `convertUpload(root, upload, options)` 生成可预览草稿；Python 用 ZIP/XML 字体继承标记文本，Pandoc 处理结构与数学；以 JSON 返回正文、标题及字体。
- [x] 3. `publisher/repository.cjs`：`saveDraft(root, draft)` 只保存新文件及生成索引；`pushSaved(root, record, log)` 限定保存清单提交、显式 push，记录状态防止重复提交。测试 dirty index、拒绝强推、push 失败重试。
- [x] 4. `publisher/server.cjs`、`publisher/ui/*`、`publisher/start.ps1`、`打开博客发布器.cmd`：本地上传 API、预览与直观表单，启动器查找已有依赖，窗口无额外终端交互。
- [x] 5. `js/article-math.js`：新文章使用 KaTeX 渲染数学，代码保持字面量。静态预览也可打开 Wiki；本地工具文件不作为网站功能入口。
- [x] 6. `tests/publisher-ui.cjs`：实际浏览器选择 MD / DOCX、预览公式、切换 Wiki、保存与推送状态，保存截图；运行现有两组回归。
- [x] 7. `docs/PUBLISHER.md`、`CLAUDE.md`：提供双击入口与使用说明、字体可用性限制、失败重试；验证后提交实际仓库；真实 GitHub 网络不可达，远端推送待网络恢复，展示可使用的界面。
