/**
 * Canvas Background - Orchestrated Edition
 * Optimized polytopal field with proper frame timing
 * © 2025 Clear Seas Solutions
 */

(function() {
  'use strict';

  const canvas = document.getElementById('polytopal-field');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    drawStaticGradient();
    return;
  }

  // Detect low-end devices
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  if (isLowEndDevice) {
    console.log('Canvas animation disabled on low-end device');
    drawStaticGradient();
    return;
  }

  initOptimizedCanvas();

  function drawStaticGradient() {
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
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(255, 0, 110, 0.04)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  function initOptimizedCanvas() {
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let rafId = null;
    let nodes = [];
    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    // Optimized settings
    const settings = {
      baseCount: 35, // Balanced node count
      maxVelocity: 0.3,
      connectionDistance: 160,
      maxConnections: 3
    };

    const pointer = { x: 0, y: 0, active: false, timeout: null };

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

      // Adjust node count for screen size
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

        // Wrap edges
        if (node.x < -50) node.x = width + 50;
        else if (node.x > width + 50) node.x = -50;
        if (node.y < -50) node.y = height + 50;
        else if (node.y > height + 50) node.y = -50;

        // Pointer influence (optimized)
        if (pointer.active) {
          const dx = pointer.x - node.x;
          const dy = pointer.y - node.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 30000) { // Only within ~173px
            const influence = Math.min(0.25, 600 / distSq);
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

      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        let connections = 0;

        for (let j = i + 1; j < nodes.length && connections < settings.maxConnections; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x;
          const dy = nodeA.y - nodeB.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistSq) {
            const alpha = (1 - Math.sqrt(distSq) / maxDist) * 0.35;
            ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
            ctx.lineWidth = 0.6;
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
      ctx.fillStyle = 'rgba(0, 212, 255, 0.45)';
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const render = (currentTime) => {
      // FPS throttling
      const elapsed = currentTime - lastFrameTime;

      if (elapsed < frameInterval) {
        rafId = requestAnimationFrame(render);
        return;
      }

      lastFrameTime = currentTime - (elapsed % frameInterval);

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Gradient background
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

    // Event handlers (optimized)
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(resizeCanvas, 250);
    };

    const handleMouseMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;

      clearTimeout(pointer.timeout);
      pointer.timeout = setTimeout(() => {
        pointer.active = false;
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Pause when page hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(render);
      }
    });

    // Initialize
    resizeCanvas();
    rafId = requestAnimationFrame(render);

    console.log('🎨 CANVAS: Complete! Animating', nodes.length, 'nodes at 60fps');
    console.log('🎨 CANVAS: RAF running =', !!rafId);

    // Cleanup
    window.addEventListener('beforeunload', () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    });
  }

})();
