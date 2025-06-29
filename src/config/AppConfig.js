const fs = require('fs');
const path = require('path');
const { app } = require('electron');

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
      console.warn('⚠️ 設定ファイル読み込みエラー:', error.message);
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
      console.log('💾 設定ファイルを保存しました');
    } catch (error) {
      console.error('❌ 設定ファイル保存エラー:', error.message);
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
    console.log('🔄 設定をリセットしました');
  }
}

module.exports = AppConfig;