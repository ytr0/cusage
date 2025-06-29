class AutoRefreshService {
  constructor(ccusageService, config) {
    this.ccusageService = ccusageService;
    this.config = config;
    this.intervalId = null;
    this.callbacks = new Set();
  }

  start() {
    if (!this.config.get('autoRefresh')) {
      console.log('📴 自動更新は無効になっています');
      return;
    }

    this.stop(); // 既存のタイマーを停止

    const interval = this.config.get('autoRefreshInterval');
    console.log(`⏰ 自動更新を開始します (${interval / 1000}秒間隔)`);
    
    this.intervalId = setInterval(async () => {
      try {
        console.log('🔄 自動更新: データを取得中...');
        const data = await this.ccusageService.getDailyUsage();
        
        // すべてのコールバックを実行
        this.callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('❌ コールバック実行エラー:', error);
          }
        });
        
        console.log('✅ 自動更新完了');
      } catch (error) {
        console.error('❌ 自動更新エラー:', error);
      }
    }, interval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ 自動更新を停止しました');
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

module.exports = AutoRefreshService;