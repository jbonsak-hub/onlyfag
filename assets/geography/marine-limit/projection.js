// ETRS89 / UTM zone 33N (EPSG:25833), GRS80. Sixth-order Krüger series.
// The map, Kartverket's WMTS grid and NGU overlays share projected metres.
const a=6378137,f=1/298.257222101,k0=.9996,e=Math.sqrt(f*(2-f)),n=f/(2-f);
const A=a/(1+n)*(1+n*n/4+n**4/64+n**6/256);
const alpha=[0,
 n/2-2*n*n/3+5*n**3/16+41*n**4/180-127*n**5/288+7891*n**6/37800,
 13*n*n/48-3*n**3/5+557*n**4/1440+281*n**5/630-1983433*n**6/1935360,
 61*n**3/240-103*n**4/140+15061*n**5/26880+167603*n**6/181440,
 49561*n**4/161280-179*n**5/168+6601661*n**6/7257600,
 34729*n**5/80640-3418889*n**6/1995840,
 212378941*n**6/319334400];
export function geographicToUTM(lon,lat){
 const lambda=(lon-15)*Math.PI/180,tau=Math.tan(lat*Math.PI/180);
 const sigma=Math.sinh(e*Math.atanh(e*tau/Math.hypot(1,tau)));
 const tauPrime=tau*Math.hypot(1,sigma)-sigma*Math.hypot(1,tau);
 const xiPrime=Math.atan2(tauPrime,Math.cos(lambda));
 const etaPrime=Math.asinh(Math.sin(lambda)/Math.hypot(tauPrime,Math.cos(lambda)));
 let xi=xiPrime,eta=etaPrime;
 for(let j=1;j<=6;j++){
  xi+=alpha[j]*Math.sin(2*j*xiPrime)*Math.cosh(2*j*etaPrime);
  eta+=alpha[j]*Math.cos(2*j*xiPrime)*Math.sinh(2*j*etaPrime);
 }
 return [500000+k0*A*eta,k0*A*xi];
}
