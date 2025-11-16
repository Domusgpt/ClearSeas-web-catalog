/**
 * Magnetic Cursor Effect
 * Provides smooth magnetic attraction for interactive elements
 * © 2025 Clear Seas Solutions
 */

(function() {
  'use strict';

  // Custom cursor element
  let cursor;
  let cursorFollower;

  // Mouse position
  let mouseX = 0;
  let mouseY = 0;

  // Current cursor position (smoothed)
  let currentX = 0;
  let currentY = 0;

  // Current follower position (smoothed)
  let followerX = 0;
  let followerY = 0;

  // Animation frame ID
  let rafId = null;

  function initMagneticCursor() {
    // Check for reduced motion or touch device
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (prefersReducedMotion || isTouchDevice) {
      console.log('Skipping magnetic cursor (reduced motion or touch device)');
      return;
    }

    // Create custom cursor elements
    cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(0, 212, 255, 0.8);
      pointer-events: none;
      z-index: 10000;
      mix-blend-mode: difference;
      transition: transform 0.15s cubic-bezier(0.23, 1, 0.32, 1);
      will-change: transform;
    `;

    cursorFollower = document.createElement('div');
    cursorFollower.className = 'custom-cursor-follower';
    cursorFollower.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid rgba(0, 212, 255, 0.3);
      pointer-events: none;
      z-index: 9999;
      transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1),
                  border-color 0.3s ease,
                  width 0.3s ease,
                  height 0.3s ease;
      will-change: transform;
    `;

    document.body.appendChild(cursor);
    document.body.appendChild(cursorFollower);

    // Hide default cursor
    document.body.style.cursor = 'none';

    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Start animation loop
    animateCursor();

    // ===== MAGNETIC EFFECT FOR INTERACTIVE ELEMENTS =====

    const magneticElements = document.querySelectorAll(
      'a, button, .btn, .signal-card, .platform-card, .capability-card, .nav-toggle'
    );

    magneticElements.forEach((element) => {
      // Add magnetic data attribute
      element.setAttribute('data-magnetic', 'true');

      element.addEventListener('mouseenter', () => {
        cursorFollower.style.width = '60px';
        cursorFollower.style.height = '60px';
        cursorFollower.style.borderColor = 'rgba(0, 212, 255, 0.6)';
        cursor.style.transform = 'scale(0.5)';
      });

      element.addEventListener('mouseleave', () => {
        cursorFollower.style.width = '40px';
        cursorFollower.style.height = '40px';
        cursorFollower.style.borderColor = 'rgba(0, 212, 255, 0.3)';
        cursor.style.transform = 'scale(1)';

        // Reset element position
        if (typeof gsap !== 'undefined') {
          gsap.to(element, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: 'elastic.out(1, 0.3)'
          });
        }
      });

      element.addEventListener('mousemove', (e) => {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Calculate magnetic strength based on element type
        let strength = 0.3;
        if (element.classList.contains('btn')) {
          strength = 0.4;
        } else if (element.tagName === 'A' && !element.classList.contains('platform-card')) {
          strength = 0.2;
        }

        const moveX = deltaX * strength;
        const moveY = deltaY * strength;

        // Apply magnetic effect with GSAP if available
        if (typeof gsap !== 'undefined') {
          gsap.to(element, {
            x: moveX,
            y: moveY,
            duration: 0.4,
            ease: 'power2.out'
          });
        }
      });
    });

    // ===== LINK HOVER EFFECT =====
    const links = document.querySelectorAll('a:not(.platform-card):not(.signal-card)');

    links.forEach((link) => {
      link.addEventListener('mouseenter', () => {
        cursor.style.backgroundColor = 'rgba(255, 0, 110, 0.8)';
        cursorFollower.style.borderColor = 'rgba(255, 0, 110, 0.6)';
      });

      link.addEventListener('mouseleave', () => {
        cursor.style.backgroundColor = 'rgba(0, 212, 255, 0.8)';
        cursorFollower.style.borderColor = 'rgba(0, 212, 255, 0.3)';
      });
    });

    // ===== BUTTON CLICK EFFECT =====
    const buttons = document.querySelectorAll('button, .btn');

    buttons.forEach((button) => {
      button.addEventListener('mousedown', () => {
        cursor.style.transform = 'scale(0.3)';
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(0.8)';
      });

      button.addEventListener('mouseup', () => {
        cursor.style.transform = 'scale(0.5)';
        cursorFollower.style.transform = 'translate(-50%, -50%) scale(1)';
      });
    });

    console.log('🧲 Magnetic cursor initialized');
  }

  function animateCursor() {
    // Smooth cursor movement with easing
    const easingFactor = 0.15;
    const followerEasing = 0.08;

    currentX += (mouseX - currentX) * easingFactor;
    currentY += (mouseY - currentY) * easingFactor;

    followerX += (mouseX - followerX) * followerEasing;
    followerY += (mouseY - followerY) * followerEasing;

    // Update cursor position
    if (cursor) {
      cursor.style.transform = `translate(${currentX - 5}px, ${currentY - 5}px)`;
    }

    if (cursorFollower) {
      cursorFollower.style.transform = `translate(${followerX - 20}px, ${followerY - 20}px)`;
    }

    rafId = requestAnimationFrame(animateCursor);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMagneticCursor);
  } else {
    initMagneticCursor();
  }

  // Cleanup
  window.addEventListener('beforeunload', () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
  });

})();
