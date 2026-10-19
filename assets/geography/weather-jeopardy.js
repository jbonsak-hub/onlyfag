

(function(){
  openWeatherJeopardyQuestion=function(btn){
    if(!btn || !btn.dataset.payload) return;
    btn.classList.add("used");
    weatherJeopardyCurrent={...JSON.parse(decodeURIComponent(btn.dataset.payload)),btn};
    const card=document.getElementById("weather-question-card");
    if(!card)return;
    card.innerHTML="";
    const meta=document.createElement("div");
    meta.className="jeopardy-question-meta";
    const c=document.createElement("span");c.textContent=weatherJeopardyCurrent.cat;
    const v=document.createElement("span");v.textContent=weatherJeopardyCurrent.value+" poeng";
    const t=document.createElement("span");t.id="weather-timer-pill";t.style.display="none";
    meta.append(c,v,t);
    const q=document.createElement("div");q.className="jeopardy-question-text";q.textContent=weatherJeopardyCurrent.q;
    const reveal=document.createElement("button");reveal.className="jeopardy-reveal";reveal.textContent="Vis fasit";reveal.addEventListener("click",revealWeatherJeopardyAnswer);
    const answer=document.createElement("div");answer.className="jeopardy-answer";answer.id="weather-jeopardy-answer";
    card.append(meta,q,reveal,answer);
    startWeatherJeopardyTimer();
  };
})();
