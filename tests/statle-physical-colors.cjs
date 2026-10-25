const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');

// Resolve the real stylesheet's simple state rules in CSS cascade order.
// Browser QA additionally checks actual computed style while hover/focus stays active.
const css=fs.readFileSync(process.argv[2]||path.resolve(__dirname,'../assets/geography/statle.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
const rules=[];
for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  for(const selector of match[1].split(',').map(s=>s.trim())){
    if(!/\.state(?:[.[:]|$)/.test(selector))continue;
    const attrs=[...selector.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)];
    const plain=selector.replace(/\[[^\]]*\]/g,'');
    const specificity=(plain.match(/#[\w-]+/g)||[]).length*1000000+
      (attrs.length+(plain.match(/\.[\w-]+|:[\w-]+/g)||[]).length)*1000+
      (plain.replace(/[#.:][\w-]+/g,'').match(/\b[a-z]+\b/g)||[]).length;
    const declarations=Object.fromEntries(match[2].split(';').map(d=>d.split(/:(.*)/s).slice(0,2).map(s=>s.trim())).filter(d=>d.length===2));
    rules.push({selector,specificity,attrs,declarations});
  }
}
function computed({physical=true,band,classes=[],hover=false,focus=false,dark=false}={}){
  const attributes={'data-statle-basemap':physical?'physical':'original','data-quiz':'statle',...(band===undefined?{}:{'data-band':String(band)}),...(dark?{'data-theme':'dark'}:{})};
  const stateClasses=new Set(['state',...classes]),style={},precedence={};
  for(let order=0;order<rules.length;order++){
    const rule=rules[order],tail=rule.selector.slice(rule.selector.lastIndexOf('.state'));
    if(rule.attrs.some(m=>!(m[1] in attributes)||(m[2]!==undefined&&attributes[m[1]]!==m[2])))continue;
    if([...tail.matchAll(/\.([\w-]+)/g)].some(m=>!stateClasses.has(m[1])))continue;
    if(tail.includes(':hover')&&!hover||tail.includes(':focus-visible')&&!focus)continue;
    for(const [property,value]of Object.entries(rule.declarations)){
      const priority=rule.specificity*10000+order;
      if(priority>=(precedence[property]??-1)){precedence[property]=priority;style[property]=value;}
    }
  }
  return style;
}
const bands=['var(--green)','var(--yellow)','var(--orange)','var(--red)'];
for(const dark of [false,true])for(const hover of [true,false])for(const focus of [false,true])for(const hovered of [false,true]){
  const classes=hovered?['hovered']:[];
  for(let band=0;band<4;band++){
    const style=computed({band,dark,hover,focus,classes:[...classes,'found','correct']});
    assert.equal(style.fill,bands[band],`band ${band} stays visible with hover=${hover}, focus=${focus}, hovered=${hovered}, dark=${dark}`);
    assert.equal(style.transition,'none','physical answer fill has no deferred transition');
    assert.equal(style.filter,'none','physical feedback does not run a glow/brightness SVG filter');
    assert.equal(style.stroke,'#efffe8','correct outline stays visible under hover/focus');
  }
  const wrong=computed({dark,hover,focus,classes:[...classes,'wrong']});
  assert.equal(wrong.fill,'#c3645c','a wrong state stays red under the pointer/focus');
  assert.equal(wrong['fill-opacity'],'.8');
  assert.equal(wrong.stroke,'#ffe1cd');
  assert.equal(wrong.transition,'none');assert.equal(wrong.filter,'none');
  assert.equal(computed({dark,hover,focus,classes}).fill,'transparent','unanswered physical states remain transparent click targets');
}
const original=computed({physical:false,band:0,classes:['found'],hover:true});
assert.equal(original.fill,bands[0]);
assert.equal(original.transition,'fill .18s,stroke .15s','the change is scoped to the physical basemap');
console.log('PASS physical answer colours stay immediate and visible through every hover/focus state');
