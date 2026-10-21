

(function(){
  function paintTimer(pill,remaining,expiredText){
    if(!pill)return;
    pill.classList.remove("timer-warning","timer-expired");
    if(remaining<=0){
      pill.classList.add("timer-expired");
      pill.textContent=expiredText||"TID!";
    }else{
      pill.textContent=remaining+" s";
      if(remaining<=5)pill.classList.add("timer-warning");
    }
  }

  const oldOpenJeopardyQuestion_v39=openJeopardyQuestion;
  openJeopardyQuestion=function(catId,index,button){
    oldOpenJeopardyQuestion_v39(catId,index,button);
    const pill=document.getElementById("timer-pill");
    const meta=document.getElementById("jeopardy-meta");
    if(pill&&meta)meta.appendChild(pill);
  };

  startQuestionTimer=function(){
    stopQuestionTimer();
    const seconds=parseInt(document.getElementById("jeopardy-timer")?.value||"0",10);
    const pill=document.getElementById("timer-pill");
    if(!pill)return;
    pill.classList.remove("timer-warning","timer-expired");
    if(!seconds){pill.style.display="none";pill.textContent="";return}
    let remaining=seconds;
    pill.style.display="inline-block";
    paintTimer(pill,remaining);
    jeopardyTimerInterval=setInterval(()=>{
      remaining--;
      paintTimer(pill,remaining,"TID!");
      if(remaining<=0){clearInterval(jeopardyTimerInterval);jeopardyTimerInterval=null}
    },1000);
  };

  function runSubjectTimer(selectId,pillId,setIntervalRef,clearIntervalRef){
    clearIntervalRef();
    const seconds=parseInt(document.getElementById(selectId)?.value||"0",10);
    const pill=document.getElementById(pillId);
    if(!pill)return;
    pill.classList.remove("timer-warning","timer-expired");
    if(!seconds){pill.style.display="none";pill.textContent="";return}
    let remaining=seconds;
    pill.style.display="inline-block";
    paintTimer(pill,remaining);
    const id=setInterval(()=>{
      remaining--;
      paintTimer(pill,remaining,"TID!");
      if(remaining<=0){clearInterval(id);setIntervalRef(null)}
    },1000);
    setIntervalRef(id);
  }


  startInnerJeopardyTimer=function(){
    runSubjectTimer("inner-timer","inner-timer-pill",
      id=>{innerJeopardyTimerInterval=id},
      ()=>{if(innerJeopardyTimerInterval){clearInterval(innerJeopardyTimerInterval);innerJeopardyTimerInterval=null}}
    );
  };
  startOuterJeopardyTimer=function(){
    runSubjectTimer("outer-timer","outer-timer-pill",
      id=>{outerJeopardyTimerInterval=id},
      ()=>{if(outerJeopardyTimerInterval){clearInterval(outerJeopardyTimerInterval);outerJeopardyTimerInterval=null}}
    );
  };
  startWeatherJeopardyTimer=function(){
    runSubjectTimer("weather-timer","weather-timer-pill",
      id=>{weatherJeopardyTimerInterval=id},
      ()=>{if(weatherJeopardyTimerInterval){clearInterval(weatherJeopardyTimerInterval);weatherJeopardyTimerInterval=null}}
    );
  };
  startResourceJeopardyTimer=function(){
    runSubjectTimer("resource-timer","resource-timer-pill",
      id=>{resourceJeopardyTimerInterval=id},
      ()=>{if(resourceJeopardyTimerInterval){clearInterval(resourceJeopardyTimerInterval);resourceJeopardyTimerInterval=null}}
    );
  };
  startDemographyJeopardyTimer=function(){
    runSubjectTimer("demography-timer","demography-timer-pill",
      id=>{demographyJeopardyTimerInterval=id},
      ()=>{if(demographyJeopardyTimerInterval){clearInterval(demographyJeopardyTimerInterval);demographyJeopardyTimerInterval=null}}
    );
  };
})();
