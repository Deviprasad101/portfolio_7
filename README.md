# Devi Prasad Chinthamreddy — 3D Interactive Portfolio

A high-performance, single-page developer portfolio built with **Vite (Vanilla JavaScript)**, **Three.js**, **GSAP + ScrollTrigger**, and **Lenis**.

## Tech Stack
- **Vite** — Fast dev server & optimized ES module bundler
- **Three.js** — Real-time 3D metallic/glass hero geometry, `#1A56FF` lighting, optional GLB/Draco model loader (`/public/model.glb`), and a 3,000-particle interactive field (800 on mobile)
- **GSAP + ScrollTrigger** — Split-word mask reveals, scroll-triggered reveals, pinned 4-step process section with live `#1A56FF` progress bar, and scroll-linked 3D transitions
- **Lenis** — Smooth inertial scrolling synchronized with GSAP's ticker

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

