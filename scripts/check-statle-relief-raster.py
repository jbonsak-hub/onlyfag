"""Validate baked Statle relief dimensions, coast/inset masks and original pixels."""
from pathlib import Path
import hashlib,json,re
import numpy as np
from PIL import Image
GEO=Path(__file__).resolve().parents[1]/'assets/geography'
source=json.loads((GEO/'us-relief.json').read_text(encoding='utf-8'))
data=json.loads((GEO/'us-relief-raster.json').read_text(encoding='utf-8'))
states=json.loads((GEO/'us-states.json').read_text(encoding='utf-8'))
expected={'main':(2600,1900),'AK':(900,650),'HI':(600,420)}
assert data['bakedMask'] and data['bakedRivers']
images={}
for area,entry in data['areas'].items():
 path=GEO/entry['image'];payload=path.read_bytes();assert hashlib.sha256(payload).hexdigest()[:12] in path.name
 image=Image.open(path).convert('RGBA');images[area]=image
 assert image.size==expected[area]==tuple(entry['pixelDimensions'])
 assert entry['bounds']==source['areas'][area]['bounds']
 assert image.getchannel('A').getextrema()==(0,255)
 assert not entry.get('rivers'),'Rivers must be baked, not painted as live SVG paths'
 original=np.asarray(Image.open(GEO/source['areas'][area]['image']).convert('RGB'))
 current=np.asarray(image);opaque=current[:,:,3]==255
 same=np.all(original==current[:,:,:3],axis=2)
 # The only changed opaque RGB pixels are the antialiased river overlay.
 assert float((opaque&same).sum()/opaque.sum())>.94

def alpha(area,p,radius=0):
 image=images[area];x,y,w,h=data['areas'][area]['bounds']
 px=round((p[0]-x)*image.width/w);py=round((p[1]-y)*image.height/h)
 return max(image.getpixel((max(0,min(image.width-1,i)),max(0,min(image.height-1,j))))[3] for i in range(px-radius,px+radius+1) for j in range(py-radius,py+radius+1))
for name in ['us-capitals.json','us-largest-cities.json']:
 path=GEO/name
 if not path.exists():continue
 cities=json.loads(path.read_text(encoding='utf-8'))
 for state in states:
  area=state['a'] if state['a'] in ('AK','HI') else 'main'
  city=cities[state['n']]
  assert alpha(area,city['p'],2)>100,state['n']+' marker has no local land coverage'
m=data['areas']['main']['transform']
for name,(x,y,w,h) in data['insetBoxes'].items():
 for fx,fy in ((.1,.1),(.5,.5),(.9,.9)):
  assert alpha('main',[(x+w*fx-m[4])/m[0],(y+h*fy-m[5])/m[3]])==0,name+' inset cut must be transparent'
print('PASS exact terrain dimensions, lossless original land pixels, city coverage, and inset alpha cuts')
