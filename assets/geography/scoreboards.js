

(function(){


  makeDescriptionBasedPlaceQuestion=function(row,catId){
    let q=cleanDescription(row.explanation).trim();
    if(q && !/[.!?]$/.test(q)) q += ".";
    return {q:q,a:row.place};
  };

  makeNameBasedPlaceQuestion=function(row,catId){
    return {
      q:`Hva kjennetegner ${row.place}?`,
      a:cleanDescription(row.explanation)
    };
  };


  function fitOneLine(el,maxPx,minPx){
    if(!el)return;
    el.style.setProperty("font-size",maxPx+"px","important");
    let size=maxPx;
    let guard=0;
    while(el.scrollWidth>el.clientWidth+1 && size>minPx && guard<30){
      size-=0.5;
      el.style.setProperty("font-size",size+"px","important");
      guard++;
    }
  }
  function fitScoreboardNames(board){
    if(!board)return;
    requestAnimationFrame(()=>{
      board.querySelectorAll(".score-card strong").forEach(el=>fitOneLine(el,17.3,11.5));
    });
  }
  function fitActionNames(root){
    if(!root)return;
    requestAnimationFrame(()=>{
      root.querySelectorAll(".score-team-name strong").forEach(el=>fitOneLine(el,15.4,11.5));
    });
  }

  function renderUnifiedScoreboard(boardId,teams){
    const board=document.getElementById(boardId);
    if(!board)return;
    board.innerHTML="";
    teams.forEach(team=>{
      const card=document.createElement("div");
      card.className="score-card";
      const name=document.createElement("strong");
      name.textContent=team.name;
      const score=document.createElement("span");
      score.textContent=String(team.score);
      card.append(name,score);
      board.appendChild(card);
    });
    fitScoreboardNames(board);
  }

  function renderUnifiedActions(actions,current,teams,awardFn,closeFn){
    actions.innerHTML="";
    teams.forEach((team,index)=>{
      const row=document.createElement("div");
      row.className="score-team-row";

      const label=document.createElement("div");
      label.className="score-team-name";
      const strong=document.createElement("strong");
      strong.textContent=team.name;
      const small=document.createElement("small");
      small.textContent=team.score+" poeng";
      label.append(strong,small);

      const buttons=document.createElement("div");
      buttons.className="score-team-buttons";

      const plus=document.createElement("button");
      plus.className="score-button";
      plus.type="button";
      plus.textContent="+"+current.value;
      plus.title="Gi "+current.value+" poeng til "+team.name;
      plus.addEventListener("click",()=>awardFn(index,current.value));

      const minus=document.createElement("button");
      minus.className="score-button minus";
      minus.type="button";
      minus.textContent="−"+current.value;
      minus.title="Trekk "+current.value+" poeng fra "+team.name;
      minus.addEventListener("click",()=>awardFn(index,-current.value));

      buttons.append(plus,minus);
      row.append(label,buttons);
      actions.appendChild(row);
    });

    const close=document.createElement("button");
    close.className="jeopardy-close jeopardy-unified-close";
    close.type="button";
    close.textContent="Ferdig";
    close.addEventListener("click",closeFn);
    actions.appendChild(close);
    fitActionNames(actions);
  }

  function revealUnified(answerId,current,teams,awardFn,closeFn){
    if(!current)return;
    const answer=document.getElementById(answerId);
    if(!answer)return;
    answer.innerHTML="";
    const answerText=document.createElement("div");
    answerText.className="jeopardy-unified-answer-text";
    answerText.textContent=current.a;
    answer.appendChild(answerText);
    const actions=document.createElement("div");
    actions.className="score-actions";
    answer.appendChild(actions);
    answer.style.display="block";
    answer.classList.add("open");
    renderUnifiedActions(actions,current,teams,awardFn,closeFn);
  }

  function refreshUnifiedActions(answerId,current,teams,awardFn,closeFn){
    if(!current)return;
    const answer=document.getElementById(answerId);
    const actions=answer?.querySelector(".score-actions");
    if(actions)renderUnifiedActions(actions,current,teams,awardFn,closeFn);
  }


  renderScoreboard=function(){
    renderUnifiedScoreboard("jeopardy-scoreboard",jeopardyTeams);
  };
  renderScoreActions=function(value){
    const wrap=document.getElementById("score-actions");
    if(!wrap||!jeopardyCurrent)return;
    renderUnifiedActions(wrap,jeopardyCurrent,jeopardyTeams,adjustScore,closeJeopardyCard);
  };
  adjustScore=function(teamIndex,delta){
    if(!jeopardyTeams[teamIndex])return;
    jeopardyTeams[teamIndex].score+=delta;
    renderScoreboard();
    if(jeopardyCurrent)renderScoreActions(jeopardyCurrent.value);
  };


  renderInnerScoreboard=function(){renderUnifiedScoreboard("inner-scoreboard",innerJeopardyTeams);};
  revealInnerJeopardyAnswer=function(){
    if(!innerJeopardyCurrent)return;
    clearInterval(innerJeopardyTimerInterval);
    revealUnified("inner-jeopardy-answer",innerJeopardyCurrent,innerJeopardyTeams,awardInnerJeopardy,closeInnerJeopardyCard);
  };
  awardInnerJeopardy=function(index,delta){
    if(!innerJeopardyTeams[index])return;
    innerJeopardyTeams[index].score+=delta;
    renderInnerScoreboard();
    refreshUnifiedActions("inner-jeopardy-answer",innerJeopardyCurrent,innerJeopardyTeams,awardInnerJeopardy,closeInnerJeopardyCard);
  };


  renderOuterScoreboard=function(){renderUnifiedScoreboard("outer-scoreboard",outerJeopardyTeams);};
  revealOuterJeopardyAnswer=function(){
    if(!outerJeopardyCurrent)return;
    clearInterval(outerJeopardyTimerInterval);
    revealUnified("outer-jeopardy-answer",outerJeopardyCurrent,outerJeopardyTeams,awardOuterJeopardy,closeOuterJeopardyCard);
  };
  awardOuterJeopardy=function(index,delta){
    if(!outerJeopardyTeams[index])return;
    outerJeopardyTeams[index].score+=delta;
    renderOuterScoreboard();
    refreshUnifiedActions("outer-jeopardy-answer",outerJeopardyCurrent,outerJeopardyTeams,awardOuterJeopardy,closeOuterJeopardyCard);
  };


  renderResourceScoreboard=function(){renderUnifiedScoreboard("resource-scoreboard",resourceJeopardyTeams);};
  revealResourceJeopardyAnswer=function(){
    if(!resourceJeopardyCurrent)return;
    clearInterval(resourceJeopardyTimerInterval);
    revealUnified("resource-jeopardy-answer",resourceJeopardyCurrent,resourceJeopardyTeams,awardResourceJeopardy,closeResourceJeopardyCard);
  };
  awardResourceJeopardy=function(index,delta){
    if(!resourceJeopardyTeams[index])return;
    resourceJeopardyTeams[index].score+=delta;
    renderResourceScoreboard();
    refreshUnifiedActions("resource-jeopardy-answer",resourceJeopardyCurrent,resourceJeopardyTeams,awardResourceJeopardy,closeResourceJeopardyCard);
  };


  renderDemographyScoreboard=function(){renderUnifiedScoreboard("demography-scoreboard",demographyJeopardyTeams);};
  revealDemographyJeopardyAnswer=function(){
    if(!demographyJeopardyCurrent)return;
    clearInterval(demographyJeopardyTimerInterval);
    revealUnified("demography-jeopardy-answer",demographyJeopardyCurrent,demographyJeopardyTeams,awardDemographyJeopardy,closeDemographyJeopardyCard);
  };
  awardDemographyJeopardy=function(index,delta){
    if(!demographyJeopardyTeams[index])return;
    demographyJeopardyTeams[index].score+=delta;
    renderDemographyScoreboard();
    refreshUnifiedActions("demography-jeopardy-answer",demographyJeopardyCurrent,demographyJeopardyTeams,awardDemographyJeopardy,closeDemographyJeopardyCard);
  };


  renderWeatherScoreboard=function(){renderUnifiedScoreboard("weather-scoreboard",weatherJeopardyTeams);};
  revealWeatherJeopardyAnswer=function(){
    if(!weatherJeopardyCurrent)return;
    clearInterval(weatherJeopardyTimerInterval);
    revealUnified("weather-jeopardy-answer",weatherJeopardyCurrent,weatherJeopardyTeams,awardWeatherJeopardy,closeWeatherJeopardyCard);
  };
  awardWeatherJeopardy=function(index,delta){
    if(!weatherJeopardyTeams[index])return;
    weatherJeopardyTeams[index].score+=delta;
    renderWeatherScoreboard();
    refreshUnifiedActions("weather-jeopardy-answer",weatherJeopardyCurrent,weatherJeopardyTeams,awardWeatherJeopardy,closeWeatherJeopardyCard);
  };


  window.addEventListener("resize",()=>{
    [
      "jeopardy-scoreboard","inner-scoreboard","outer-scoreboard",
      "resource-scoreboard","demography-scoreboard","weather-scoreboard"
    ].forEach(id=>fitScoreboardNames(document.getElementById(id)));
  });
})();
