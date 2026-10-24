import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initScene3D({ prefersReducedMotion = false } = {}) {
  const canvas = document.getElementById('webgl-canvas');
  if (!canvas) return null;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  // Scene, Camera & Renderer (Prompt 06: full-screen canvas, transparent background, cap pixel ratio at 2)
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  const baseCameraZ = 7.5;
  camera.position.set(0, 0, baseCameraZ);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobile,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // Lighting (Prompt 06: #1A56FF blue light + soft white light)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  const whiteLight = new THREE.DirectionalLight(0xffffff, 2.2);
  whiteLight.position.set(4, 5, 4);
  scene.add(whiteLight);

  const blueLight = new THREE.PointLight(0x1a56ff, 8, 18);
  blueLight.position.set(-3.5, -2, 3.5);
  scene.add(blueLight);

  const rimBlueLight = new THREE.PointLight(0x1a56ff, 5, 15);
  rimBlueLight.position.set(3.5, 2.5, -2.5);
  scene.add(rimBlueLight);

  // =========================================================================
  // 1. HERO 3D OBJECT (Prompts 06, 07, 08)
  // =========================================================================
  const heroGroup = new THREE.Group();
  // Position slightly to the right on desktop so hero headline stays super legible
  const initialX = isMobile ? 0 : 2.15;
  const initialY = isMobile ? 0.35 : 0.15;
  heroGroup.position.set(initialX, initialY, 0);
  scene.add(heroGroup);

  const knotSegments = isMobile ? 96 : 160;
  const radialSegments = isMobile ? 16 : 28;
  const torusGeometry = new THREE.TorusKnotGeometry(1.18, 0.34, knotSegments, radialSegments, 2, 3);

  const glassMetalMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x0d1b3e),
    emissive: new THREE.Color(0x071438),
    emissiveIntensity: 0.45,
    metalness: 0.65,
    roughness: 0.16,
    transmission: 0.35,
    thickness: 1.2,
    ior: 1.45,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    transparent: true,
    opacity: 0.96,
  });

  const wireMaterial = new THREE.MeshBasicMaterial({
    color: 0x1a56ff,
    wireframe: true,
    transparent: true,
    opacity: 0.16,
  });

  const mainMesh = new THREE.Mesh(torusGeometry, glassMetalMaterial);
  const wireMesh = new THREE.Mesh(torusGeometry, wireMaterial);
  wireMesh.scale.setScalar(1.015);
  heroGroup.add(mainMesh);
  heroGroup.add(wireMesh);

  // Prompt 08: Optional /model.glb loader with GLTFLoader + DRACOLoader (dynamically imported)
  const loaderEl = document.getElementById('model-loader');
  fetch('/model.glb', { method: 'HEAD' })
    .then(async (res) => {
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || contentType.includes('text/html')) return;

      if (loaderEl) loaderEl.classList.add('is-visible');
      const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/loaders/DRACOLoader.js'),
      ]);

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);

      gltfLoader.load(
        '/model.glb',
        (gltf) => {
          heroGroup.remove(mainMesh, wireMesh);
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          model.position.sub(center);
          model.scale.setScalar(2.4 / maxDim);
          heroGroup.add(model);
          if (loaderEl) loaderEl.classList.remove('is-visible');
        },
        undefined,
        () => {
          if (loaderEl) loaderEl.classList.remove('is-visible');
        }
      );
    })
    .catch(() => {
      // Uses procedural metallic/glass TorusKnot
    });

  // =========================================================================
  // 2. PARTICLE FIELD (Prompt 09: 3,000 particles on desktop, 800 on mobile)
  // =========================================================================
  const particleCount = isMobile ? 800 : 3000;
  const positions = new Float32Array(particleCount * 3);
  const basePositions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  const colorWhite = new THREE.Color(0xffffff);
  const colorBlue = new THREE.Color(0x1a56ff);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    const x = (Math.random() - 0.5) * 22;
    const y = (Math.random() - 0.5) * 16;
    const z = (Math.random() - 0.5) * 14 - 2;

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    basePositions[i3] = x;
    basePositions[i3 + 1] = y;
    basePositions[i3 + 2] = z;

    // White with ~30% electric blue #1A56FF particles
    const chosen = Math.random() < 0.32 ? colorBlue : colorWhite;
    colors[i3] = chosen.r;
    colors[i3 + 1] = chosen.g;
    colors[i3 + 2] = chosen.b;
  }

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMaterial = new THREE.PointsMaterial({
    size: isMobile ? 0.042 : 0.036,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particlePoints);

  // =========================================================================
  // 3. SCROLL-LINKED 3D & CAMERA PUSH (Prompts 07 & 09)
  // =========================================================================
  const scrollState = {
    x: initialX,
    y: initialY,
    z: 0,
    rotY: 0,
    scale: 1,
    opacity: 0.96,
    wireOpacity: 0.16,
    camZOffset: 0,
  };

  function applyScrollState() {
    heroGroup.position.set(scrollState.x, scrollState.y, scrollState.z);
    heroGroup.scale.setScalar(scrollState.scale);
    glassMetalMaterial.opacity = scrollState.opacity;
    wireMaterial.opacity = scrollState.wireOpacity;
    heroGroup.visible = scrollState.opacity > 0.02;
  }

  // Phase 1 (Prompt 07): Scroll out of Hero -> move away, rotate 180 deg (Math.PI), fade out
  gsap.to(scrollState, {
    z: -4.2,
    rotY: Math.PI,
    scale: 0.55,
    opacity: 0,
    wireOpacity: 0,
    ease: 'none',
    onUpdate: applyScrollState,
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });

  // Phase 2 (Prompt 07): In Services section -> bring 3D object back smaller on the right
  gsap.fromTo(
    scrollState,
    {
      x: isMobile ? 0 : 2.55,
      y: isMobile ? -0.4 : 0.05,
      z: -3.2,
      rotY: Math.PI,
      scale: 0.35,
      opacity: 0,
      wireOpacity: 0,
    },
    {
      x: isMobile ? 0 : 2.35,
      y: isMobile ? 0 : 0.05,
      z: -0.6,
      rotY: Math.PI * 2,
      scale: isMobile ? 0.58 : 0.72,
      opacity: 0.92,
      wireOpacity: 0.22,
      ease: 'none',
      immediateRender: false,
      onUpdate: applyScrollState,
      scrollTrigger: {
        trigger: '#services',
        start: 'top 80%',
        end: 'center center',
        scrub: true,
      },
    }
  );

  // Fade out again after leaving Services section
  gsap.to(scrollState, {
    z: -3.8,
    scale: 0.35,
    opacity: 0,
    wireOpacity: 0,
    ease: 'none',
    immediateRender: false,
    onUpdate: applyScrollState,
    scrollTrigger: {
      trigger: '#services',
      start: 'bottom 65%',
      end: 'bottom top',
      scrub: true,
    },
  });

  // Prompt 09: Push camera forward slightly on scroll across the page
  gsap.to(scrollState, {
    camZOffset: -1.85,
    ease: 'none',
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });

  // =========================================================================
  // 4. MOUSE INTERACTION & VISIBILITY / OFF-SCREEN PAUSE (Prompts 06 & 09)
  // =========================================================================
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

  window.addEventListener(
    'pointermove',
    (e) => {
      mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    { passive: true }
  );

  let isTabVisible = !document.hidden;
  document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
  });

  // Resize handling
  window.addEventListener(
    'resize',
    () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    { passive: true }
  );

  // Render loop driven by requestAnimationFrame (60fps)
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!isTabVisible) return;

    const elapsedTime = clock.getElapsedTime();

    // Smooth mouse easing
    mouse.x += (mouse.targetX - mouse.x) * 0.06;
    mouse.y += (mouse.targetY - mouse.y) * 0.06;

    // Camera subtle push on scroll
    camera.position.z = baseCameraZ + scrollState.camZOffset;

    // Rotate 3D object slowly + tilt toward mouse position with easing (Prompt 06)
    if (heroGroup.visible) {
      const slowSpin = prefersReducedMotion ? 0 : elapsedTime * 0.28;
      heroGroup.rotation.y = scrollState.rotY + slowSpin + mouse.x * 0.45;
      heroGroup.rotation.x = elapsedTime * 0.16 - mouse.y * 0.35;
    }

    // Drift particles slowly + gently move away from mouse (Prompt 09)
    if (!prefersReducedMotion) {
      particlePoints.rotation.y = elapsedTime * 0.02;
      const posAttr = particleGeometry.attributes.position;
      const posArr = posAttr.array;
      const mouseWorldX = mouse.x * 6.5;
      const mouseWorldY = mouse.y * 4.5;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const bx = basePositions[i3];
        const by = basePositions[i3 + 1];

        const dx = bx - mouseWorldX;
        const dy = by - mouseWorldY;
        const distSq = dx * dx + dy * dy;

        let repelX = 0;
        let repelY = 0;
        if (distSq < 6.0 && distSq > 0.001) {
          const force = (1 - distSq / 6.0) * 0.42;
          const dist = Math.sqrt(distSq);
          repelX = (dx / dist) * force;
          repelY = (dy / dist) * force;
        }

        posArr[i3] = bx + repelX + Math.sin(elapsedTime * 0.35 + i) * 0.04;
        posArr[i3 + 1] = by + repelY + Math.cos(elapsedTime * 0.3 + i) * 0.04;
      }
      posAttr.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  animate();
  return { scene, camera, renderer };
}
