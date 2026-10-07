// Mission Ravi-1 in WebGL: a launch from Earth where each spent part separates and tumbles away in vacuum,
// and the payload coasts on toward the next destination. The page drives one number, progress (0 to 1),
// so scrolling back plays the flight in reverse. Rendering: Three.js, with pmndrs postprocessing for
// bloom, AgX tone mapping, SMAA and a little film grain.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer, RenderPass, EffectPass, BloomEffect, ToneMappingEffect, ToneMappingMode, SMAAEffect, VignetteEffect, NoiseEffect, BlendFunction } from 'postprocessing';
import { stage1, stage2, fairingHalf, payload, deploy, materials, R0 } from './rocket.js';
import { NOISE } from './noise.glsl.js';

const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/**
 * @param {{ canvas: HTMLCanvasElement, labels: HTMLElement, events: Record<string, number>, names: any, reducedMotion: boolean }} o
 */
export function createMission({ canvas, labels, events: ev, names, reducedMotion }) {
  const small = matchMedia('(max-width: 760px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, stencil: false, depth: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 1.75));
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010204);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 6000);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.28; // space is dark: reflections stay subtle

  const SUN = new THREE.Vector3(-0.55, 0.42, 0.72).normalize();
  const sun = new THREE.DirectionalLight(0xfff3e2, 4.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 60 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0x2a3f66, 0x081428, 0.4)); // earthshine

  /* ---------- sky: stars and a faint Milky Way ---------- */
  {
    const n = small ? 4000 : 9000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n);
    const band = new THREE.Vector3(0.3, 0.9, 0.3).normalize();
    for (let i = 0; i < n; i++) {
      let v = new THREE.Vector3().randomDirection();
      if (i < n * 0.45) v.addScaledVector(band, -v.dot(band) * 0.85).normalize(); // crowd into a band
      v.multiplyScalar(2500); pos.set([v.x, v.y, v.z], i * 3);
      const t = Math.random(), b = 0.35 + Math.pow(Math.random(), 3) * 1.4;
      col.set(t < 0.12 ? [b, b * 0.82, b * 0.62] : t < 0.3 ? [b * 0.75, b * 0.88, b] : [b, b, b], i * 3);
      size[i] = 0.6 + Math.pow(Math.random(), 6) * 3.2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: { dpr: { value: renderer.getPixelRatio() } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
      vertexShader: 'attribute float size; uniform float dpr; varying vec3 vC; void main(){ vC = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_PointSize = size * dpr * 1.6; }',
      fragmentShader: 'varying vec3 vC; void main(){ float d = length(gl_PointCoord - .5); float a = smoothstep(.5, 0., d); gl_FragColor = vec4(vC * a * 1.6, a); }',
    });
    const stars = new THREE.Points(g, m); stars.frustumCulled = false; scene.add(stars);
  }

  /* ---------- Earth: procedural shaders (land, ocean glint, city lights, clouds, atmosphere) ---------- */
  const R = 60;
  const earth = new THREE.Group(); scene.add(earth);
  const sunU = { value: SUN.clone() }, timeU = { value: 0 };
  const surface = new THREE.Mesh(new THREE.SphereGeometry(R, 192, 128), new THREE.ShaderMaterial({
    uniforms: { sunDir: sunU },
    vertexShader: `varying vec3 vObj; varying vec3 vN; varying vec3 vW;
      void main(){ vObj = normalize(position); vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `${NOISE}
      uniform vec3 sunDir; varying vec3 vObj; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 p = vObj;
        float c = fbm(p * 1.7 + vec3(3.1, 0., 1.3)) + .35 * fbm(p * 6.5);
        float land = smoothstep(.04, .08, c);
        float coast = smoothstep(-.12, .05, c) * (1. - land);
        float lat = abs(p.y);
        float dry = smoothstep(.15, .35, fbm(p * 3.3 + 7.)) * (1. - smoothstep(.15, .55, abs(lat - .3)));
        float mount = smoothstep(.25, .5, fbm(p * 12.));
        vec3 green = mix(vec3(.05,.11,.035), vec3(.10,.16,.06), fbm(p * 20.) * .5 + .5);
        vec3 desert = vec3(.36,.27,.16);
        vec3 ground = mix(mix(green, desert, dry), vec3(.30,.28,.26), mount * .6);
        vec3 ocean = mix(vec3(.004,.02,.06), vec3(.02,.09,.16), coast);
        float ice = smoothstep(.82, .9, lat + fbm(p * 8.) * .06);
        vec3 col = mix(mix(ocean, ground, land), vec3(.85,.9,.95), ice);
        vec3 N = normalize(vN), L = normalize(sunDir), V = normalize(cameraPosition - vW);
        float ndl = dot(N, L), day = smoothstep(-.08, .25, ndl);
        vec3 lit = col * max(ndl, 0.) * 2.2 + col * .015;
        vec3 H = normalize(L + V);
        lit += vec3(1., .9, .75) * pow(max(dot(N, H), 0.), 90.) * (1. - land) * (1. - ice) * day * 2.5;
        float cities = smoothstep(.55, .8, fbm(p * 40.) * .5 + .5) * land * (1. - ice) * smoothstep(.2, .5, fbm(p * 5. + 2.));
        lit += vec3(1., .62, .28) * cities * (1. - day) * .9;
        float rim = pow(1. - max(dot(N, V), 0.), 3.);
        lit = mix(lit, vec3(.35,.6,1.) * 1.2, rim * .55 * smoothstep(-.2, .4, ndl));
        gl_FragColor = vec4(lit, 1.);
        #include <colorspace_fragment>
      }`,
  }));
  surface.rotation.set(0.55, 0, -0.25); earth.add(surface);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.006, 160, 110), new THREE.ShaderMaterial({
    uniforms: { sunDir: sunU, time: timeU }, transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vObj; varying vec3 vN; void main(){ vObj = normalize(position); vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `${NOISE}
      uniform vec3 sunDir; uniform float time; varying vec3 vObj; varying vec3 vN;
      void main(){
        vec3 p = vObj * 2.4 + vec3(time * .004, 0., 0.);
        float c = fbm(p + fbm(p * 2.) * .6);
        float a = smoothstep(.05, .45, c) * .85;
        float ndl = dot(normalize(vN), normalize(sunDir));
        vec3 col = vec3(1.) * (max(ndl, 0.) * 2. + .01);
        gl_FragColor = vec4(col, a * smoothstep(-.25, .1, ndl) + a * .05);
        #include <colorspace_fragment>
      }`,
  }));
  clouds.rotation.copy(surface.rotation); earth.add(clouds);
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 128, 96), new THREE.ShaderMaterial({
    uniforms: { sunDir: sunU }, side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 sunDir; varying vec3 vN; varying vec3 vW;
      void main(){ vec3 V = normalize(cameraPosition - vW); float rim = pow(1. - abs(dot(V, vN)), 2.6);
        float lit = clamp(dot(-vN, -sunDir) * .7 + .45, 0., 1.);
        vec3 c = mix(vec3(1.,.45,.2), vec3(.3,.6,1.), smoothstep(.0, .5, lit));
        gl_FragColor = vec4(c * rim * lit * 3., rim * lit); }`,
  }));
  earth.add(atmosphere);

  // Launch pad and tower.
  const pad = new THREE.Group(); earth.add(pad); pad.position.set(0, R, 0);
  {
    const concrete = new THREE.MeshStandardMaterial({ color: 0x6b6d70, roughness: 0.95 });
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.3, 64), concrete); deck.position.y = 0.05; deck.receiveShadow = true; pad.add(deck);
    const trench = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.31, 3.2), new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 })); trench.position.set(0, 0.06, 1.2); pad.add(trench);
    const steel = new THREE.MeshStandardMaterial({ color: 0x8c3a2a, metalness: 0.5, roughness: 0.55 });
    const tower = new THREE.Group(); tower.position.set(-1.35, 0.2, 0);
    for (let i = 0; i < 4; i++) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 12, 0.06), steel); leg.position.set(i % 2 ? 0.28 : -0.28, 6, i < 2 ? 0.28 : -0.28); tower.add(leg); }
    for (let y = 0.4; y < 12; y += 0.6) for (const z of [0.28, -0.28]) {
      const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.04), steel); r1.position.set(0, y, z); tower.add(r1);
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.82, 0.03), steel); d.position.set(0, y + 0.3, z); d.rotation.z = 0.8; tower.add(d);
    }
    for (const y of [5.6, 9.2]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.25), steel); arm.position.set(0.62, y, 0); tower.add(arm); }
    const lamp = new THREE.PointLight(0xffd7a0, 6, 10, 2); lamp.position.set(0.6, 11.5, 1.2); tower.add(lamp);
    tower.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    pad.add(tower);
  }

  /* ---------- the destination ---------- */
  const planet = new THREE.Group(); planet.position.set(520, R + 38, -255); scene.add(planet);
  planet.add(new THREE.Mesh(new THREE.SphereGeometry(14, 96, 64), new THREE.ShaderMaterial({
    uniforms: { sunDir: sunU },
    vertexShader: 'varying vec3 vObj; varying vec3 vN; void main(){ vObj = normalize(position); vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `${NOISE} uniform vec3 sunDir; varying vec3 vObj; varying vec3 vN;
      void main(){ float b = fbm(vec3(vObj.x * 1.5, vObj.y * 9. + fbm(vObj * 3.) * 1.8, vObj.z * 1.5));
        vec3 col = mix(vec3(.38,.2,.42), vec3(.85,.62,.55), b * .5 + .5);
        float ndl = max(dot(normalize(vN), normalize(sunDir)), 0.);
        gl_FragColor = vec4(col * (ndl * 2. + .02), 1.);
        #include <colorspace_fragment>
      }`,
  })));
  {
    const ring = new THREE.Mesh(new THREE.RingGeometry(18, 28, 160), new THREE.ShaderMaterial({
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'varying vec3 vP; void main(){ float r = length(vP.xy); float bands = .5 + .5 * sin(r * 6.) * sin(r * 2.3); gl_FragColor = vec4(vec3(.9,.82,.95) * 1.2, bands * .45 * smoothstep(18., 19.5, r) * smoothstep(28., 26., r)); }',
    }));
    ring.rotation.x = Math.PI / 2.3; planet.add(ring);
  }

  /* ---------- the vehicle ---------- */
  const parts = { s1: stage1(), s2: stage2(), fl: fairingHalf(1), fr: fairingHalf(-1), pay: payload() };
  for (const p of Object.values(parts)) {
    const holder = new THREE.Group(); holder.matrixAutoUpdate = false; holder.add(p); scene.add(holder); p.userData.holder = holder;
  }

  /* ---------- engine plumes ---------- */
  function plume() {
    const geo = new THREE.CylinderGeometry(1, 0.16, 1, 64, 32, true); geo.translate(0, -0.5, 0);
    const mat = new THREE.ShaderMaterial({
      uniforms: { time: timeU, vac: { value: 0 }, power: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: `${NOISE}
        uniform float time; uniform float vac; uniform float power; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main(){
          float along = 1. - vUv.y;
          float facing = pow(abs(dot(vN, vV)), 1.4);
          float flick = .7 + .3 * snoise(vec3(vUv.x * 9., along * 6. - time * 14., time * 2.));
          float diamonds = mix(.72 + .28 * smoothstep(.3, 1., sin(along * 42. - time * 2.)), 1., vac);
          float fall = pow(1. - along, mix(1.8, 3.4, vac));
          float a = fall * facing * flick * diamonds * power;
          vec3 core = mix(vec3(1., .93, .8), vec3(.72, .82, 1.), vac);
          vec3 edge = mix(vec3(1., .42, .1), vec3(.3, .45, 1.), vac);
          vec3 c = mix(edge, core, pow(1. - along, 5.));
          gl_FragColor = vec4(c * a * mix(5., 1.6, vac), a);
        }`,
    });
    const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; scene.add(m); return m;
  }
  const plume1 = plume(), plume2 = plume();
  const sprite = (draw) => { const c = document.createElement('canvas'); c.width = c.height = 128; draw(c.getContext('2d'), 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const glowTex = sprite((c, s) => { const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,200,140,.55)'); g.addColorStop(1, 'rgba(255,140,60,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); });
  const puffTex = sprite((c, s) => { for (let i = 0; i < 9; i++) { const x = s / 2 + (Math.random() - 0.5) * s * 0.4, y = s / 2 + (Math.random() - 0.5) * s * 0.4, r = s * (0.2 + Math.random() * 0.2); const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, s, s); } });
  const glow = (color) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); scene.add(s); return s; };
  const glow1 = glow(new THREE.Color(4, 2.4, 1.2)), glow2 = glow(new THREE.Color(1.4, 1.8, 3.2));
  const sunDisc = glow(new THREE.Color(14, 12, 10)); sunDisc.scale.set(90, 90, 1);

  // Smoke and venting vapour around the pad, and cold-gas puffs at each separation.
  const smoke = Array.from({ length: small ? 40 : 80 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0xc9c4bc, transparent: true, depthWrite: false, opacity: 0 }));
    s.userData = { a: Math.random() * Math.PI * 2, sp: 0.5 + Math.random(), up: Math.random(), rot: Math.random() * 6 }; s.material.rotation = s.userData.rot; pad.add(s); return s;
  });
  const vents = Array.from({ length: 18 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0xeef2f6, transparent: true, depthWrite: false, opacity: 0 }));
    s.userData = { y: 2 + (i % 6) * 1.5, ph: Math.random() }; pad.add(s); return s;
  });
  const puffs = Array.from({ length: 36 }, () => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0xffffff, transparent: true, depthWrite: false, opacity: 0 }));
    s.userData = { d: new THREE.Vector3().randomDirection() }; scene.add(s); return s;
  });

  /* ---------- flight path ---------- */
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, R + 0.35, 0), new THREE.Vector3(0, R + 5, 0), new THREE.Vector3(1.5, R + 11, 0), new THREE.Vector3(7, R + 16, -1),
    new THREE.Vector3(22, R + 20, -6), new THREE.Vector3(50, R + 24, -18), new THREE.Vector3(100, R + 28, -40), new THREE.Vector3(190, R + 32, -85),
    new THREE.Vector3(320, R + 36, -150), new THREE.Vector3(440, R + 38, -215),
  ], false, 'centripetal');
  const transfer = new THREE.Line(new THREE.BufferGeometry().setFromPoints(path.getSpacedPoints(500).slice(180)),
    new THREE.LineDashedMaterial({ color: new THREE.Color(2.2, 1.3, 0.5), dashSize: 2.5, gapSize: 2, transparent: true, opacity: 0 }));
  transfer.computeLineDistances(); scene.add(transfer);

  // Flight time: slow off the pad, then faster as the stages shed mass.
  const flightU = (p) => p < ev.sep1 ? 0.17 * Math.pow(p / ev.sep1, 1.7) : 0.17 + ((p - ev.sep1) / (1 - ev.sep1)) * 0.81 * (0.45 + 0.55 * ((p - ev.sep1) / (1 - ev.sep1)));
  const UP = new THREE.Vector3(0, 1, 0), ONE = new THREE.Vector3(1, 1, 1), I = new THREE.Matrix4();
  function frameAt(p) {
    const u = Math.min(0.998, Math.max(0, flightU(Math.max(0, p))));
    const pos = path.getPointAt(u), tan = path.getTangentAt(u).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(UP, tan).multiply(new THREE.Quaternion().setFromAxisAngle(UP, Math.min(1, p / 0.12) * 0.6));
    return { pos, q, tan, m: new THREE.Matrix4().compose(pos, q, ONE) };
  }
  // A detached part: where it was at separation, pushed along `drift` and tumbling, as a pure function of progress.
  function detach(holder, at, local, dp, drift, axis, rate, pivot) {
    holder.matrix.copy(new THREE.Matrix4().makeTranslation(drift.x * dp, drift.y * dp, drift.z * dp).multiply(at.m.clone().multiply(local))
      .multiply(new THREE.Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z))
      .multiply(new THREE.Matrix4().makeRotationAxis(axis.clone().normalize(), rate * dp))
      .multiply(new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z)));
  }

  /* ---------- labels pinned to parts ---------- */
  const mk = (tag, text) => { const d = document.createElement('div'); d.className = 'm-label'; const b = document.createElement('b'); b.textContent = tag; d.append(b, ` ${text}`); labels.append(d); return d; };
  const split = (s) => { const [a, ...b] = s.split(' · '); return [a, b.join(' · ')]; };
  const L = {
    s1: mk(...split(names.stage1)), fair: mk(...split(names.fairing)), s2: mk(...split(names.stage2)), pay: mk(...split(names.payload)),
    a0: mk('Array', names.arrays[0] ?? ''), a1: mk('Array', names.arrays[1] ?? ''), dish: mk('Antenna', names.arrays[2] ?? ''), dest: mk(...split(names.destination)),
  };
  const v3 = new THREE.Vector3();
  let W = 1, H = 1;
  function place(el, world, show) {
    v3.copy(world).project(camera);
    const vis = show > 0.02 && v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05;
    el.style.opacity = vis ? String(Math.min(1, show)) : '0';
    if (vis) el.style.transform = `translate3d(${((v3.x * 0.5 + 0.5) * W + 18).toFixed(1)}px, ${((-v3.y * 0.5 + 0.5) * H - 8).toFixed(1)}px, 0)`;
  }

  /* ---------- camera ---------- */
  // Offsets from the ship (world space) and how high up the ship to look, keyed by progress.
  const N = 7, leg = (k) => k / N;
  const keys = [
    [-0.01, [10, 3.5, 22], 5.5], [0.03, [10, 2, 19], 4.5], [leg(1) - 0.02, [6, 9, 15], 3], [ev.sep1 + 0.02, [5, 12, 17], 2],
    [ev.fair - 0.01, [3, 8, 11], 7], [ev.sep2 - 0.02, [4, 9, 12], 6], [ev.sep2 + 0.05, [4.5, 3, 8], 9.3],
    [ev.arr1, [5, 3, 7.5], 9.4], [ev.wide, [6, 4, 9], 9.4], [1.0, [-60, 45, 150], 9.4],
  ];
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  function cameraFor(p, f) {
    let a = keys[0], b = keys[keys.length - 1];
    for (let i = 0; i < keys.length - 1; i++) if (p >= keys[i][0] && p <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; break; }
    const t = sstep(a[0], b[0], p);
    const off = new THREE.Vector3(...a[1]).lerp(new THREE.Vector3(...b[1]), t);
    const look = new THREE.Vector3(0, lerp(a[2], b[2], t), 0).applyMatrix4(f.m);
    look.lerp(f.pos.clone().lerp(planet.position, 0.35), sstep(ev.wide, 1, p) * 0.8);
    return { pos: f.pos.clone().add(off), look };
  }

  /* ---------- post-processing ---------- */
  const composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new BloomEffect({ mipmapBlur: true, intensity: 1.15, luminanceThreshold: 0.92, luminanceSmoothing: 0.2, radius: 0.72 });
  composer.addPass(new EffectPass(camera, bloom));
  const grain = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY, premultiply: true });
  grain.blendMode.opacity.value = 0.18;
  composer.addPass(new EffectPass(camera, new ToneMappingEffect({ mode: ToneMappingMode.AGX }), new VignetteEffect({ offset: 0.3, darkness: 0.62 }), grain));
  if (!small) composer.addPass(new EffectPass(camera, new SMAAEffect()));

  /* ---------- state + frame ---------- */
  let target = 0, p = 0, dim = 0, dimTarget = 0, running = false, first = true, shiftX = 0, shiftY = 0;
  const timer = new THREE.Timer();
  const fS1 = () => frameAt(ev.sep1), fF = () => frameAt(ev.fair), fS2 = () => frameAt(ev.sep2);
  let cS1, cF, cS2; // cached separation frames
  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false); composer.setSize(W, H);
    camera.aspect = W / H; camera.fov = W < 760 ? 50 : 36;
    // Keep the ship out from under the text: right of centre on wide screens, higher on phones.
    shiftX = W >= 900 ? -W * 0.2 : 0; shiftY = W < 760 ? H * 0.16 : 0;
    camera.setViewOffset(W, H, shiftX, shiftY, W, H);
    camera.updateProjectionMatrix();
    cS1 = fS1(); cF = fF(); cS2 = fS2();
  }

  function render() {
    timer.update();
    const time = timer.getElapsed(), dt = Math.min(0.1, timer.getDelta());
    // Frame-rate independent easing, so slow and fast screens fly the same.
    const ease = (rate) => (first || reducedMotion ? 1 : 1 - Math.exp(-dt * rate));
    p += (target - p) * ease(5);
    dim += (dimTarget - dim) * ease(3.5);
    timeU.value = time;
    const f = frameAt(p);
    const sep1 = p >= ev.sep1, fair = p >= ev.fair, sep2 = p >= ev.sep2;

    // Stage 1
    const h1 = parts.s1.userData.holder;
    if (!sep1) h1.matrix.copy(f.m);
    else detach(h1, cS1, I, p - ev.sep1, cS1.tan.clone().multiplyScalar(-50).add(new THREE.Vector3(0, -9, 4)), new THREE.Vector3(1, 0.2, 0.4), 8, new THREE.Vector3(0, 3, 0));
    // Fairing halves swing open on their base hinges, then drift away.
    [parts.fl, parts.fr].forEach((half, i) => {
      const h = half.userData.holder, side = i ? -1 : 1;
      if (!fair) { h.matrix.copy(f.m); return; }
      const dp = p - ev.fair, open = Math.min(1, dp * 28);
      const local = new THREE.Matrix4().makeTranslation(side * 0.56, 8.5, 0).multiply(new THREE.Matrix4().makeRotationZ(-side * open * 0.95)).multiply(new THREE.Matrix4().makeTranslation(-side * 0.56, -8.5, 0));
      const lat = new THREE.Vector3(side, 0, 0).applyQuaternion(cF.q);
      detach(h, cF, local, dp, lat.multiplyScalar(28).add(cF.tan.clone().multiplyScalar(-12)), new THREE.Vector3(side, 0.3, 0.1), 5, new THREE.Vector3(0, 10, 0));
    });
    // Stage 2
    const h2 = parts.s2.userData.holder;
    if (!sep2) h2.matrix.copy(f.m);
    else detach(h2, cS2, I, p - ev.sep2, cS2.tan.clone().multiplyScalar(-36).add(new THREE.Vector3(0, -3, -5)), new THREE.Vector3(0.3, 0.1, 1), 6, new THREE.Vector3(0, 7, 0));
    parts.pay.userData.holder.matrix.copy(f.m);
    for (const pt of Object.values(parts)) pt.userData.holder.updateMatrixWorld(true);
    deploy(parts.pay, sstep(ev.arr0, ev.arr1, p));

    // Engines: plumes, glow, nozzle heat.
    const lift = sstep(0, 0.02, p), vac = sstep(0.04, ev.sep1, p);
    const burn1 = !sep1 && p > 0.001, burn2 = p > ev.sep1 + 0.015 && !sep2;
    const n1 = parts.s1.userData.nozzle.clone().applyMatrix4(h1.matrix), n2 = parts.s2.userData.nozzle.clone().applyMatrix4(h2.matrix);
    plume1.visible = glow1.visible = burn1;
    plume1.position.copy(n1); plume1.quaternion.copy(f.q);
    plume1.scale.set(lerp(0.45, 1.5, vac), lerp(3.2, 6.5, vac) * (0.5 + 0.5 * lift), lerp(0.45, 1.5, vac));
    plume1.material.uniforms.vac.value = vac * 0.75; plume1.material.uniforms.power.value = lift;
    glow1.position.copy(n1); glow1.scale.setScalar(2.6 * lift * (0.92 + 0.08 * Math.sin(time * 47)));
    const ign2 = sstep(ev.sep1 + 0.015, ev.sep1 + 0.03, p);
    plume2.visible = glow2.visible = burn2;
    plume2.position.copy(n2); plume2.quaternion.copy(f.q); plume2.scale.set(1.5, 5.5, 1.5);
    plume2.material.uniforms.vac.value = 1; plume2.material.uniforms.power.value = ign2;
    glow2.position.copy(n2); glow2.scale.setScalar(1.8 * ign2);
    materials.nozzle1.emissiveIntensity = burn1 ? 0.6 * lift : Math.max(0, 0.6 - (p - ev.sep1) * 20);
    // The vacuum nozzle glows orange while it burns and keeps glowing as the spent stage drifts off.
    materials.nozzle2.emissiveIntensity = burn2 ? 3 * ign2 : sep2 ? Math.max(0, 3 - (p - ev.sep2) * 18) : 0;

    // Pad: vapour venting before launch, smoke billowing at liftoff.
    const idle = 1 - sstep(0, 0.008, p);
    vents.forEach((s, i) => {
      const k = s.userData, t = (time * 0.35 + k.ph) % 1;
      s.position.set(R0 + 0.2 + t * 1.6, k.y + t * 0.6, 0.3 * Math.sin(i));
      s.scale.setScalar(0.4 + t * 1.6); s.material.opacity = idle * (1 - t) * 0.22;
    });
    const billow = Math.min(1, p / 0.035);
    smoke.forEach((s) => {
      const k = s.userData, r = billow * (2.2 + k.sp * 7);
      s.position.set(Math.cos(k.a) * r, 0.4 + k.up * billow * 3, Math.sin(k.a) * r);
      s.scale.setScalar(1.6 + billow * 5 * k.sp);
      s.material.opacity = (p > 0.0015 ? 1 : 0) * (1 - sstep(0.04, 0.1, p)) * 0.6;
    });
    // Cold-gas puffs at each separation.
    const events = [[ev.sep1, cS1, 5.6], [ev.fair, cF, 8.6], [ev.sep2, cS2, 6.1]];
    puffs.forEach((s, i) => {
      const [at, fr, y] = events[i % 3], dp = p - at;
      const on = dp > 0 && dp < 0.025;
      s.visible = on;
      if (!on) return;
      const c = new THREE.Vector3(0, y, 0).applyMatrix4(fr.m).addScaledVector(s.userData.d, 0.2 + dp * 40);
      s.position.copy(c); s.scale.setScalar(0.3 + dp * 30); s.material.opacity = (1 - dp / 0.025) * 0.5;
    });

    // Light follows the ship so its shadows stay sharp.
    sun.position.copy(f.pos).addScaledVector(SUN, 25); sun.target.position.copy(f.pos); sun.target.updateMatrixWorld();
    sunDisc.position.copy(f.pos).addScaledVector(SUN, 1800);
    transfer.material.opacity = 0.6 * sstep(ev.wide - 0.04, ev.wide + 0.05, p);

    // Camera: eased follow plus a little shake while the first stage burns through the air.
    const c = cameraFor(p, f), k = ease(4.5);
    camPos.lerp(c.pos, k); camLook.lerp(c.look, k);
    const shake = burn1 ? (1 - vac) * lift * 0.035 : 0;
    camera.position.copy(camPos).add(new THREE.Vector3(Math.sin(time * 37) * shake, Math.cos(time * 29) * shake, 0));
    camera.lookAt(camLook);
    // Ease the view offset toward centre for the final wide shot.
    const wide = sstep(ev.wide, 1, p);
    camera.setViewOffset(W, H, shiftX * (1 - wide * 0.7), shiftY, W, H);
    first = false;

    // Labels
    const at = (part, x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(part.userData.holder.matrix);
    const win = (a, b) => sstep(a, a + 0.02, p) * (1 - sstep(b, b + 0.02, p));
    const show = 1 - dim;
    place(L.s1, at(parts.s1, R0, 3, 0), win(0.02, ev.sep1 + 0.08) * show);
    place(L.fair, at(parts.fl, 0.6, 10, 0), win(ev.fair - 0.06, ev.fair + 0.06) * show);
    place(L.s2, at(parts.s2, R0, 7.3, 0), win(ev.fair + 0.04, ev.sep2 + 0.07) * show);
    place(L.pay, at(parts.pay, 0.4, 9.4, 0), win(ev.sep2, ev.wide) * show);
    const wings = parts.pay.userData.wings;
    place(L.a0, wings[0].panels[2].localToWorld(new THREE.Vector3(-0.62, 0, 0)), win(ev.arr1 - 0.02, ev.wide) * show);
    place(L.a1, wings[1].panels[2].localToWorld(new THREE.Vector3(0.62, 0, 0)), win(ev.arr1 - 0.02, ev.wide) * show);
    place(L.dish, parts.pay.userData.dish.localToWorld(new THREE.Vector3(0, 0.3, 0)), win(ev.arr1, ev.wide) * show);
    place(L.dest, planet.position.clone().add(new THREE.Vector3(16, 0, 0)), sstep(ev.wide + 0.03, ev.wide + 0.08, p) * show);

    canvas.style.opacity = String(1 - dim * 0.72);
    composer.render();
  }

  function loop() { if (!running) return; render(); requestAnimationFrame(loop); }
  resize();
  document.addEventListener('visibilitychange', () => { if (document.hidden) running = false; else if (!reducedMotion) { running = true; requestAnimationFrame(loop); } });

  return {
    /** progress through the flight, and whether the page has scrolled past it (dims the scene behind content) */
    setProgress(next, past) { target = Math.min(1, Math.max(0, next)); dimTarget = past ? 1 : 0; if (reducedMotion) render(); },
    resize() { resize(); if (reducedMotion) render(); },
    start() { running = true; requestAnimationFrame(loop); },
    draw: render,
  };
}
