

(function(){
  function isSvgSource(src){return /^data:image\/svg\+xml/i.test(src||"")||/\.svg(?:$|[?#])/i.test(src||"");}
  function upgradeDetailedFlagsFromCdn(){
    document.querySelectorAll("#land-table img[data-flag-code]").forEach(img=>{
      if(img.dataset.vectorFlag==="1")return;
      const code=String(img.dataset.flagCode||"").toLowerCase();
      if(!/^[a-z]{2}$/.test(code))return;
      const fallback=img.src;
      const probe=new Image();
      probe.onload=()=>{
        if(img.dataset.vectorFlag==="1")return;
        img.dataset.flagFallback=fallback;
        img.src=`https://flagcdn.com/${code}.svg`;
        img.removeAttribute("srcset");
        img.dataset.remoteVectorFlag="1";
        img.classList.remove("flag-bitmap-detail");
        img.classList.add("flag-vector-upgraded");
        img.onerror=()=>{
          if(img.dataset.flagFallback){
            img.src=img.dataset.flagFallback;
            img.dataset.remoteVectorFlag="";
            img.classList.remove("flag-vector-upgraded");
            img.classList.add("flag-bitmap-detail");
          }
        };
      };
      probe.src=`https://flagcdn.com/${code}.svg`;
    });
  }
  const previousFlagHtml=flagHtml;
  flagHtml=function(c,size=100){
    const code=String(c.flagCode||"").toLowerCase();
    let src=SIMPLE_FLAGS[code]||c.flag||flagUrlFromCode(c.flagCode);
    // Nepal is not rectangular; trim only its transparent SVG canvas in quizzes.
    if(code==='np'&&['flags','flagcapital'].includes(document.body.dataset.quiz)){
      try{const svg=/;base64,/.test(src)?atob(src.split(',')[1]):decodeURIComponent(src.slice(src.indexOf(',')+1));
        if(svg.includes('viewBox="0 0 600 600"'))src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg.replace('viewBox="0 0 600 600"','viewBox="65 35 455 530"'));
      }catch(_){}
    }
    const vector=isSvgSource(src);
    const asked=Math.max(36,Number(size)||100);
    const w=vector?Math.min(230,Math.max(90,asked)):Math.min(148,Math.max(80,asked));
    return `<img class="quiz-flag-img ${vector?"flag-vector-upgraded":"flag-bitmap-detail"}" src="${src}" alt="Flagget til ${c.country}" style="width:${w}px;max-width:100%;height:auto" loading="eager">`;
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",upgradeDetailedFlagsFromCdn);
  else upgradeDetailedFlagsFromCdn();
})();
