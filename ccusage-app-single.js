const { app, ipcMain, Tray, Menu, nativeImage, BrowserWindow, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// =============================================================================
// AppConfig クラス - アプリケーション設定管理
// =============================================================================
class AppConfig {
  constructor() {
    this.configPath = path.join(app.getPath('userData'), 'config.json');
    this.defaultConfig = {
      cacheTimeout: 5 * 60 * 1000, // 5分
      autoRefresh: true,
      autoRefreshInterval: 10 * 60 * 1000, // 10分
      showNotifications: true,
      theme: 'auto', // 'light', 'dark', 'auto'
      startWithSystem: false,
      windowPosition: { x: null, y: null },
      displayFormat: {
        currency: 'USD',
        numberFormat: 'en-US'
      }
    };
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const fileContent = fs.readFileSync(this.configPath, 'utf8');
        const savedConfig = JSON.parse(fileContent);
        return { ...this.defaultConfig, ...savedConfig };
      }
    } catch (error) {
      if (process.stderr.writable) {
        console.warn('⚠️ 設定ファイル読み込みエラー:', error.message);
      }
    }
    
    return { ...this.defaultConfig };
  }

  saveConfig() {
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      if (process.stdout.writable) {
        console.log('💾 設定ファイルを保存しました');
      }
    } catch (error) {
      if (process.stderr.writable) {
        console.error('❌ 設定ファイル保存エラー:', error.message);
      }
    }
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    this.saveConfig();
  }

  getAll() {
    return { ...this.config };
  }

  reset() {
    this.config = { ...this.defaultConfig };
    this.saveConfig();
    if (process.stdout.writable) {
      console.log('🔄 設定をリセットしました');
    }
  }
}

// =============================================================================
// CcusageService クラス - ccusage CLI 統合
// =============================================================================
class CcusageService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分間キャッシュ
  }

  async getDailyUsage() {
    const cacheKey = 'daily-' + new Date().toDateString();
    
    // キャッシュをチェック
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        if (process.stdout.writable) {
          console.log('📦 キャッシュからデータを返します');
        }
        return cached.data;
      }
    }

    try {
      if (process.stdout.writable) {
        console.log('🔄 ccusage daily --json を実行中...');
      }
      const data = await this.executeCcusage('daily --json');
      
      // キャッシュに保存
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      if (process.stdout.writable) {
        console.log('✅ ccusageデータ取得成功');
      }
      return data;
    } catch (error) {
      if (process.stderr.writable) {
        console.error('❌ ccusageデータ取得エラー:', error.message);
      }
      throw error;
    }
  }

  async getMonthlyUsage() {
    try {
      return await this.executeCcusage('monthly --json');
    } catch (error) {
      if (process.stderr.writable) {
        console.error('❌ 月次データ取得エラー:', error.message);
      }
      throw error;
    }
  }

  async getSessionUsage() {
    try {
      return await this.executeCcusage('session --json');
    } catch (error) {
      if (process.stderr.writable) {
        console.error('❌ セッションデータ取得エラー:', error.message);
      }
      throw error;
    }
  }

  executeCcusage(command) {
    return new Promise((resolve, reject) => {
      const fullCommand = `npx ccusage ${command}`;
      if (process.stdout.writable) {
        console.log(`🔧 実行中: ${fullCommand}`);
      }
      
      exec(fullCommand, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`ccusage実行エラー: ${error.message}`));
          return;
        }
        
        if (stderr) {
          if (process.stderr.writable) {
          console.warn('⚠️ ccusage stderr:', stderr);
        }
        }
        
        try {
          const data = JSON.parse(stdout);
          resolve(data);
        } catch (parseError) {
          reject(new Error(`JSONパースエラー: ${parseError.message}`));
        }
      });
    });
  }

  clearCache() {
    this.cache.clear();
    if (process.stdout.writable) {
      console.log('🗑️ キャッシュをクリアしました');
    }
  }
}

// =============================================================================
// AutoRefreshService クラス - 自動リフレッシュ機能
// =============================================================================
class AutoRefreshService {
  constructor(ccusageService, config) {
    this.ccusageService = ccusageService;
    this.config = config;
    this.intervalId = null;
    this.callbacks = new Set();
  }

