import {seededRandom,clamp} from '../runtime/core.mjs';

// The original torus flight, rendered as one unlit point cloud without a CDN.
// The caller owns the clock and all visibility / pause / motion preferences.
export function createStudioTunnel(canvas,{wake=()=>{}}={}){
 if(!canvas)return null;
 let gl,program,buffer,uniforms,ready=false,lost=false,failed=false,phase=0,lastTime=0;
 const theme=matchMedia('(prefers-color-scheme:dark)');
 const random=seededRandom(230),count=4800,points=new Float32Array(count*4);
 for(let i=0;i<count;i++){
  const u=random()*Math.PI*2,v=random()*Math.PI*2,r=15*(.74+random()*.26);
  points.set([(60+r*Math.cos(v))*Math.cos(u),r*Math.sin(v),(60+r*Math.cos(v))*Math.sin(u),random()],i*4);
 }
 const vertex=`
 attribute vec4 point;
 uniform float angle,aspect,dpr;
 uniform vec2 pointer;
 varying float tint,depth;
 void main(){
  vec3 radial=vec3(cos(angle),0.,sin(angle));
  vec3 forward=vec3(-sin(angle),0.,cos(angle));
  vec3 eye=radial*(60.+pointer.x*3.)+vec3(0.,pointer.y*2.,0.);
  vec3 relative=point.xyz-eye;
  depth=dot(relative,forward);
  float x=dot(relative,radial),y=relative.y;
  gl_Position=vec4(x*1.14/aspect,y*1.14,depth*.999-.2,depth);
  gl_PointSize=clamp(110.*dpr/max(depth,.1),1.,7.*dpr);
  tint=point.w;
 }`;
 const fragment=`
 precision mediump float;
 uniform vec3 ink,accent;
 varying float tint,depth;
 void main(){
  float radius=length(gl_PointCoord-.5)*2.;
  float edge=1.-smoothstep(.12,1.,radius);
  float fog=1.-smoothstep(30.,115.,depth);
  gl_FragColor=vec4(mix(ink,accent,step(.82,tint)),edge*fog*.65);
 }`;
 function state(value){if(canvas.dataset.state!==value)canvas.dataset.state=value;}
 function disposeGPU(){if(gl&&!lost){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);}buffer=program=null;ready=false;}
 function init(){
  if(ready||lost||failed)return;
  try{
   gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,powerPreference:'low-power'});
   if(!gl)throw Error('WebGL unavailable');
   program=gl.createProgram();
   for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw Error('Shader unavailable');}
    gl.attachShader(program,shader);gl.deleteShader(shader);
   }
   gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Program unavailable');
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,points,gl.STATIC_DRAW);
   const attr=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,4,gl.FLOAT,false,0,0);
   uniforms=Object.fromEntries(['angle','aspect','dpr','pointer','ink','accent'].map(key=>[key,gl.getUniformLocation(program,key)]));
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);ready=true;
  }catch{failed=true;disposeGPU();state('fallback');}
 }
 const onLost=e=>{e.preventDefault();lost=true;ready=false;canvas.style.opacity='0';state('fallback');};
 const onRestored=()=>{lost=false;failed=false;program=buffer=null;wake();};
 canvas.addEventListener('webglcontextlost',onLost);
 canvas.addEventListener('webglcontextrestored',onRestored);
 return {
  render(s,visibility,paused){
   const active=s.visible&&!s.reducedMotion&&!paused&&s.quality!=='static'&&visibility>0;
   if(!active){canvas.style.opacity='0';lastTime=s.time;state(failed||lost?'fallback':'paused');return false;}
   init();if(!ready){lastTime=s.time;return false;}
   const dpr=Math.min(devicePixelRatio,s.coarsePointer||s.quality==='low'?1:1.5);
   const width=Math.round(innerWidth*dpr),height=Math.round(innerHeight*dpr);
   if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
   phase+=Math.min(.05,Math.max(0,s.time-lastTime))*.006;lastTime=s.time;
   gl.useProgram(program);
   gl.uniform1f(uniforms.angle,s.scroll.progress*Math.PI*2+phase);
   gl.uniform1f(uniforms.aspect,innerWidth/innerHeight);gl.uniform1f(uniforms.dpr,dpr);
   gl.uniform2f(uniforms.pointer,s.pointer.active&&!s.coarsePointer?(s.pointer.x/innerWidth-.5)*2:0,s.pointer.active&&!s.coarsePointer?(.5-s.pointer.y/innerHeight)*2:0);
   gl.uniform3fv(uniforms.ink,theme.matches?[.64,.70,.55]:[.24,.30,.14]);
   gl.uniform3fv(uniforms.accent,theme.matches?[.83,1.,.25]:[.43,.56,.06]);
   gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
   gl.drawArrays(gl.POINTS,0,s.coarsePointer||s.quality==='low'?1800:count);
   canvas.style.opacity=String(clamp(visibility)*(theme.matches?.75:.42));state('playing');
   return true;
  },
  dispose(){disposeGPU();canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);canvas.style.opacity='0';state('paused');}
 };
}
