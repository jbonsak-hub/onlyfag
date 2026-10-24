// Keep published HTML and its local model/data assets compatible across caches.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/astronomy-prototypes'),check=process.argv.includes('--check');
const read=file=>fs.readFileSync(path.join(dir,file),'utf8').replace(/\r\n/g,'\n');
const hash=text=>crypto.createHash('sha256').update(text).digest('hex').slice(0,12);
const entries=[];
function asset(name,source=read(name)){
  const ext=path.extname(name),file=name.slice(0,-ext.length)+'-'+hash(source)+ext;
  entries.push({name,file,source});return file;
}
const data=asset('milankovitch-data.json');
for(const name of ['common.css','common.js','jord-mane-sol.css','jord-mane-sol.js','arstider-solbane.css','arstider-solbane.js','milankovitch.css'])asset(name);
asset('milankovitch.js',read('milankovitch.js').replace("'milankovitch-data.json'","'"+data+"'"));
for(const {file,source} of entries){
  const target=path.join(dir,file);
  if(check){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8').replace(/\r\n/g,'\n')!==source)throw Error('Rebuild astronomy prototype asset: '+file);}
  else fs.writeFileSync(target,source);
}
for(const page of ['index','jord-mane-sol','arstider-solbane','milankovitch']){
  const target=path.join(root,'prototyper',page+'.html'),original=fs.readFileSync(target,'utf8');let html=original;
  for(const {name,file} of entries){
    const ext=path.extname(name).slice(1),stem=name.slice(0,-ext.length-1);
    html=html.replace(new RegExp('astronomy-prototypes/'+stem+'(?:-[a-f0-9]{12})?\\.'+ext,'g'),'astronomy-prototypes/'+file);
  }
  if(check){if(html!==original)throw Error('Rebuild astronomy page references: '+page);}
  else fs.writeFileSync(target,html);
}
console.log('PASS '+(check?'verified':'built')+' astronomy assets and four page references');
