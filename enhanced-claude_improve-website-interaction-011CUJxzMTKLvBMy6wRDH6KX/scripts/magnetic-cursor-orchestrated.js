/**
 * Magnetic Cursor - Orchestrated Edition
 * Smooth magnetic effects with GSAP optimization
 * © 2025 Clear Seas Solutions
 */

(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (prefersReducedMotion || isTouchDevice) {
    console.log('Magnetic cursor disabled (reduced motion or touch device)');
    return;
  }

  // Wait for GSAP
  function waitForGSAP(callback) {
    const checkInterval = setInterval(() => {
      if (typeof gsap !== 'undefined') {
        clearInterval(checkInterval);
        callback();
      }
    }, 50);

    setTimeout(() => clearInterval(checkInterval), 5000);
  }

  waitForGSAP(initMagneticCursor);

  function initMagneticCursor() {
    console.log('🧲 CURSOR: Starting initialization...');
    console.log('🧲 CURSOR: GSAP available =', typeof gsap);

    // Create cursor elements
    const cursor = document.createElement('div');
    cursor.className = 'cursor-dot';
    cursor.style.cssText = `
      position: fixed;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: rgba(0, 212, 255, 0.9);
      pointer-events: none;
      z-index: 10001;
      mix-blend-mode: difference;
      transform: translate(-50%, -50%);
    `;

    const cursorFollower = document.createElement('div');
    cursorFollower.className = 'cursor-follower';
    cursorFollower.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid rgba(0, 212, 255, 0.4);
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -50%);
    `;

    document.body.appendChild(cursor);
    document.body.appendChild(cursorFollower);

    // Hide default cursor
    document.body.style.cursor = 'none';

    // Mouse tracking
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth cursor follow with GSAP
    gsap.to(cursor, {
      x: () => mouseX,
      y: () => mouseY,
      duration: 0.15,
      ease: 'power2.out',
      overwrite: true
    });

    gsap.to(cursorFollower, {
      x: () => mouseX,
      y: () => mouseY,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: true
    });

    // Update cursor position continuously
    gsap.ticker.add(() => {
      gsap.set(cursor, { x: mouseX, y: mouseY });
      gsap.set(cursorFollower, { x: mouseX, y: mouseY });
    });

    // ===== MAGNETIC EFFECT ON INTERACTIVE ELEMENTS =====
    const magneticElements = document.querySelectorAll(
      'a, button, .btn, .signal-card, .platform-card, .capability-card, .research-lab, .step'
    );

    magneticElements.forEach(element => {
      element.addEventListener('mouseenter', function() {
        // Expand cursor
        gsap.to(cursorFollower, {
          width: 60,
          height: 60,
          borderColor: 'rgba(0, 212, 255, 0.7)',
          borderWidth: 2,
          duration: 0.3,
          ease: 'power2.out'
        });

        gsap.to(cursor, {
          scale: 0.5,
          duration: 0.2,
          ease: 'power2.out'
        });

        // Change color for links
        if (this.tagName === 'A' && !this.classList.contains('btn')) {
          gsap.to(cursor, {
            background: 'rgba(255, 0, 110, 0.9)',
            duration: 0.2
          });
          gsap.to(cursorFollower, {
            borderColor: 'rgba(255, 0, 110, 0.7)',
            duration: 0.2
          });
        }
      });

      element.addEventListener('mouseleave', function() {
        // Reset cursor
        gsap.to(cursorFollower, {
          width: 40,
          height: 40,
          borderColor: 'rgba(0, 212, 255, 0.4)',
          borderWidth: 2,
          duration: 0.3,
          ease: 'power2.out'
        });

        gsap.to(cursor, {
          scale: 1,
          background: 'rgba(0, 212, 255, 0.9)',
          duration: 0.2,
          ease: 'power2.out'
        });

        // Reset element position
        gsap.to(this, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'elastic.out(1, 0.3)'
        });
      });

      element.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Magnetic strength based on element type
        let strength = 0.15;

        if (this.classList.contains('btn')) {
          strength = 0.25;
        } else if (this.classList.contains('signal-card') ||
                   this.classList.contains('platform-card') ||
                   this.classList.contains('capability-card')) {
          strength = 0.1; // Subtle for cards
        }

        const moveX = deltaX * strength;
        const moveY = deltaY * strength;

        gsap.to(this, {
          x: moveX,
          y: moveY,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true
        });
      });

      // Click effect
      element.addEventListener('mousedown', function() {
        gsap.to(cursor, {
          scale: 0.3,
          duration: 0.15,
          ease: 'power2.in'
        });

        gsap.to(cursorFollower, {
          scale: 0.8,
          duration: 0.15,
          ease: 'power2.in'
        });
      });

      element.addEventListener('mouseup', function() {
        gsap.to(cursor, {
          scale: 0.5,
          duration: 0.2,
          ease: 'elastic.out(1.5, 0.4)'
        });

        gsap.to(cursorFollower, {
          scale: 1,
          duration: 0.3,
          ease: 'elastic.out(1, 0.3)'
        });
      });
    });

    // ===== CURSOR STATES =====

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
      gsap.to([cursor, cursorFollower], {
        opacity: 0,
        duration: 0.2
      });
    });

    document.addEventListener('mouseenter', () => {
      gsap.to([cursor, cursorFollower], {
        opacity: 1,
        duration: 0.2
      });
    });

    console.log('✨ CURSOR: Complete! Tracking', magneticElements.length, 'elements');
    console.log('✨ CURSOR: Cursor elements created =', !!cursor && !!cursorFollower);
  }

})();
