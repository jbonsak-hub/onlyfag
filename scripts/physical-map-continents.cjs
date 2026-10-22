// Teaching order for continent-by-continent practice. Transcontinental features
// use their main extent (Caspian/Caucasus: Asia; Urals/Volga/Don: Europe).
const groups={
 northAmerica:'Mackenzie|Missouri|Ohio|Saint Lawrence|Colorado|Mississippi|Rio Grande|Yukon|Great Bear Lake|Great Slave Lake|Lake Athabasca|Lake Winnipeg|Lake Superior|Lake Michigan|Lake Huron|Lake Erie|Lake Ontario|Great Salt Lake|Lake Nicaragua|Rocky Mountains|Appalachian Mountains|Sierra Madre|Sierra Nevada',
 southAmerica:'Amazon|São Francisco|Paraguay|Paraná|Uruguay|Orinoco|Lake Maracaibo|Lake Titicaca|Brazilian Highlands|Andes|Altiplano',
 europe:'Volga|Dnipro|Don|Rhine|Danube|Loire|Rhône|Glomma|Thames|Po|Elbe|Vänern|Lake Ladoga|Lake Onega|Lake Geneva|Lake Mjøsa|Lake Garda|Scandinavian Mountains|Ural Mountains|Carpathian Mountains|Alps|Dinaric Alps|Apennines|Pyrenees|Dolomites',
 asia:'Ob|Yenisei|Lena|Amur|Huang He (Yellow River)|Yangtze|Indus|Ganges|Brahmaputra|Mekong|Tigris|Euphrates|Syr Darya|Amu Darya|Caspian Sea|Aral Sea|Lake Balkhash|Lake Baikal|Qinghai Lake|Dead Sea|Tonlé Sap|Lake Toba|Tibetan Plateau|Iranian Plateau|Mongolian Plateau|Altai Mountains|Tian Shan|Himalayas|Deccan Plateau|Kunlun Mountains|Hindu Kush|Zagros Mountains|Caucasus Mountains|Eastern Ghats|Western Ghats|Karakoram|Taurus Mountains',
 africa:'Niger|Nile|Blue Nile|White Nile|Congo|Zambezi|Orange|Senegal|Limpopo|Lake Chad|Lake Turkana|Lake Victoria|Lake Tanganyika|Lake Malawi (Nyasa)|Atlas Mountains|Ethiopian Highlands|Drakensberg',
 oceania:'Murray|Lake Eyre|Great Dividing Range'
};
const entries=Object.entries(groups).flatMap(([continent,names])=>names.split('|').map(name=>[name,continent]));
if(new Set(entries.map(([name])=>name)).size!==entries.length)throw Error('Duplicate practice continent');
const lookup=new Map(entries);
module.exports=name=>{const continent=lookup.get(name);if(!continent)throw Error('Missing practice continent: '+name);return continent;};
