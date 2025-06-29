const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

let tray = null;
let popupWindow = null;

function getCcusageData() {
  return new Promise((resolve, reject) => {
    exec('npx ccusage daily --json', (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      try {
        const data = JSON.parse(stdout);
        resolve(data);
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

function createTray() {
  // macOSでテキストのみを表示
  if (process.platform === 'darwin') {
    // 透明な1x1のアイコンを作成
    const icon = nativeImage.createEmpty();
    tray = new Tray(icon);
    tray.setTitle('💰'); // 絵文字アイコンを表示
  } else {
    // WindowsやLinuxでは通常のアイコンを使用
    const icon = nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADFSURBVDiNY2AYBaNgFAyEAUYGBgYGhv///zMwMjIy0NIARkZGRgYWWumGacZpANkGwNX9h/uamhgYsRjASE0DGMnyPQMjVhdQ6gJGRkZGBpyJgYqAkZoBRIsGhoGMBZS6gJGaBlBsACMjIyNDQEAAw6VLl6jpAoKasWqmpgtolhhGEwNtUsNoKhhZCkcVDjKFDA0NDbTQnJKSwvD//39GahdQzYABBaNgFIyCUUBzAABNTyTI2tx0BgAAAABJRU5ErkJggg==');
    tray = new Tray(icon);
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'ccusage使用量を表示',
      click: () => {
        showPopupWindow();
      }
    },
    {
      type: 'separator'
    },
    {
      label: '終了',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('ccusage Menubar App');
  tray.setContextMenu(contextMenu);
}

function showPopupWindow() {
  if (popupWindow) {
    popupWindow.focus();
    return;
  }

  popupWindow = new BrowserWindow({
    width: 380,
    height: 240,
    show: false,
    frame: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  popupWindow.loadFile('popup.html');
  
  popupWindow.once('ready-to-show', () => {
    popupWindow.show();
  });

  popupWindow.on('blur', () => {
    popupWindow.close();
  });

  popupWindow.on('closed', () => {
    popupWindow = null;
  });
}

// IPCハンドラーを設定
ipcMain.handle('get-ccusage-data', async () => {
  try {
    console.log('📊 ccusageデータ取得開始...');
    const data = await getCcusageData();
    console.log('✅ ccusageデータ取得成功:', data.totals);
    return { success: true, data };
  } catch (error) {
    console.error('❌ ccusageデータ取得エラー:', error.message);
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  createTray();
  console.log('✅ システムトレイが作成されました');
});

app.on('window-all-closed', () => {
  // メニューバーアプリなので、ウィンドウが閉じてもアプリは終了しない
});

// Dock（macOS）やタスクバー（Windows）に表示しない
app.dock && app.dock.hide();