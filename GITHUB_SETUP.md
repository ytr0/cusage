# GitHub リポジトリセットアップガイド

## 📋 GitHubリポジトリ作成手順

### 1. GitHubでリポジトリを作成
https://github.com/new にアクセスして以下の設定で新しいリポジトリを作成：

#### リポジトリ設定
- **Repository name**: `ccusage-menubar`
- **Description**: `A beautiful menubar app for monitoring Claude usage with real-time updates and elegant design`
- **Visibility**: `Public` ✅
- **Initialize options**: 
  - ❌ Add a README file （既にREADME.mdが存在するため）
  - ❌ Add .gitignore （既に.gitignoreが存在するため）
  - ❌ Choose a license （後で追加可能）

### 2. リモートリポジトリを追加
リポジトリ作成後、以下のコマンドを実行：

```bash
# GitHubリポジトリのURLを追加（あなたのユーザー名に置き換え）
git remote add origin https://github.com/YOUR_USERNAME/ccusage-menubar.git

# デフォルトブランチ名をmainに設定
git branch -M main

# 初回プッシュ
git push -u origin main
```

### 3. リポジトリ情報の確認
```bash
# リモートURLの確認
git remote -v

# ブランチ状況の確認
git branch -a

# 最新の状態確認
git status
```

## 🏷️ 推奨リポジトリ設定

### Topics（タグ）の追加
リポジトリページの設定で以下のトピックを追加：
- `electron`
- `menubar`
- `claude`
- `usage-monitoring`
- `macos`
- `system-tray`
- `typescript`
- `javascript`

### About欄の設定
```
🖥️ Beautiful menubar app for real-time Claude usage monitoring

✨ Features: System tray integration, hover tooltips, auto-refresh, elegant design
🎨 Modern monochrome UI with Inter font
🚀 Cross-platform support (macOS/Windows/Linux)
```

### リポジトリのWebsite設定
- Homepage: （デモサイトがあれば追加）
- Topics: 上記のトピックを追加

## 📄 推奨追加ファイル

### LICENSE ファイル
```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### CONTRIBUTING.md（将来的に追加推奨）
```markdown
# Contributing to ccusage Menubar App

## Development Setup
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/ccusage-menubar.git
cd ccusage-menubar
npm install
npm start
\`\`\`

## Pull Request Process
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
```

## 🚀 プッシュ後の確認項目

### ✅ 確認リスト
- [ ] すべてのファイルが正しくアップロードされている
- [ ] README.mdが適切に表示されている
- [ ] .gitignoreが機能している（node_modulesなどが除外されている）
- [ ] コミットメッセージが適切に表示されている
- [ ] リポジトリの説明が設定されている
- [ ] トピック（タグ）が設定されている

### 📊 リポジトリ統計
- 言語: JavaScript 
- ファイル数: 17ファイル
- 総行数: 約3,000行
- ドキュメント: 包括的

## 🔄 継続的な更新

### 定期的なプッシュのコマンド例
```bash
# 変更をステージング
git add .

# コミット
git commit -m "機能名: 変更内容の説明

🔧 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# プッシュ
git push origin main
```

### ブランチ戦略（将来的に）
- `main`: 安定版
- `develop`: 開発版
- `feature/*`: 機能ブランチ
- `hotfix/*`: 緊急修正ブランチ

---

**このガイドに従ってGitHubリポジトリを作成し、ccusage Menubar Appを世界に公開しましょう！** 🌟