import * as THREE from 'three';

type Point = readonly [number, number];
// Open structural strokes, not text contours cut into a surrounding plate.
// The breaks run through the silhouette, exposing the next structural plane.
const W: Point[][] = [
  [[0,5.2],[.98,5.2],[1.83,.12],[.87,.12]],
  [[1.05,.12],[1.94,.12],[2.2,1.32],[1.37,1.32]],
  [[1.5,1.78],[2.3,1.78],[2.6,3.18],[1.86,3.18]],
  [[2.06,3.18],[2.83,3.18],[3.51,.12],[2.6,.12]],
  [[2.85,.12],[3.82,.12],[4.74,5.2],[3.76,5.2]],
];
const R: Point[][] = [
  [[0,.12],[.91,.12],[.91,5.2],[0,5.2]],
  [[1.16,5.2],[3.17,5.2],[4.05,4.38],[4.05,3.05],[3.17,2.27],[1.16,2.27],[1.16,3.15],[2.78,3.15],[3.11,3.44],[3.11,4.02],[2.78,4.31],[1.16,4.31]],
  [[1.42,2.02],[2.48,2.02],[4.34,.12],[3.16,.12]],
];
const X: Point[][] = [
  [[0,5.2],[1.13,5.2],[2.6,2.76],[1.66,2.76]],
  [[2.83,2.76],[3.62,5.2],[4.75,5.2],[3.4,2.76]],
  [[0,.12],[1.13,.12],[2.37,2.56],[1.43,2.56]],
  [[2.62,2.56],[3.62,.12],[4.75,.12],[3.56,2.56]],
];

function polygon(points: Point[]) {
  const path = new THREE.Path();
  points.forEach(([x,y], i) => { if (i === 0) path.moveTo(x,y); else path.lineTo(x,y); });
  path.closePath();
  return path;
}

export type CutProjection = { origin: { x: number; y: number }; exit: { x: number; y: number }; mobile: boolean };
export type BrandConstruction = {
  setRelease: (release: number, continuation: number) => void;
  subscribeLayout: (callback: (projection: CutProjection) => void) => () => void;
  dispose: () => void;
};

