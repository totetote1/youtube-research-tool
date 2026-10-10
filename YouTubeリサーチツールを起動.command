#!/bin/zsh
cd -- "${0:A:h}" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
clear
printf '\n  YouTubeリサーチツール\n\n'

if ! command -v node >/dev/null 2>&1; then
  printf 'Node.jsが必要です。https://nodejs.org/ からLTS版をインストールし、もう一度開いてください。\n\n'
  read '?Enterキーで閉じます。'
  exit 1
fi

if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)'; then
  printf 'Node.js 22.13以上が必要です。https://nodejs.org/ でLTS版を更新してください。\n'
  read '?Enterキーで閉じます。'
  exit 1
fi

node scripts/mac-launch.mjs
result=$?
if [ "$result" -ne 0 ]; then
  printf '\n起動できませんでした。上のメッセージをご確認ください。\n'
fi
read '?Enterキーで閉じます。'
exit "$result"
