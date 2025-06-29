const { app, ipcMain } = require('electron');
const path = require('path');

// モジュールのインポート
const CcusageService = require('./services/ccusageService');
const TrayManager = require('./managers/TrayManager');
const WindowManager = require('./managers/WindowManager');
const AppConfig = require('./config/AppConfig');
const AutoRefreshService = require('./services/AutoRefreshService');

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
        console.log(`📊 ${type}データ取得開始...`);
        
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
        
        console.log(`✅ ${type}データ取得成功`);
        return { success: true, data, type };
      } catch (error) {
        console.error(`❌ ${type}データ取得エラー:`, error.message);
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
      console.log('🚀 ccusage Menubar App が起動しました');
    } catch (error) {
      console.error('❌ アプリ初期化エラー:', error);
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
    console.log('👋 アプリを終了します');
  }
}

// アプリケーション起動
new CcusageApp();