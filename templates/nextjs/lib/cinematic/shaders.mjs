/** Original GLSL recipes. Raw canvas works in display space; the Three host adds its linear-output conversion. */
export const SHADER_PRESETS = ['displacement', 'refraction', 'atmosphere', 'portal'];
export const vertexShader = `#version 300 es
in vec2 position;
out vec2 vUv;
void main(){vUv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const common = `
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uTime, uProgress, uVelocity, uProximity, uQuality, uReducedMotion, uHasTexture;
uniform vec2 uPointer, uResolution, uImageSize;
uniform vec3 uColorA, uColorB;
uniform vec4 uRadiusX, uRadiusY;
uniform sampler2D uTexture;
void clipCorners(){
  vec2 p=vec2(vUv.x,1.-vUv.y)*uResolution;
  for(int i=0;i<4;i++){
    vec2 r=vec2(uRadiusX[i],uRadiusY[i]);
    vec2 q=vec2(i==1||i==2?uResolution.x-p.x:p.x,i>=2?uResolution.y-p.y:p.y);
    if(r.x>0.&&r.y>0.&&q.x<r.x&&q.y<r.y&&length((q-r)/r)>1.) discard;
  }
}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  vec3 k=vec3(127.1,311.7,43758.5453);
  float a=fract(sin(dot(i,k.xy))*k.z),b=fract(sin(dot(i+vec2(1,0),k.xy))*k.z);
  float c=fract(sin(dot(i+vec2(0,1),k.xy))*k.z),d=fract(sin(dot(i+vec2(1,1),k.xy))*k.z);
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
}
vec2 coverUV(vec2 uv){
  float screen=uResolution.x/max(uResolution.y,1.),source=uImageSize.x/max(uImageSize.y,1.);
  vec2 scale=vec2(min(screen/source,1.),min(source/screen,1.));
  return (uv-.5)*scale+.5;
}
vec3 imageAt(vec2 uv){
  if(uHasTexture>.5) return texture(uTexture,clamp(coverUV(uv),.001,.999)).rgb;
  float rings=.5+.5*cos(length((uv-.5)*vec2(1.5,1.))*24.);
  return mix(uColorA,uColorB,clamp(uv.y*.6+rings*.4,0.,1.));
}
`;
const bodies = {
  displacement: `
  vec2 uv=vUv,delta=uv-uPointer;
  float radius=exp(-dot(delta,delta)*22.);
  float motion=1.-uReducedMotion;
  uv+=delta*radius*uProximity*.12*motion;
  uv.x+=sin(uv.y*16.+uTime*2.)*uVelocity*.018*motion;
  outColor=vec4(imageAt(uv),1.);`,
  refraction: `
  vec2 uv=vUv,delta=uv-uPointer;
  float lens=exp(-dot(delta,delta)*12.)*uProximity*(1.-uReducedMotion);
  vec2 bend=delta*lens*.22+vec2(sin(uv.y*9.+uTime)*.012*uVelocity,0.);
  vec3 color=imageAt(uv+bend);
  color.r=imageAt(uv+bend*1.12).r;
  color.b=imageAt(uv+bend*.88).b;
  color+=pow(max(0.,1.-abs(length(delta)-.23)*60.),3.)*lens*.2;
  outColor=vec4(color,1.);`,
  atmosphere: `
  vec2 uv=(vUv-.5)*vec2(uResolution.x/max(uResolution.y,1.),1.);
  float t=uTime*.13*(1.-uReducedMotion),sum=0.,amp=.5;
  vec2 p=uv*2.4+vec2(uProgress*.7,t);
  for(int i=0;i<4;i++){
    if(float(i)>uQuality+1.) break;
    sum+=noise(p+noise(p+t))*amp;p=p*2.02+3.7;amp*=.5;
  }
  float field=smoothstep(.15,.85,sum+sin(uv.x*2.-uv.y*3.+t)*.12);
  float light=exp(-length(uv-(uPointer-.5)) * 2.)*uProximity*.2*(1.-uReducedMotion);
  vec3 color=mix(uColorA,uColorB,field)+light;
  color*=.9;
  outColor=vec4(color,1.);`,
  portal: `
  vec2 p=(vUv-.5)*vec2(uResolution.x/max(uResolution.y,1.),1.);
  float radius=mix(.06,.85,uProgress),d=length(p);
  float edge=1.-smoothstep(.008,.03,abs(d-radius));
  float inside=1.-smoothstep(radius-.012,radius+.012,d);
  vec2 uv=vUv+(vUv-.5)*edge*.06*(1.-uReducedMotion);
  vec3 color=mix(uColorA*.4,imageAt(uv),inside)+uColorB*edge*.8;
  outColor=vec4(color,1.);`,
};
export function fragmentShader(preset) {
  if (!SHADER_PRESETS.includes(preset)) throw new TypeError('Unknown shader preset: ' + preset);
  return '#version 300 es\n' + common + '\nvoid main(){clipCorners();' + bodies[preset] + '\n}';
}
