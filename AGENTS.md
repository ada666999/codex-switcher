# 给 Codex / AI 助手的一键部署说明

用户让你「部署 / 安装这个仓库」时，按下面做。这是 Codex Switcher 的**简体中文汉化版**，汉化在 `zh-cn` 分支（已设为默认分支）。

## 1. 确认分支

```bash
git checkout zh-cn
```

## 2. 装依赖（缺什么装什么）

- Node.js 18+、pnpm（没有就 `npm i -g pnpm`）
- Rust（没有就 `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`，然后 `. "$HOME/.cargo/env"`）
- macOS 需要 Xcode 命令行工具：`xcode-select --install`
- Windows 需要 Visual Studio C++ 生成工具和 WebView2（Win10/11 一般自带）

```bash
pnpm install
```

## 3. 编译

不要直接 `pnpm tauri build`：它会生成自动更新包，没有原作者的签名私钥会在最后报错。用下面的命令关掉更新包：

**macOS**

```bash
pnpm tauri build --bundles app -c '{"bundle":{"createUpdaterArtifacts":false}}'
```

产物：`src-tauri/target/release/bundle/macos/Codex Switcher.app`

**Windows（PowerShell）**

```powershell
pnpm tauri:win build --bundles nsis -c '{\"bundle\":{\"createUpdaterArtifacts\":false}}'
```

产物：`src-tauri\target\release\bundle\nsis\` 下的 `*-setup.exe`，运行它安装。

## 4. 安装（macOS）

```bash
osascript -e 'quit app "Codex Switcher"' 2>/dev/null || true
rm -rf "/Applications/Codex Switcher.app"
cp -R "src-tauri/target/release/bundle/macos/Codex Switcher.app" /Applications/
xattr -dr com.apple.quarantine "/Applications/Codex Switcher.app" 2>/dev/null || true
open "/Applications/Codex Switcher.app"
```

打开后界面应是中文。

## 注意

- **别点应用内的「有新版本 → 更新」**：它会从原作者仓库装回英文版。想更新就重新 `git pull` 后再走一遍第 3、4 步。
- 修改汉化时只改界面显示文字，`w.label === "Weekly"` 这类判断用的值、菜单 ID 不要翻译。
- 改完可以跑 `npx tsc --noEmit` 检查类型。
