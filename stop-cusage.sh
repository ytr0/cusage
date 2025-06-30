#!/bin/bash

# ccusage Menubar App 停止スクリプト
# 使用方法: ./stop-cusage.sh

PID_FILE="/tmp/cusage.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "🛑 cusageを停止しています (PID: $PID)..."
        kill "$PID"
        rm -f "$PID_FILE"
        echo "✅ cusageが停止されました"
    else
        echo "⚠️  指定されたPIDのプロセスが見つかりません"
        rm -f "$PID_FILE"
    fi
else
    echo "⚠️  cusageは実行されていません（PIDファイルなし）"
fi

# 念のため、他のElectronプロセスもチェック
ELECTRON_PIDS=$(pgrep -f "electron.*ccusage")
if [ -n "$ELECTRON_PIDS" ]; then
    echo "🔍 他のcusage関連プロセスが見つかりました:"
    echo "$ELECTRON_PIDS"
    echo "🛑 これらも停止しますか？ (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "$ELECTRON_PIDS" | xargs kill
        echo "✅ 全てのcusage関連プロセスを停止しました"
    fi
fi