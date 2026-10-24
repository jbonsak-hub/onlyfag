/* Small shared geometric helpers; angles at the API boundary are degrees. */
(() => {
  'use strict';
  const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const declination=(solarLongitude,tilt=23.44)=>deg(Math.asin(Math.sin(rad(tilt))*Math.sin(rad(solarLongitude))));
  function dayLength(latitude,declinationDegrees){const a=Math.sin(rad(latitude))*Math.sin(rad(declinationDegrees)),b=Math.cos(rad(latitude))*Math.cos(rad(declinationDegrees));if(Math.abs(b)<1e-12)return a>0?24:a<0?0:12;const q=-a/b;return q<=-1?24:q>=1?0:24/Math.PI*Math.acos(q);}
  function solarPosition(latitude,declinationDegrees,solarHour){const p=rad(latitude),d=rad(declinationDegrees),h=rad((solarHour-12)*15),east=-Math.cos(d)*Math.sin(h),north=Math.cos(p)*Math.sin(d)-Math.sin(p)*Math.cos(d)*Math.cos(h),up=Math.sin(p)*Math.sin(d)+Math.cos(p)*Math.cos(d)*Math.cos(h);return {altitude:deg(Math.asin(clamp(up,-1,1))),azimuth:(deg(Math.atan2(east,north))+360)%360,horizontalFlux:1361*Math.max(0,up)};}
  function dailyInsolation(latitude,solarLongitude,tilt=23.44,eccentricity=.0167,perihelionSolarLongitude=282.9){const p=rad(latitude),d=rad(declination(solarLongitude,tilt)),H=dayLength(latitude,deg(d))*Math.PI/24,r=(1-eccentricity**2)/(1+eccentricity*Math.cos(rad(solarLongitude-perihelionSolarLongitude)));return 1361/(Math.PI*r*r)*(H*Math.sin(p)*Math.sin(d)+Math.cos(p)*Math.cos(d)*Math.sin(H));}
  window.AstroCore={rad,deg,clamp,declination,dayLength,solarPosition,dailyInsolation,format:(value,digits=0)=>new Intl.NumberFormat('nb-NO',{maximumFractionDigits:digits}).format(value)};
  const current=location.pathname.split('/').pop();for(const link of document.querySelectorAll('.prototype-nav a'))if(link.getAttribute('href')?.split('/').pop()===current)link.setAttribute('aria-current','page');
})();
