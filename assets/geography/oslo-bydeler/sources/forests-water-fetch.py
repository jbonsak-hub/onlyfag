import urllib.request, urllib.parse, urllib.error, json, pathlib, gzip, hashlib, datetime
OUT=pathlib.Path('/tmp/oslo-real-source-research')
OUT.mkdir(parents=True,exist_ok=True)
HEADERS={'User-Agent':'Onlyfag educational map source acquisition (OpenStreetMap contributors attribution retained)'}
def fetch(url,filename):
    req=urllib.request.Request(url,headers=HEADERS)
    with urllib.request.urlopen(req,timeout=50) as response:data=response.read()
    (OUT/filename).write_bytes(data)
    print(filename,len(data),hashlib.sha256(data).hexdigest())
    return json.loads(data)

def arcgis():
    app=fetch('https://www.arcgis.com/sharing/rest/content/items/2b2b910daaba4dd4bece777306c843e8/data?f=json','oslo-official-app.json')
    def walk(obj):
        if isinstance(obj,dict):
            if obj.get('itemId'):print('ITEM',obj.get('itemId'),obj.get('type'),obj.get('label'),obj.get('portalUrl'))
            for k,v in obj.items():
                if isinstance(v,str) and ('arcgis' in v or 'MapServer' in v or 'FeatureServer' in v):print('URL',k,v)
                elif isinstance(v,(dict,list)):walk(v)
        elif isinstance(obj,list):
            for v in obj:walk(v)
    walk(app)

def overpass():
    query='[out:json][timeout:90];\n(\nway["name"~"^(Sognsvann|Sognsvatn|Nøklevann|Østensjøvannet|Lutvann|Steinbruvann|Dælivannet|Dælivann|Nordmarka|Østmarka|Lillomarka|Bærumsmarka)$",i](59.7,10.4,60.4,11.3);\nrelation["name"~"^(Sognsvann|Sognsvatn|Nøklevann|Østensjøvannet|Lutvann|Steinbruvann|Dælivannet|Dælivann|Nordmarka|Østmarka|Lillomarka|Bærumsmarka)$",i](59.7,10.4,60.4,11.3);\n);out tags geom;'
    url='https://overpass-api.de/api/interpreter?'+urllib.parse.urlencode({'data':query})
    data=fetch(url,'oslo-named-osm-geometry.json')
    for element in data.get('elements',[]):print(element.get('type'),element.get('id'),element.get('tags'),len(element.get('geometry',[])),len(element.get('members',[])))
if __name__=='__main__':
    import sys
    (arcgis if sys.argv[1]=='arcgis' else overpass)()
