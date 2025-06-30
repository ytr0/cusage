const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

class TrayManager {
  constructor(windowManager, ccusageService) {
    this.tray = null;
    this.windowManager = windowManager;
    this.ccusageService = ccusageService;
    this.updateTimer = null;
    this.updateInterval = 5 * 60 * 1000; // 5分間隔
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
      this.startAutoUpdate();
      
      console.log('✅ システムトレイが作成されました');
    } catch (error) {
      console.error('❌ システムトレイ作成エラー:', error);
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
          const { app } = require('electron');
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
    const { screen } = require('electron');
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
      
      // 今日の日付を取得（日本時間）
      const today = this.getJapanToday();
      
      // 今日のデータのみを取得
      const todayData = data.daily.find(day => day.date === today);
      
      if (todayData) {
        const cost = todayData.totalCost.toFixed(2);
        const tokens = (todayData.totalTokens / 1000000).toFixed(1);
        
        const tooltip = `Today's Usage
Cost: $${cost}
Tokens: ${tokens}M
Models: ${todayData.modelsUsed?.length || 0}

Left click: View details
Right click: Menu`;
        
        this.tray.setToolTip(tooltip);
        
        // タイトルも更新（macOS）
        if (process.platform === 'darwin') {
          this.tray.setTitle(`$${cost}`);
        }
      } else {
        const tooltip = `Today's Usage
Cost: $0.00
Tokens: 0.0M
Models: 0

Left click: View details
Right click: Menu`;
        
        this.tray.setToolTip(tooltip);
        
        // タイトルも更新（macOS）
        if (process.platform === 'darwin') {
          this.tray.setTitle('$0.00');
        }
      }
    } catch (error) {
      console.error('❌ ツールチップ更新エラー:', error);
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

  startAutoUpdate() {
    // 初回実行
    this.updateTrayTitle();
    
    // 定期実行
    this.updateTimer = setInterval(() => {
      this.updateTrayTitle();
    }, this.updateInterval);
    
    console.log('✅ 定期更新開始（5分間隔）');
  }

  async updateTrayTitle() {
    try {
      const data = await this.ccusageService.getDailyUsage();
      
      // 今日の日付を取得（日本時間）
      const today = this.getJapanToday();
      
      // 今日のデータのみを取得
      const todayData = data.daily.find(day => day.date === today);
      const cost = todayData ? todayData.totalCost.toFixed(2) : '0.00';
      
      if (process.platform === 'darwin') {
        this.tray.setTitle(`$${cost}`);
      }
      
      console.log(`💰 メニューバー金額更新（今日のみ）: $${cost}`);
    } catch (error) {
      console.error('❌ メニューバータイトル更新エラー:', error);
      if (process.platform === 'darwin') {
        this.tray.setTitle('$ERR');
      }
    }
  }

  // 日本時間での今日の日付を取得
  getJapanToday() {
    const now = new Date();
    // 日本時間（UTC+9）に変換
    const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return japanTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  destroy() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = TrayManager;