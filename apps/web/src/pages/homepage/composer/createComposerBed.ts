import * as THREE from 'three';
import { COMPOSER_BAR_COUNT, composerBarState } from './composerMotion';

const WIDTH = 11.4;
const HEIGHT = 8;
const PITCH = HEIGHT / COMPOSER_BAR_COUNT;
const PAPER = '#f0eee8';

function canvasTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

async function createArtwork(svg: SVGSVGElement) {
  const units = svg.viewBox.baseVal.width;
  const height = units * 40;
  const width = Math.round(height * WIDTH / HEIGHT);
  const qrCanvas = document.createElement('canvas');
  qrCanvas.width = width;
  qrCanvas.height = height;
  const qrContext = qrCanvas.getContext('2d');
  if (!qrContext) throw new Error('Canvas unavailable');
  qrContext.fillStyle = PAPER;
  qrContext.fillRect(0, 0, width, height);
  const image = new Image();
  const serialized = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([serialized], { type: 'image/svg+xml' }));
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('QR artwork unavailable'));
      image.src = url;
    });
    qrContext.imageSmoothingEnabled = false;
    qrContext.drawImage(image, Math.round((width - height) / 2), 0, height, height);
  } finally { URL.revokeObjectURL(url); }

  const addressCanvas = document.createElement('canvas');
  addressCanvas.width = width;
  addressCanvas.height = height;
  const context = addressCanvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#202327';
  context.font = '500 33px "JetBrains Mono", monospace';
  context.fillText('UNE ADRESSE / À ENCODER', width * 0.075, height * 0.105);
  context.strokeStyle = '#c2c0b8';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(width * 0.075, height * 0.155);
  context.lineTo(width * 0.925, height * 0.155);
  context.stroke();
  context.font = '500 35px "JetBrains Mono", monospace';
  context.fillText('https://', width * 0.075, height * 0.69);
  context.font = '600 116px Manrope, Arial, sans-serif';
  context.fillText('atelier-azur.example', width * 0.069, height * 0.815, width * 0.87);
  context.font = '500 27px "JetBrains Mono", monospace';
  context.fillStyle = '#65665f';
  context.fillText('DESTINATION DE DÉMONSTRATION', width * 0.075, height * 0.927);
  return { address: canvasTexture(addressCanvas), qr: canvasTexture(qrCanvas) };
}

function labelTexture(completed = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 96;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#2b2e32';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#dedfdc';
  context.font = '500 35px "JetBrains Mono", monospace';
  context.fillText('https://atelier-azur.example', 25, 60);
  context.fillStyle = '#d6a24b';
  context.font = '500 24px "JetBrains Mono", monospace';
  context.textAlign = 'right';
  context.fillText(completed ? 'QR DIRECT' : 'ENCODAGE DIRECT', 1510, 58);
  return canvasTexture(canvas);
}

