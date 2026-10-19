
(function(){
  function geoWizNorwayOnly(){
    try{
      ensureGeoGuessrSelection();
      return geoGuessrSelection instanceof Set &&
             geoGuessrSelection.size===1 &&
             geoGuessrSelection.has('place:Norge');
    }catch(e){return false}
  }

  function geoWizCategoryBuckets(){
    ensureGeoGuessrSelection();
    const norwayOnly=geoWizNorwayOnly();
    const buckets=[];

    if(geoGuessrSelection.has('capitals')){
      const items=geoUniqueTargets(geoPlayableCapitals()).slice();
      if(items.length)buckets.push({key:'capitals',items:shuffleArray(items)});
    }

    const places=geoPlayablePlaces();
    const selectedPlaceCategories=[...geoGuessrSelection]
      .filter(k=>k.startsWith('place:'))
      .map(k=>k.slice(6));

    selectedPlaceCategories.forEach(category=>{
      let items=places.filter(t=>t.category===category);
      if(category==='Norge'&&!norwayOnly)items=items.filter(t=>t.lat<=75);
      items=geoUniqueTargets(items).slice();
      if(items.length)buckets.push({key:'place:'+category,items:shuffleArray(items)});
    });

    return shuffleArray(buckets);
  }

  function geoWizBalancedRounds(count){
    let buckets=geoWizCategoryBuckets();
    const total=buckets.reduce((sum,b)=>sum+b.items.length,0);
    if(total<count)return [];

    const rounds=[];
    const seenTargets=new Set();
    while(rounds.length<count && buckets.length){
      // Ny tilfeldig rekkefølge for hver "runde" gjennom kategoriene.
      buckets=shuffleArray(buckets.filter(b=>b.items.length));
      let added=0;

      for(const bucket of buckets){
        if(rounds.length>=count)break;
        let target;
        while(bucket.items.length){
          const candidate=bucket.items.pop();
          const key=(candidate.name+'|'+candidate.lat.toFixed(3)+'|'+candidate.lon.toFixed(3)).toLowerCase();
          if(seenTargets.has(key))continue;
          seenTargets.add(key);
          target=candidate;
          break;
        }
        if(target){
          rounds.push(target);
          added++;
        }
      }
      if(!added)break;
    }
    return rounds;
  }

  startGeoGuessr=function(){
    stopGeoGuessrClock();
    ensureGeoGuessrSelection();
    const allCurriculum=geoGuessrSelection.size===1&&geoGuessrSelection.has('place:Geografifaget1');
    const roundCount=allCurriculum?geoPlayablePlaces().filter(t=>t.category==='Geografifaget1').length:10;
    const rounds=geoWizBalancedRounds(roundCount);
    if(rounds.length<roundCount){
      refreshGeoGuessrSelectionStatus();
      return;
    }
    geoGuessrState={
      rounds,
      index:0,
      total:0,
      baseTotal:0,
      bonusTotal:0,
      results:[],
      answered:false,
      questionStarted:performance.now(),
      norwayOnly:geoWizNorwayOnly(),
      hsMode:window.geoWizHsModeFromSelection?.()||null,
      hsStartedAt:Date.now(),
      hsHandled:false
    };
    renderGeoGuessrRound();
  };
})();
