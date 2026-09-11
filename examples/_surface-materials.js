import * as THREE from 'three';

/** Shared, locally hosted CC0 scans. Colour is sRGB; packed AO/roughness and normals stay linear. */
export function createSurfaceLibrary(renderer,invalidate=()=>{}){
 const loader=new THREE.TextureLoader(),cache=new Map(),materials=new Set();
 function texture(asset,kind){
  const key=asset+'_'+kind;
  if(cache.has(key))return cache.get(key);
  const record={texture:null,failed:false,users:[]};
  record.texture=loader.load(new URL('./_surface-assets/'+key+'.jpg',import.meta.url).href,()=>{
   invalidate();
  },undefined,()=>{
   record.failed=true;for(const [material,slot] of record.users){material[slot]=null;material.needsUpdate=true;}invalidate();
  });
  record.texture.colorSpace=kind==='diff'?THREE.SRGBColorSpace:THREE.NoColorSpace;
  record.texture.wrapS=record.texture.wrapT=THREE.RepeatWrapping;
  record.texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  cache.set(key,record);return record;
 }
 return {
  material(asset,options={}){
   const {relief=.45,occlusion=.55,...physical}=options;
   const m=new THREE.MeshPhysicalMaterial({color:'#ffffff',metalness:0,roughness:1,envMapIntensity:.65,...physical});
   for(const [slot,kind] of [['map','diff'],['normalMap','nor_gl'],['roughnessMap','arm'],['aoMap','arm']]){
    const record=texture(asset,kind);record.users.push([m,slot]);if(!record.failed)m[slot]=record.texture;
   }
   m.normalScale.setScalar(relief);m.aoMapIntensity=occlusion;
   materials.add(m);return m;
  },
  dispose(){for(const m of materials)m.dispose();for(const r of cache.values())r.texture.dispose();materials.clear();cache.clear();}
 };
}

/** Project UVs in local metres so concrete columns and long floors don't stretch a single tile. */
export function surfaceUV(geometry,metres=2){
 const p=geometry.attributes.position,n=geometry.attributes.normal,uv=new Float32Array(p.count*2);
 for(let i=0;i<p.count;i++){
  const x=Math.abs(n.getX(i)),y=Math.abs(n.getY(i)),z=Math.abs(n.getZ(i));
  uv[i*2]=(x>y&&x>z?p.getZ(i):p.getX(i))/metres;
  uv[i*2+1]=(y>x&&y>z?p.getZ(i):p.getY(i))/metres;
 }
 geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 return geometry;
}

export function bevelBox(width,height,depth,radius=.04){
 const shape=new THREE.Shape();shape.moveTo(-width/2+radius,-height/2+radius);
 shape.lineTo(width/2-radius,-height/2+radius);shape.lineTo(width/2-radius,height/2-radius);shape.lineTo(-width/2+radius,height/2-radius);shape.closePath();
 const g=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.01,depth-radius*2),steps:1,bevelEnabled:true,bevelSegments:2,bevelThickness:radius,bevelSize:radius});
 g.translate(0,0,-depth/2+radius);return surfaceUV(g);
}

/** Leaf venation is authored in canvas, not a flat material tint. UVs follow each curved blade. */
export function leafSurface(){
 const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');
 const wash=ctx.createLinearGradient(0,0,256,0);wash.addColorStop(0,'#264928');wash.addColorStop(.46,'#719447');wash.addColorStop(.5,'#a8b86a');wash.addColorStop(.54,'#668743');wash.addColorStop(1,'#1e4225');ctx.fillStyle=wash;ctx.fillRect(0,0,256,512);
 let seed=230;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<14000;i++){ctx.fillStyle=rand()>.5?'#aec37b18':'#09241420';ctx.fillRect(rand()*256,rand()*512,1+rand()*2,1+rand()*3);}
 ctx.lineWidth=1.4;ctx.strokeStyle='#beca7a66';
 for(let y=30;y<495;y+=23)for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(128,y);ctx.bezierCurveTo(128+side*25,y-9,128+side*75,y-35,128+side*124,y-58);ctx.stroke();}
 ctx.lineWidth=3;ctx.strokeStyle='#d0d99a9c';ctx.beginPath();ctx.moveTo(128,0);ctx.lineTo(128,512);ctx.stroke();
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 const bump=map.clone();bump.colorSpace=THREE.NoColorSpace;bump.needsUpdate=true;
 return {map,bumpMap:bump,bumpScale:.035};
}

export function disposeSurfaceScene(scene,renderer){
 const geometry=new Set(),materials=new Set(),textures=new Set();
 scene.traverse(object=>{
  if(object.geometry)geometry.add(object.geometry);
  for(const m of object.material?(Array.isArray(object.material)?object.material:[object.material]):[])materials.add(m);
  object.shadow?.map?.dispose();
 });
 for(const m of materials)for(const value of Object.values(m))if(value?.isTexture)textures.add(value);
 for(const t of textures)t.dispose();for(const g of geometry)g.dispose();for(const m of materials)m.dispose();
 renderer.dispose();
}
