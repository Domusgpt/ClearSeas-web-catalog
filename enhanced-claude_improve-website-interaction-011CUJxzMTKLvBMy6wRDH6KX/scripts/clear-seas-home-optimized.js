/**
 * Clear Seas Home - OPTIMIZED FOR PERFORMANCE
 * Lightweight, efficient, 60fps guaranteed
 */

(function () {
  'use strict';

  // ===== HEADER SCROLL STATE (Throttled) =====
  const header = document.querySelector('.site-header');
  if (header) {
    let ticking = false;
    const updateHeaderState = () => {
      const scrolled = window.scrollY > 12;
      header.classList.toggle('is-scrolled', scrolled);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderState);
        ticking = true;
      }
    }, { passive: true });

    updateHeaderState();
  }

  // ===== NAVIGATION TOGGLE =====
  const navToggle = document.querySelector('.nav-toggle');
  const navigation = document.getElementById('primary-navigation');

  if (navToggle && navigation) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      navigation.classList.toggle('is-open', !expanded);
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.setAttribute('aria-expanded', 'false');
        navigation.classList.remove('is-open');
      });
    });
  }

  // ===== OPTIMIZED CANVAS BACKGROUND =====
  const canvas = document.getElementById('polytopal-field');
  if (canvas && canvas.getContext) {
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let teardown = null;

    if (!reduceMotionQuery.matches) {
      teardown = initOptimizedCanvas(canvas);
    } else {
      drawStaticGradient(canvas);
    }

    reduceMotionQuery.addEventListener?.('change', (e) => {
      if (e.matches && teardown) {
        teardown();
        teardown = null;
        drawStaticGradient(canvas);
      } else if (!e.matches && !teardown) {
        teardown = initOptimizedCanvas(canvas);
      }
    });
  }

  // ===== YEAR DISPLAY =====
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

})();

// ===== STATIC GRADIENT (No Animation) =====
function drawStaticGradient(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  ctx.scale(dpr, dpr);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, 'rgba(0, 212, 255, 0.06)');
  gradient.addColorStop(1, 'rgba(255, 0, 110, 0.04)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// ===== HIGHLY OPTIMIZED CANVAS ANIMATION =====
function initOptimizedCanvas(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let rafId = null;
  let nodes = [];
  let lastTime = 0;
  const targetFPS = 60;
  const frameInterval = 1000 / targetFPS;

  // DRASTICALLY REDUCED NODE COUNT for performance
  const settings = {
    baseCount: 30, // Was 70 - cut by more than half
    maxVelocity: 0.25,
    connectionDistance: 150, // Reduced from 180
    maxConnections: 3 // Limit connections per node
  };

  const pointer = { x: 0, y: 0, active: false };

  const createNode = () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * settings.maxVelocity,
    vy: (Math.random() - 0.5) * settings.maxVelocity,
    radius: 1.2
  });

  const resizeCanvas = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.scale(dpr, dpr);

    // Adjust node count based on screen size
    const nodeCount = Math.min(
      Math.round(settings.baseCount * (width / 1920)),
      settings.baseCount
    );
    nodes = Array.from({ length: nodeCount }, createNode);
  };

  const updateNodes = () => {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];

      node.x += node.vx;
      node.y += node.vy;

      // Wrap around edges
      if (node.x < -50) node.x = width + 50;
      else if (node.x > width + 50) node.x = -50;
      if (node.y < -50) node.y = height + 50;
      else if (node.y > height + 50) node.y = -50;

      // Pointer influence (simplified)
      if (pointer.active) {
        const dx = pointer.x - node.x;
        const dy = pointer.y - node.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 40000) { // Only within 200px
          const influence = Math.min(0.3, 800 / distSq);
          node.vx += dx * influence * 0.0002;
          node.vy += dy * influence * 0.0002;
        }
      }

      // Clamp velocity
      const speed = Math.hypot(node.vx, node.vy);
      if (speed > settings.maxVelocity) {
        node.vx = (node.vx / speed) * settings.maxVelocity;
        node.vy = (node.vy / speed) * settings.maxVelocity;
      }
    }
  };

  const drawConnections = () => {
    const maxDist = settings.connectionDistance;
    const maxDistSq = maxDist * maxDist;

    // Optimized: limit connections per node
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      let connections = 0;

      for (let j = i + 1; j < nodes.length && connections < settings.maxConnections; j++) {
        const nodeB = nodes[j];
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const alpha = (1 - Math.sqrt(distSq) / maxDist) * 0.3;
          ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(nodeA.x, nodeA.y);
          ctx.lineTo(nodeB.x, nodeB.y);
          ctx.stroke();
          connections++;
        }
      }
    }
  };

  const drawNodes = () => {
    // Simplified node rendering
    ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const render = (currentTime) => {
    // FPS throttling
    const elapsed = currentTime - lastTime;

    if (elapsed < frameInterval) {
      rafId = requestAnimationFrame(render);
      return;
    }

    lastTime = currentTime - (elapsed % frameInterval);

    // Clear and draw
    ctx.clearRect(0, 0, width, height);

    // Simple gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.04)');
    gradient.addColorStop(1, 'rgba(255, 0, 110, 0.03)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    updateNodes();
    drawConnections();
    drawNodes();

    rafId = requestAnimationFrame(render);
  };

  // Event listeners (throttled)
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 250);
  };

  let mouseMoveTimeout;
  const handleMouseMove = (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;

    clearTimeout(mouseMoveTimeout);
    mouseMoveTimeout = setTimeout(() => {
      pointer.active = false;
    }, 100);
  };

  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('mousemove', handleMouseMove, { passive: true });

  // Initialize
  resizeCanvas();
  rafId = requestAnimationFrame(render);

  // Cleanup function
  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('mousemove', handleMouseMove);
    clearTimeout(resizeTimeout);
    clearTimeout(mouseMoveTimeout);
    ctx.clearRect(0, 0, width, height);
  };
}