  start() {
    if (!this.config.get('autoRefresh')) {
      if (process.stdout.writable) {
        console.log('📴 自動更新は無効になっています');
      }
      return;
    }

    this.stop(); // 既存のタイマーを停止

    const interval = this.config.get('autoRefreshInterval');
    if (process.stdout.writable) {
      console.log(`⏰ 自動更新を開始します (${interval / 1000}秒間隔)`);
    }
    
    this.intervalId = setInterval(async () => {
      try {
        if (process.stdout.writable) {
          console.log('🔄 自動更新: データを取得中...');
        }
        const data = await this.ccusageService.getDailyUsage();
        
        // すべてのコールバックを実行
        this.callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            if (process.stderr.writable) {
              console.error('❌ コールバック実行エラー:', error);
            }
          }
        });
        
        if (process.stdout.writable) {
          console.log('✅ 自動更新完了');
        }
      } catch (error) {
        if (process.stderr.writable) {
          console.error('❌ 自動更新エラー:', error);
        }
      }
    }, interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      if (process.stdout.writable) {
        console.log('⏹️ 自動更新を停止しました');
      }
    }
  }

  addCallback(callback) {
    this.callbacks.add(callback);
  }

  removeCallback(callback) {
    this.callbacks.delete(callback);
  }

  restart() {
    this.stop();
    this.start();
  }

  isRunning() {
    return this.intervalId !== null;
  }
}

// =============================================================================
// WindowManager クラス - ウィンドウ管理
// =============================================================================
class WindowManager {
  constructor() {
    this.popupWindow = null;
    this.currentType = 'daily';
  }

  showPopup(type = 'daily') {
    this.showPopupAt(type, null);
  }

  showPopupAt(type = 'daily', position = null) {
    if (this.popupWindow) {
      this.popupWindow.focus();
      // タイプが変わった場合は再読み込み
      if (this.currentType !== type) {
        this.currentType = type;
        this.popupWindow.webContents.send('change-data-type', type);
      }
      return;
    }

    this.currentType = type;
    this.createPopupWindow(position);
  }

  createPopupWindow(position = null) {
    const windowOptions = {
      width: 396,
      height: 296,
      show: false,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      transparent: true,
      backgroundColor: '#00000000',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: false
      }
    };

    // 位置が指定されている場合は設定
    if (position) {
      windowOptions.x = position.x;
      windowOptions.y = position.y;
    }

    this.popupWindow = new BrowserWindow(windowOptions);

