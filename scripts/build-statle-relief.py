"""Reproject public-domain Natural Earth relief into the existing Statle state coordinates.
Usage: python scripts/build-statle-relief.py source.tif rivers.geojson
Requires Pillow and NumPy; no runtime map service is used.
"""
import sys,json,re,math,hashlib,io
from pathlib import Path
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]);rivers_path=Path(sys.argv[2])
Image.MAX_IMAGE_PIXELS=100_000_000
raster=np.asarray(Image.open(source).convert('RGB'))
H,W,_=raster.shape
rad=math.pi/180
n=(math.sin(29.5*rad)+math.sin(45.5*rad))/2
c=math.cos(29.5*rad)**2+2*n*math.sin(29.5*rad)
rho0=math.sqrt(c)/n
rho=math.sqrt(c-2*n*math.sin(38.7*rad))/n
center=(rho*math.sin(-.6*rad*n),rho0-rho*math.cos(-.6*rad*n))
def forward(lon,lat,area):
 if area=='AK': return [824.0256300273641+4.169974327844517*(lon-360 if lon>0 else lon),770.5588802583964-4.169974327844517*lat]
 if area=='HI': return [4015.17901197142+23.170796903781728*lon,1020.2462085977172-23.170796903781728*lat]
 rho=math.sqrt(c-2*n*math.sin(lat*rad))/n
 return [499.6372552186457+983.5892427316285*(rho*math.sin((lon+96)*rad*n)-center[0]),247.90855578188942-983.5892427316285*(rho0-rho*math.cos((lon+96)*rad*n)-center[1])]
def inverse(x,y,area):
 if area=='AK':return (x-824.0256300273641)/4.169974327844517,(770.5588802583964-y)/4.169974327844517
 if area=='HI':return (x-4015.17901197142)/23.170796903781728,(1020.2462085977172-y)/23.170796903781728
 rx=(x-499.6372552186457)/983.5892427316285+center[0];ry=(247.90855578188942-y)/983.5892427316285+center[1]
 rho=np.hypot(rx,rho0-ry);theta=np.arctan2(rx,rho0-ry)
 return theta/n/rad-96,np.arcsin(np.clip((c-(rho*n)**2)/(2*n),-1,1))/rad
states=json.loads((ROOT/'assets/geography/us-states.json').read_text())
features=json.loads(rivers_path.read_text(encoding='utf-8'))['features']
out=ROOT/'assets/geography/statle-relief';out.mkdir(exist_ok=True)
manifest={'source':'Natural Earth II 1:50m, shaded relief and water 3.2.0; Natural Earth 1:50m rivers','sourceSHA256':hashlib.sha256(source.read_bytes()).hexdigest(),'areas':{}}
for area in ['main','AK','HI']:
 selected=[s for s in states if (s['a'] if s['a'] in ['AK','HI'] else 'main')==area]
 if area=='main':bounds=[-150,-150,1300,950];size=(2600,1900)
 else:
  xy=[tuple(map(float,m)) for s in selected for m in re.findall(r'[ML]([-\d.]+) ([-\d.]+)',s['d'])]
  xmin=min(p[0] for p in xy)-25;ymin=min(p[1] for p in xy)-25
  bounds=[xmin,ymin,max(p[0] for p in xy)-xmin+25,max(p[1] for p in xy)-ymin+25]
  size=(900,650) if area=='AK' else (600,420)
 left,top,width,height=bounds;ow,oh=size;result=np.empty((oh,ow,3),dtype=np.uint8)
 for row in range(0,oh,120):
  count=min(120,oh-row)
  x=left+(np.arange(ow)[None,:]+.5)*width/ow;y=top+(np.arange(row,row+count)[:,None]+.5)*height/oh
  lon,lat=inverse(x,y,area);lon=np.broadcast_to(lon,(count,ow));lat=np.broadcast_to(lat,(count,ow))
  px=np.clip((lon+180)/360*W-.5,0,W-1.001);py=np.clip((90-lat)/180*H-.5,0,H-1.001)
  ix=px.astype(int);iy=py.astype(int);fx=(px-ix)[...,None];fy=(py-iy)[...,None]
  result[row:row+count]=np.clip(raster[iy,ix]*(1-fx)*(1-fy)+raster[iy,ix+1]*fx*(1-fy)+raster[iy+1,ix]*(1-fx)*fy+raster[iy+1,ix+1]*fx*fy,0,255).astype(np.uint8)
 buffer=io.BytesIO();Image.fromarray(result).save(buffer,format='WEBP',quality=88,method=6)
 payload=buffer.getvalue();filename=area+'-'+hashlib.sha256(payload).hexdigest()[:12]+'.webp';(out/filename).write_bytes(payload)
 paths=[]
 for f in features:
  if f['properties'].get('scalerank',99)>4:continue
  geometry=f['geometry'];lines=[geometry['coordinates']] if geometry['type']=='LineString' else geometry['coordinates'] if geometry['type']=='MultiLineString' else []
  for line in lines:
   region=(lambda p:-135<p[0]<-55 and 10<p[1]<80) if area=='main' else (lambda p:-180<p[0]<-130 and 48<p[1]<75) if area=='AK' else (lambda p:False)
   if not any(region(p) for p in line):continue
   coords=[forward(*p[:2],area) for p in line]
   paths.append('M'+'L'.join(str(round(x,3))+' '+str(round(y,3)) for x,y in coords))
 manifest['areas'][area]={'image':'statle-relief/'+filename,'bounds':bounds,'rivers':''.join(paths)}
 print(area,len(payload),'bytes',len(paths),'river segments')
(ROOT/'assets/geography/us-relief.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n',encoding='utf-8')
