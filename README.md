# ccusage Menubar App

Claude使用量をメニューバーから簡単に確認できるElectronアプリです。

## 🚀 特徴

- **シンプルなデザイン**: モノクロ系の美しい配色とInterフォント
- **ホバー情報表示**: メニューバーにマウスを乗せるだけで使用量を確認
- **ワンクリックアクセス**: 左クリックで詳細ポップアップ、右クリックでメニュー
- **リアルタイム表示**: 今日、月次、セッション別の使用量を表示
- **自動更新**: 1分間隔で自動的にデータを更新（メニューバータイトルも更新）
- **インテリジェントキャッシュ**: 5分間のキャッシュでパフォーマンス最適化
- **透明ポップアップ**: モダンな透明背景のポップアップウィンドウ

## 📦 インストール & 起動

```bash
# 依存関係をインストール
npm install

# アプリを起動
npm start

# 開発モード（DevToolsが開く）
npm run dev
```

## 🎯 使用方法

1. アプリを起動するとメニューバーに `$` が表示されます（起動後にコストも表示）
2. **ホバー**: アイコンにマウスを乗せると使用量のサマリーがツールチップで表示
3. **左クリック**: 詳細なポップアップウィンドウを表示
4. **右クリック**: メニューを表示
   - **📊 今日の使用量**: 本日のコストとトークン使用量
   - **📅 月次使用量**: 今月の合計使用量
   - **💬 セッション使用量**: セッション別の使用量
   - **🔄 キャッシュクリア**: キャッシュをクリアして最新データを取得

### 💡 クイックアクセス機能
- **ホバー時**: コスト、トークン数、モデル数をすぐに確認
- **メニューバータイトル**: リアルタイムでコストが更新される
- **透明ポップアップ**: 他のアプリの邪魔にならないデザイン

## 🏗️ アーキテクチャ

### ディレクトリ構造
```
src/
├── main.js                 # メインプロセス
├── services/
│   ├── ccusageService.js    # ccusageコマンド実行
│   └── AutoRefreshService.js # 自動更新機能
├── managers/
│   ├── TrayManager.js       # システムトレイ管理
│   └── WindowManager.js     # ウィンドウ管理
└── config/
    └── AppConfig.js         # 設定管理
popup.html                   # ポップアップUI
```

### 主要クラス

- **CcusageApp**: アプリケーションのメインクラス
- **CcusageService**: ccusageコマンドの実行とデータ取得
- **TrayManager**: システムトレイとメニューの管理
- **WindowManager**: ポップアップウィンドウの管理
- **AppConfig**: 設定ファイルの読み書き
- **AutoRefreshService**: 自動更新機能

## ⚙️ 設定

設定ファイルは `~/.config/ccusage-menubar/config.json` に保存されます。

### デフォルト設定
```json
{
  "cacheTimeout": 300000,        // キャッシュ有効期間 (5分)
  "autoRefresh": true,           // 自動更新の有効/無効
  "autoRefreshInterval": 60000,  // 自動更新間隔 (1分)
  "showNotifications": true,     // 通知表示
  "theme": "auto",              // テーマ (light/dark/auto)
  "startWithSystem": false,     // システム起動時に自動開始
  "displayFormat": {
    "currency": "USD",          // 通貨表示
    "numberFormat": "en-US"     // 数値フォーマット
  }
}
```

## 🔧 開発

### 要件
- Node.js 16+
- Electron 28+
- ccusage パッケージがインストールされていること

### 開発環境での実行
```bash
# 開発モードで起動（DevToolsが開く）
npm run dev
```

### ビルド
```bash
# 本番用ビルド（予定）
npm run build
```

## 🐛 トラブルシューティング

### メニューバーにアイコンが表示されない
- macOSでは `💰` テキストが表示されます
- システム設定でメニューバー項目の表示が許可されているか確認

### データが表示されない
- `npx ccusage` コマンドが正常に実行できるか確認
- ターミナルで `npx ccusage daily --json` を実行してデータが取得できるかテスト

### 自動更新が動作しない
- 設定で `autoRefresh` が `true` になっているか確認
- コンソールでエラーログを確認

## 📝 ライセンス

MIT License

## 📚 開発者向けドキュメント

- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - プロジェクト現状・完成機能の詳細
- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - 開発ガイド・アーキテクチャ解説
- **[FEATURE_ROADMAP.md](FEATURE_ROADMAP.md)** - 今後の機能計画・ロードマップ
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - よく使うコマンド・設定のリファレンス

## 🤝 貢献

バグ報告や機能要求は Issues にお気軽にお寄せください。

---

**最終更新**: 2025-06-29  
**バージョン**: 1.0.0  
**ステータス**: 基本機能完成、拡張準備完了

🚀 **次回セッション開始時は [PROJECT_STATUS.md](PROJECT_STATUS.md) をご確認ください。**