/* A local, draggable globe surface. Only redraws when the view or map changes. */
(() => {
  'use strict';
  const base=new URL('.',document.currentScript.src),canvas=document.createElement('canvas');
  canvas.id='globe-surface';canvas.width=640;canvas.height=640;canvas.tabIndex=0;
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Roterbar jordklode. Dra sidelengs eller bruk venstre og høyre piltast.');
  let longitude=10,physical=false,dark=false,pending=0,holder=null;
  const images={},pixels={},textures={};
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:true});
  let program,uniforms,ctx,lookup;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  if(gl){
    program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 v;void main(){v=p;gl_Position=vec4(p,0.,1.);}'));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision highp float;varying vec2 v;uniform sampler2D map;uniform float yaw;uniform float photo;uniform float ready;uniform vec3 ocean;uniform vec3 land;
      void main(){float r=dot(v,v);if(r>=1.||ready<.5)discard;float z=sqrt(1.-r);float lon=atan(v.x,z)+yaw;float lat=asin(clamp(v.y,-1.,1.));vec2 uv=vec2(fract(lon/6.283185307+.5),.5-lat/3.141592654);vec3 sampleColor=texture2D(map,uv).rgb;vec3 c=photo>.5?sampleColor:mix(ocean,land,sampleColor.r);float light=.76+.24*max(0.,dot(vec3(v,z),normalize(vec3(-.35,.35,1.))));gl_FragColor=vec4(c*light,1.-smoothstep(.987,1.,r));}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const location=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
    uniforms=Object.fromEntries(['map','yaw','photo','ready','ocean','land'].map(k=>[k,gl.getUniformLocation(program,k)]));gl.uniform1i(uniforms.map,0);
  }else{
    canvas.width=384;canvas.height=384;ctx=canvas.getContext('2d');lookup=[];
    for(let y=0;y<384;y++)for(let x=0;x<384;x++){const nx=(x+.5)/192-1,ny=1-(y+.5)/192,r=nx*nx+ny*ny;if(r<1){const z=Math.sqrt(1-r);lookup.push({i:(y*384+x)*4,u:Math.atan2(nx,z)/(2*Math.PI)+.5,v:Math.floor((.5-Math.asin(ny)/Math.PI)*1024),shade:.76+.24*Math.max(0,(-.35*nx+.35*ny+z)/1.116)});}}
  }
  function color(name){const s=getComputedStyle(document.body).getPropertyValue(name).trim();if(/^#[a-f\d]{6}$/i.test(s))return [1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);return [.4,.6,.5];}
  function draw(){pending=0;if(!holder||!images.mask)return;const key=physical&&images.physical?'physical':'mask',ocean=color('--ocean'),land=color('--land');
    if(gl){gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,textures[key]);gl.uniform1f(uniforms.yaw,longitude*Math.PI/180);gl.uniform1f(uniforms.photo,key==='physical'?1:0);gl.uniform1f(uniforms.ready,1);gl.uniform3fv(uniforms.ocean,ocean);gl.uniform3fv(uniforms.land,land);gl.drawArrays(gl.TRIANGLES,0,6);}
    else{if(!pixels[key]){const temp=document.createElement('canvas');temp.width=2048;temp.height=1024;const c=temp.getContext('2d',{willReadFrequently:true});c.drawImage(images[key],0,0,2048,1024);pixels[key]=c.getImageData(0,0,2048,1024).data;}const input=pixels[key],output=ctx.createImageData(384,384),data=output.data;for(const p of lookup){const u=((p.u+longitude/360)%1+1)%1,j=(p.v*2048+Math.floor(u*2048))*4;for(let k=0;k<3;k++){const c=key==='physical'?input[j+k]:255*(ocean[k]+(land[k]-ocean[k])*input[j]/255);data[p.i+k]=c*p.shade;}data[p.i+3]=255;}ctx.putImageData(output,0,0);}
  }
  function schedule(){if(!pending)pending=requestAnimationFrame(draw);}
  async function load(key,file){
    if(images[key]||images[key+'Pending'])return;images[key+'Pending']=true;
    let objectURL;
    try{
      const img=new Image(),url=new URL(file,base);
      // Explicit MIME also supports static preview servers that serve SVG as binary.
      if(file.endsWith('.svg')){const response=await fetch(url);if(!response.ok)throw Error('Map unavailable');objectURL=URL.createObjectURL(new Blob([await response.text()],{type:'image/svg+xml'}));img.src=objectURL;}
      else img.src=url.href;
      await img.decode();images[key]=img;
      if(gl){const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);textures[key]=texture;}
      schedule();dispatchEvent(new CustomEvent('circulation-surface-ready',{detail:{map:key}}));
    }catch{images[key+'Pending']=false;dispatchEvent(new CustomEvent('circulation-surface-error',{detail:{map:key}}));}
    finally{if(objectURL)URL.revokeObjectURL(objectURL);}
  }
  window.CirculationGlobe={mount(element){holder=element;element.append(canvas);schedule();},set(options){if(Number.isFinite(options.longitude))longitude=options.longitude;if('physical'in options)physical=options.physical;if('dark'in options)dark=options.dark;if(physical)load('physical','earth-physical.webp');schedule();},get physicalReady(){return !!images.physical;},get canvas(){return canvas;},get renderer(){return gl?'webgl':'canvas2d';}};
  load('mask','earth-mask.svg');
})();