export async function createComposerBed(host: HTMLElement, svg: SVGSVGElement) {
  const artwork = await createArtwork(svg);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor('#191b1e', 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 90);
  const model = new THREE.Group();
  model.rotation.x = -Math.PI / 2;
  model.rotation.z = -0.035;
  model.position.y = 0.8;
  scene.add(model);

  const hemisphere = new THREE.HemisphereLight('#f4f3ef', '#43464b', 2.4);
  const key = new THREE.DirectionalLight('#ffffff', 3.1);
  key.position.set(-7, 13, 9);
  scene.add(hemisphere, key);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>([artwork.address, artwork.qr]);
  const geometry = <T extends THREE.BufferGeometry>(value: T) => { geometries.add(value); return value; };
  const material = <T extends THREE.Material>(value: T) => { materials.add(value); return value; };
  const chassisMaterial = material(new THREE.MeshStandardMaterial({ color: '#282b2f', roughness: 0.83, metalness: 0.18 }));
  const edgeMaterial = material(new THREE.MeshStandardMaterial({ color: '#444950', roughness: 0.7, metalness: 0.28 }));
  const sideMaterial = material(new THREE.MeshStandardMaterial({ color: '#30343a', roughness: 0.78, metalness: 0.22 }));
  const base = new THREE.Mesh(geometry(new THREE.BoxGeometry(12.25, 10.35, 0.5)), chassisMaterial);
  base.position.z = -0.56;
  model.add(base);
  const railsGeometry = geometry(new THREE.BoxGeometry(0.32, 10.35, 0.63));
  for (const x of [-5.99, 5.99]) {
    const rail = new THREE.Mesh(railsGeometry, edgeMaterial);
    rail.position.set(x, 0, -0.13);
    model.add(rail);
  }
  const endGeometry = geometry(new THREE.BoxGeometry(12.05, 0.47, 0.6));
  for (const y of [-4.94, 4.94]) {
    const rail = new THREE.Mesh(endGeometry, chassisMaterial);
    rail.position.set(0, y, -0.13);
    model.add(rail);
  }

  const label = labelTexture();
  const completedLabel = labelTexture(true);
  textures.add(label);
  textures.add(completedLabel);
  const labelMaterial = material(new THREE.MeshBasicMaterial({ map: label, toneMapped: false }));
  const labelMesh = new THREE.Mesh(geometry(new THREE.PlaneGeometry(10.7, 0.49)), labelMaterial);
  labelMesh.position.set(0, -4.94, 0.18);
  model.add(labelMesh);
  const index = new THREE.Mesh(geometry(new THREE.BoxGeometry(0.12, 0.42, 0.035)), material(new THREE.MeshBasicMaterial({ color: '#507fff', toneMapped: false })));
  index.position.set(-5.67, -4.92, 0.2);
  model.add(index);

  const barGeometry = geometry(new THREE.BoxGeometry(WIDTH, PITCH, PITCH));
  const faceGeometry = geometry(new THREE.PlaneGeometry(WIDTH, PITCH * 0.94));
  const addressFaceMaterial = material(new THREE.MeshBasicMaterial({ map: artwork.address, toneMapped: false }));
  const qrFaceMaterial = material(new THREE.MeshBasicMaterial({ map: artwork.qr, toneMapped: false }));
  const axleGeometry = geometry(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 12));
  const bars: THREE.Group[] = [];
  for (let i = 0; i < COMPOSER_BAR_COUNT; i++) {
    const bar = new THREE.Group();
    bar.add(new THREE.Mesh(barGeometry, sideMaterial));
    for (const x of [-WIDTH / 2 - 0.04, WIDTH / 2 + 0.04]) {
      const axle = new THREE.Mesh(axleGeometry, edgeMaterial);
      axle.rotation.z = Math.PI / 2;
      axle.position.x = x;
      bar.add(axle);
    }
    const rowGeometry = geometry(faceGeometry.clone());
    const uv = rowGeometry.getAttribute('uv');
    for (let vertex = 0; vertex < uv.count; vertex++) {
      uv.setY(vertex, (uv.getY(vertex) + COMPOSER_BAR_COUNT - i - 1) / COMPOSER_BAR_COUNT);
    }
    for (const [type, faceMaterial] of [['address', addressFaceMaterial], ['qr', qrFaceMaterial]] as const) {
      const face = new THREE.Mesh(rowGeometry, faceMaterial);
      if (type === 'address') face.position.z = PITCH / 2 + 0.001;
      else { face.rotation.x = -Math.PI / 2; face.position.y = PITCH / 2 + 0.001; }
      bar.add(face);
    }
    model.add(bar);
    bars.push(bar);
  }
  // Exact settled surfaces retain the quiet zone without mechanical face seams.
  const settledGeometry = geometry(new THREE.PlaneGeometry(WIDTH, HEIGHT));
  const settledAddressMaterial = material(new THREE.MeshBasicMaterial({ map: artwork.address, transparent: true, toneMapped: false }));
  const settledQrMaterial = material(new THREE.MeshBasicMaterial({ map: artwork.qr, transparent: true, toneMapped: false, opacity: 0 }));
  const settledAddress = new THREE.Mesh(settledGeometry, settledAddressMaterial);
  const settledQr = new THREE.Mesh(settledGeometry, settledQrMaterial);
  settledAddress.position.z = settledQr.position.z = PITCH / 2 + 0.004;
  model.add(settledAddress, settledQr);

  // One static contact-shadow texture; no shadow-map pass during articulation.
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 256;
  const shadowContext = shadowCanvas.getContext('2d')!;
  const gradient = shadowContext.createRadialGradient(128, 128, 65, 128, 128, 125);
  gradient.addColorStop(0, '#000000bc');
  gradient.addColorStop(0.7, '#00000066');
  gradient.addColorStop(1, '#00000000');
  shadowContext.fillStyle = gradient;
  shadowContext.fillRect(0, 0, 256, 256);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  textures.add(shadowTexture);
  const shadow = new THREE.Mesh(geometry(new THREE.PlaneGeometry(16, 13.5)), material(new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0.35, 0.005, 0.75);
  scene.add(shadow);

  let progress = 0;
  let pointerTilt = 0;
  let visible = true;
  let pending = 0;
  let disposed = false;
  let frames = 0;
  const draw = () => {
    pending = 0;
    if (disposed || !visible) return;
    renderer.render(scene, camera);
    host.dataset['renders'] = String(++frames);
  };
  const requestDraw = () => { if (!pending && visible && !disposed) pending = requestAnimationFrame(draw); };
  const apply = () => {
    settledAddressMaterial.opacity = Math.max(0, 1 - progress / 0.035);
    settledAddress.visible = settledAddressMaterial.opacity > 0;
    settledQrMaterial.opacity = Math.max(0, (progress - 0.965) / 0.035);
    settledQr.visible = settledQrMaterial.opacity > 0;
    labelMaterial.map = progress >= 0.999 ? completedLabel : label;
    bars.forEach((bar, i) => {
      const state = composerBarState(progress, i);
      bar.position.set(0, (HEIGHT / 2 - PITCH * (i + 0.5)) * state.spacing, state.lift);
      bar.rotation.x = state.rotation + (i === COMPOSER_BAR_COUNT - 1 && progress < 0.015 ? pointerTilt : 0);
    });
    host.dataset['progress'] = progress.toFixed(3);
    requestDraw();
  };
  const resize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    const mobile = window.innerWidth < 700;
    camera.position.set(mobile ? 0.8 : 2.4, mobile ? 26.5 : 23.5, mobile ? 8.4 : 12.5);
    camera.lookAt(0, 0.4, 0);
    camera.fov = mobile ? 34 : 29;
    camera.updateProjectionMatrix();
    requestDraw();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    if (visible) requestDraw();
  });
  intersectionObserver.observe(host);
  resize();
  apply();

  return {
    setProgress(value: number) { progress = Math.max(0, Math.min(1, value)); apply(); },
    setPointerTilt(value: number) { pointerTilt = value; apply(); },
    dispose() {
      disposed = true;
      if (pending) cancelAnimationFrame(pending);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      geometries.forEach((value) => value.dispose());
      materials.forEach((value) => value.dispose());
      textures.forEach((value) => value.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
