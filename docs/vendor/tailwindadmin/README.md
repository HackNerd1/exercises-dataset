# Tailwindadmin 组件来源

UI 组件、主题 Provider、`cn` 工具及主题 token 来源于 Tailwindadmin 模板。上游 MIT 许可见 [LICENSE.md](LICENSE.md)，Copyright (c) 2026 Tailwindadmin。项目数据和媒体许可另见仓库根目录的 LICENSE 与 NOTICE.md。

[import-manifest.json](import-manifest.json) 保留首次导入的文件哈希和上游依赖版本，用于来源追溯；其中包含后来删除的模板 CSS，不能作为当前文件或依赖清单。当前依赖以 package.json 和 pnpm-lock.yaml 为准。

## 当前适配

- 组件通过 Tailwind 工具类及 `cn` / variants 封装样式。
- `src/app/css/globals.css` 只保存主题 token、基础默认值、焦点与减少动画规则，模板后台布局和覆盖样式已移除。
- 主题变量修复了上游未定义引用和暗色自引用，并提供完整的语义颜色映射。
- Button/Input 具有必要的客户端边界，Dialog/Sheet 的关闭标签支持国际化。
- DM Sans 通过 @fontsource-variable 本地打包，保留多语言系统字体回退。
- next-themes 提供亮色、暗色和跟随系统选项，语言独立由 URL 管理。

使用约定见 [tokens.md](tokens.md)。
