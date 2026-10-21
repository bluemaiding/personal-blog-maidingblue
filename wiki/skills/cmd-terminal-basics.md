---
title: CMD、PowerShell、终端——那些黑框框到底是什么
group: 入门
date: 2026-09-29
order: 2
tags: 终端, CMD, PowerShell, 命令行
---

# CMD、PowerShell、终端——那些黑框框到底是什么

> **核心问题：** 网上教程都说"打开终端输入命令"，可 Windows 上右键菜单里有终端、有 PowerShell、搜索还能搜出 cmd——这三个黑框框是什么关系？我该用哪个？敲进去的命令又是怎么被执行的？

搞清楚这个问题，只需要记住一个核心区分：**"终端"是窗口，"Shell"是往窗口里敲的那个翻译官。** 你看到的每个黑框框，其实是"某个终端程序里跑着某个 Shell"。

## 先搞懂 Shell：一个循环的翻译官

Shell（壳）本质上是一个**交互式程序**，它干的事就是一个死循环：

1. 显示提示符，等你敲一行字；
2. 把这行字解析成"要运行哪个程序、带什么参数"；
3. 替你把程序启动起来，等它跑完；
4. 回到第 1 步。

所以你在命令行敲 `python main.py`，并不是什么魔法——是 Shell 帮你找到 python.exe，把 `main.py` 作为参数传给它，启动进程，并负责处理输入输出的接线。你直接双击 python.exe 也能跑，只是没地方传参数、看不到流式输出而已。命令行只是**给程序喂参数和看输出的最省事接口**。

## 再搞懂终端（Terminal）：一扇"窗口"的来历

"终端"这个词来自打字机时代的大头机（teletype）：一台连着远端主机的键盘+显示器。后来主机变成了你电脑里的 Shell 进程，但那块"负责显示字符、接收键盘输入"的窗口_interface 保留了下来，就叫**终端模拟器**（Terminal Emulator）。

它只干显示和输入的活，**跟你能敲什么命令毫无关系**。同一个 Windows Terminal 窗口里，你可以跑 cmd，也可以跑 PowerShell，也可以跑 Git Bash——换的是 Shell，终端没变。

## Windows 上的三个东西，各是什么

现在可以回答核心问题了：

| 名字 | 是什么 | 身份 |
| --- | --- | --- |
| cmd.exe | Windows 的 Shell，前身可追溯到 1980 年代的 MS-DOS 的 COMMAND.COM | Shell（老） |
| PowerShell | 微软 2006 年推出的新 Shell，命令之间传递的是对象而非纯文本 | Shell（新） |
| Windows Terminal | 微软 2019 年开源的现代窗口程序，标签页、字体渲染、GPU 加速 | 终端模拟器 |
| conhost.exe | 老 Windows 默认给 cmd/PowerShell 套的那个传统窗口 | 终端模拟器（旧） |

- **cmd** 内置于 Windows，命令体系继承 DOS：`dir` 列目录、`cd ..` 回上层。够用，但脚本语言（批处理）表达力弱，很多现代工具链的文档已不再为它优化。
- **PowerShell** 命令叫 cmdlet（如 `Get-ChildItem`），输出是 .NET 对象，可以 `Get-Process | Where-Object CPU -gt 50` 这样像操作数据库一样管道处理。学习曲线略陡，但它是 Windows 自动化的正路。
- **Windows Terminal** 是壳中的壳：微软把它设为系统默认终端后，你搜"终端"打开的就是它，而它默认启动的 Shell 可以配置成 PowerShell、cmd、WSL 任意一个，用标签页和 `Ctrl+Shift+数字` 切换。

**所以"我该用哪个"的答案：** 日常打开 Windows Terminal（默认挂着 PowerShell）就够了；跑古老批处理脚本时才需要 cmd；文档让你用 `bash` 时，装 Git 附带的 Git Bash 或 WSL。

## 命令是怎么被"找到"的：PATH

敲 `git status`，系统怎么知道 git 在哪？答案是 **PATH 环境变量**——一个目录清单，Shell 按顺序在这些目录里找 `git.exe`，找到就跑，找不到就报"不是内部或外部命令"。

这解释了新手最常见的两个困惑：

1. **装完软件命令行认不出来** → 安装程序没把它的目录加进 PATH，手动加（系统设置 → 环境变量），或者重启一下让新 PATH 生效。
2. **`python` 打开的是微软商店** → Windows 在 PATH 里放了一个商店跳板（应用执行别名），去"设置 → 应用 → 高级应用设置 → 应用执行别名"里关掉。

顺带一提，每个 Shell 还有**内置命令**（比如 `cd`），它不是外部程序而是 Shell 自己的功能——因为"换目录"这件事改变的是 Shell 自身的状态，外部程序改了也没用。

## 新手最容易踩的几个坑

**路径里的空格。** `cd C:\Program Files\App` 会报错，因为 Shell 用空格切分参数，`Files\App` 被切到了别的参数上。加引号：`cd "C:\Program Files\App"`。

**Tab 补命是第一生产力。** 敲一半按 Tab 自动补全路径和命令名，既省 typing 又杜绝拼写错误；Linux/macOS 习惯强烈，Windows PowerShell 同样支持。多用。

**↑↓ 翻历史命令。** 按上箭头调出之前敲过的命令，不用重复输入长命令；`Ctrl+C` 终止当前正在跑的程序；`cls`（cmd/PowerShell）或 `clear` 清屏。

**相对路径以"当前目录"为基准。** `cd` 改变的是 Shell 的当前工作目录（提示符上能看到），后面所有不带盘符的路径都相对它解析。"明明文件就在这我怎么找不到"九成原因是你以为的"这"和 Shell 的"当前目录"不是一个地方。PowerShell 里 `Get-Location`（或 `pwd`）随时确认自己在哪。

**cmd 默认编码坑。** cmd 里 Python 打印中文乱码、`dir` 输出对不上，可能是代码页问题（`chcp 65001` 切 UTF-8）。PowerShell 7+ 对 UTF-8 友好得多，这也是弃用 cmd 的一个实际理由。

## 小结

三个层次各就各位：

- **终端**是那块"屏幕"（Windows Terminal / conhost），只管显示和输入；
- **Shell** 是翻译官（cmd / PowerShell / bash），负责解析你敲的每一行；
- **PATH** 是翻译官的"通讯录"，决定你敲的名字能不能被找出来。

教程里说"打开终端"时，在 Windows 上的最佳对应动作是：**Win+X → 终端**（或搜索"终端"），然后在里面用 PowerShell 跑命令。看到专门针对 cmd 的老教程，命令照敲没问题，但别投入感情——它是过去式了。
