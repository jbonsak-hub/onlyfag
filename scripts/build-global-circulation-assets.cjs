// Give each model dependency a content version; the host also versions the frame.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),checking=process.argv.includes('--check');
const read=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n/g,'\n');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex').slice(0,12);
const folder='assets/geography/global-circulation/';
const versions=Object.fromEntries(['model.css','model.js','earth-land.js','embed.css','embed.js'].map(name=>[name,hash(read(folder+name))]));
function version(html){return html.replace(/((?:\.\.\/)?assets\/geography\/global-circulation\/)(model\.css|model\.js|earth-land\.js|embed\.css|embed\.js)(?:\?v=[a-f0-9]+)?/g,(_,prefix,name)=>prefix+name+'?v='+versions[name]);}
const model='geografi/global-sirkulasjon.html',oldModel=read(model),newModel=version(oldModel);
const page='geografi.html',oldPage=read(page),newPage=version(oldPage).replace(/(data-src="geografi\/global-sirkulasjon\.html)(?:\?v=[a-f0-9]+)?"/g,'$1?v='+hash(newModel)+'"');
for(const [file,oldValue,newValue]of [[model,oldModel,newModel],[page,oldPage,newPage]]){
 if(checking&&oldValue!==newValue)throw Error('Run node scripts/build-global-circulation-assets.cjs');
 if(!checking&&oldValue!==newValue)fs.writeFileSync(path.join(root,file),newValue);
}
console.log(checking?'PASS circulation dependency versions':'Versioned circulation dependencies and iframe');
