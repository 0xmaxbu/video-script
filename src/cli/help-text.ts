export const HELP_TEXT = `video-script - AI 视频生成工具

用法: video-script [命令] [选项]

AI 驱动的技术教程视频生成 CLI 工具

工作流程:
  research  →  script  →  screenshot  →  compose
     ↓           ↓            ↓            ↓
  收集信息    生成脚本     截取图片     合成视频

命令:
  create [标题]       创建新视频项目（自动运行 research + script）
  resume [runId]      恢复暂停的工作流程
  research [选项]     从标题、链接和文档生成 research.json
  script <目录>       从 research.json 生成 script.json
  screenshot <目录>    从 script.json 截取屏幕截图
  compose <目录>      生成最终视频和字幕
  config             查看当前配置（敏感值已隐藏）
  help [命令]        显示帮助信息

选项:
  -V, --version      输出版本号
  -h, --help         显示帮助信息

快速开始:
  1. 配置环境变量:
     export MINIMAX_API_KEY=your_api_key

  2. 创建视频项目:
     video-script create "React Hooks 教程" --links "https://react.dev"

  3. 或分步执行:
     video-script research "React Hooks 教程" --links "https://react.dev"
     video-script script ./output
     video-script screenshot ./output
     video-script compose ./output

配置:
  配置文件位于: video-script.config.json
  或通过环境变量: MINIMAX_API_KEY

示例:
  # 最简单的方式
  video-script create "TypeScript 入门" --links "https://www.typescriptlang.org/docs/"

  # 带文档
  video-script create "Git 教程" --links "https://git-scm.com/doc" --doc ./notes.md

  # 跳过审核直接继续
  video-script create "Vue 教程" --links "https://vuejs.org/" --no-review

  # 查看配置
  video-script config

更多信息请访问: https://github.com/0xmaxbu/video-script
`;

export const COMMAND_HELP: Record<string, string> = {
  create: `video-script create [标题] [选项]

创建新的视频项目，自动执行 research 和 script 阶段。

参数:
  标题                      视频主题（可选，交互式输入）

选项:
  --links <urls>           逗号分隔的网页链接列表
  --doc <file>             本地文档文件路径
  --no-review              跳过脚本审核，自动继续后续步骤
  --output <dir>           输出目录（默认按日期自动生成）
  -h, --help               显示帮助信息

示例:
  video-script create "React Hooks 教程" --links "https://react.dev"
  video-script create --links "https://vuejs.org/,https://angular.io/"`,

  research: `video-script research [选项] <标题>

从标题、链接和文档收集研究信息。

参数:
  标题                      研究主题

选项:
  --links <urls>           逗号分隔的网页链接
  --doc <file>             本地文档路径
  --output <dir>           输出目录
  -h, --help               显示帮助信息`,

  script: `video-script script <目录>

从 research.json 生成视频脚本。

参数:
  目录                      包含 research.json 的目录

选项:
  -h, --help               显示帮助信息`,

  screenshot: `video-script screenshot <目录>

根据脚本截取屏幕截图。

参数:
  目录                      包含 script.json 的目录

选项:
  -h, --help               显示帮助信息`,

  compose: `video-script compose <目录>

生成最终视频文件和字幕。

参数:
  目录                      包含 script.json 和截图的目录

选项:
  -h, --help               显示帮助信息`,
};
