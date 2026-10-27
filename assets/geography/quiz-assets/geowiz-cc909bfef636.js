

(function(){
  let worldMap=null;
  const worldMapImage=()=>worldMap?.image||GEO_MAP_DATA;
  // The map image and both click projections share one generated Mercator fit.
  // Keep the legacy fit until the current MapWiz page installs its metadata.
  window.MapWizWorld={install(metadata){
    if(metadata?.projection!=='mercator'||!metadata.image||!(metadata.top>metadata.bottom))throw Error('Invalid world map');
    worldMap=metadata;
    const top=geoMercatorY(metadata.top),bottom=geoMercatorY(metadata.bottom);
    geoToPercent=function(lat,lon){return {x:(lon+180)/360*100,y:(top-geoMercatorY(lat))/(top-bottom)*100};};
    geoPercentToLatLon=function(x,y){return {lon:x/100*360-180,lat:geoInverseMercatorY(top-y/100*(top-bottom))};};
  },get image(){return worldMapImage();},get metadata(){return worldMap;}};
  // Generated atlas metadata is kept with its projection so rendered pixels and
  // submitted answers use exactly the same coordinates, including both insets.
  const NO_ATLAS = /* mapwiz-norway-atlas:start */ {"version":1,"width":1360.629,"height":1500.617,"areas":[{"id":"mainland","rect":[0,0,1360.629,1500.617],"projection":{"type":"registered-lambert-conic","coneConstant":0.8990395456797843,"centralMeridian":15,"matrix":[[11.431284357479102,0.18007866650580012],[0.1788572971879697,-11.411085457473396],[680.1042916371192,-2211.155025382398]]}},{"id":"svalbard","rect":[28,34,435,435],"projection":{"type":"equirectangular","bounds":[7,36,75.5,81.5]}},{"id":"jan-mayen","rect":[28,505,250,250],"projection":{"type":"equirectangular","bounds":[-9.4,-7.6,70.65,71.25]}}],"image":"/assets/geography/mapwiz-norway/physical-411ab1d39e2a.webp"} /* mapwiz-norway-atlas:end */;

  function noAtlasArea(lat,lon){
    return NO_ATLAS.areas.find(area=>area.id===(lat>=74?'svalbard':lon<0?'jan-mayen':'mainland'));
  }
  function noAreaProject(lat,lon,area){
    const p=area.projection;
    if(p.type==='registered-lambert-conic'){
      const rho=1000/Math.tan(Math.PI/4+lat*Math.PI/360)**p.coneConstant;
      const angle=p.coneConstant*(lon-p.centralMeridian)*Math.PI/180;
      const x=rho*Math.sin(angle),y=-rho*Math.cos(angle),m=p.matrix;
      return {x:x*m[0][0]+y*m[1][0]+m[2][0],y:x*m[0][1]+y*m[1][1]+m[2][1]};
    }
    const [west,east,south,north]=p.bounds;
    return {x:area.rect[0]+(lon-west)/(east-west)*area.rect[2],y:area.rect[1]+(north-lat)/(north-south)*area.rect[3]};
  }
  function noAtlasProject(lat,lon){
    const point=noAreaProject(lat,lon,noAtlasArea(lat,lon));
    return {x:point.x/NO_ATLAS.width,y:point.y/NO_ATLAS.height};
  }
  function noAtlasInverse(x,y){
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<0||x>1||y<0||y>1)return null;
    const px=x*NO_ATLAS.width,py=y*NO_ATLAS.height;
    const inset=NO_ATLAS.areas.find(area=>area.id!=='mainland'&&px>=area.rect[0]&&px<=area.rect[0]+area.rect[2]&&py>=area.rect[1]&&py<=area.rect[1]+area.rect[3]);
    if(inset){const [west,east,south,north]=inset.projection.bounds;return {lon:west+(px-inset.rect[0])/inset.rect[2]*(east-west),lat:north-(py-inset.rect[1])/inset.rect[3]*(north-south)};}
    const p=NO_ATLAS.areas[0].projection,m=p.matrix,dx=px-m[2][0],dy=py-m[2][1],det=m[0][0]*m[1][1]-m[1][0]*m[0][1];
    const rx=(dx*m[1][1]-dy*m[1][0])/det,ry=(dy*m[0][0]-dx*m[0][1])/det;
    const rho=Math.hypot(rx,ry)/1000;
    return {lon:p.centralMeridian+Math.atan2(rx,-ry)/p.coneConstant*180/Math.PI,lat:(2*Math.atan(rho**(-1/p.coneConstant))-Math.PI/2)*180/Math.PI};
  }
  window.MapWizNorway={project:noAtlasProject,inverse:noAtlasInverse,atlas:NO_ATLAS};

  function norwayTargets(){
    return geoUniqueTargets(
      GEO_PLACE_TARGETS.filter(t=>t.category==="Norge"&&Number.isFinite(t.lat)&&Number.isFinite(t.lon))
    );
  }

  geoPlayableCapitals=function(){
    const allowed=new Set(COUNTRY_MAP_ALL.map(normalizeAnswer));
    return geoUniqueTargets(
      GEO_CAPITAL_TARGETS.filter(t=>geoPlayable(t)&&allowed.has(normalizeAnswer(t.country)))
    );
  };

  geoPlayablePlaces=function(){
    const seen=new Set();
    return GEO_PLACE_TARGETS.filter(t=>geoPlayable(t)||t.category==="Norge").filter(t=>{
      const key=(t.category+'|'+t.name+'|'+t.lat.toFixed(3)+'|'+t.lon.toFixed(3)).toLowerCase();
      if(seen.has(key))return false;
      seen.add(key);
      return true;
    });
  };

  geoSelectionOptions=function(){
    const places=geoPlayablePlaces();
    const categories=[];
    for(const t of places){
      if(t.category&&t.category!=="Norge"&&!categories.includes(t.category))categories.push(t.category);
    }
    return [
      {key:"capitals",label:"Hovedsteder",count:geoPlayableCapitals().length},
      ...categories.map(category=>({
        key:"place:"+category,
        label:category,
        count:places.filter(t=>t.category===category).length
      })),
      {key:"place:Norge",label:"Norge",count:norwayTargets().length,special:true}
    ];
  };

  ensureGeoGuessrSelection=function(){
    const options=geoSelectionOptions();
    const valid=new Set(options.map(o=>o.key));
    if(!(geoGuessrSelection instanceof Set)){
      geoGuessrSelection=new Set(options.map(o=>o.key));
    }else{
      geoGuessrSelection=new Set([...geoGuessrSelection].filter(k=>valid.has(k)));
    }
  };

  function isNorwayOnly(){
    ensureGeoGuessrSelection();
    return geoGuessrSelection.size===1&&geoGuessrSelection.has("place:Norge");
  }

  geoTargetPoolFromSelection=function(){
    ensureGeoGuessrSelection();
    const pool=[];
    if(geoGuessrSelection.has("capitals"))pool.push(...geoPlayableCapitals());

    const norwayOnly=isNorwayOnly();
    for(const t of geoPlayablePlaces()){
      if(!geoGuessrSelection.has("place:"+t.category))continue;

      if(t.category==="Norge"&&!norwayOnly&&t.lat>75)continue;
      pool.push(t);
    }
    return geoUniqueTargets(pool);
  };

  initGeoGuessr=function(){
    stopGeoGuessrClock();geoGuessrState=null;
    const app=document.getElementById("geo-guessr-app");if(!app)return;
    ensureGeoGuessrSelection();
    const options=geoSelectionOptions();

    const items=options.map(o=>{
      const special=o.special?" geo-norway-special":"";
      const curriculum=o.key==="place:Geografifaget1"?" geo-curriculum-category":"";
      const sub=o.special
        ? `${o.count} steder · alene: eget Norgeskart · sammen med andre: verdenskart`
        : `${o.count} steder`;
      return `<label class="geo-selection-item${special}${curriculum}">
        <input type="checkbox" data-geo-key="${escapeGeoHtml(o.key)}" ${geoGuessrSelection.has(o.key)?"checked":""} onchange="toggleGeoGuessrSelectionCheckbox(this)">
        <span><strong>${escapeGeoHtml(o.label)}${o.special?'<span class="geo-norway-special-note">eget kart når valgt alene</span>':""}</strong><small>${sub}</small></span>
      </label>`;
    }).join("");

    const selectedCount=geoTargetPoolFromSelection().length;
    const curriculumPlaces=geoPlayablePlaces().filter(t=>t.category==="Geografifaget1");
    app.innerHTML=`<div class="geo-guessr-setup-wrap"><div class="geo-guessr-setup">
      <h3>MapWiz</h3>
      <p>Klikk på kjente steder på kartet. Jo nærmere du kommer desto mer poeng får du. Maks er 100 geografipoeng + 10 tidsbonus per sted.</p>
      <div class="geo-selection-tools"><button type="button" onclick="setAllGeoGuessrSelections(true)">Velg alle</button><button type="button" onclick="setAllGeoGuessrSelections(false)">Fjern alle</button><span class="geo-selection-count" id="geo-selection-count">${selectedCount} steder valgt</span></div>
      <div class="geo-selection-grid">${items}</div>
      <div class="geo-selection-error" id="geo-selection-error"></div>
      <div class="geo-setup-actions"><button class="geo-start-button" id="geo-start-button" onclick="startGeoGuessr()" ${selectedCount<10?"disabled":""}>${geoGuessrSelection.size===1&&geoGuessrSelection.has("place:Geografifaget1")?`Start alle ${curriculumPlaces.length} steder`:"Start 10 steder"}</button><button class="geo-setup-back" onclick="exitQuizMode()">Tilbake til testvalg</button></div>
    </div></div>`;
  };

  toggleGeoGuessrSelectionCheckbox=function(input){
    ensureGeoGuessrSelection();
    const key=input?.dataset?.geoKey;if(!key)return;
    if(input.checked)geoGuessrSelection.add(key);
    else geoGuessrSelection.delete(key);
    refreshGeoGuessrSelectionStatus();
  };

  setAllGeoGuessrSelections=function(on){
    const options=geoSelectionOptions();
    geoGuessrSelection=on?new Set(options.map(o=>o.key)):new Set();
    document.querySelectorAll('.geo-selection-item input[type="checkbox"]').forEach(el=>el.checked=on);
    refreshGeoGuessrSelectionStatus();
  };

  function noMapHtml(){
    return `<div class="geo-no-continuous-frame" data-no-frame="all"><img src="${NO_ATLAS.image}" alt="Fysisk kart over fastlands-Norge med egne utsnitt for Svalbard og Jan Mayen"></div>
      <div class="geo-no-continuous-source">Kart: Kartverket · Natural Earth · egne målestokker i øyutsnittene</div>`;
  }

  // Summary views can switch between the world and Norway while keeping the
  // result card, navigation and their handlers in place.
  window.MapWizMapView={set(norwayOnly){
    const stage=document.getElementById("geo-map-stage");if(!stage)return null;
    const same=stage.classList.contains("norway-continuous-mode")===!!norwayOnly;
    if(same&&stage.querySelector(norwayOnly?'[data-no-frame]':'.geo-world-content'))return stage;
    stage.classList.toggle("norway-continuous-mode",!!norwayOnly);
    stage.querySelectorAll('.geo-no-continuous-frame,.geo-no-continuous-source,.geo-world-scroll,.geo-mobile-pan-tip,.geo-map-image,.geo-line-layer,#geo-markers').forEach(node=>node.remove());
    const overlays='<svg class="geo-line-layer" id="geo-line-layer" viewBox="0 0 100 100" preserveAspectRatio="none"></svg><div id="geo-markers"></div>';
    const template=document.createElement('template');
    template.innerHTML=norwayOnly?noMapHtml()+overlays:`<div class="geo-world-scroll"><div class="geo-world-content"><img class="geo-map-image" alt="Fysisk verdenskart" src="${worldMapImage()}">${overlays}</div></div><span class="geo-mobile-pan-tip">Dra kartet sidelengs</span>`;
    stage.prepend(template.content);
    const scroll=stage.querySelector('.geo-world-scroll');
    if(scroll)requestAnimationFrame(()=>{if(scroll.isConnected)scroll.scrollLeft=(scroll.scrollWidth-scroll.clientWidth)/2;});
    return stage;
  }};
  window.MapWizNorway.html=noMapHtml;

  function noFrameRect(stage){
    return stage.querySelector('[data-no-frame="all"]')?.getBoundingClientRect()||null;
  }

  function noClick(ev,stage){
    const fr=noFrameRect(stage);if(!fr)return null;
    if(ev.clientX<fr.left||ev.clientX>fr.right||ev.clientY<fr.top||ev.clientY>fr.bottom)return null;
    const x=(ev.clientX-fr.left)/fr.width;
    const y=(ev.clientY-fr.top)/fr.height;
    const ll=noAtlasInverse(x,y);if(!ll)return null;
    const sr=stage.getBoundingClientRect();
    return {
      ...ll,
      x:(ev.clientX-sr.left)/sr.width*100,
      y:(ev.clientY-sr.top)/sr.height*100
    };
  }

  function noTargetPct(stage,target){
    const fr=noFrameRect(stage),sr=stage.getBoundingClientRect();
    if(!fr)return {x:50,y:50};
    const p=noAtlasProject(target.lat,target.lon);
    return {
      x:(fr.left-sr.left+p.x*fr.width)/sr.width*100,
      y:(fr.top-sr.top+p.y*fr.height)/sr.height*100
    };
  }

  startGeoGuessr=function(){
    stopGeoGuessrClock();
    const pool=shuffleArray(geoTargetPoolFromSelection());
    if(pool.length<10){refreshGeoGuessrSelectionStatus();return}
    const rounds=pool.slice(0,10);
    geoGuessrState={
      rounds,index:0,total:0,baseTotal:0,bonusTotal:0,results:[],
      answered:false,questionStarted:performance.now(),norwayOnly:isNorwayOnly()
    };
    renderGeoGuessrRound();
  };

  renderGeoGuessrRound=function(){
    stopGeoGuessrClock();
    const s=geoGuessrState,app=document.getElementById("geo-guessr-app");if(!s||!app)return;
    if(s.index>=s.rounds.length)return renderGeoGuessrSummary();
    s.answered=false;s.questionStarted=performance.now();
    const t=s.rounds[s.index];
    const bg=s.norwayOnly
      ? noMapHtml()
      : `<img class="geo-map-image" alt="Fysisk verdenskart" src="${worldMapImage()}">`;

    app.innerHTML=`<div class="geo-map-stage ${s.norwayOnly?"norway-continuous-mode":""}" id="geo-map-stage" onclick="geoMapClick(event)">
      ${s.norwayOnly?"":'<div class="geo-world-scroll"><div class="geo-world-content">'}
      ${bg}
      <svg class="geo-line-layer" id="geo-line-layer" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
      <div id="geo-markers"></div>
      ${s.norwayOnly?"":'</div></div><span class="geo-mobile-pan-tip">Dra kartet sidelengs</span>'}
      <button class="geo-map-exit" onclick="event.stopPropagation();initGeoGuessr()">Avslutt</button>
      <div class="geo-hud" id="geo-hud" onclick="event.stopPropagation()">
        <div class="geo-hud-top"><span class="geo-hud-pill">${s.index+1} / ${s.rounds.length}</span><span class="geo-hud-pill">Poeng: ${s.total.toFixed(1)}</span><span class="geo-hud-spacer"></span><span class="geo-hud-pill" id="geo-time-pill">Mulig tidsbonus: 10.0</span></div>
        <div class="geo-target-label">${escapeGeoHtml(t.name)}</div>
        <div class="geo-hint" id="geo-hint">${s.norwayOnly?"Klikk der du mener stedet ligger på Norgeskartet.":"Klikk på kartet der du mener stedet ligger."}</div>
        <div class="geo-feedback" id="geo-feedback" style="display:none"></div>
      </div>
    </div>`;
    const scroll=app.querySelector(".geo-world-scroll");
    if(scroll)requestAnimationFrame(()=>{if(scroll.isConnected)scroll.scrollLeft=(scroll.scrollWidth-scroll.clientWidth)/2;});
    geoGuessrClock=setInterval(updateGeoGuessrClock,100);
  };

  geoMapClick=function(ev){
    const s=geoGuessrState;if(!s||s.answered)return;
    const stage=document.getElementById("geo-map-stage");if(!stage)return;
    const target=s.rounds[s.index];

    let guess,guessPct,targetPct;
    if(s.norwayOnly){
      const p=noClick(ev,stage);if(!p)return;
      guess={lat:p.lat,lon:p.lon};
      guessPct={x:p.x,y:p.y};
      targetPct=noTargetPct(stage,target);
    }else{
      const r=(stage.querySelector(".geo-world-content")||stage).getBoundingClientRect();
      const x=(ev.clientX-r.left)/r.width*100;
      const y=(ev.clientY-r.top)/r.height*100;
      if(x<0||x>100||y<0||y>100)return;
      guess=geoPercentToLatLon(x,y);
      guessPct={x,y};
      targetPct=geoToPercent(target.lat,target.lon);
    }

    s.answered=true;stopGeoGuessrClock();
    const km=geoDistanceKm(guess,target);
    const elapsed=(performance.now()-s.questionStarted)/1000;
    const base=s.norwayOnly
      ? (km<=15?100:Math.max(0,100*Math.exp(-(km-15)/190)))
      : geoBasePoints(km);
    const bonus=geoAdjustedTimeBonus(elapsed,base);
    const points=base+bonus;

    s.total+=points;s.baseTotal+=base;s.bonusTotal+=bonus;
    s.results.push({name:target.name,km,base,bonus,points});

    const markers=document.getElementById("geo-markers");
    if(markers)markers.innerHTML=`<div class="geo-marker guess" style="left:${guessPct.x}%;top:${guessPct.y}%" title="Ditt treff"></div><div class="geo-marker answer" style="left:${targetPct.x}%;top:${targetPct.y}%" title="Riktig sted"></div>`;
    const svg=document.getElementById("geo-line-layer");
    if(svg)svg.innerHTML=s.norwayOnly?`<line x1="${guessPct.x}" y1="${guessPct.y}" x2="${targetPct.x}" y2="${targetPct.y}"></line>`:geoWrappedLineSvg(guessPct.x,guessPct.y,targetPct.x,targetPct.y);

    const description=target.kind==="Hovedstad"
      ? `Hovedstad i ${target.country}.`
      : (target.explanation||target.category||"Kjent sted");
    const hud=document.getElementById("geo-hud");if(hud)hud.classList.add("answered");
    const hint=document.getElementById("geo-hint");if(hint)hint.textContent=description;
    const fb=document.getElementById("geo-feedback");
    if(fb){
      fb.style.display="block";
      fb.innerHTML=`<strong>${Math.round(km).toLocaleString("nb-NO")} km unna</strong> · ${base.toFixed(1)} geografi + ${bonus.toFixed(1)} tidsbonus = <strong>${points.toFixed(1)} p</strong><br><button class="geo-next-button" onclick="nextGeoGuessrRound()">${s.index+1>=s.rounds.length?"Se resultat (space)":"Neste sted (space)"}</button>`;
    }
    const pill=document.getElementById("geo-time-pill");if(pill)pill.textContent=`Tidsbonus: ${bonus.toFixed(1)}`;
  };

  const oldSummaryV36=renderGeoGuessrSummary;
  renderGeoGuessrSummary=function(){
    const s=geoGuessrState;
    if(!s?.norwayOnly)return oldSummaryV36();
    stopGeoGuessrClock();
    const app=document.getElementById("geo-guessr-app");if(!app)return;
    const rows=s.results.map(r=>`<div class="geo-summary-row"><span>${escapeGeoHtml(r.name)}</span><span>${Math.round(r.km).toLocaleString("nb-NO")} km</span><span>${r.points.toFixed(1)} p</span></div>`).join("");
    app.innerHTML=`<div class="geo-map-stage norway-continuous-mode">
      ${noMapHtml()}
      <button class="geo-map-exit" onclick="initGeoGuessr()">Avslutt</button>
      <div class="geo-hud geo-summary-hud">
        <div class="geo-target-label">${s.total.toFixed(1)} / ${s.rounds.length*110} poeng</div>
        <div class="geo-hint">Geografi: ${s.baseTotal.toFixed(1)} · tidsbonus: ${s.bonusTotal.toFixed(1)}</div>
        <div class="geo-summary"><div class="geo-summary-header"><span>Sted</span><span>Avstand</span><span>Poeng</span></div>${rows}</div>
        <div class="geo-summary-actions"><button class="geo-next-button" onclick="startGeoGuessr()">Spill igjen</button><button class="geo-next-button" onclick="initGeoGuessr()">Endre utvalg</button><button class="geo-next-button" onclick="exitQuizMode()">Tilbake</button></div>
      </div>
    </div>`;
  };
})();
