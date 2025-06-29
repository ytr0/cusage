# クイックリファレンス - ccusage Menubar App

## 🚀 即座に使えるコマンド

```bash
# プロジェクトディレクトリへ移動
cd /Users/ytr0/Desktop/cusage

# アプリ起動（本番モード）
npm start

# アプリ起動（開発モード・DevTools付き）
npm run dev

# 依存関係再インストール（問題がある場合）
npm install
```

## 📁 重要ファイルの場所

| ファイル | 役割 | パス |
|---------|------|------|
| メインプロセス | アプリケーション統合 | `src/main.js` |
| システムトレイ | メニューバー管理 | `src/managers/TrayManager.js` |
| ポップアップ | ウィンドウ管理 | `src/managers/WindowManager.js` |
| データ取得 | ccusage実行 | `src/services/ccusageService.js` |
| 設定管理 | 設定ファイル | `src/config/AppConfig.js` |
| UI定義 | ポップアップUI | `popup.html` |
| 設定ファイル | ユーザー設定 | `~/.config/ccusage-menubar/config.json` |

## 🔧 よく使う編集ポイント

### メニュー項目追加
```javascript
// src/managers/TrayManager.js - setupContextMenu()
{
  label: '🆕 新しい機能',
  click: () => {
    // 処理を記述
  }
}
```

### ポップアップサイズ変更
```javascript
// src/managers/WindowManager.js
width: 396,   // 幅を変更
height: 296,  // 高さを変更

// src/managers/TrayManager.js でも同じ値に更新必要
const popupWidth = 396;
const popupHeight = 296;
```

### 自動更新間隔変更
```javascript
// src/config/AppConfig.js - defaultConfig
autoRefreshInterval: 60000,  // ミリ秒で指定（60000 = 1分）
```

### UI色変更
```css
/* popup.html の style セクション */
background: #fafafa;      /* 背景色 */
color: #1a1a1a;          /* テキスト色 */
border: 1px solid #e1e1e1; /* ボーダー色 */
```

## 🐛 デバッグ用コード例

### ログ出力追加
```javascript
console.log('🔍 デバッグ:', データ);
console.error('❌ エラー:', error.message);
console.warn('⚠️ 警告:', message);
```

### IPC通信のデバッグ
```javascript
// メインプロセス
ipcMain.handle('debug-test', () => {
  console.log('IPCテスト成功');
  return { success: true };
});

// レンダラープロセス (popup.html)
const result = await ipcRenderer.invoke('debug-test');
console.log('IPC結果:', result);
```

## 📐 UI調整のスニペット

### 新しい行を追加
```html
<!-- popup.html - .status 内に追加 -->
<div class="row">
    <span class="label">新しい項目:</span>
    <span class="value" id="new-value">値</span>
</div>
```

### ボタン追加
```html
<button class="refresh-btn" onclick="newFunction()">
    ✨ 新機能
</button>
```

```javascript
function newFunction() {
    console.log('新機能が実行されました');
}
```

## 🔧 設定値リファレンス

### 時間設定（ミリ秒）
```javascript
1秒 = 1000
1分 = 60000
5分 = 300000
1時間 = 3600000
```

### 色コード
```css
/* 現在のカラーパレット */
--bg-primary: #fafafa;    /* 背景 */
--bg-secondary: #ffffff;  /* カード背景 */
--text-primary: #1a1a1a;  /* メインテキスト */
--text-secondary: #666666; /* サブテキスト */
--border-light: #e1e1e1;  /* ライトボーダー */
--error: #d32f2f;         /* エラー色 */
```

### フォントウェイト
```css
font-weight: 300; /* Light */
font-weight: 400; /* Regular */
font-weight: 500; /* Medium */
font-weight: 600; /* SemiBold */
font-weight: 700; /* Bold */
```

## 🚨 トラブルシューティング

### アプリが起動しない
```bash
# 1. 依存関係確認
npm install

# 2. ccusage動作確認
npx ccusage daily --json

# 3. 設定ファイルリセット
rm ~/.config/ccusage-menubar/config.json
```

### メニューバーに表示されない
```bash
# macOSの場合
# システム環境設定 > Dock とメニューバー > メニューバーを確認

# 一時的な回避
pkill "ccusage-menubar" && npm start
```

### ポップアップが表示されない
```bash
# 開発モードで詳細確認
npm run dev

# コンソールでエラーログ確認
# popup.htmlのパス確認
```

## 📋 チェックリスト

### 新機能追加時
- [ ] 必要なファイルを特定
- [ ] IPC通信が必要か確認
- [ ] UI更新が必要か確認
- [ ] 設定項目が必要か確認
- [ ] テスト方法を決定
- [ ] ドキュメント更新

### リリース前
- [ ] 全機能動作確認
- [ ] エラーハンドリング確認
- [ ] パフォーマンステスト
- [ ] 複数環境での動作確認
- [ ] ドキュメント更新
- [ ] バージョン番号更新

## 🎯 パフォーマンス最適化Tips

### メモリ使用量削減
```javascript
// 不要なオブジェクトをnullに
this.cache = null;

// イベントリスナー削除
window.removeEventListener('event', handler);
```

### レンダリング最適化
```css
/* ハードウェアアクセラレーション */
transform: translateZ(0);
will-change: transform;

/* 不要な再描画防止 */
contain: layout style paint;
```

## 📚 学習リソース

### 公式ドキュメント
- [Electron API](https://www.electronjs.org/docs/api)
- [Node.js API](https://nodejs.org/api/)
- [Inter Font](https://rsms.me/inter/)

### デバッグツール
- Chrome DevTools（開発モード時）
- Console API
- Performance タブ

---

**このリファレンスをブックマークして、効率的な開発を！**