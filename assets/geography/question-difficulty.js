

(function(){
  const JVALUES=[100,200,300,400,500];

  function stableNoise(text){
    let h=2166136261;
    const s=String(text||"");
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
    return ((h>>>0)%1000)/1000;
  }

  function academicDifficulty(item){
    const q=String(item?.q||"").toLocaleLowerCase("nb-NO");
    const a=String(item?.a||"").toLocaleLowerCase("nb-NO");
    let s=1.2;
    if(/^(hva er|hva betyr|hva kalles|hvilken|hvilket|hvilke|hvor ligger|hvem|nev(n|n )|oppgi)\b/.test(q)) s-=0.35;
    if(/\b(forklar|hvorfor|hvordan)\b/.test(q)) s+=0.9;
    if(/\b(sammenlikn|sammenlign|drøft|vurder|analyser|vis sammenhengen|følg |knytt |begrunn)\b/.test(q)) s+=1.35;
    if(/\b(forskjell|konsekvens|årsaker|virkninger|påvirker|sammenheng|mekanisme|prosess)\b/.test(q)) s+=0.45;
    if(/\b(nevn tre|nevn fire|nevn fem|to viktigste|tre viktigste|flere årsaker)\b/.test(q)) s+=0.55;
    const qwords=q.split(/\s+/).filter(Boolean).length;
    const words=a.split(/\s+/).filter(Boolean).length;
    if(qwords>13)s+=0.22;if(qwords>22)s+=0.28;
    if(/,\s+og\s+|\bog hvilke\b|\bog hva\b|\bog hvorfor\b|\bog hvordan\b/.test(q))s+=0.42;
    if(words>14)s+=0.25;if(words>28)s+=0.35;if(words>45)s+=0.35;
    const advanced=[
      "radiometr","astenosf","slab pull","ridge push","momentmagnitude","subduksjon",
      "milanković","albedo","tilbakekobling","termohalin","dypvannsdannelse","coriolis",
      "ressursforbannelse","allmenningens tragedie","industriell treghet","konsekvensutredning",
      "ekspropriasjon","befolkningsmoment","forsørgerbyrde","gini","avhengighetsteori",
      "konvensjonsflyktning","remittering","marin grense","kvikkleire"
    ];
    advanced.forEach(k=>{if((q+" "+a).includes(k))s+=0.18;});
    return s+stableNoise(q)*0.18;
  }

  function tieredPick(pool,scoreFn=academicDifficulty){
    const clean=(pool||[]).filter(x=>x&&x.q&&x.a);
    if(!clean.length)return [];
    const sorted=clean.map(item=>({item,score:Number(scoreFn(item))||0}))
      .sort((x,y)=>x.score-y.score);
    const buckets=[[],[],[],[],[]];
    sorted.forEach((x,i)=>{
      const b=Math.min(4,Math.floor(i*5/sorted.length));
      buckets[b].push(x.item);
    });
    for(let i=0;i<5;i++){
      if(!buckets[i].length){
        let d=1;
        while(!buckets[i].length && d<5){
          if(i-d>=0&&buckets[i-d].length)buckets[i]=buckets[i-d].slice();
          else if(i+d<5&&buckets[i+d].length)buckets[i]=buckets[i+d].slice();
          d++;
        }
      }
    }
    const used=new Set();
    return buckets.map((bucket,i)=>{
      let options=shuffleArray(bucket).filter(x=>!used.has(x.q));
      if(!options.length)options=shuffleArray(bucket);
      const item=options[0];
      if(item)used.add(item.q);
      return {...item,value:JVALUES[i],difficulty:i+1};
    });
  }

  function innerColumn(item){
    if(item.__column)return item.__column;
    if(item.cat==="Jordas oppbygning")return "Jordas indre";
    if(item.cat==="Kontinentaldrift")return "Platedrift";
    if(item.cat==="Jordskjelv"||item.cat==="Tsunami")return "Jordskjelv og tsunami";
    if(item.cat==="Vulkanisme")return "Vulkaner";
    if(item.cat==="Bergarter og Norge")return "Bergarter og Norge";
    if(item.cat==="Platedrift"){
      const t=(item.q+" "+item.a).toLowerCase();
      if(/plategrense|subduks|diverger|konverger|transform|san andreas|himalaya|andes|marian|japan|dyphavsgrop|riftsone|havbunnsplate møter|to kontinenter kolliderer|to havbunnsplater/.test(t))return "Plategrenser";
      return "Platedrift";
    }
    return "Platedrift";
  }
  function outerColumn(item){
    if(item.__column)return item.__column;
    const m={
      "Grunnprosesser":"Grunnprosesser","Elver":"Elver","Istider":"Istider og isbreer","Isbreer":"Istider og isbreer",
      "Breerosjon":"Brelandformer","Breformer":"Brelandformer","Løsmasser":"Løsmasser og landheving","Landheving":"Løsmasser og landheving",
      "Skred":"Skred og landskapshistorie","Norgeshistorie":"Skred og landskapshistorie","Sammenheng":"Skred og landskapshistorie"
    };return m[item.cat]||"Grunnprosesser";
  }
  function resourceColumn(item){
    if(item.__column)return item.__column;
    const m={
      "Ressurser":"Ressurser og bærekraft","Næringer":"Næringer og endring","Lokalisering":"Lokalisering",
      "Energi":"Norske ressursnæringer","Jord og skog":"Norske ressursnæringer","Fiskeri":"Norske ressursnæringer",
      "Petroleum og mineraler":"Norske ressursnæringer","Arealbruk":"Arealbruk og lover","Konflikter":"Konflikter og makt"
    };return m[item.cat]||"Ressurser og bærekraft";
  }
  function demographyColumn(item){
    if(item.__column)return item.__column;
    const m={
      "Grunnlag":"Tall og modeller","Overgang":"Tall og modeller","Framskriving":"Tall og modeller",
      "Fruktbarhet":"Fruktbarhet og dødelighet","Dødelighet":"Fruktbarhet og dødelighet",
      "Struktur":"Struktur og Norge","Fordeling":"Struktur og Norge","Norge":"Struktur og Norge",
      "Levekår":"Levekår og utvikling","Utvikling":"Levekår og utvikling","Teorier":"Levekår og utvikling","Bærekraft":"Levekår og utvikling","Globalt":"Levekår og utvikling",
      "Migrasjon":"Migrasjon","Byer":"Byer og flukt","Flukt":"Byer og flukt"
    };
    if(m[item.cat])return m[item.cat];
    if(item.cat==="Sammenheng"){
      const t=(item.q+" "+item.a).toLowerCase();
      if(/migr|flytt|remitter|flukt/.test(t))return "Migrasjon";
      if(/by|urban/.test(t))return "Byer og flukt";
      return "Levekår og utvikling";
    }
    return "Tall og modeller";
  }

  function buildAcademicColumns(bank,names,router){
    return names.map(name=>{
      const pool=(bank||[]).filter(q=>router(q)===name);
      return {name,questions:tieredPick(pool,academicDifficulty),poolSize:pool.length};
    });
  }

  function dedupeQuestions(items){
    const seen=new Set();
    return (items||[]).filter(x=>{
      const key=String(x?.q||"").trim().toLocaleLowerCase("nb-NO");
      if(!key||seen.has(key))return false;
      seen.add(key);return true;
    });
  }
  function legacyFlat(categories){
    return (categories||[]).flatMap(c=>(c.questions||[]).map(q=>({...q,__column:c.name})));
  }
  function allSubjectQuestions(id){
    try{
      const generalLegacy=(jeopardyCategories.find(c=>c.id===id)?.questions||[]);
      const extra=(jeopardyExtraQuestions[id]||[]);
      if(id==="indre")return dedupeQuestions([...INNER_CONTROL_QUESTIONS,...legacyFlat(INNER_JEOPARDY_CATEGORIES),...generalLegacy,...extra]);
      if(id==="ytre")return dedupeQuestions([...OUTER_CORE_CONTROL_QUESTIONS,...legacyFlat(OUTER_JEOPARDY_CATEGORIES),...generalLegacy,...extra]);
      if(id==="klima")return dedupeQuestions([...WEATHER_JEOPARDY_CATEGORIES.flatMap(c=>c.questions.map(q=>({...q,cat:c.name}))),...generalLegacy,...extra]);
      if(id==="ressurser")return dedupeQuestions([...RESOURCE_CORE_CONTROL_QUESTIONS,...legacyFlat(RESOURCE_JEOPARDY_CATEGORIES),...generalLegacy,...extra]);
      if(id==="demografi")return dedupeQuestions([...DEMOGRAPHY_CORE_CONTROL_QUESTIONS,...legacyFlat(DEMOGRAPHY_JEOPARDY_CATEGORIES),...generalLegacy,...extra]);
    }catch(e){}
    return [];
  }

  const COUNTRY_TIER_1=new Set(("Norge,Sverige,Danmark,Finland,Island,Storbritannia,Frankrike,Tyskland,Spania,Italia,Portugal,Nederland,Belgia,Sveits,Østerrike,Polen,Hellas,USA,Canada,Mexico,Brasil,Argentina,Australia,New Zealand,Russland,Kina,Japan,India,Sør-Korea,Thailand,Egypt,Sør-Afrika,Tyrkia").split(","));
  const COUNTRY_TIER_2=new Set(("Irland,Tsjekkia,Ungarn,Romania,Kroatia,Serbia,Ukraina,Bulgaria,Estland,Latvia,Litauen,Slovenia,Slovakia,Israel,Saudi-Arabia,De forente arabiske emirater,Iran,Irak,Pakistan,Indonesia,Filippinene,Vietnam,Nord-Korea,Nepal,Sri Lanka,Chile,Peru,Colombia,Venezuela,Cuba,Costa Rica,Panama,Kenya,Marokko,Tunisia,Nigeria,Etiopia,Ghana,Tanzania,Madagaskar").split(","));
  const COUNTRY_TIER_4=new Set(("Albania,Belarus,Bosnia-Hercegovina,Moldova,Montenegro,Nord-Makedonia,Georgia,Armenia,Aserbajdsjan,Kasakhstan,Usbekistan,Turkmenistan,Tadsjikistan,Kirgisistan,Mongolia,Kambodsja,Laos,Bangladesh,Bhutan,Brunei,Oman,Jordan,Libanon,Jemen,Bahrain,Kuwait,Qatar,Bolivia,Paraguay,Uruguay,Ecuador,Guyana,Surinam,Guatemala,Honduras,Nicaragua,El Salvador,Den dominikanske republikk,Jamaica,Haiti,Botswana,Namibia,Zambia,Zimbabwe,Uganda,Rwanda,Senegal,Mali,Niger,Tsjad,Mosambik,Angola").split(","));
  const COUNTRY_TIER_5=new Set(("Andorra,Liechtenstein,Monaco,San Marino,Vatikanstaten,Malta,Kosovo,Antigua og Barbuda,Bahamas,Barbados,Belize,Dominica,Grenada,Saint Kitts og Nevis,St. Lucia,St. Vincent og Grenadinene,Trinidad og Tobago,Kapp Verde,Komorene,Djibouti,Ekvatorial-Guinea,Eswatini,Gabon,Gambia,Guinea,Guinea-Bissau,Lesotho,Liberia,Malawi,Mauritania,Mauritius,Seychellene,Sierra Leone,Somalia,Sør-Sudan,Togo,Kiribati,Marshalløyene,Mikronesia,Nauru,Palau,Samoa,Salomonøyene,Tonga,Tuvalu,Vanuatu,Øst-Timor").split(","));
  function countryBaseTier(country){
    if(COUNTRY_TIER_1.has(country))return 1;
    if(COUNTRY_TIER_2.has(country))return 2;
    if(COUNTRY_TIER_4.has(country))return 4;
    if(COUNTRY_TIER_5.has(country))return 5;
    return 3;
  }
  const CAPITAL_ADJUST={
    "Australia":.8,"Canada":.45,"Brasil":.45,"Tyrkia":.55,"Kasakhstan":.55,"Tanzania":.75,
    "Sri Lanka":1.1,"Myanmar":.75,"Sør-Afrika":1.0,"Bolivia":.9,"Elfenbenskysten":.75,
    "Nigeria":.45,"Burundi":.55,"Belize":.45,"Benin":.45,"Palestina":.35,
    "Singapore":-1.0,"Luxemburg":-.7,"Monaco":-1.0,"San Marino":-.7,"Djibouti":-.7
  };
  const FLAG_ADJUST={
    "Nepal":-1.1,"Canada":-.7,"Japan":-.7,"Sveits":-.7,"Storbritannia":-.6,"USA":-.55,"Brasil":-.45,
    "Norge":-.6,"Sverige":-.55,"Danmark":-.55,"Finland":-.45,"Island":-.35,"Sør-Korea":-.45,"Kina":-.25,
    "Tsjad":.7,"Romania":.55,"Indonesia":.65,"Monaco":.55,"Mali":.55,"Guinea":.55,"Irland":.45,
    "Elfenbenskysten":.55,"Luxemburg":.45,"Nederland":.25,"Slovenia":.35,"Slovakia":.35
  };
  function countryScore(row,mode){
    let s=countryBaseTier(row.country);
    if(mode==="capital")s+=(CAPITAL_ADJUST[row.country]||0);
    if(mode==="flag")s+=(FLAG_ADJUST[row.country]||0);
    return s+stableNoise(row.country)*.12;
  }

  const PLACE_TIER_1=new Set(("Grand Canyon,Great Barrier Reef,Mount Everest,Everest,Niagara,Sahara,Atlanterhavet,Stillehavet,Indiske hav,Nordsjøen,Suezkanalen,Panamakanalen,Gibraltarstredet,Alpene,Andes,Himalaya,Rocky Mountains,Fuji,Kilimanjaro,Vesuv,Etna,Dødehavet,Kaspiske hav,Amazonas,Nilen,Mississippi,Themsen,Seinen,Rhinen,Grønland,Hawaii,Galapagos,Madagaskar,Svalbard,Arktis,Antarktis,Sibir,Tibet,Eiffeltårnet,Big Ben,Colosseum,Den forbudte by,Frihetsgudinnen,Giza,Golden Gate,Louvre,Machu Picchu,Stonehenge,Taj Mahal,Burj Khalifa,Bergen,Lofoten,Nordkapp,Preikestolen").split(","));
  const PLACE_TIER_2=new Set(("Yellowstone,Yosemite,Victoriafallene,Iguazu,Death Valley,Uluru,Serengeti,Sognefjorden,Rødehavet,Svartehavet,Østersjøen,Karibiske hav,Beringstredet,Bosporus,Kapp Horn,Kapp det gode håp,Pyreneene,Atlas,Kaukasus,Appalachene,Mont Blanc,Matterhorn,Aconcagua,Denali,Elbrus,Bajkal,Aralsjøen,Titicaca,Victoria,Donau,Volga,Ganges,Yangtze,Mekong,Kongo,Jordan,Colorado,Borneo,Sicilia,Sardinia,Krim,Yucatan,Påskeøya,Kanariøyene,Atacama,Gobi,Kalahari,Sahel,Mesopotamia,Levanten,Patagonia,Afrikas Horn,Angkor Vat,Hagia Sofia,Alhambra,Akropolis,Den røde plass,Mount Rushmore,Petra,Versailles,Konstantinopel,Persia,Osmanske riket,Sparta,Besseggen,Jotunheimen,Gaustatoppen,Rondane,Trondheim").split(","));
  const PLACE_TIER_4=new Set(("Adriaterhavet,Arabiske hav,Barentshavet,Beringhavet,Egeerhavet,Gulehavet,Japanhavet,Marmarahavet,Sargassohavet,Skagerak,Sørishavet,Biscayabukta,Bottenvika,Hormuz,Malakkastredet,Magellanstredet,Altai,Dinarene,Great Dividing Range,Hindu Kush,Karakoram,Karpatene,Kaukasus,Kunlun,Pamir,Tian Shan,Ural,Ararat,Great Bear Lake,Hornindalsvatnet,Ladoga,Vänern,Brahmaputra,Elbe,Indus,Po,Rio Grande,Yukon,Balearene,Corsica,Falklandsøyene,Hinnøya,Jan Mayen,Kola,Shetland,Tasmania,Taklamakan,Anatolia,Indokina,Polynesia,Riftdalen,Dronning Mauds land,Nubia,Teotihuacan,Assyriske riket,Kartago,Preussen,Zaire,Dovrefjell,Kautokeino,Rjukan,Saltstraumen,Trollveggen").split(","));
  const PLACE_TIER_5=new Set(("Joniske hav,Tyrrenske hav,Messinastredet,Penninene,Great Bear Lake,Nubia,Teotihuacan").split(","));
  const PLACE_FAMILIARITY_OVERRIDES={"Wadi Rum":3,"Cliffs of Moher":2,"Ha Long-bukta":2,"Persiabukta":2,"Adenbukta":3,"Bab el-Mandeb":4,"Doverstredet":2,"Kielkanalen":3,"Krakatau":2,"Mauna Loa":2,"Mauna Kea":3,"Mount St. Helens":2,"Tambora":3,"Pinatubo":3,"Cotopaxi":2,"Chimborazo":3,"Mount Kenya":2,"Comosjøen":3,"Loch Ness":1,"Santorini":1,"Zanzibar":2,"Sumatra":2,"Java":2,"Kreta":1,"Bora Bora":2,"Tahiti":2,"Sinaihalvøya":2,"Ny-Guinea":2,"Namib":2,"Kappadokia":2,"Nildeltaet":2,"Ganges–Brahmaputra-deltaet":3,"Great Plains":2,"Deccanplatået":3,"Den fruktbare halvmåne":2,"Mekongdeltaet":3,"Ruhr-området":3,"Silicon Valley":2,"Loessplatået":4,"Den kinesiske mur":1,"Pompeii":1,"Sydney Opera House":1,"Kristusstatuen":1,"Notre-Dame":1,"St. Basil-katedralen":2,"Brandenburger Tor":2,"Det skjeve tårn i Pisa":1,"Tower Bridge":1,"Det hvite hus":1,"CN Tower":2,"Efesos":3,"Persepolis":3,"Delfi":3,"Troja":2,"Palmyra":4,"Tikal":3,"Bagan":3,"Timbuktu":2,"Geirangerfjorden":1,"Trolltunga":1,"Helgelandskysten":2,"Torghatten":2,"Røros":2,"Vøringsfossen":1,"Lysefjorden":1,"Hardangervidda":1,"Vegaøyan":2,"Akershus":2,"Agder":2,"Buskerud":2,"Finnmark":2,"Innlandet":2,"Møre og Romsdal":2,"Nordland":2,"Oslo":1,"Rogaland":2,"Telemark":2,"Troms":2,"Trøndelag":2,"Vestfold":2,"Vestland":2,"Østfold":2,"Bergen":1,"Stavanger":1,"Sandnes":2,"Trondheim":1,"Drammen":1,"Fredrikstad":2,"Sarpsborg":2,"Porsgrunn":2,"Skien":2,"Kristiansand":1,"Tønsberg":2,"Ålesund":2,"Moss":2,"Haugesund":2,"Sandefjord":2,"Arendal":2,"Bodø":1,"Tromsø":1,"Hamar":2,"Gjøvik":2,"Larvik":2,"Halden":2,"Sognefjorden":1,"Hardangerfjorden":1,"Nordfjord":2,"Oslofjorden":1,"Trondheimsfjorden":2,"Romsdalsfjorden":2,"Nærøyfjorden":2,"Varangerfjorden":3,"Porsangerfjorden":3,"Glomma":1,"Gudbrandsdalslågen":2,"Numedalslågen":3,"Drammenselva":2,"Otra":2,"Tanaelva":2,"Altaelva":2,"Namsen":3,"Gaula":3,"Vefsna":3,"Mjøsa":1,"Røssvatnet":3,"Femunden":2,"Tyrifjorden":2,"Snåsavatnet":3,"Tinnsjø":3,"Hornindalsvatnet":2,"Galdhøpiggen":1,"Glittertind":2,"Snøhetta":2,"Store Skagastølstind":3,"Romsdalshorn":3,"Hårteigen":3,"Finnmarksvidda":1,"Trollheimen":2,"Sunnmørsalpene":2,"Lyngsalpene":2,"Saltfjellet":2,"Setesdalsheiene":3,"Jostedalsbreen":1,"Folgefonna":2,"Svartisen":2,"Senja":2,"Vesterålen":2,"Hinnøya":3,"Gudbrandsdalen":1,"Romsdalen":2,"Låtefossen":2,"Langfoss":3,"Femundsmarka":3,"Besseggen":1,"Dovrefjell":2,"Gaustatoppen":1,"Jotunheimen":1,"Kautokeino":2,"Kjeragbolten":1,"Lindesnes":1,"Lofoten":1,"Nordkapp":1,"Preikestolen":1,"Rjukan":2,"Rondane":2,"Saltstraumen":1,"Svalbard":1,"Trollveggen":2};
  function placeScore(row){
    const p=row.place;
    let s=PLACE_FAMILIARITY_OVERRIDES[p]||3;
    if(!PLACE_FAMILIARITY_OVERRIDES[p]){
      if(PLACE_TIER_1.has(p))s=1;
      else if(PLACE_TIER_2.has(p))s=2;
      else if(PLACE_TIER_5.has(p))s=5;
      else if(PLACE_TIER_4.has(p))s=4;
    }
    if(/Norge|Norges|norsk/i.test(row.explanation||"") && s>1)s-=.25;
    return s+stableNoise(p)*.15;
  }

  const oldMakeJeopardyQuestions=makeJeopardyQuestions;
  makeJeopardyQuestions=function(cat){
    if(["indre","ytre","klima","ressurser","demografi"].includes(cat.id)){
      return tieredPick(allSubjectQuestions(cat.id),academicDifficulty);
    }
    if(cat.id==="hovedsteder")return makeCapitalQuestions();
    if(cat.id==="flagg")return makeFlagQuestions();
    if(placeCategoryHeadings[cat.id])return makePlaceQuestions(cat.id,placeCategoryHeadings[cat.id]);
    const pool=[...(cat.questions||[]),...(jeopardyExtraQuestions[cat.id]||[])];
    return tieredPick(pool,academicDifficulty);
  };

  makeCapitalQuestions=function(){
    const rows=getLandRows();
    const picks=tieredPick(rows.map(r=>({q:r.country,a:r.capital,row:r})),x=>countryScore(x.row,"capital"));
    return picks.map((x,i)=>{
      const row=x.row;
      const askCapital=Math.random()<.55;
      return {
        value:JVALUES[i],difficulty:i+1,
        q:askCapital?`Hva heter hovedstaden i ${row.country}?`:`Hvilket land har ${quizCapitalName(row.capital,row.country)} som hovedstad?`,
        a:askCapital?quizCapitalName(row.capital,row.country):row.country
      };
    });
  };

  makeFlagQuestions=function(){
    const rows=getLandRows().filter(x=>x.flag);
    const picks=tieredPick(rows.map(r=>({q:r.country,a:r.country,row:r})),x=>countryScore(x.row,"flag"));
    return picks.map((x,i)=>{
      const row=x.row;
      return {
        value:JVALUES[i],difficulty:i+1,
        html:`<div>Hvilket land/område har dette flagget?</div><img src="${row.flag}" srcset="${row.flag2x}" alt="Flagg" style="margin-top:12px;width:90px;border:1px solid rgba(255,255,255,.35);border-radius:4px;background:#fff;padding:2px">`,
        a:row.country
      };
    });
  };

  makePlaceQuestions=function(catId,headingText){
    const rows=getPlaceRowsByHeading(headingText);
    const picks=tieredPick(rows.map(r=>({q:r.place,a:r.explanation,row:r})),x=>placeScore(x.row));
    return picks.map((x,i)=>{
      const row=x.row;
      const item=Math.random()<.5?makeNameBasedPlaceQuestion(row,catId):makeDescriptionBasedPlaceQuestion(row,catId);
      return {...item,value:JVALUES[i],difficulty:i+1};
    });
  };

  function buildBoardFromColumns(board,columns,openFn,usedClass){
    board.style.gridTemplateColumns=`repeat(${columns.length}, minmax(105px,1fr))`;
    board.innerHTML="";
    columns.forEach(cat=>{
      const h=document.createElement("div");h.className="jeopardy-category";h.textContent=cat.name;board.appendChild(h);
    });
    for(let row=0;row<5;row++){
      columns.forEach(cat=>{
        const q=cat.questions[row];
        const value=JVALUES[row];
        const b=document.createElement("button");
        b.className="jeopardy-cell jeopardy-value";
        b.textContent=String(value);
        if(q)b.addEventListener("click",()=>openFn(b,cat,q,value));
        else {b.disabled=true;b.textContent="—";}
        board.appendChild(b);
      });
    }
  }

  buildInnerJeopardyBoard=function(){
    const board=document.getElementById("inner-jeopardy-board");if(!board)return;
    const names=["Jordas indre","Platedrift","Plategrenser","Jordskjelv og tsunami","Vulkaner","Bergarter og Norge"];
    const bank=dedupeQuestions([...INNER_CONTROL_QUESTIONS,...legacyFlat(INNER_JEOPARDY_CATEGORIES)]);
    const active=buildAcademicColumns(bank,names,innerColumn);
    buildBoardFromColumns(board,active,openInnerJeopardyQuestion);
  };
  buildOuterJeopardyBoard=function(){
    const board=document.getElementById("outer-jeopardy-board");if(!board)return;
    const names=["Grunnprosesser","Elver","Istider og isbreer","Brelandformer","Løsmasser og landheving","Skred og landskapshistorie"];
    const bank=dedupeQuestions([...OUTER_CORE_CONTROL_QUESTIONS,...legacyFlat(OUTER_JEOPARDY_CATEGORIES)]);
    const active=buildAcademicColumns(bank,names,outerColumn);
    buildBoardFromColumns(board,active,openOuterJeopardyQuestion);
  };
  buildResourceJeopardyBoard=function(){
    const board=document.getElementById("resource-jeopardy-board");if(!board)return;
    const names=["Ressurser og bærekraft","Næringer og endring","Lokalisering","Norske ressursnæringer","Arealbruk og lover","Konflikter og makt"];
    const bank=dedupeQuestions([...RESOURCE_CORE_CONTROL_QUESTIONS,...legacyFlat(RESOURCE_JEOPARDY_CATEGORIES)]);
    const active=buildAcademicColumns(bank,names,resourceColumn);
    buildBoardFromColumns(board,active,openResourceJeopardyQuestion);
  };
  buildDemographyJeopardyBoard=function(){
    const board=document.getElementById("demography-jeopardy-board");if(!board)return;
    const names=["Tall og modeller","Fruktbarhet og dødelighet","Struktur og Norge","Levekår og utvikling","Migrasjon","Byer og flukt"];
    const bank=dedupeQuestions([...DEMOGRAPHY_CORE_CONTROL_QUESTIONS,...legacyFlat(DEMOGRAPHY_JEOPARDY_CATEGORIES)]);
    const active=buildAcademicColumns(bank,names,demographyColumn);
    buildBoardFromColumns(board,active,openDemographyJeopardyQuestion);
  };
  buildWeatherJeopardyBoard=function(){
    const board=document.getElementById("weather-jeopardy-board");if(!board)return;
    const active=WEATHER_JEOPARDY_CATEGORIES.map(cat=>({...cat,questions:tieredPick(cat.questions,academicDifficulty)}));
    board.style.gridTemplateColumns=`repeat(${active.length}, minmax(120px,1fr))`;
    board.innerHTML="";
    active.forEach(cat=>board.insertAdjacentHTML("beforeend",`<div class="jeopardy-category">${cat.name}</div>`));
    for(let r=0;r<5;r++){
      active.forEach((cat,c)=>{
        const q=cat.questions[r];if(!q)return;
        const payload=encodeURIComponent(JSON.stringify({...q,cat:cat.name,row:r,col:c}));
        board.insertAdjacentHTML("beforeend",`<button class="jeopardy-cell jeopardy-value" data-payload="${payload}" onclick="openWeatherJeopardyQuestion(this)">${q.value}</button>`);
      });
    }
  };

  function addDifficultyNote(id){
    const setup=document.getElementById(id);if(!setup||setup.querySelector(".jeopardy-random-note"))return;
    const p=document.createElement("p");p.className="fullscreen-note jeopardy-random-note";
    p.textContent="Nytt brett hver runde: spørsmål trekkes tilfeldig fra hele spørsmålsbanken, med enklere spørsmål på 100 og mer krevende spørsmål mot 500.";
    const header=setup.querySelector(".jeopardy-setup-header");
    if(header)header.appendChild(p);
  }
  ["inner-jeopardy-setup","outer-jeopardy-setup","resource-jeopardy-setup","demography-jeopardy-setup","weather-jeopardy-setup","jeopardy-setup"].forEach(addDifficultyNote);

  window.geoJeopardyDifficulty={
    academicDifficulty,
    countryScore,
    placeScore,
    tieredPick,
    counts:{
      inner:INNER_CONTROL_QUESTIONS.length,
      outer:OUTER_CORE_CONTROL_QUESTIONS.length,
      weather:WEATHER_JEOPARDY_CATEGORIES.reduce((n,c)=>n+c.questions.length,0),
      resources:RESOURCE_CORE_CONTROL_QUESTIONS.length,
      demography:DEMOGRAPHY_CORE_CONTROL_QUESTIONS.length
    }
  };
})();
