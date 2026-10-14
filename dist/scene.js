import * as THREE from './vendor/three.module.js';

// An original, illustrative California garden. All geometry is generated locally.
export function initGardenScene({ container, onReady = () => {}, reducedMotion = false }) {
  if (!container) return null;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (error) {
    return renderFallback(container, onReady);
  }

  const scene = new THREE.Scene();
  const garden = new THREE.Group();
  scene.add(garden);
  const camera = new THREE.OrthographicCamera(-7.8, 7.8, 6.7, -6.7, 0.1, 70);
  camera.position.set(12, 10, 14);
  camera.lookAt(0, 0.9, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;';
  container.appendChild(renderer.domElement);

  let seed = 1978;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const range = (a, b) => a + random() * (b - a);
  const mats = {};
  const material = (name, color, extra = {}) => mats[name] || (mats[name] = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra }));
  const earth = material('earth', '#786445');
  const earthEdge = material('earthEdge', '#a59470');
  const cream = material('cream', '#f3ead7');
  const stone = material('stone', '#ddd5bd');
  const cedar = material('cedar', '#b98c58');
  const cedarDark = material('cedarDark', '#76563a');
  const dark = material('dark', '#263a31');
  const roofMat = material('roof', '#ded9c7');
  const trunkMat = material('trunk', '#756043');
  const mulch = material('mulch', '#60563b');
  const waterGlass = material('glass', '#5a8177', { roughness: 0.21, metalness: 0.15 });
  const shrubsMat = material('shrubs', '#ffffff');
  const leavesMat = material('leaves', '#ffffff');
  const flowersMat = material('flowers', '#efe5ba');

  function box(w, h, d, mat, x, y, z, parent = garden) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function roundedGeometry(w, d, h, r = 0.25) {
    const s = new THREE.Shape();
    const x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r);
    s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d);
    s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    const geometry = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 12 });
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }
  function rounded(w, d, h, r, mat, x, y, z, parent = garden) {
    const mesh = new THREE.Mesh(roundedGeometry(w, d, h, r), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function branch(a, b, bottom, top, mat = trunkMat, parent = garden) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const delta = end.clone().sub(start);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, delta.length(), 9), mat);
    mesh.position.copy(start.add(end).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  rounded(10.9, 8.15, 0.55, 0.72, earth, 0, -0.62, 0);
  rounded(10.94, 8.19, 0.095, 0.73, earthEdge, 0, -0.13, 0);
  const lawnMat = material('lawn', '#54823c');
  lawnMat.onBeforeCompile = shader => {
    shader.vertexShader = 'varying vec3 vLawnPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLawnPosition = position;');
    shader.fragmentShader = 'varying vec3 vLawnPosition;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat stripe = smoothstep(0.01, 0.04, sin(vLawnPosition.x * 3.45));\ndiffuseColor.rgb *= mix(0.88, 1.11, stripe);');
  };
  rounded(10.77, 8.02, 0.12, 0.67, lawnMat, 0, -0.04, 0);

  // White stucco, cedar screening and warm roof details make a small ranch house.
  const house = new THREE.Group();
  garden.add(house);
  box(4.7, 0.16, 2.6, stone, -0.75, 0.16, -2.35, house);
  box(4.45, 1.75, 2.35, cream, -0.85, 1.08, -2.45, house);
  box(4.8, 0.13, 2.72, roofMat, -0.85, 2.02, -2.43, house);
  box(4.9, 0.07, 2.81, cream, -0.85, 2.11, -2.43, house);
  box(4.52, 0.09, 0.055, cedarDark, -0.85, 1.92, -1.24, house);

  function frontWindow(x, width, height = 1.12) {
    box(width + 0.1, height + 0.1, 0.07, dark, x, 1.15, -1.253, house);
    box(width, height, 0.025, waterGlass, x, 1.15, -1.208, house);
    box(0.035, height, 0.035, dark, x, 1.15, -1.184, house);
    box(width, 0.045, 0.16, stone, x, 0.56, -1.21, house);
    const reflectionMat = material('reflection', '#b5cfb8', { transparent: true, opacity: 0.16 });
    box(width * 0.45, height, 0.008, reflectionMat, x - width * 0.21, 1.15, -1.19, house);
  }
  frontWindow(-1.95, 1.65);
  frontWindow(0.65, 1.18, 1.35);
  box(0.73, 1.53, 0.1, cedarDark, -0.55, 1.0, -1.2, house);
  for (let n = 0; n < 8; n++) box(0.073, 1.48, 0.06, cedar, -0.86 + n * 0.089, 1.0, -1.127, house);
  box(0.025, 0.26, 0.08, dark, -0.31, 1.0, -1.073, house);
  box(0.12, 0.34, 0.12, dark, -0.02, 1.4, -1.13, house);
  const lampMat = material('lamp', '#fff2be', { emissive: '#fce6a3', emissiveIntensity: 0.2 });
  box(0.08, 0.19, 0.03, lampMat, -0.02, 1.4, -1.06, house);
  box(0.035, 1.0, 1.4, dark, 1.391, 1.22, -2.38, house);
  box(0.025, 0.92, 1.32, waterGlass, 1.417, 1.22, -2.38, house);
  box(0.035, 0.96, 0.04, dark, 1.438, 1.22, -2.38, house);
  for (let n = 0; n < 13; n++) box(0.08, 1.68, 0.07, cedar, -3.08 + n * 0.13, 1.08, -3.66, house);
  box(0.48, 0.55, 0.45, cream, -2.26, 2.32, -2.94, house);
  box(0.56, 0.06, 0.51, roofMat, -2.26, 2.61, -2.94, house);

  // Travertine patio and a slim timber pergola.
  rounded(2.85, 2.45, 0.095, 0.06, stone, 2.78, 0.09, -2.26);
  const jointMat = material('joints', '#bdb69d');
  for (let n = 1; n < 4; n++) box(0.012, 0.008, 2.4, jointMat, 1.37 + n * 0.71, 0.189, -2.26);
  for (let n = 1; n < 3; n++) box(2.82, 0.008, 0.012, jointMat, 2.78, 0.19, -3.48 + n * 0.81);
  [[1.55,-3.3],[4,-3.3],[1.55,-1.2],[4,-1.2]].forEach(([x,z]) => box(0.105,2.1,0.105,cedar,x,1.22,z));
  box(2.65,0.14,0.12,cedar,2.78,2.24,-3.3);
  box(2.65,0.14,0.12,cedar,2.78,2.24,-1.2);
  for(let n=0;n<12;n++) box(0.09,0.12,2.46,cedar,1.48+n*0.235,2.34,-2.25);
  const cushion = material('cushion','#f2ead8');
  function chair(x,z,angle=0) {
    const group = new THREE.Group(); group.position.set(x,0,z); group.rotation.y=angle; garden.add(group);
    box(0.58,0.09,0.61,cedarDark,0,0.56,0,group);
    box(0.55,0.1,0.56,cushion,0,0.64,0,group);
    box(0.58,0.48,0.08,cedar,0,0.86,-0.26,group);
    box(0.48,0.33,0.08,cushion,0,0.87,-0.202,group);
    [-0.23,0.23].forEach(cx => {box(0.045,0.38,0.045,cedarDark,cx,0.37,0.22,group);box(0.045,0.38,0.045,cedarDark,cx,0.37,-0.22,group);});
    return group;
  }
  chair(2.12,-2.63,0.2); chair(3.33,-2.62,-0.25);
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,0.065,32),cream);
  table.position.set(2.74,0.64,-1.91);table.castShadow=true;garden.add(table);
  branch([2.74,0.2,-1.91],[2.74,0.62,-1.91],0.06,0.045,cedarDark);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.038,0.1,12),cream);cup.position.set(2.7,0.725,-1.9);garden.add(cup);

  // Broad, irregular stepping stones keep the front lawn visually open.
  const stones = [];
  for (let i=0;i<6;i++) {
    const x=-0.53+Math.sin(i*0.75)*0.22, z=-0.62+i*0.71;
    const mesh=rounded(0.94,0.53,0.075,0.065,stone,x,0.085,z);
    mesh.rotation.y=(i%2 ? -1:1)*0.035;
    stones.push({x,z,w:1.02,d:0.61});
  }
  // Mulched planting beds, river stones and a neatly clipped side hedge.
  rounded(1.2,3.65,0.055,0.5,mulch,-4.36,0.085,-1.05);
  rounded(1.07,3.08,0.055,0.45,mulch,4.56,0.085,0.75);
  rounded(2.18,0.7,0.055,0.3,mulch,-2.04,0.085,-0.8);
  const foliage = new THREE.Group(); garden.add(foliage);
  const sphere = new THREE.SphereGeometry(1,9,7);
  const matrix = new THREE.Matrix4(); const q = new THREE.Quaternion(); const p = new THREE.Vector3(); const scale = new THREE.Vector3(); const color = new THREE.Color();
  const shrubInstances = new THREE.InstancedMesh(sphere,shrubsMat,310);
  let shrubIndex=0;
  function bush(x,y,z,r,baseColor='#52763a',count=18) {
    for(let j=0;j<count;j++) {
      const angle=random()*Math.PI*2, distance=Math.sqrt(random())*r*0.7;
      p.set(x+Math.cos(angle)*distance,y+r*0.32+random()*r*0.45,z+Math.sin(angle)*distance);
      scale.set(r*range(0.33,0.48),r*range(0.4,0.58),r*range(0.33,0.48));
      matrix.compose(p,q,scale); shrubInstances.setMatrixAt(shrubIndex,matrix);
      color.set(baseColor).multiplyScalar(range(0.83,1.15)); shrubInstances.setColorAt(shrubIndex,color); shrubIndex++;
    }
  }
  [[-4.3,-2.4,.6],[-4.4,-1.45,.61],[-4.35,-.5,.65],[-4.2,.3,.58],[4.55,-.35,.56],[4.58,.55,.58],[4.58,1.45,.55],[4.35,2.1,.5],[-2.65,-.75,.43],[-1.74,-.75,.4],[-3.8,2.6,.48],[3.75,2.85,.48]].forEach(([x,z,r],i)=>bush(x,.17,z,r,i%3===0?'#718947':'#4f7635'));
  shrubInstances.count=shrubIndex;shrubInstances.castShadow=true;shrubInstances.receiveShadow=true;foliage.add(shrubInstances);

  const leafInstances = new THREE.InstancedMesh(sphere,leavesMat,980);
  let leafIndex=0;
  function tree(x,z,size) {
    const baseY=0.1;
    branch([x,baseY,z],[x+0.1,baseY+2.1*size,z],.115*size,.065*size);
    for(let b=0;b<5;b++) {
      const a=b*1.26;
      branch([x+0.04,baseY+1.2*size,z],[x+Math.cos(a)*.56*size,baseY+(2.05+random()*.3)*size,z+Math.sin(a)*.55*size],.055*size,.025*size);
    }
    const clusters=[[0,2.58,0,.75],[.62,2.3,.12,.62],[-.61,2.35,.1,.66],[.08,2.28,.61,.65],[.1,2.29,-.6,.66],[-.33,2.83,-.23,.59],[.39,2.8,.25,.58]];
    clusters.forEach(([cx,cy,cz,r])=>{
      for(let j=0;j<57;j++) {
        const u=range(-1,1),a=random()*Math.PI*2, rr=Math.cbrt(random())*r;
        const radial=Math.sqrt(1-u*u)*rr;
        p.set(x+(cx+Math.cos(a)*radial)*size,baseY+(cy+u*rr*.8)*size,z+(cz+Math.sin(a)*radial)*size);
        scale.set(range(.17,.3)*size,range(.16,.28)*size,range(.17,.3)*size);
        q.setFromEuler(new THREE.Euler(random(),random(),random()));matrix.compose(p,q,scale);leafInstances.setMatrixAt(leafIndex,matrix);
        color.setHSL(range(.22,.28),range(.34,.51),range(.25,.4));leafInstances.setColorAt(leafIndex,color);leafIndex++;
      }
    });
  }
  tree(-3.65,1.1,1.04);tree(4.03,-2.77,.87);
  leafInstances.count=leafIndex;leafInstances.castShadow=true;leafInstances.receiveShadow=true;foliage.add(leafInstances);
  q.identity();

  // Small cream blooms and upright rosemary are restrained planting accents.
  const flowerInstances = new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,5),flowersMat,90);
  const stemMat=material('stems','#5e743a');
  for(let i=0;i<90;i++) {
    const right=i>44,x=(right?4.56:-4.32)+range(-.35,.35),z=(right?1.0:-1.2)+range(-1.2,1.2),height=range(.37,.65);
    p.set(x,height,z);scale.set(.049,.034,.049);matrix.compose(p,q,scale);flowerInstances.setMatrixAt(i,matrix);
    if(i%3===0) branch([x,.15,z],[x,height,z],.008,.005,stemMat);
  }
  flowerInstances.castShadow=true;foliage.add(flowerInstances);
  const pebbleMat=material('pebbles','#b9b6a2');
  const pebbles=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),pebbleMat,70);
  for(let i=0;i<70;i++) {
    const side=i<35?-1:1; p.set(side*range(4.97,5.12),.12,range(-3.1,2.7));scale.set(range(.06,.13),range(.025,.06),range(.07,.15));matrix.compose(p,q,scale);pebbles.setMatrixAt(i,matrix);
  }
  pebbles.castShadow=true;garden.add(pebbles);

  // Real instanced blades add detail without thousands of separate draw calls.
  const bladeGeometry=new THREE.BufferGeometry();
  bladeGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.024,0,0,.024,0,0,.012,.12,0,0,.21,-.025],3));
  bladeGeometry.setAttribute('normal',new THREE.Float32BufferAttribute([0,0,1,0,0,1,0,0,1,0,0,1],3));
  bladeGeometry.setIndex([0,1,2,0,2,3]);
  const grassMat = new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,side:THREE.DoubleSide});
  const wind={value:0};
  grassMat.onBeforeCompile=shader=>{
    shader.uniforms.uGardenTime=wind;
    shader.vertexShader='uniform float uGardenTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat bladeHeight = position.y / 0.21;\ntransformed.x += sin(uGardenTime * 1.25 + instanceMatrix[3].x * 1.8 + instanceMatrix[3].z) * 0.024 * bladeHeight * bladeHeight;');
  };
  const grass=new THREE.InstancedMesh(bladeGeometry,grassMat,11000);
  let grassCount=0;
  function inLawn(x,z) {
    if(Math.abs(x)>4.74&&Math.abs(z)>3.38&&Math.hypot(Math.abs(x)-4.74,Math.abs(z)-3.38)>.62)return false;
    if(x>-3.19&&x<4.28&&z<-.99)return false;
    if(x< -3.75&&z<.75&&z> -3.15)return false;
    if(x>4.02&&z>-1.02&&z<2.47)return false;
    if(x>-3.18&&x<-.91&&z<-.43)return false;
    return !stones.some(s=>Math.abs(x-s.x)<s.w/2&&Math.abs(z-s.z)<s.d/2);
  }
  for(let i=0;i<18000&&grassCount<11000;i++) {
    const x=range(-5.27,5.27),z=range(-3.9,3.9);if(!inLawn(x,z))continue;
    p.set(x,.075,z);q.setFromAxisAngle(new THREE.Vector3(0,1,0),random()*Math.PI*2);scale.setScalar(range(.45,.8));scale.y*=range(.7,1.15);
    matrix.compose(p,q,scale);grass.setMatrixAt(grassCount,matrix);
    const stripe=Math.sin(x*3.45)>0;color.set(stripe?'#78a549':'#537c36').multiplyScalar(range(.85,1.14));grass.setColorAt(grassCount,color);grassCount++;
  }
  grass.count=grassCount;grass.receiveShadow=true;garden.add(grass);

  // A few loose leaves are visible when exploring seasonal cleanups.
  const cleanup=new THREE.Group();cleanup.visible=false;garden.add(cleanup);
  const autumn=material('autumn','#bc924d');
  for(let i=0;i<26;i++) {
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,5,3),autumn);
    leaf.position.set(range(-3.2,3.4),.17,range(.6,3.5));leaf.scale.set(.08,.012,.035);leaf.rotation.y=random()*6.28;cleanup.add(leaf);
  }

  const hemisphere=new THREE.HemisphereLight('#e9f1d9','#7b865c',3.1);scene.add(hemisphere);
  const key=new THREE.DirectionalLight('#fff1cb',4.0);key.position.set(-4,10,7);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;key.shadow.camera.near=.5;key.shadow.camera.far=30;key.shadow.normalBias=.035;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
  const fill=new THREE.DirectionalLight('#cee4dd',1.3);fill.position.set(7,4,-6);scene.add(fill);
  const shadowPlane=new THREE.Mesh(new THREE.PlaneGeometry(35,35),new THREE.ShadowMaterial({opacity:.12}));
  shadowPlane.rotation.x=-Math.PI/2;shadowPlane.position.y=-.76;shadowPlane.receiveShadow=true;scene.add(shadowPlane);

  let alive=true,paused=!!reducedMotion,inView=true,contextLost=false,frame=0,last=0,elapsed=0,dragging=false,downX=0,downY=0;
  let careAngle=-.12,userAngle=0,scrollProgress=0,currentAngle=-.12,care='lawn',time='day',zoom=1;
  const targetLight={intensity:4,r:1,g:0.945,b:0.796,ambient:3.1,exposure:1.25};
  const state={grassScale:1,foliageScale:1};

  function resize() {
    const rect=container.getBoundingClientRect();const w=Math.max(1,rect.width),h=Math.max(1,rect.height);
    renderer.setSize(w,h,false);
    const aspect=w/h;const vertical=Math.max(5.35,7.05/aspect);
    camera.left=-vertical*aspect;camera.right=vertical*aspect;camera.top=vertical;camera.bottom=-vertical;camera.zoom=zoom;camera.updateProjectionMatrix();
    drawOnce();
  }
  function isStatic() {return paused||!inView||document.hidden||contextLost;}
  function targetAngle() {return careAngle+userAngle+scrollProgress*.72;}
  function targetGrassScale() {return state.grassScale+(.62-state.grassScale)*scrollProgress;}
  function drawOnce() {if(alive&&!contextLost)renderer.render(scene,camera);}
  function syncLoop() {
    last=performance.now();
    if(!alive||isStatic()){
      if(frame)cancelAnimationFrame(frame);
      frame=0;
    } else if(!frame) frame=requestAnimationFrame(animate);
  }
  function showRotation() {
    if(isStatic()){
      currentAngle=targetAngle();garden.rotation.y=currentAngle;
      grass.scale.y=targetGrassScale();
      zoom=1+scrollProgress*.06;camera.zoom=zoom;camera.updateProjectionMatrix();
      drawOnce();
    }
  }
  function animate(now) {
    frame=0;
    if(!alive||isStatic()){last=now;return;}
    const dt=Math.min((now-last)/1000||0,.04);last=now;
    elapsed+=dt;
    currentAngle+=(targetAngle()-currentAngle)*Math.min(1,dt*7);
    garden.rotation.y=currentAngle;
    garden.position.y=Math.sin(elapsed*.6)*.035;
    wind.value=elapsed;
    const blend=Math.min(1,dt*3.3);
    key.intensity+=(targetLight.intensity-key.intensity)*blend;
    key.color.r+=(targetLight.r-key.color.r)*blend;key.color.g+=(targetLight.g-key.color.g)*blend;key.color.b+=(targetLight.b-key.color.b)*blend;
    hemisphere.intensity+=(targetLight.ambient-hemisphere.intensity)*blend;
    renderer.toneMappingExposure+=(targetLight.exposure-renderer.toneMappingExposure)*blend;
    grass.scale.y+=(targetGrassScale()-grass.scale.y)*blend;
    const nextZoom=zoom+(1+scrollProgress*.06-zoom)*Math.min(1,dt*7);
    if(Math.abs(nextZoom-zoom)>.000001){zoom=nextZoom;camera.zoom=zoom;camera.updateProjectionMatrix();}
    if(care==='hedges') foliage.rotation.z=Math.sin(elapsed*.75)*.002;
    else foliage.rotation.z*=.94;
    renderer.render(scene,camera);
    frame=requestAnimationFrame(animate);
  }
  function pointerDown(event) {
    if(event.pointerType==='mouse'&&event.button!==0)return;
    dragging=true;downX=event.clientX;downY=event.clientY;
    renderer.domElement.style.cursor='grabbing';
    if(event.pointerType==='mouse')renderer.domElement.setPointerCapture(event.pointerId);
  }
  function pointerMove(event) {
    if(!dragging)return;
    const dx=event.clientX-downX,dy=event.clientY-downY;
    if(event.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)*1.25){dragging=false;return;}
    userAngle+=dx*.006;downX=event.clientX;downY=event.clientY;
    showRotation();
  }
  function pointerUp(){dragging=false;renderer.domElement.style.cursor='grab';}
  function keydown(event) {
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();userAngle+=(event.key==='ArrowLeft'?-1:1)*.18;
      showRotation();
    } else if(event.key==='Home') {event.preventDefault();reset();}
  }
  function setTime(value) {
    time=value==='sunset'?'sunset':'day';
    const c=new THREE.Color(time==='sunset'?'#ffb779':'#fff1cb');
    Object.assign(targetLight,{intensity:time==='sunset'?3.3:4,r:c.r,g:c.g,b:c.b,ambient:time==='sunset'?2.15:3.1,exposure:time==='sunset'?1.17:1.25});
    key.position.set(time==='sunset'?-8:-4,time==='sunset'?5:10,7);
    lampMat.emissiveIntensity=time==='sunset'?2.5:.2;
    waterGlass.color.set(time==='sunset'?'#9b9d77':'#5a8177');
    if(isStatic()){key.color.copy(c);key.intensity=targetLight.intensity;hemisphere.intensity=targetLight.ambient;renderer.toneMappingExposure=targetLight.exposure;drawOnce();}
  }
  function setCare(value) {
    care=['lawn','hedges','cleanup'].includes(value)?value:'lawn';
    cleanup.visible=care==='cleanup';state.grassScale=care==='lawn'?1:care==='hedges'?.74:.9;
    if(care==='hedges')careAngle=-.45;
    else if(care==='cleanup')careAngle=.16;
    else careAngle=-.12;
    showRotation();
  }
  function setScrollProgress(value){
    scrollProgress=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
    showRotation();
  }
  function reset(){careAngle=-.12;userAngle=0;showRotation();}
  function visibilityChange(){syncLoop();}
  const observer=new ResizeObserver(resize);observer.observe(container);
  const intersection=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting!==false;syncLoop();},{rootMargin:'100px'});intersection.observe(container);
  renderer.domElement.addEventListener('pointerdown',pointerDown);
  renderer.domElement.addEventListener('pointermove',pointerMove);
  renderer.domElement.addEventListener('pointerup',pointerUp);
  renderer.domElement.addEventListener('pointercancel',pointerUp);
  renderer.domElement.addEventListener('lostpointercapture',pointerUp);
  container.addEventListener('keydown',keydown);
  document.addEventListener('visibilitychange',visibilityChange);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;syncLoop();});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;resize();syncLoop();});
  resize();garden.rotation.y=currentAngle;drawOnce();syncLoop();onReady({fallback:false});

  return {
    setTime,setCare,setScrollProgress,reset,
    pause(value){paused=!!value;syncLoop();},
    getStats(){return {fallback:false,grassBlades:grassCount,leaves:leafIndex,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,time,care,scrollProgress};},
    dispose(){
      alive=false;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();
      document.removeEventListener('visibilitychange',visibilityChange);container.removeEventListener('keydown',keydown);
      renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointercancel',pointerUp);renderer.domElement.removeEventListener('lostpointercapture',pointerUp);
      const geometries=new Set(),materials=new Set();scene.traverse(item=>{if(item.geometry)geometries.add(item.geometry);if(item.material)(Array.isArray(item.material)?item.material:[item.material]).forEach(m=>materials.add(m));});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();
    }
  };
}

