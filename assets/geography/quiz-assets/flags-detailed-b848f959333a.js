

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
    const src=SIMPLE_FLAGS[code]||c.flag||flagUrlFromCode(c.flagCode),vector=isSvgSource(src);
    const asked=Math.max(36,Number(size)||100);
    const w=vector?Math.min(230,Math.max(90,asked)):Math.min(148,Math.max(80,asked));
    return `<img class="quiz-flag-img ${vector?"flag-vector-upgraded":"flag-bitmap-detail"}" src="${src}" alt="Flagget til ${c.country}" style="width:${w}px;max-width:100%;height:auto" loading="eager">`;
  };
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",upgradeDetailedFlagsFromCdn);
  else upgradeDetailedFlagsFromCdn();
})();
