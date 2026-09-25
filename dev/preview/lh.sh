#!/bin/sh
# Lighthouse against the local render: ./lh.sh <page> <mobile|desktop>
cd "$(dirname "$0")"
page=${1:-index.html}; mode=${2:-mobile}; out="lh/${page%.html}-$mode.json"
preset=""; [ "$mode" = desktop ] && preset="--preset=desktop"
CHROME_PATH=${CHROMIUM:-/opt/pw-browsers/chromium} npx lighthouse "http://localhost:4173/$page" \
  --chrome-flags="--headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader" \
  --only-categories=performance,accessibility,best-practices,seo $preset \
  --output=json --output-path="$out" --quiet 2>lh/err.log || { tail -5 lh/err.log; exit 1; }
node -e "
const r=require('./$out'); const c=r.categories, a=r.audits;
console.log('$page $mode', Object.entries(c).map(([k,v])=>k+':'+Math.round(v.score*100)).join(' '),
 '| LCP', a['largest-contentful-paint'].displayValue, '| TBT', a['total-blocking-time'].displayValue, '| CLS', a['cumulative-layout-shift'].displayValue, '| FCP', a['first-contentful-paint'].displayValue);
for (const [id,au] of Object.entries(a)) if (au.score!==null && au.score<0.9 && ['accessibility','seo','best-practices'].some(cat=>c[cat].auditRefs.some(x=>x.id===id&&x.weight>0))) console.log('   x', id, au.displayValue||'');
"