function renderFallback(container,onReady) {
  const fallback=document.createElement('div');
  fallback.style.cssText='width:100%;height:100%;min-height:330px;display:grid;place-items:center;position:relative;isolation:isolate;';
  fallback.innerHTML=`<svg viewBox="0 0 640 520" width="100%" height="100%" role="img" aria-label="Illustrated garden with a California home, lush green lawn and mature trees"><defs><linearGradient id="jcp-lawn" x2="1" y2="1"><stop stop-color="#729244"/><stop offset="1" stop-color="#365e32"/></linearGradient><linearGradient id="jcp-tree"><stop stop-color="#72904c"/><stop offset="1" stop-color="#345b35"/></linearGradient><filter id="jcp-shadow"><feGaussianBlur stdDeviation="12"/></filter></defs><ellipse cx="326" cy="431" rx="220" ry="40" fill="#294729" opacity=".13" filter="url(#jcp-shadow)"/><path d="M70 300 308 174 575 307 342 449Z" fill="#9b8660"/><path d="M70 281 308 155 575 288 342 430Z" fill="url(#jcp-lawn)"/><g stroke="#86a45b" stroke-width="22" opacity=".48"><path d="m138 266 263 131"/><path d="m211 229 263 131"/><path d="m282 191 263 131"/></g><path d="m193 249 123-66 152 76-121 68Z" fill="#c9c6ad"/><path d="M200 167 321 103 451 169 330 232Z" fill="#f1e9d7"/><path d="M200 167v92l130 64v-91Z" fill="#ece3cd"/><path d="M330 232v91l121-65v-89Z" fill="#d5cbb1"/><path d="m220 194 62 31v56l-62-31Z" fill="#5c8176"/><path d="m297 233 19 10v69l-19-10Z" fill="#ad8459"/><path d="m350 238 80-42v53l-80 43Z" fill="#648377"/><g fill="#e6dfcb"><path d="m307 324 36-19 29 14-36 20Z"/><path d="m276 345 36-19 29 14-36 20Z"/><path d="m245 367 36-19 29 14-36 20Z"/></g><path d="M151 323V220m0 48-31-28m31 17 27-29" fill="none" stroke="#776144" stroke-width="12"/><g fill="url(#jcp-tree)"><circle cx="132" cy="205" r="48"/><circle cx="172" cy="196" r="47"/><circle cx="150" cy="163" r="45"/><circle cx="108" cy="190" r="32"/><circle cx="191" cy="219" r="31"/></g><path d="M494 292V196" fill="none" stroke="#776144" stroke-width="10"/><g fill="url(#jcp-tree)"><circle cx="473" cy="181" r="35"/><circle cx="511" cy="181" r="40"/><circle cx="492" cy="151" r="39"/></g><g fill="#597b3c"><ellipse cx="421" cy="354" rx="35" ry="24"/><ellipse cx="466" cy="329" rx="28" ry="23"/><ellipse cx="191" cy="322" rx="29" ry="23"/></g></svg>`;
  container.appendChild(fallback);onReady({fallback:true});
  return {setTime(value){fallback.style.filter=value==='sunset'?'sepia(.2) saturate(1.1)':'none';},setCare(){},setScrollProgress(){},reset(){},pause(){},dispose(){fallback.remove();},getStats(){return {fallback:true};}};
}
