#!/bin/bash

# ccusage Menubar App 起動スクリプト
# 使用方法: ./start-cusage.sh または alias cusage='~/ytr0tools/cusage/start-cusage.sh'

APP_DIR="$HOME/ytr0tools/cusage"
LOG_FILE="/tmp/cusage.log"
PID_FILE="/tmp/cusage.pid"

# 既に実行中かチェック
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "⚠️  cusageは既に実行中です (PID: $PID)"
        echo "🔍 プロセスを終了するには: kill $PID"
        exit 1
    else
        # 古いPIDファイルを削除
        rm -f "$PID_FILE"
    fi
fi

# アプリディレクトリに移動
cd "$APP_DIR" || {
    echo "❌ アプリディレクトリが見つかりません: $APP_DIR"
    exit 1
}

# 古いログファイルを削除
rm -f "$LOG_FILE"

echo "🚀 cusage Menubar Appを起動しています..."
echo "📁 ディレクトリ: $APP_DIR"
echo "📋 ログファイル: $LOG_FILE"

# バックグラウンドで起動
nohup npm run start > "$LOG_FILE" 2>&1 &
APP_PID=$!

# PIDを保存
echo "$APP_PID" > "$PID_FILE"

echo "✅ cusageが起動しました (PID: $APP_PID)"
echo "📊 メニューバーを確認してください"
echo "🔍 ログを確認: tail -f $LOG_FILE"
echo "🛑 停止するには: kill $APP_PID"

# 3秒後にアプリが正常に起動したかチェック
sleep 3
if ps -p "$APP_PID" > /dev/null 2>&1; then
    echo "✅ アプリは正常に実行中です"
else
    echo "❌ アプリの起動に失敗しました"
    echo "📋 エラーログ:"
    cat "$LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi