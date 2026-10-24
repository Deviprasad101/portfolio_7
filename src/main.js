import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;

// ============================================================================
// 1. LENIS SMOOTH SCROLLING + GSAP SCROLLTRIGGER SYNC (Prompt 03)
// ============================================================================
let lenis = null;

if (!prefersReducedMotion) {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.5,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

// Smooth anchor navigation
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(targetEl, { offset: -80 });
    } else {
      targetEl.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  });
});

// ============================================================================
// 2. SPLIT HEADLINE INTO WORDS (Prompt 05: slides up from behind a mask)
// ============================================================================
function initSplitHeadline() {
  const headline = document.querySelector('[data-split-words]');
  if (!headline) return;

  const rawText = headline.textContent.trim().replace(/\s+/g, ' ');
  const words = rawText.split(' ');

  headline.innerHTML = words
    .map(
      (word) =>
        `<span class="word-mask"><span class="word-inner">${word}</span></span>`
    )
    .join(' ');

  if (prefersReducedMotion) return;

  const wordInners = headline.querySelectorAll('.word-inner');
  gsap.fromTo(
    wordInners,
    { yPercent: 115, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: 0.85,
      ease: 'power3.out',
      stagger: 0.055,
      delay: 0.15,
    }
  );
}

// ============================================================================
// 3. SCROLL-TRIGGERED REVEALS (Prompt 03: opacity 0->1, y: 40->0, 0.8s, power3.out)
// ============================================================================
function initScrollReveals() {
  const revealElements = gsap.utils.toArray('[data-reveal]');
  if (prefersReducedMotion) return;

  revealElements.forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

// ============================================================================
// 4. PINNED PROCESS SECTION WITH #1A56FF PROGRESS BAR (Prompt 04)
//    Desktop: Pinned while scrolling, steps reveal one after another + progress bar
//    Mobile: Disable pin and show steps as a list
// ============================================================================
function initPinnedProcess() {
  const progressBar = document.getElementById('process-progress-bar');
  const steps = gsap.utils.toArray('.process-step');

  if (!progressBar || !steps.length || prefersReducedMotion) {
    if (progressBar) gsap.set(progressBar, { scaleX: 1 });
    return;
  }

  const mm = gsap.matchMedia();

  // Desktop (> 768px): Pin section & scrub through the 4 steps + progress bar
  mm.add('(min-width: 769px)', () => {
    gsap.set(progressBar, { scaleX: 0 });
    gsap.set(steps, { opacity: 0.28, y: 28 });
    gsap.set(steps[0], { opacity: 1, y: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#process',
        start: 'top top+=76',
        end: '+=2000',
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        onUpdate: (self) => {
          const activeIndex = Math.min(
            steps.length - 1,
            Math.floor(self.progress * steps.length)
          );
          steps.forEach((step, idx) => {
            step.classList.toggle('is-active', idx <= activeIndex);
          });
        },
      },
    });

    tl.to(
      progressBar,
      {
        scaleX: 1,
        ease: 'none',
        duration: 1,
      },
      0
    );

    steps.forEach((step, i) => {
      if (i === 0) return;
      const startPos = i / steps.length;
      tl.to(
        step,
        {
          opacity: 1,
          y: 0,
          duration: 1 / steps.length,
          ease: 'power3.out',
        },
        startPos - 0.12
      );
    });
  });

  // Mobile (<= 768px): Disable pin, reveal each step naturally as a list
  mm.add('(max-width: 768px)', () => {
    gsap.set(progressBar, { scaleX: 1 });
    steps.forEach((step) => {
      step.classList.add('is-active');
      gsap.fromTo(
        step,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: step,
            start: 'top 88%',
          },
        }
      );
    });
  });
}

// ============================================================================
// 5. ANIMATED COUNTERS ON VIEWPORT ENTRY (Prompt 10 #4)
// ============================================================================
function initCounters() {
  const counterEls = document.querySelectorAll('[data-counter]');

  counterEls.forEach((el) => {
    const targetValue = parseFloat(el.getAttribute('data-counter') || '0');
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);

    if (prefersReducedMotion) {
      el.textContent = targetValue.toFixed(decimals);
      return;
    }

    const counterObj = { val: 0 };
    gsap.to(counterObj, {
      val: targetValue,
      duration: 1.8,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = counterObj.val.toFixed(decimals);
      },
      scrollTrigger: {
        trigger: el,
        start: 'top 90%',
        once: true,
      },
    });
  });
}

// ============================================================================
// 6. MICRO-INTERACTIONS: CUSTOM CURSOR, MAGNETIC BUTTONS, 3D CARD TILT (Prompt 10)
//    Disabled automatically on touch devices
// ============================================================================
function initMicroInteractions() {
  if (isTouchDevice || prefersReducedMotion) return;

  // 6a. Custom Cursor
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  if (dot && ring) {
    const moveDotX = gsap.quickTo(dot, 'x', { duration: 0.08, ease: 'power3.out' });
    const moveDotY = gsap.quickTo(dot, 'y', { duration: 0.08, ease: 'power3.out' });
    const moveRingX = gsap.quickTo(ring, 'x', { duration: 0.28, ease: 'power3.out' });
    const moveRingY = gsap.quickTo(ring, 'y', { duration: 0.28, ease: 'power3.out' });

    window.addEventListener(
      'pointermove',
      (e) => {
        moveDotX(e.clientX);
        moveDotY(e.clientY);
        moveRingX(e.clientX);
        moveRingY(e.clientY);
      },
      { passive: true }
    );

    const interactiveTargets = document.querySelectorAll('a, button, [data-magnetic]');
    interactiveTargets.forEach((target) => {
      target.addEventListener('pointerenter', () => ring.classList.add('is-hover'));
      target.addEventListener('pointerleave', () => ring.classList.remove('is-hover'));
    });
  }

  // 6b. Magnetic Buttons
  const magneticButtons = document.querySelectorAll('[data-magnetic]');
  magneticButtons.forEach((btn) => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.35, ease: 'power3.out' });

    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      xTo(relX * 0.26);
      yTo(relY * 0.26);
    });

    btn.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });

  // 6c. 3D Card Tilt on Hover
  const tiltCards = document.querySelectorAll('[data-tilt]');
  tiltCards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(card, {
        rotateY: x * 7,
        rotateX: -y * 7,
        transformPerspective: 900,
        duration: 0.35,
        ease: 'power2.out',
      });
    });

    card.addEventListener('pointerleave', () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.5,
        ease: 'power3.out',
      });
    });
  });
}

// ============================================================================
// INITIALIZE EVERYTHING ON DOM READY (Lazy-load 3D scene for fast LCP/FCP)
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  initSplitHeadline();
  initScrollReveals();
  initPinnedProcess();
  initCounters();
  initMicroInteractions();

  const start3D = () => {
    import('./scene3d.js').then(({ initScene3D }) => {
      initScene3D({ prefersReducedMotion });
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(start3D, { timeout: 600 });
  } else {
    setTimeout(start3D, 80);
  }
});
