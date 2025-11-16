import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    __testVisualStateUpdates?: number;
  }
}

const lenisStub = `(() => {
  class Lenis {
    constructor() {
      this.scroll = { value: 0, instance: { scroll: 0 } };
      this._listeners = new Map();
    }

    raf() {}

    on(event, handler) {
      if (!this._listeners.has(event)) {
        this._listeners.set(event, new Set());
      }
      this._listeners.get(event).add(handler);
    }

    off(event, handler) {
      const set = this._listeners.get(event);
      if (set) {
        set.delete(handler);
      }
    }

    update() {}
    start() {}
    stop() {}

    destroy() {
      this._listeners.clear();
    }

    scrollTo(value) {
      if (Number.isFinite(value)) {
        this.scroll.value = value;
        this.scroll.instance.scroll = value;
        const set = this._listeners.get('scroll');
        if (set) {
          set.forEach((handler) => {
            try {
              handler({ target: this });
            } catch (error) {
              console.warn('[Lenis stub] scroll handler failed', error);
            }
          });
        }
      }
    }
  }

  window.Lenis = Lenis;
})();`;

const gsapStub = `(() => {
  const clamp = (min, max, value) => Math.min(max, Math.max(min, value));
  const toArray = (input) => {
    if (Array.isArray(input)) {
      return input;
    }
    if (typeof input === 'string') {
      return Array.from(document.querySelectorAll(input));
    }
    if (input == null) {
      return [];
    }
    return [input];
  };

  const createTimeline = (config = {}) => {
    const state = {
      progress: 0,
      scrollTrigger: config.scrollTrigger
        ? Object.assign({ isActive: false, kill() {} }, config.scrollTrigger)
        : null,
    };

    const timeline = {
      scrollTrigger: state.scrollTrigger,
      addLabel() {
        return timeline;
      },
      add(callback) {
        if (typeof callback === 'function') {
          try {
            callback();
          } catch (error) {
            console.warn('[GSAP stub] timeline callback failed', error);
          }
        }
        return timeline;
      },
      fromTo() {
        return timeline;
      },
      from() {
        return timeline;
      },
      to() {
        return timeline;
      },
      eventCallback() {
        return timeline;
      },
      progress(value) {
        if (typeof value === 'number') {
          state.progress = clamp(0, 1, value);
          return timeline;
        }
        return state.progress;
      },
      kill() {
        state.scrollTrigger = null;
      },
    };

    return timeline;
  };

  const gsap = {
    timeline: createTimeline,
    utils: { toArray, clamp },
    registerPlugin() {},
    set() {},
    to() {},
    from() {
      return {};
    },
    fromTo() {
      return {};
    },
    getProperty() {
      return 0;
    },
  };

  window.gsap = gsap;
})();`;

const scrollTriggerStub = `(() => {
  const listeners = {
    refresh: new Set(),
    refreshInit: new Set(),
  };

  const ScrollTrigger = {
    addEventListener(event, callback) {
      const set = listeners[event];
      if (set) {
        set.add(callback);
      }
    },
    removeEventListener(event, callback) {
      const set = listeners[event];
      if (set) {
        set.delete(callback);
      }
    },
    scrollerProxy() {},
    update() {},
    refresh() {
      listeners.refreshInit.forEach((handler) => {
        try {
          handler({});
        } catch (error) {
          console.warn('[ScrollTrigger stub] refreshInit handler failed', error);
        }
      });
      listeners.refresh.forEach((handler) => {
        try {
          handler({});
        } catch (error) {
          console.warn('[ScrollTrigger stub] refresh handler failed', error);
        }
      });
    },
    getAll() {
      return [];
    },
    matchMedia() {
      return { add() {}, revert() {} };
    },
    defaults() {},
  };

  window.ScrollTrigger = ScrollTrigger;
})();`;

test.describe('Hero choreography responsiveness', () => {
  test('responds to pointer input and orchestration events', async ({ page }) => {
    await page.route('https://unpkg.com/lenis@1.0.6/dist/lenis.min.js', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: lenisStub,
      });
    });

    await page.route('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: gsapStub,
      });
    });

    await page.route('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: scrollTriggerStub,
      });
    });

    await page.goto('/index.html');

    await page.waitForSelector('[data-moire-layer]');
    await page.waitForFunction(() => document.body.dataset.heroPhase === 'intro', {
      timeout: 15_000,
    });

    const pointerTiltBefore = await page.evaluate(() => {
      const value = getComputedStyle(document.documentElement).getPropertyValue('--hero-pointer-tilt-x');
      return Number.parseFloat(value) || 0;
    });

    await page.mouse.move(200, 200);
    await page.mouse.move(880, 320);
    await page.waitForTimeout(150);

    const pointerTiltAfter = await page.evaluate(() => {
      const value = getComputedStyle(document.documentElement).getPropertyValue('--hero-pointer-tilt-x');
      return Number.parseFloat(value) || 0;
    });

    expect(Math.abs(pointerTiltAfter - pointerTiltBefore)).toBeGreaterThan(0.05);

    await page.evaluate(() => {
      window.__testVisualStateUpdates = 0;
      window.addEventListener('visualStateUpdate', () => {
        window.__testVisualStateUpdates += 1;
      });
    });

    const beforeOpacity = await page.evaluate(() => {
      const value = getComputedStyle(document.documentElement).getPropertyValue('--moire-opacity');
      return Number.parseFloat(value) || 0;
    });

    await page.evaluate(() => {
      const detail = {
        state: {
          intensity: 0.72,
          chaos: 0.38,
          speed: 0.9,
          hue: 210,
          rgbOffset: 0.0012,
          moireIntensity: 0.28,
        },
        multipliers: {
          mouseActivity: 1.1,
          scrollVelocity: 1.0,
          cardHover: 1.0,
          timeOfDay: 1.0,
          userEnergy: 0.88,
        },
        context: {
          section: 'hero',
          scroll: 0.1,
          userEnergy: 0.8,
          mouseActivity: 0.6,
          scrollVelocity: 0.3,
          hoveredCards: 0,
        },
      };
      window.dispatchEvent(new CustomEvent('visualStateUpdate', { detail }));
    });

    await page.waitForFunction(
      (initial) => {
        const value = Number.parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--moire-opacity')
        );
        return Number.isFinite(value) && value > initial + 0.01;
      },
      beforeOpacity,
      { timeout: 5_000 }
    );

    const eventCount = await page.evaluate(() => window.__testVisualStateUpdates || 0);
    expect(eventCount).toBeGreaterThanOrEqual(1);
  });
});
