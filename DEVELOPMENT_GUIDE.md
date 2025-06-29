# 開発ガイド - ccusage Menubar App

## 🚀 クイックスタート

### 次回セッション開始時
```bash
# 1. ディレクトリ移動
cd /Users/ytr0/Desktop/cusage

# 2. 動作確認
npm start

# 3. 開発モード（必要に応じて）
npm run dev
```

## 🏗️ アーキテクチャ理解

### データフロー
```
ccusage CLI → CcusageService → TrayManager/WindowManager → UI表示
                ↓
            AutoRefreshService → 自動更新 → UI更新
                ↓
             AppConfig → 設定管理
```

### 主要クラス間の関係
```
CcusageApp (main.js)
├── CcusageService ──→ ccusageコマンド実行
├── TrayManager ──→ システムトレイ管理
├── WindowManager ──→ ポップアップ管理
├── AutoRefreshService ──→ 自動更新
└── AppConfig ──→ 設定管理
```

## 🔧 開発時の重要ポイント

### 1. IPC通信パターン
```javascript
// メインプロセス (src/main.js)
ipcMain.handle('get-ccusage-data', async (event, type) => {
  // データ取得処理
});

// レンダラープロセス (popup.html)
const result = await ipcRenderer.invoke('get-ccusage-data', 'daily');
```

### 2. ポップアップ位置計算
```javascript
// TrayManager.js - showPopupNearTray()
const trayBounds = this.tray.getBounds();
const x = trayX - popupWidth / 2;  // 中央揃え
const y = trayBounds.y + trayBounds.height + 8;  // 8px下
```

### 3. 自動更新システム
```javascript
// AutoRefreshService.js
this.intervalId = setInterval(async () => {
  const data = await this.ccusageService.getDailyUsage();
  this.callbacks.forEach(callback => callback(data));
}, interval);
```

## 🎨 UIカスタマイズガイド

### カラー変更
popup.htmlの`:root`で管理予定（今後実装）:
```css
:root {
  --bg-primary: #fafafa;
  --bg-secondary: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
}
```

### フォント調整
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
font-weight: 400; /* 300,400,500,600,700 */
letter-spacing: -0.01em;
```

### サイズ調整
```javascript
// WindowManager.js & TrayManager.js
const popupWidth = 396;  // 調整可能
const popupHeight = 296; // 調整可能
```

## 📋 よくある開発タスク

### 新しいデータタイプ追加
1. `CcusageService.js`にメソッド追加
2. `main.js`のIPC handlerに追加
3. `TrayManager.js`のメニューに追加
4. `popup.html`のUI対応

### 設定項目追加
1. `AppConfig.js`のdefaultConfigに追加
2. 必要に応じてUIで設定変更機能追加

### メニュー項目追加
```javascript
// TrayManager.js - setupContextMenu()
{
  label: '🆕 新機能',
  click: () => {
    // 処理内容
  }
}
```

## 🐛 デバッグ方法

### 1. 開発モードでの起動
```bash
npm run dev
# DevToolsが自動で開く
```

### 2. ログ出力の活用
```javascript
console.log('🔄 データ取得開始...');
console.error('❌ エラー:', error.message);
```

### 3. IPC通信のデバッグ
```javascript
// レンダラープロセスでイベント監視
ipcRenderer.on('debug-event', (event, data) => {
  console.log('Debug:', data);
});
```

## 📦 ビルド・パッケージング（今後実装予定）

### electron-builder設定例
```json
{
  "build": {
    "appId": "com.example.ccusage-menubar",
    "productName": "ccusage Monitor",
    "directories": {
      "output": "dist"
    },
    "mac": {
      "category": "public.app-category.developer-tools"
    },
    "win": {
      "target": "nsis"
    }
  }
}
```

## 🔒 セキュリティ考慮事項

### 1. Node Integration
```javascript
webPreferences: {
  nodeIntegration: true,        // 現在有効（最小権限に変更検討）
  contextIsolation: false,      // 現在無効（有効化検討）
  enableRemoteModule: false     // 適切に無効化済み
}
```

### 2. 外部リソース
- Google Fonts: HTTPS経由での読み込み
- ccusageコマンド: ローカル実行のみ

## 🧪 テスト戦略

### 手動テスト項目
- [ ] アプリ起動・終了
- [ ] メニューバーアイコン表示
- [ ] ホバーツールチップ
- [ ] 左クリックポップアップ
- [ ] 右クリックメニュー
- [ ] 自動更新動作
- [ ] 設定保存・読み込み

### 自動テスト（今後実装）
- ユニットテスト: Jest
- E2Eテスト: Spectron

## 🚨 緊急時対応

### アプリが起動しない
1. `npm install`で依存関係再インストール
2. `npx ccusage daily --json`でccusage動作確認
3. `~/.config/ccusage-menubar/config.json`削除してリセット

### メニューバーに表示されない
1. macOSのメニューバー設定確認
2. システム権限確認
3. 他のメニューバーアプリとの競合確認

### ポップアップが表示されない
1. 開発モードでコンソールエラー確認
2. `popup.html`のパス確認
3. 透明度設定確認

## 📚 参考資料

### Electron公式
- [Electron Documentation](https://www.electronjs.org/docs)
- [Tray API](https://www.electronjs.org/docs/api/tray)
- [BrowserWindow API](https://www.electronjs.org/docs/api/browser-window)

### 使用ライブラリ
- [Inter Font](https://fonts.google.com/specimen/Inter)
- [ccusage CLI](https://www.npmjs.com/package/ccusage)

---

**このガイドを使って効率的に開発を継続してください！**