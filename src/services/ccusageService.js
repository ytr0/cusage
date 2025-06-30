const { exec } = require('child_process');

class CcusageService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分間キャッシュ
  }

  // 日本時間での今日の日付を取得
  getJapanToday() {
    const now = new Date();
    // 日本時間（UTC+9）に変換
    const japanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return japanTime.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  async getDailyUsage() {
    const cacheKey = 'daily-' + this.getJapanToday();
    
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

  async getDailyAndMonthlyUsage() {
    try {
      console.log('🔄 今日と月次データを並行取得中...');
      const [dailyData, monthlyData] = await Promise.all([
        this.getDailyUsage(),
        this.getMonthlyUsage()
      ]);
      
      console.log('✅ 並行取得成功');
      return {
        daily: dailyData,
        monthly: monthlyData,
        combined: {
          ...dailyData,
          monthlyTotals: monthlyData.totals
        }
      };
    } catch (error) {
      console.error('❌ 並行取得エラー:', error.message);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
    console.log('🗑️ キャッシュをクリアしました');
  }
}

module.exports = CcusageService;