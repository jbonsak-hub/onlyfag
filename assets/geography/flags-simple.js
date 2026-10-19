

function svgUri(svg){return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);}
  function svgBase(w=3,h=2,body=""){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>`;}
  function hBands(cols,weights){
    weights=weights||cols.map(()=>1);const total=weights.reduce((a,b)=>a+b,0);let y=0,body="";
    cols.forEach((c,i)=>{const h=2*weights[i]/total;body+=`<rect width="3" height="${h}" y="${y}" fill="${c}"/>`;y+=h;});
    return svgUri(svgBase(3,2,body));
  }
  function vBands(cols,weights){
    weights=weights||cols.map(()=>1);const total=weights.reduce((a,b)=>a+b,0);let x=0,body="";
    cols.forEach((c,i)=>{const w=3*weights[i]/total;body+=`<rect height="2" width="${w}" x="${x}" fill="${c}"/>`;x+=w;});
    return svgUri(svgBase(3,2,body));
  }
  function nordic(bg,outer,inner){
    let b=`<rect width="22" height="16" fill="${bg}"/><rect x="6" width="4" height="16" fill="${outer}"/><rect y="6" width="22" height="4" fill="${outer}"/>`;
    if(inner)b+=`<rect x="7" width="2" height="16" fill="${inner}"/><rect y="7" width="22" height="2" fill="${inner}"/>`;
    return svgUri(svgBase(22,16,b));
  }
  function circleFlag(bg,cx,cy,r,fill){
    return svgUri(svgBase(3,2,`<rect width="3" height="2" fill="${bg}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`));
  }
  const SIMPLE_FLAGS={
    de:hBands(["#000","#D00","#FFCE00"]),ru:hBands(["#fff","#1351B4","#D52B1E"]),nl:hBands(["#AE1C28","#fff","#21468B"]),
    lu:hBands(["#EF3340","#fff","#00A3E0"]),at:hBands(["#ED2939","#fff","#ED2939"]),ua:hBands(["#0057B7","#FFD700"]),
    pl:hBands(["#fff","#DC143C"]),id:hBands(["#CE1126","#fff"]),mc:hBands(["#CE1126","#fff"]),hu:hBands(["#CE2939","#fff","#477050"]),
    bg:hBands(["#fff","#00966E","#D62612"]),ee:hBands(["#4891D9","#000","#fff"]),lt:hBands(["#FDB913","#006A44","#C1272D"]),
    lv:hBands(["#9E3039","#fff","#9E3039"],[2,1,2]),am:hBands(["#D90012","#0033A0","#F2A800"]),ye:hBands(["#CE1126","#fff","#000"]),
    fr:vBands(["#0055A4","#fff","#EF4135"]),it:vBands(["#009246","#fff","#CE2B37"]),ie:vBands(["#169B62","#fff","#FF883E"]),
    be:vBands(["#000","#FFD90C","#EF3340"]),ro:vBands(["#002B7F","#FCD116","#CE1126"]),td:vBands(["#002664","#FECB00","#C60C30"]),
    ml:vBands(["#14B53A","#FCD116","#CE1126"]),gn:vBands(["#CE1126","#FCD116","#009460"]),ci:vBands(["#F77F00","#fff","#009E60"]),
    ng:vBands(["#008753","#fff","#008753"]),pe:vBands(["#D91023","#fff","#D91023"]),
    no:nordic("#BA0C2F","#fff","#00205B"),se:nordic("#006AA7","#FECC00",""),dk:nordic("#C8102E","#fff",""),
    fi:nordic("#fff","#003580",""),is:nordic("#02529C","#fff","#DC1E35"),
    jp:circleFlag("#fff",1.5,1,.6,"#BC002D"),bd:circleFlag("#006A4E",1.65,1,.55,"#F42A41"),pw:circleFlag("#4AADD6",1.35,1,.55,"#FFDE00"),
    ch:svgUri(svgBase(3,2,'<rect width="3" height="2" fill="#D52B1E"/><rect x="1.25" y=".45" width=".5" height="1.1" fill="#fff"/><rect x=".95" y=".75" width="1.1" height=".5" fill="#fff"/>')),
    cz:svgUri(svgBase(3,2,'<rect width="3" height="1" fill="#fff"/><rect y="1" width="3" height="1" fill="#D7141A"/><path d="M0 0L1.35 1L0 2Z" fill="#11457E"/>')),
    ae:svgUri(svgBase(3,2,'<rect width="3" height="2" fill="#CE1126"/><rect x=".75" width="2.25" height=".667" fill="#00732F"/><rect x=".75" y=".667" width="2.25" height=".666" fill="#fff"/><rect x=".75" y="1.333" width="2.25" height=".667" fill="#000"/>')),
    kw:svgUri(svgBase(3,2,'<rect width="3" height=".667" fill="#007A3D"/><rect y=".667" width="3" height=".666" fill="#fff"/><rect y="1.333" width="3" height=".667" fill="#CE1126"/><path d="M0 0L.72 .5V1.5L0 2Z" fill="#000"/>')),
    th:hBands(["#A51931","#F4F5F8","#2D2A4A","#F4F5F8","#A51931"],[1,1,2,1,1]),
    gm:hBands(["#CE1126","#fff","#0C1C8C","#fff","#3A7728"],[3,1,2,1,3]),
    bw:hBands(["#75AADB","#fff","#000","#fff","#75AADB"],[4,1,2,1,4]),
    ba:svgUri(svgBase(30,20,'<rect width="30" height="20" fill="#002F87"/><polygon points="10,0 26,0 26,20" fill="#FECB00"/><defs><polygon id="s" points="0,-1.22 .34,-.38 1.28,-.38 .52,.15 .82,.98 0,.5 -.82,.98 -.52,.15 -1.28,-.38 -.34,-.38"/></defs><g fill="#fff"><use href="#s" x="7.55" y="-0.35"/><use href="#s" x="10.05" y="2.55"/><use href="#s" x="12.55" y="5.45"/><use href="#s" x="15.05" y="8.35"/><use href="#s" x="17.55" y="11.25"/><use href="#s" x="20.05" y="14.15"/><use href="#s" x="22.55" y="17.05"/><use href="#s" x="25.05" y="19.95"/></g>'))
  };
  function upgradeSimpleFlags(){
    document.querySelectorAll("#land-table img[data-flag-code]").forEach(img=>{
      const code=String(img.dataset.flagCode||"").toLowerCase();
      const src=SIMPLE_FLAGS[code];
      if(src){
        img.src=src;img.removeAttribute("srcset");img.dataset.vectorFlag="1";
        img.classList.add("flag-vector-upgraded");
      }else{
        img.classList.add("flag-bitmap-detail");
      }
    });
  }
  const oldFlagHtml=flagHtml;
  flagHtml=function(c,size=100){
    const code=String(c.flagCode||"").toLowerCase();
    const src=SIMPLE_FLAGS[code]||c.flag||flagUrlFromCode(c.flagCode),isVector=String(src).startsWith("data:image/svg+xml");
    const asked=Math.max(36,Number(size)||100);
    const w=isVector?Math.min(220,Math.max(90,asked)):Math.min(148,Math.max(80,asked));
    return `<img class="quiz-flag-img ${isVector?"flag-vector-upgraded":"flag-bitmap-detail"}" src="${src}" alt="Flagget til ${c.country}" style="width:${w}px;max-width:100%;height:auto" loading="eager">`;
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",upgradeSimpleFlags);
  else upgradeSimpleFlags();
