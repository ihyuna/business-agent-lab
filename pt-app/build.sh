#!/bin/sh
cd "$(dirname "$0")"
{ cat src/00-head.html; printf '<script>\n(()=>{\n'; cat src/10-data.js src/20-logic.js src/30-views.js src/31-views2.js src/35-guide.js src/40-actions.js; printf '\nwindow.__pt={get S(){return S},UI,ACT,ON,G,SCENES,gotoScene};\n})();\n</script>\n'; } > index.html
wc -c index.html
