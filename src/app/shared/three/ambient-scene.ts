/**
 * Lightweight ambient WebGL graph field for the marketing hero.
 * Dynamically imported — never loaded on routes that don't need it.
 * Fully disposable: geometry, material, renderer, observers, rAF.
 */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
  AdditiveBlending,
  Color,
  Group,
  Vector2,
} from 'three';

export interface AmbientSceneOptions {
  host: HTMLElement;
  reducedMotion?: boolean;
  particleCount?: number;
  accent?: string;
}

export interface AmbientSceneHandle {
  setPointer(x: number, y: number): void;
  setTheme(isDark: boolean): void;
  resize(): void;
  dispose(): void;
}

export function createAmbientScene(options: AmbientSceneOptions): AmbientSceneHandle | null {
  const host = options.host;
  if (!host) return null;

  const reducedMotion = options.reducedMotion ?? false;
  const count = options.particleCount ?? (reducedMotion ? 80 : 220);

  const scene = new Scene();
  const camera = new PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.z = 8;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: true,
    });
  } catch {
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, reducedMotion ? 1 : 1.5));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    display: 'block',
  });

  const group = new Group();
  scene.add(group);

  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 14;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    speeds[i] = 0.15 + Math.random() * 0.45;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

  const material = new PointsMaterial({
    size: reducedMotion ? 0.035 : 0.045,
    color: new Color(options.accent ?? '#2dd4bf'),
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new Points(geometry, material);
  group.add(points);

  // Soft connection lines via a second sparse point cloud layer
  const lineCount = Math.floor(count * 0.35);
  const linePositions = new Float32Array(lineCount * 6);
  for (let i = 0; i < lineCount; i++) {
    const a = Math.floor(Math.random() * count);
    const b = Math.floor(Math.random() * count);
    linePositions[i * 6] = positions[a * 3];
    linePositions[i * 6 + 1] = positions[a * 3 + 1];
    linePositions[i * 6 + 2] = positions[a * 3 + 2];
    linePositions[i * 6 + 3] = positions[b * 3];
    linePositions[i * 6 + 4] = positions[b * 3 + 1];
    linePositions[i * 6 + 5] = positions[b * 3 + 2];
  }

  const pointer = new Vector2(0, 0);
  let targetX = 0;
  let targetY = 0;
  let rafId = 0;
  let disposed = false;
  let running = true;

  const resize = () => {
    if (disposed) return;
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  };

  const resizeObserver = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => resize())
    : null;
  resizeObserver?.observe(host);
  resize();

  const visibilityHandler = () => {
    running = document.visibilityState === 'visible';
    if (running && !disposed && !reducedMotion) loop();
  };
  document.addEventListener('visibilitychange', visibilityHandler);

  let last = performance.now();
  const loop = () => {
    if (disposed || !running) return;
    rafId = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    targetX += (pointer.x * 0.35 - targetX) * 0.04;
    targetY += (pointer.y * 0.25 - targetY) * 0.04;
    group.rotation.y = targetX;
    group.rotation.x = -targetY;

    if (!reducedMotion) {
      const attr = geometry.getAttribute('position') as Float32BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] += Math.sin(now * 0.001 * speeds[i] + i) * dt * 0.12;
      }
      attr.needsUpdate = true;
      group.rotation.z += dt * 0.02;
    }

    renderer.render(scene, camera);
  };

  if (reducedMotion) {
    renderer.render(scene, camera);
  } else {
    loop();
  }

  return {
    setPointer(x: number, y: number) {
      pointer.set(x, y);
    },
    setTheme(isDark: boolean) {
      material.color.set(isDark ? '#2dd4bf' : '#0d9488');
      material.opacity = isDark ? 0.55 : 0.4;
    },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      running = false;
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      document.removeEventListener('visibilitychange', visibilityHandler);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    },
  };
}
