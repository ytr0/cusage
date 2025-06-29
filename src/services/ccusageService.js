const { exec } = require('child_process');

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
        console.log('📦 キャッシュからデータを返します');
        return cached.data;
      }
    }

    try {
      console.log('🔄 ccusage daily --json を実行中...');
      const data = await this.executeCcusage('daily --json');
      
      // キャッシュに保存
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      console.log('✅ ccusageデータ取得成功');
      return data;
    } catch (error) {
      console.error('❌ ccusageデータ取得エラー:', error.message);
      throw error;
    }
  }

  async getMonthlyUsage() {
    try {
      return await this.executeCcusage('monthly --json');
    } catch (error) {
      console.error('❌ 月次データ取得エラー:', error.message);
      throw error;
    }
  }

  async getSessionUsage() {
    try {
      return await this.executeCcusage('session --json');
    } catch (error) {
      console.error('❌ セッションデータ取得エラー:', error.message);
      throw error;
    }
  }

  executeCcusage(command) {
    return new Promise((resolve, reject) => {
      const fullCommand = `npx ccusage ${command}`;
      console.log(`🔧 実行中: ${fullCommand}`);
      
      exec(fullCommand, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`ccusage実行エラー: ${error.message}`));
          return;
        }
        
        if (stderr) {
          console.warn('⚠️ ccusage stderr:', stderr);
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
    console.log('🗑️ キャッシュをクリアしました');
  }
}

module.exports = CcusageService;