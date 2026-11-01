/* Fixed independent pyproj EPSG:4326 -> EPSG:25833 reference values. */
const assert=require('node:assert/strict');require('../assets/geography/wgs84-raster.js');
const refs=[
 [10.74609,59.91273,262210.8893177103,6649335.409472278],
 [10.39506,63.43048,270337.87028114265,7041814.199059743],
 [18.96366,69.65455,653706.3816724909,7732337.613037544],
 [5.32438,60.39352,-31956.268370915903,6734428.525915692],
 [25.7842,71.1725,886615.3025117535,7931196.690002568]
];
for(const [lon,lat,e,n] of refs){const p=WGS84Raster.geographicToUTM(lon,lat),ll=WGS84Raster.utmToGeographic(e,n);assert.ok(Math.hypot(p[0]-e,p[1]-n)<.001);assert.ok(Math.abs(ll[0]-lon)<1e-9&&Math.abs(ll[1]-lat)<1e-9);}
console.log('PASS WGS84 tile projection: independent Oslo/Trondheim/Tromsø/Bergen/Nordkapp metre and inverse references.');
