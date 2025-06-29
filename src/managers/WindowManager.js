const { BrowserWindow } = require('electron');
const path = require('path');

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

    // ポップアップファイルのパスを修正
    const popupPath = path.join(__dirname, '../../popup.html');
    this.popupWindow.loadFile(popupPath);

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

module.exports = WindowManager;