    // HTML内容を直接設定
    this.popupWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(POPUP_HTML_CONTENT)}`);

    this.popupWindow.once('ready-to-show', () => {
      this.popupWindow.show();
      // データタイプを送信
      this.popupWindow.webContents.send('set-data-type', this.currentType);
    });

    // フォーカスが外れたときに閉じる
    this.popupWindow.on('blur', () => {
      this.closePopup();
    });

    this.popupWindow.on('closed', () => {
      this.popupWindow = null;
    });

    // 開発時はDevToolsを開く
    if (process.argv.includes('--dev')) {
      this.popupWindow.webContents.openDevTools({ mode: 'detach' });
    }
  }

  closePopup() {
    if (this.popupWindow) {
      this.popupWindow.close();
    }
  }

  getCurrentType() {
    return this.currentType;
  }
}

// =============================================================================
// TrayManager クラス - システムトレイ管理
// =============================================================================
class TrayManager {
  constructor(windowManager, ccusageService) {
    this.tray = null;
    this.windowManager = windowManager;
    this.ccusageService = ccusageService;
  }

  create() {
    try {
      // macOSでテキストのみを表示
      if (process.platform === 'darwin') {
        const icon = nativeImage.createEmpty();
        this.tray = new Tray(icon);
        this.tray.setTitle('$');
      } else {
        // WindowsやLinuxでは通常のアイコンを使用
        const icon = nativeImage.createFromDataURL(
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADFSURBVDiNY2AYBaNgFAyEAUYGBgYGhv///zMwMjIy0NIARkZGRgYWWumGacZpANkGwNX9h/uamhgYsRjASE0DGMnyPQMjVhdQ6gJGRkZGBpyJgYqAkZoBRIsGhoGMBZS6gJGaBlBsACMjIyNDQEAAw6VLl6jpAoKasWqmpgtolhhGEwNtUsNoKhhZCkcVDjKFDA0NDbTQnJKSwvD//39GahdQzYABBaNgFIyCUUBzAABNTyTI2tx0BgAAAABJRU5ErkJggg=='
        );
        this.tray = new Tray(icon);
      }

      this.setupContextMenu();
      this.updateTooltip();
      this.setupEventHandlers();
      
      if (process.stdout.writable) {
      console.log('✅ システムトレイが作成されました');
    }
    } catch (error) {
      if (process.stderr.writable) {
      console.error('❌ システムトレイ作成エラー:', error);
    }
      throw error;
    }
  }

  setupContextMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '📊 今日の使用量',
        click: () => this.showPopupNearTray('daily')
      },
      {
        label: '📅 月次使用量',
        click: () => this.showPopupNearTray('monthly')
      },
      {
        label: '💬 セッション使用量',
        click: () => this.showPopupNearTray('session')
      },
      {
        type: 'separator'
      },
      {
        label: '🔄 キャッシュクリア',
        click: () => {
          this.ccusageService.clearCache();
          this.updateTitle('キャッシュクリア済み');
          setTimeout(() => this.updateTitle(), 2000);
        }
      },
      {
        type: 'separator'
      },
      {
        label: '❌ 終了',
        click: () => {
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  setupEventHandlers() {
    if (!this.tray) return;

    // クリックイベント（左クリックでポップアップ表示）
    this.tray.on('click', () => {
      this.showPopupNearTray('daily');
    });

    // マウスホバー時にすぐにデータを取得して表示
    this.tray.on('mouse-enter', () => {
      this.updateTooltipWithData();
    });
  }

  showPopupNearTray(type) {
    const trayBounds = this.tray.getBounds();
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    
    // ポップアップのサイズ（マージンを含む）
    const popupWidth = 396; // 380 + 16px margin
    const popupHeight = 296; // 280 + 16px margin
    
    // トレイアイコンの中心位置を計算
    const trayX = trayBounds.x + trayBounds.width / 2;
    const trayY = trayBounds.y + trayBounds.height / 2;
    
    // ポップアップの位置を計算
    let x = trayX - popupWidth / 2;
    let y;
    
    // macOSの場合、メニューバーは通常画面上部にある
    if (process.platform === 'darwin') {
      y = trayBounds.y + trayBounds.height + 8; // アイコンの下に8px空けて表示
    } else {
      // WindowsやLinuxの場合、タスクバーの位置によって上下を判断
      if (trayY > screenHeight / 2) {
        // タスクバーが下にある場合、ポップアップを上に表示
        y = trayBounds.y - popupHeight - 8;
      } else {
        // タスクバーが上にある場合、ポップアップを下に表示
        y = trayBounds.y + trayBounds.height + 8;
      }
    }
    
    // 画面端のチェックと調整
    if (x < 0) x = 8;
    if (x + popupWidth > screenWidth) x = screenWidth - popupWidth - 8;
    if (y < 0) y = 8;
    if (y + popupHeight > screenHeight) y = screenHeight - popupHeight - 8;
    
    // ポップアップを表示
    this.windowManager.showPopupAt(type, { x: Math.round(x), y: Math.round(y) });
  }

  async updateTooltipWithData() {
    try {
      const data = await this.ccusageService.getDailyUsage();
      const cost = data.totals.totalCost.toFixed(2);
      const tokens = (data.totals.totalTokens / 1000000).toFixed(1);
      
      const tooltip = `Today's Usage
Cost: $${cost}
Tokens: ${tokens}M
Models: ${data.daily?.[0]?.modelsUsed?.length || 0}

Left click: View details
Right click: Menu`;
      
      this.tray.setToolTip(tooltip);
      
      // タイトルも更新（macOS）
      if (process.platform === 'darwin') {
        this.tray.setTitle(`$${cost}`);
      }
    } catch (error) {
      if (process.stderr.writable) {
        console.error('❌ ツールチップ更新エラー:', error);
      }
      this.updateTooltip('Error loading data');
    }
  }

  updateTooltip(customText = null) {
    if (!this.tray) return;
    
    const defaultTooltip = `ccusage Monitor
