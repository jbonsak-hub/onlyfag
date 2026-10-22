#!/usr/bin/env python3
"""Convert the user-provided legacy Flash reference into inert SVG/timeline data.

No ActionScript or executable content is run or copied to the website. The renderer
supports this film's vector shapes, morphs, matrices, masks, text and nested movies.
Source artwork: forskning.no, 'Slik oppstår en tsunami', supplied by the user.
"""
import argparse, collections, copy, html, json, math, struct
from pathlib import Path

class Reader:
    def __init__(self,data,pos=0): self.data=data; self.bit=pos*8
    @property
    def pos(self): return (self.bit+7)//8
    def align(self): self.bit=self.pos*8
    def bits(self,n,signed=False):
        v=0
        for _ in range(n):
            v=v*2+((self.data[self.bit//8]>>(7-self.bit%8))&1); self.bit+=1
        return v-(1<<n) if signed and n and v&(1<<(n-1)) else v
    def uint(self,n):
        self.align(); p=self.pos; self.bit+=n*8
        return int.from_bytes(self.data[p:p+n],'little')
    def u8(self): return self.uint(1)
    def u16(self): return self.uint(2)
    def u32(self): return self.uint(4)
    def string(self):
        self.align(); p=self.pos; end=self.data.index(0,p); self.bit=(end+1)*8
        return self.data[p:end].decode('utf-8',errors='replace')
    def rect(self):
        n=self.bits(5); a=[self.bits(n,True) for _ in range(4)]; self.align(); return a
    def matrix(self):
        a=d=1; b=c=0
        if self.bits(1):
            n=self.bits(5); a=self.bits(n,True)/65536; d=self.bits(n,True)/65536
        if self.bits(1):
            n=self.bits(5); b=self.bits(n,True)/65536; c=self.bits(n,True)/65536
        n=self.bits(5); x=self.bits(n,True); y=self.bits(n,True); self.align()
        return [a,b,c,d,x,y]
    def color(self,alpha=True): return [self.u8() for _ in range(4 if alpha else 3)]+([] if alpha else [255])
    def cxform(self,alpha=True):
        add=self.bits(1); mul=self.bits(1); n=self.bits(4); channels=4 if alpha else 3
        ms=[self.bits(n,True)/256 for _ in range(channels)] if mul else [1]*channels
        ads=[self.bits(n,True) for _ in range(channels)] if add else [0]*channels
        self.align()
        if not alpha: ms.append(1);ads.append(0)
        return ms+ads

def fmt(v):
    if isinstance(v,int) or float(v).is_integer(): return str(int(v))
    return ('%.5f'%v).rstrip('0').rstrip('.')
def matrix_attr(m): return 'matrix('+ ' '.join(fmt(x) for x in m)+')'
def rgba(c): return '#'+''.join('%02x'%max(0,min(255,round(v))) for v in c[:3])
def color_attrs(c,name='fill'): return '%s="%s" %s-opacity="%s"'%(name,rgba(c),name,fmt(c[3]/255))
def lerp(a,b,t): return [x+(y-x)*t for x,y in zip(a,b)]

def fill_style(r,alpha,morph=False):
    t=r.u8(); result={'type':t}
    if t==0:
        result['color']=r.color(alpha or morph)
        if morph: result['endColor']=r.color(True)
    elif t in [0x10,0x12,0x13]:
        result['matrix']=r.matrix()
        if morph: result['endMatrix']=r.matrix()
        count=r.u8(); result['spread']=count>>6; result['interpolation']=(count>>4)&3; count&=15
        stops=[]
        for _ in range(count):
            stop={'ratio':r.u8(),'color':r.color(alpha or morph)}
            if morph: stop.update(endRatio=r.u8(),endColor=r.color(True))
            stops.append(stop)
        result['stops']=stops
        if t==0x13: result['focal']=r.uint(2)/256
    elif t in [0x40,0x41,0x42,0x43]:
        result['bitmap']=r.u16(); result['matrix']=r.matrix()
        if morph: result['endMatrix']=r.matrix()
    else: raise ValueError('Unsupported fill type '+hex(t))
    return result

def fill_styles(r,alpha,morph=False):
    count=r.u8(); count=r.u16() if count==255 else count
    return [fill_style(r,alpha,morph) for _ in range(count)]
def line_styles(r,alpha,morph=False):
    count=r.u8(); count=r.u16() if count==255 else count;out=[]
    for _ in range(count):
        width=r.u16(); endwidth=r.u16() if morph else width;color=r.color(alpha or morph);endcolor=r.color(True) if morph else color
        out.append({'width':width,'endWidth':endwidth,'color':color,'endColor':endcolor})
    return out

def shape_records(r,fills,lines,alpha=True,new_styles=True):
    nf=r.bits(4); nl=r.bits(4); x=y=0; f0=f1=li=0;fb=lb=0;edges=[];fg=collections.defaultdict(list);lg=collections.defaultdict(list)
    while True:
        if not r.bits(1):
            flags=r.bits(5)
            if flags==0: break
            if flags&1:
                n=r.bits(5); x=r.bits(n,True); y=r.bits(n,True)
            if flags&2:
                v=r.bits(nf); f0=v+fb if v else 0
            if flags&4:
                v=r.bits(nf); f1=v+fb if v else 0
            if flags&8:
                v=r.bits(nl); li=v+lb if v else 0
            if flags&16:
                if not new_styles: raise ValueError('Unexpected new morph styles')
                r.align();fb=len(fills);lb=len(lines); fills.extend(fill_styles(r,alpha)); lines.extend(line_styles(r,alpha));nf=r.bits(4);nl=r.bits(4)
            continue
        straight=r.bits(1);n=r.bits(4)+2; ox,oy=x,y
        if straight:
            if r.bits(1):x+=r.bits(n,True);y+=r.bits(n,True)
            elif r.bits(1):y+=r.bits(n,True)
            else:x+=r.bits(n,True)
            e=[ox,oy,(ox+x)/2,(oy+y)/2,x,y]
        else:
            cx=x+r.bits(n,True);cy=y+r.bits(n,True);x=cx+r.bits(n,True);y=cy+r.bits(n,True);e=[ox,oy,cx,cy,x,y]
        i=len(edges);edges.append(e)
        if f0:fg[f0].append([i,True])
        if f1:fg[f1].append([i,False])
        if li:lg[li].append([i,False])
    r.align();return {'edges':edges,'fillGroups':dict(fg),'lineGroups':dict(lg)}

def chain_groups(edges,groups):
    result={}
    for style,items in groups.items():
        remaining={i:rev for i,rev in items};starts=collections.defaultdict(list)
        for i,rev in items: starts[tuple(edges[i][4:6] if rev else edges[i][0:2])].append(i)
        chains=[]
        while remaining:
            i=next(iter(remaining)); chain=[]
            while i is not None:
                rev=remaining.pop(i);chain.append([i,rev]);end=tuple(edges[i][0:2] if rev else edges[i][4:6])
                i=next((j for j in starts[end] if j in remaining),None)
            chains.append(chain)
        result[style]=chains
    return result

def path_from_chains(edges,chains,close=False):
    parts=[]
    for chain in chains:
        first=True
        for i,rev in chain:
            e=edges[i];x0,y0,cx,cy,x1,y1=(e[4],e[5],e[2],e[3],e[0],e[1]) if rev else e
            if first:parts.append('M'+fmt(x0)+' '+fmt(y0));first=False
            if abs(cx-(x0+x1)/2)<.00001 and abs(cy-(y0+y1)/2)<.00001:parts.append('L'+fmt(x1)+' '+fmt(y1))
            else:parts.append('Q'+' '.join(fmt(v) for v in [cx,cy,x1,y1]))
        if close:parts.append('Z')
    return ' '.join(parts)

def paint(style,gid):
    if style['type']==0:return color_attrs(style['color']),''
    if style['type'] not in [0x10,0x12,0x13]:return 'fill="none"',''
    radial=style['type']!=0x10;tag='radialGradient' if radial else 'linearGradient';attrs='cx="0" cy="0" r="16384"' if radial else 'x1="-16384" x2="16384" y1="0" y2="0"'
    spread=['pad','reflect','repeat','pad'][style.get('spread',0)]
    stops=''.join('<stop offset="%s" %s/>'%(fmt(s['ratio']/255),color_attrs(s['color'],'stop-color').replace('stop-color-opacity','stop-opacity')) for s in style['stops'])
    grad='<%s id="%s" gradientUnits="userSpaceOnUse" %s gradientTransform="%s" spreadMethod="%s">%s</%s>'%(tag,gid,attrs,matrix_attr(style['matrix']),spread,stops,tag)
    return 'fill="url(#'+gid+')"',grad

def shape_svg(asset,aid):
    pieces=[];defs=[]
    for style,chains in asset['fillChains'].items():
        style=int(style);attrs,gradient=paint(asset['fills'][style-1],'ts-ref-grad-%s-%s'%(aid,style));defs.append(gradient)
        pieces.append('<path d="%s" %s fill-rule="evenodd"/>'%(path_from_chains(asset['edges'],chains,True),attrs))
    for style,chains in asset['lineChains'].items():
        ls=asset['lines'][int(style)-1]
        pieces.append('<path d="%s" fill="none" %s stroke-width="%s" stroke-linecap="round" stroke-linejoin="round"/>'%(path_from_chains(asset['edges'],chains),color_attrs(ls['color'],'stroke'),fmt(ls['width'])))
    return '<g id="ts-ref-asset-%s">%s%s</g>'%(aid,''.join(defs),''.join(pieces))

def tags(data,start=0):
    r=Reader(data,start)
    while r.pos+2<=len(data):
        h=r.u16();tag=h>>6;n=h&63
        if n==63:n=r.u32()
        p=r.pos;payload=data[p:p+n];r.bit=(p+n)*8;yield tag,payload
        if tag==0:break

def actions(data):
    r=Reader(data);out=[]
    while r.pos<len(data):
        op=r.u8()
        if not op:break
        n=r.u16() if op>=128 else 0;p=r.pos;payload=data[p:p+n];r.bit=(p+n)*8
        if op==7:out.append(['stop'])
        elif op==6:out.append(['play'])
        elif op==0x81:out.append(['goto',int.from_bytes(payload,'little')])
        elif op==0x8c:out.append(['label',payload.rstrip(b'\0').decode('latin1')])
    return out

class Extractor:
    def __init__(self):self.assets={};self.sprites={};self.fonts={};self.labels={};self.defs=[]
    def font(self,d):
        r=Reader(d);fid=r.u16();flags=r.u8();r.u8();n=r.u8();p=r.pos;name=d[p:p+n].decode('latin1').rstrip('\0');r.bit=(p+n)*8;num=r.u16();base=r.pos;w=4 if flags&8 else 2
        r.bit=(base+num*w)*8;co=r.uint(w);r.bit=(base+co)*8;cw=2 if flags&4 else 1
        codes=[r.uint(cw) for _ in range(num)]
        offsets=[int.from_bytes(d[base+i*w:base+(i+1)*w],'little') for i in range(num)]
        self.fonts[fid]={'name':name,'codes':codes,'italic':bool(flags&2),'bold':bool(flags&1)}
        for i,offset in enumerate(offsets):
            gr=Reader(d,base+offset);glyph=shape_records(gr,[{'type':0,'color':[0,0,0,255]}],[],new_styles=False)
            chains=chain_groups(glyph['edges'],glyph['fillGroups'])
            paths=''.join('<path d="%s" fill-rule="evenodd"/>'%path_from_chains(glyph['edges'],chain,True) for chain in chains.values())
            self.defs.append('<g id="ts-ref-glyph-%s-%s">%s</g>'%(fid,i,paths))
    def text(self,d,alpha):
        r=Reader(d);aid=r.u16();bounds=r.rect();m=r.matrix();gb=r.u8();ab=r.u8();font=None;size=240;color=[0,0,0,255];x=y=0;runs=[];alltext=[]
        while r.pos<len(d):
            flags=r.u8()
            if not flags:break
            if flags&8:font=r.u16()
            if flags&4:color=r.color(alpha)
            if flags&1:x=r.u16();x=x-65536 if x&32768 else x
            if flags&2:y=r.u16();y=y-65536 if y&32768 else y
            if flags&8:size=r.u16()
            count=r.u8();chars=[]
            for _ in range(count):
                index=r.bits(gb);advance=r.bits(ab,True);codes=self.fonts.get(font,{}).get('codes',[]);ch=chr(codes[index]) if index<len(codes) else '?';chars.append([x,y,ch]);alltext.append(ch);x+=advance
            r.align();runs.append({'font':self.fonts.get(font,{}).get('name','Trebuchet MS'),'fontId':font,'size':size,'color':color.copy(),'chars':chars})
        asset={'type':'text','bounds':bounds,'matrix':m,'runs':runs,'text':''.join(alltext)};self.assets[aid]=asset
        texts=[]
        replacement=asset['text']
        if replacement=='Mantelen(lava)':
            run=runs[0];c=run['chars'][0];texts.append('<text x="%s" y="%s" font-size="%s" font-family="Trebuchet MS,Arial,sans-serif" %s>Mantel<tspan x="%s" dy="%s" font-size="%s">hovedsakelig fast</tspan></text>'%(fmt(c[0]),fmt(c[1]),fmt(run['size']),color_attrs(run['color']),fmt(c[0]),fmt(run['size']*1.2),fmt(run['size']*.64)))
        elif replacement=='Økt trykk':
            run=runs[0];c=run['chars'][0];texts.append('<text x="%s" y="%s" font-size="%s" font-family="Trebuchet MS,Arial,sans-serif" %s>Delvis smelting</text>'%(fmt(c[0]-120),fmt(c[1]),fmt(run['size']*.72),color_attrs(run['color'])))
        else:
            for run in runs:
                codes=self.fonts[run['fontId']]['codes'];uses=[]
                for x,y,ch in run['chars']:
                    index=codes.index(ord(ch))
                    uses.append('<use href="#ts-ref-glyph-%s-%s" transform="translate(%s %s) scale(%s)"/>'%(run['fontId'],index,fmt(x),fmt(y),fmt(run['size']/1024)))
                texts.append('<g %s>%s</g>'%(color_attrs(run['color']),''.join(uses)))
        self.defs.append('<g id="ts-ref-asset-%s" transform="%s">%s</g>'%(aid,matrix_attr(m),''.join(texts)))
    def shape(self,d,version):
        r=Reader(d);aid=r.u16();bounds=r.rect();fills=fill_styles(r,version>=3);lines=line_styles(r,version>=3);shape=shape_records(r,fills,lines,version>=3)
        shape.update(type='shape',bounds=bounds,fills=fills,lines=lines);shape['fillChains']=chain_groups(shape['edges'],shape.pop('fillGroups'));shape['lineChains']=chain_groups(shape['edges'],shape.pop('lineGroups'))
        shape['clip']=''.join('<path d="%s" fill-rule="evenodd"/>'%path_from_chains(shape['edges'],chains,True) for chains in shape['fillChains'].values())
        self.assets[aid]=shape;self.defs.append(shape_svg(shape,aid))
    def morph(self,d):
        r=Reader(d);aid=r.u16();bounds=r.rect();endbounds=r.rect();offset=r.u32();endpos=r.pos+offset;fills=fill_styles(r,True,True);lines=line_styles(r,True,True)
        start=shape_records(r,fills,lines,new_styles=False);r.bit=endpos*8;end=shape_records(r,fills,lines,new_styles=False)
        if len(start['edges'])!=len(end['edges']):raise ValueError('Morph edge mismatch %s %s %s'%(aid,len(start['edges']),len(end['edges'])))
        self.assets[aid]={'type':'morph','bounds':bounds,'endBounds':endbounds,'fills':fills,'lines':lines,'edges':start['edges'],'endEdges':end['edges'],'fillChains':chain_groups(start['edges'],start['fillGroups']),'lineChains':chain_groups(start['edges'],start['lineGroups'])}
    def timeline(self,taglist,aid=None):
        state={};frames=[];labels={};act={};index=0
        for tag,d in taglist:
            if tag in [2,22,32]:self.shape(d,{2:1,22:2,32:3}[tag])
            elif tag==46:self.morph(d)
            elif tag==48:self.font(d)
            elif tag in [11,33]:self.text(d,tag==33)
            elif tag==39:
                sid,n=struct.unpack_from('<HH',d);movie=self.timeline(list(tags(d,4)),sid);self.sprites[sid]=movie;self.assets[sid]={'type':'sprite'}
            elif tag in [7,34,37]:
                bid=int.from_bytes(d[:2],'little');self.assets[bid]={'type':'ignored'}
            elif tag==26:
                r=Reader(d);flags=r.u8();depth=r.u16();old=state.get(depth);node=copy.deepcopy(old) if old else {'id':0,'matrix':[1,0,0,1,0,0],'color':[1,1,1,1,0,0,0,0],'ratio':0,'since':index}
                if flags&2:
                    char=r.u16()
                    if not old or char!=old['id'] or not flags&1:node['since']=index
                    node['id']=char
                if flags&4:node['matrix']=r.matrix()
                if flags&8:node['color']=r.cxform()
                if flags&16:node['ratio']=r.u16()
                if flags&32:node['name']=r.string()
                if flags&64:node['clip']=r.u16()
                state[depth]=node
            elif tag==28:state.pop(int.from_bytes(d,'little'),None)
            elif tag==43:labels[d.rstrip(b'\0').decode('latin1')]=index
            elif tag==12:
                parsed=actions(d)
                if parsed:act[index]=parsed
            elif tag==1:
                frames.append([[depth,n['id'],n['matrix'],n['color'],n['ratio'],n.get('clip',0),n['since']] for depth,n in sorted(state.items())]);index+=1
        return {'frames':frames,'labels':labels,'actions':act}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('source',type=Path);ap.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'assets/geography/tsunami/reference-data.js');args=ap.parse_args()
    data=args.source.read_bytes()
    if data[:3]!=b'FWS':raise SystemExit('Pass an uncompressed FWS file; executable files are never run.')
    r=Reader(data,8);bounds=r.rect();fps=r.u16()/256;count=r.u16();ex=Extractor();movie=ex.timeline(list(tags(data,r.pos)))
    # Static shapes are SVG symbols; only morph coordinates and text metadata need JSON.
    assets={str(aid):({k:v for k,v in a.items() if k in ['type','text','bounds','clip']} if a['type']!='morph' else a) for aid,a in ex.assets.items()}
    payload={'source':'forskning.no – Slik oppstår en tsunami (user-provided legacy reference)','fps':fps,'width':bounds[1]/20,'height':bounds[3]/20,'crop':[0,30.6,440,251],'frameCount':count,'defs':''.join(ex.defs),'assets':assets,'sprites':ex.sprites,**movie}
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text('/* Inert vector/timeline data extracted from the user-provided forskning.no reference. */\nwindow.TsunamiReference='+json.dumps(payload,ensure_ascii=False,separators=(',',':'))+';\n')
    print('Wrote',args.output,'bytes',args.output.stat().st_size,'assets',len(assets),'morphs',sum(a['type']=='morph' for a in assets.values()),'sprites',len(ex.sprites),'frames',len(movie['frames']))
    for aid,s in ex.sprites.items():print('Sprite',aid,'frames',len(s['frames']),'labels',s['labels'],'actions',s['actions'])
    print('Labels',movie['labels'])
if __name__=='__main__':main()
