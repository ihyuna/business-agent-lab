#!/bin/sh
cd "$(dirname "$0")"
{ cat src/00-head.html; printf '<script>\n(()=>{\n'; cat src/10-data.js src/20-logic.js src/30-views.js src/31-views2.js src/32-charts.js src/35-guide.js src/40-actions.js; printf '\nwindow.__pt={get S(){return S},UI,ACT,ON,G,SCENES,gotoScene};\n})();\n</script>\n'; } > index.html
wc -c index.html
# 크롬에서 바로 여는 독립 페이지 (GitHub Pages나 파일로 열기)
{ printf '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="PT 기록">\n</head>\n<body>\n'; cat index.html; printf '\n</body>\n</html>\n'; } > app.html
