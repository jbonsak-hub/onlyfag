/* Offline, hash-pinned builder. See milankovitch-sources.md for source URLs. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sourceDir=process.argv[2];if(!sourceDir)throw Error('Usage: node milankovitch-data-build.cjs <downloaded-source-directory>');
const hashes={
 'bein1.dat':'333d9f2aad399ca8342d381c6c1db0fe9f48957bad1fa96b80c426ed9eed2877',
 'bein2.dat':'592659e32a6702de45fe6fa60816b2d8f254ef4d4ade05a808837eae7692abb9',
 'bein3.dat':'0f9ed39d9ccec48350812b6e20578bc6295ea0dd92702ed3c9f5e9b109a19c54',
 'bein4.dat':'3afe5f249903753de4d0a2e7409502006ab25bc44e3e527453a1c672918f5524',
 'bein5.dat':'1963902ded999e415760c4d8329fdd2701962aa6aaee8d38fbbe85df43dcba84',
 'bein6.dat':'99b80fa4c2055c3ebf047ef55d05a82a79e4743b996f0f88d1a2434f84702e3c',
 'bein7.dat':'55e4300fe8e7ea6c365b81f043af748b3238777f67284644465a08ee5bc645d4',
 'bein8.dat':'e4c0e784836586c3bfc0afb7c714d6652fff65a256641ab2505c71c7dd6afb04',
 'bein11.dat':'1c1820ba369cf6194017800f4d1ff1081c1e9d73ed77418a3c2cbf0679eb4919',
 'lisiecki2005.txt':'973a52d988da04333c98c3fc0cb51babac2fa9bb1c05d42de3d6df726d96b6fc'
};
function read(file){
 let filename=path.join(sourceDir,file);
 // Accept original research-cache aliases as well as the published NOAA names.
 if(!fs.existsSync(filename)){const alias=file==='bein11.dat'?'future.txt':file==='lisiecki2005.txt'?'lr04.txt':file.replace('.dat','.txt');filename=path.join(sourceDir,alias);}
 const bytes=fs.readFileSync(filename),sha256=crypto.createHash('sha256').update(bytes).digest('hex');if(sha256!==hashes[file])throw Error('Source digest mismatch: '+file);
 return{bytes,text:bytes.toString('utf8'),metadata:{file,sha256,bytes:bytes.length}};
}
const records=new Map(),orbitalFiles=[];
for(const file of Object.keys(hashes).filter(name=>name.endsWith('.dat'))){
 const source=read(file),pattern=/date\s*=\s*(-?\d+)\s+ecc\s*=\s*([\d.]+)\s+omega\s*=\s*([\d.]+)\s+obl\s*=\s*([\d.]+)/g;
 for(const match of source.text.matchAll(pattern)){const t=Number(match[1]);if(t>=-800&&t<=100)records.set(t,[t,Number(match[2]),Math.round(((Number(match[3])+180)%360)*100)/100,Number(match[4])]);}
 orbitalFiles.push(source.metadata);
}
const lr=read('lisiecki2005.txt'),header=lr.text.match(/Time\s+d18O\s+Error/);if(!header)throw Error('LR04 stack header not found');
const proxy=[];let started=false;
for(const line of lr.text.slice(header.index).split(/\r?\n/)){
 const match=line.match(/^\s*(\d+)\s+([\d.]+)\s+([\d.]+)\s*$/);if(!match){if(started)break;continue;}started=true;
 const age=Number(match[1]);if(age<=800)proxy.push([-age,Number(match[2]),Number(match[3])]);
}
const orbital=[...records.values()].sort((a,b)=>a[0]-b[0]);proxy.sort((a,b)=>a[0]-b[0]);
if(orbital.length!==901||proxy.length!==701||orbital.some((r,i)=>r[0]!==i-800))throw Error('Incomplete compact data');
const data={version:1,timeReference:'1950 CE; kyr relative to 1950, negative = past',orbitalColumns:['kyrFrom1950','eccentricity','solarLongitudeOfPerihelionDeg','obliquityDeg'],orbital,proxyColumns:['kyrFrom1950','benthicDelta18O_permille','standardError_permille'],proxy,sources:{orbitalBase:'https://www.ncei.noaa.gov/pub/data/paleo/climate_forcing/orbital_variations/insolation/',orbitalReference:'Berger (1978), distributed in NOAA Orbital Variations and Insolation Database. Same solution for past and future; NOAA recommends this solution at reference time 0.',orbitalFiles,proxyUrl:'https://www.ncei.noaa.gov/pub/data/paleo/contributions_by_author/lisiecki2005/lisiecki2005.txt',proxyReference:'Lisiecki & Raymo (2005), LR04, doi:10.1029/2004PA001071',proxySha256:lr.metadata.sha256,proxyBytes:lr.metadata.bytes}};
const output=path.join(__dirname,'milankovitch-data.json');fs.writeFileSync(output,JSON.stringify(data)+'\n');console.log(JSON.stringify({output,orbital:orbital.length,proxy:proxy.length,bytes:fs.statSync(output).size}));