/** Demand-rendered construction: viewport changes and the one bounded cut release. */
export function createBrandConstruction(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor('#191b1e', 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10,10,7,-7,.1,80);
  const assembly = new THREE.Group();
  scene.add(assembly);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const geometry = <T extends THREE.BufferGeometry>(value: T) => { geometries.add(value); return value; };
  const material = <T extends THREE.Material>(value: T) => { materials.add(value); return value; };
  const face = material(new THREE.MeshStandardMaterial({ color: '#393d42', roughness: .92, metalness: 0 }));
  const edge = material(new THREE.MeshStandardMaterial({ color: '#2c3035', roughness: .95, metalness: 0 }));
  const rear = material(new THREE.MeshStandardMaterial({ color: '#202428', roughness: .96, metalness: 0 }));
  const blue = material(new THREE.MeshStandardMaterial({ color: '#507fff', roughness: .92, metalness: 0, side: THREE.DoubleSide }));
  let releasePlane: THREE.Mesh | undefined;

  const glyphs = [W, R, X];
  for (let layer = 0; layer < 3; layer++) {
    glyphs.forEach((fragments,index) => fragments.forEach((points,fragment) => {
      // Selective support: thin planes, deep joints and unsupported open cuts
      // coexist instead of repeating a full wordmark at every depth.
      if (layer === 1 && ((index === 0 && [0,2].includes(fragment)) || (index === 2 && [0,3].includes(fragment)))) return;
      if (layer === 2 && !((index === 0 && fragment === 3) || (index === 1 && fragment === 0) || (index === 2 && fragment === 2))) return;
      const mapped = points.map(([x,y]) => [x - 2.37 + (index - 1) * 5.35,y] as Point);
      const shape = new THREE.Shape(polygon(mapped).getPoints());
      const depth = layer > 0 ? .11 : index === 0 && fragment === 2 ? .12 : index === 2 && fragment === 1 ? .13 : .23;
      const mesh = new THREE.Mesh(geometry(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 1, steps: 1 })), [layer === 0 ? face : rear, edge]);
      // Offset only the structural strokes, never a full rear rectangle.
      mesh.position.set(layer * .065 + (fragment % 2 === 0 ? -.035 : .06) * layer,.11,.58 - layer * .39);
      mesh.castShadow = mesh.receiveShadow = true;
      assembly.add(mesh);
      if (layer === 0 && index === 2 && fragment === 1) releasePlane = mesh;
    }));
  }

  // Recessed blue partitions are discovered through open joins. Their front
  // surface sits behind the exterior strokes; they never outline a letter.
  const partitions: Point[][] = [
    [[-6.13,1.4],[-5.6,1.4],[-5.54,1.65],[-6.06,1.65]],
    [[-1.34,2.7],[-1.16,2.7],[-1.16,4.15],[-1.34,4.15]],
  ];
  partitions.forEach(points => {
    const partition = new THREE.Mesh(geometry(new THREE.ExtrudeGeometry(new THREE.Shape(polygon(points).getPoints()), {depth:.12,bevelEnabled:false})),blue);
    partition.position.set(0,.11,-.23);
    assembly.add(partition);
  });
  // The X reveal is an actual transverse wall, seen into the crossing slot,
  // not a front-facing blue symbol applied at the intersection.
  const crossingWall = new THREE.Mesh(geometry(new THREE.BoxGeometry(.64,.065,.48)),blue);
  crossingWall.position.set(5.42,2.79,-.33);
  assembly.add(crossingWall);
  // The first length of the route is real recessed geometry: the existing X
  // occludes it. Only beyond this length does the route become a DOM rule.
  const continuationWall = new THREE.Mesh(geometry(new THREE.BoxGeometry(1,.035,.12)),blue);
  continuationWall.visible = false;
  assembly.add(continuationWall);

  const baseMaterial = material(new THREE.MeshStandardMaterial({ color: '#272b30', roughness: .91, metalness: .08 }));
  [-5.35,0,5.35].forEach(x => {
    const foot = new THREE.Mesh(geometry(new THREE.BoxGeometry(x === 0 ? 1.02 : 3.05,.09,.64)),baseMaterial);
    foot.position.set(x,.055,.03);
    foot.castShadow = foot.receiveShadow = true;
    assembly.add(foot);
  });

  const floor = new THREE.Mesh(geometry(new THREE.PlaneGeometry(120,80)),material(new THREE.ShadowMaterial({ opacity: .48 })));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const ambient = new THREE.HemisphereLight('#f4f3ef','#25282c',2.1);
  const key = new THREE.DirectionalLight('#ffffff',3.2);
  key.position.set(-8,14,12);
  key.castShadow = true;
  key.shadow.mapSize.set(2048,2048);
  key.shadow.camera.left = -13; key.shadow.camera.right = 13;
  key.shadow.camera.top = 12; key.shadow.camera.bottom = -9;
  key.shadow.normalBias = .035;
  key.shadow.bias = -.0003;
  scene.add(ambient,key);
  const fill = new THREE.DirectionalLight('#d6d7d9',.65);
  fill.position.set(10,5,7);
  scene.add(fill);

  let release = 0, continuation = 0, mobile = false, visible = true;
  let projection: CutProjection | undefined;
  const subscribers = new Set<(value: CutProjection) => void>();
  const projected = (x: number) => {
    const point = new THREE.Vector3(x,2.79,-.18).project(camera);
    return { x: (point.x + 1) * host.clientWidth / 2, y: (1 - point.y) * host.clientHeight / 2 };
  };
  const render = () => { if (visible && document.visibilityState !== 'hidden') renderer.render(scene,camera); };
  const applyRelease = () => {
    if (releasePlane) releasePlane.position.set(release * .14,.11 + release * .28,.58);
    const direction = mobile ? 1 : -1;
    const length = (mobile ? .7 : 1.72) * continuation;
    continuationWall.scale.x = Math.max(.001,length);
    continuationWall.position.set(5.42 + direction * length / 2,2.79,-.18);
    continuationWall.visible = continuation > 0;
  };

  const resize = () => {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    mobile = window.innerWidth < 700;
    const aspect = width / height;
    const span = mobile ? 16.6 : 18.8;
    camera.left = -span / 2; camera.right = span / 2;
    camera.top = span / aspect / 2; camera.bottom = -span / aspect / 2;
    camera.position.set(mobile ? 2.6 : 6.6,mobile ? 7 : 9.4,25);
    camera.lookAt(mobile ? .5 : .4,mobile ? 2.7 : 3.8,0);
    camera.updateProjectionMatrix();
    renderer.setSize(width,height);
    applyRelease();
    render();
    projection = { origin: projected(5.42), exit: projected(mobile ? 6.12 : 3.7), mobile };
    subscribers.forEach(callback => callback(projection!));
    host.dataset['ready'] = 'true';
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const visibilityObserver = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false;
    if (visible) render();
  });
  visibilityObserver.observe(host);
  return {
    setRelease: (nextRelease: number, nextContinuation: number) => {
      if (nextRelease === release && nextContinuation === continuation) return;
      // Only the moving structural plane changes the cast shadow. Extending
      // the unshadowed blue wall reuses the settled shadow map.
      if (nextRelease !== release) renderer.shadowMap.needsUpdate = true;
      release = nextRelease; continuation = nextContinuation;
      applyRelease();
      render();
    },
    subscribeLayout: (callback: (value: CutProjection) => void) => {
      subscribers.add(callback);
      if (projection) callback(projection);
      return () => { subscribers.delete(callback); };
    },
    dispose: () => {
    observer.disconnect();
    visibilityObserver.disconnect();
    subscribers.clear();
    geometries.forEach(item => item.dispose());
    materials.forEach(item => item.dispose());
    key.shadow.map?.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    },
  };
}