Hover: Quick view
Left click: Details
Right click: Menu`;
    
    this.tray.setToolTip(customText || defaultTooltip);
  }

  updateTitle(text = '$') {
    if (this.tray && process.platform === 'darwin') {
      this.tray.setTitle(text);
    }
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

// =============================================================================
// CcusageApp クラス - メインアプリケーション
// =============================================================================
class CcusageApp {
  constructor() {
    this.config = new AppConfig();
    this.ccusageService = new CcusageService();
    this.windowManager = new WindowManager();
    this.trayManager = new TrayManager(this.windowManager, this.ccusageService);
    this.autoRefreshService = new AutoRefreshService(this.ccusageService, this.config);
    
    this.setupIpcHandlers();
    this.setupAppEvents();
    this.setupAutoRefresh();
  }

  setupIpcHandlers() {
    // ccusageデータ取得
    ipcMain.handle('get-ccusage-data', async (event, type = 'daily') => {
      try {
        if (process.stdout.writable) {
        console.log(`📊 ${type}データ取得開始...`);
      }
        
        let data;
        switch (type) {
          case 'monthly':
            data = await this.ccusageService.getMonthlyUsage();
            break;
          case 'session':
            data = await this.ccusageService.getSessionUsage();
            break;
          default:
            data = await this.ccusageService.getDailyUsage();
        }
        
        if (process.stdout.writable) {
          console.log(`✅ ${type}データ取得成功`);
        }
        return { success: true, data, type };
      } catch (error) {
        if (process.stderr.writable) {
        console.error(`❌ ${type}データ取得エラー:`, error.message);
      }
        return { success: false, error: error.message, type };
      }
    });

    // 設定関連
    ipcMain.handle('get-config', () => {
      return this.config.getAll();
    });

    ipcMain.handle('set-config', (event, key, value) => {
      this.config.set(key, value);
      return this.config.getAll();
    });

    ipcMain.handle('reset-config', () => {
      this.config.reset();
      return this.config.getAll();
    });

    // キャッシュクリア
    ipcMain.handle('clear-cache', () => {
      this.ccusageService.clearCache();
      return { success: true };
    });
  }

  setupAppEvents() {
    app.whenReady().then(() => {
      this.initialize();
    });

    app.on('window-all-closed', () => {
      // メニューバーアプリなので、ウィンドウが閉じてもアプリは終了しない
    });

    app.on('before-quit', () => {
      this.cleanup();
    });

    // Dock（macOS）やタスクバー（Windows）に表示しない
    if (app.dock) {
      app.dock.hide();
    }
  }

  initialize() {
    try {
      this.trayManager.create();
      this.autoRefreshService.start();
      if (process.stdout.writable) {
      console.log('🚀 ccusage Menubar App が起動しました');
    }
    } catch (error) {
      if (process.stderr.writable) {
      console.error('❌ アプリ初期化エラー:', error);
    }
      app.quit();
    }
  }

  setupAutoRefresh() {
    // 自動更新のコールバックを設定
    this.autoRefreshService.addCallback((data) => {
      // メニューバータイトルを更新
      const cost = data.totals.totalCost.toFixed(2);
      this.trayManager.updateTitle(`$${cost}`);
      
      // ポップアップが開いていれば更新
      if (this.windowManager.popupWindow) {
        this.windowManager.popupWindow.webContents.send('auto-refresh-data', data);
      }
    });
  }

  cleanup() {
    this.autoRefreshService.stop();
    this.trayManager.destroy();
    this.windowManager.closePopup();
    if (process.stdout.writable) {
    console.log('👋 アプリを終了します');
  }
  }
}

// =============================================================================
// HTML テンプレート（埋め込み）
// =============================================================================
const POPUP_HTML_CONTENT = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ccusage Status</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 8px;
            padding: 20px;
            background: #fafafa;
            font-size: 13px;
            border-radius: 8px;
            color: #2c2c2c;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.18), 0 4px 16px rgba(0, 0, 0, 0.08);
            border: 1px solid #e1e1e1;
            font-weight: 400;
            letter-spacing: -0.01em;
        }
        .header {
            font-weight: 600;
            font-size: 16px;
            color: #1a1a1a;
            margin-bottom: 16px;
            text-align: center;
            letter-spacing: -0.02em;
        }
        .status {
            background: #ffffff;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e8e8e8;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            padding: 6px 0;
            border-bottom: 1px solid #f5f5f5;
        }
        .row:last-of-type {
            border-bottom: none;
            margin-bottom: 0;
        }
        .label {
            color: #666666;
            font-size: 12px;
            font-weight: 500;
            letter-spacing: -0.005em;
        }
        .value {
            font-weight: 600;
            color: #1a1a1a;
            letter-spacing: -0.01em;
            font-variant-numeric: tabular-nums;
        }
        .cost {
            color: #2c2c2c;
            font-size: 15px;
            font-weight: 700;
        }
        .loading {
            text-align: center;
            color: #888888;
            font-style: italic;
            font-weight: 400;
        }
        .error {
            color: #d32f2f;
            font-size: 11px;
            font-weight: 500;
        }
        .refresh-btn {
            background: #f8f8f8;
            border: 1px solid #d1d1d1;
            color: #4a4a4a;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            margin-top: 12px;
            width: 100%;
            transition: all 0.15s ease;
            font-family: inherit;
            letter-spacing: -0.005em;
        }
        .refresh-btn:hover {
            background: #eeeeee;
            border-color: #c1c1c1;
        }
        .refresh-btn:active {
            transform: translateY(0.5px);
        }
    </style>
</head>
<body>
    <div class="header" id="header">ccusage Status</div>
    <div class="status" id="status">
        <div class="row">
            <span class="label">Cost:</span>
            <span class="value cost" id="cost">$0.00</span>
        </div>
        <div class="row">
            <span class="label">Tokens:</span>
            <span class="value" id="tokens">0</span>
        </div>
        <div class="row">
            <span class="label">Status:</span>
            <span class="value" id="status-text">Loading...</span>
        </div>
        <button class="refresh-btn" onclick="refreshData()">↻ Refresh</button>
    </div>
    <script>
        const { ipcRenderer } = require('electron');
        
        let currentDataType = 'daily';
        
        // データタイプ別のタイトル
        const typeTitles = {
            daily: '📊 Today\\'s Usage',
            monthly: '📅 Monthly Usage',
            session: '💬 Session Usage'
        };
        
        async function loadCcusageData(type = currentDataType) {
            try {
                console.log(\`🔄 \${type}データ取得リクエスト開始...\`);
                
                // ローディング状態を表示
                document.getElementById('status-text').textContent = 'Loading...';
                document.getElementById('status-text').className = 'value loading';
                
                const result = await ipcRenderer.invoke('get-ccusage-data', type);
                console.log('📦 受信データ:', result);
                
                if (result.success) {
                    const data = result.data;
                    console.log('✅ データ解析成功:', data);
                    
                    updateUI(data, type);
                } else {
                    console.error('❌ データ取得失敗:', result.error);
                    showError(result.error);
                }
            } catch (error) {
                console.error('❌ 例外エラー:', error);
                showError('データ読み込みエラー');
            }
        }
        
        function updateUI(data, type) {
            // ヘッダーを更新
            document.getElementById('header').textContent = typeTitles[type] || 'ccusage Status';
            
            // データを表示
            const cost = data.totals.totalCost.toFixed(2);
            const tokens = data.totals.totalTokens.toLocaleString();
            
            document.getElementById('cost').textContent = \`$\${cost}\`;
            document.getElementById('tokens').textContent = tokens;
            document.getElementById('status-text').textContent = 'Ready';
            document.getElementById('status-text').className = 'value';
            
            // 既存のモデル行を削除
            const existingModelRow = document.getElementById('model-row');
            if (existingModelRow) {
                existingModelRow.remove();
            }
            
            // モデル情報を表示
            let modelsData = [];
            if (type === 'daily' && data.daily && data.daily.length > 0) {
                modelsData = data.daily[0].modelsUsed;
            } else if (type === 'monthly' && data.monthly && data.monthly.length > 0) {
                modelsData = data.monthly[0].modelsUsed;
            }
            
            if (modelsData && modelsData.length > 0) {
                const models = modelsData.join(', ');
                const statusDiv = document.getElementById('status');
                const modelRow = document.createElement('div');
                modelRow.className = 'row';
                modelRow.id = 'model-row';
                modelRow.innerHTML = \`
                    <span class="label">Models:</span>
                    <span class="value" style="font-size: 10px;">\${models.replace(/claude-/g, '').replace(/-4-20250514/g, '')}</span>
                \`;
                statusDiv.insertBefore(modelRow, statusDiv.lastElementChild);
            }
        }
        
        function showError(message) {
            document.getElementById('status-text').textContent = \`Error: \${message}\`;
            document.getElementById('status-text').className = 'value error';
        }
        
        function refreshData() {
            loadCcusageData(currentDataType);
        }
        
        // IPCイベントリスナー
        ipcRenderer.on('set-data-type', (event, type) => {
            currentDataType = type;
            loadCcusageData(type);
        });
        
        ipcRenderer.on('change-data-type', (event, type) => {
            currentDataType = type;
            loadCcusageData(type);
        });
        
        // 自動更新データの受信
        ipcRenderer.on('auto-refresh-data', (event, data) => {
            if (currentDataType === 'daily') {
                updateUI(data, 'daily');
            }
        });
        
        // ページロード時にデータを取得
        window.addEventListener('DOMContentLoaded', () => {
            loadCcusageData();
        });
    </script>
</body>
</html>`;

// =============================================================================
// アプリケーション起動
// =============================================================================
new CcusageApp();