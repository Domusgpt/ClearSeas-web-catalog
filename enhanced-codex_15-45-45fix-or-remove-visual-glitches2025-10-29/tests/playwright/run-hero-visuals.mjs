import { strict as assert } from 'node:assert';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Minimal DOM + RAF harness so we can exercise the hero choreography and
 * orchestrator logic without depending on Playwright binaries.
 */

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(handler);
  }

  removeEventListener(type, handler) {
    const bucket = this.listeners.get(type);
    if (bucket) {
      bucket.delete(handler);
      if (bucket.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  dispatchEvent(event) {
    if (!event || typeof event.type !== 'string') {
      return false;
    }

    const bucket = this.listeners.get(event.type);
    if (!bucket || bucket.size === 0) {
      return true;
    }

    for (const handler of Array.from(bucket)) {
      try {
        handler.call(this, event);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(`[FakeEventTarget] handler for "${event.type}" failed`, error);
      }
    }
    return true;
  }
}

class FakeClassList {
  constructor() {
    this._set = new Set();
  }

  add(...tokens) {
    tokens.forEach((token) => {
      if (typeof token === 'string' && token) {
        this._set.add(token);
      }
    });
  }

  remove(...tokens) {
    tokens.forEach((token) => {
      this._set.delete(token);
    });
  }

  toggle(token, force) {
    if (force === true) {
      this._set.add(token);
      return true;
    }
    if (force === false) {
      this._set.delete(token);
      return false;
    }
    if (this._set.has(token)) {
      this._set.delete(token);
      return false;
    }
    this._set.add(token);
    return true;
  }

  contains(token) {
    return this._set.has(token);
  }
}

class FakeStyle {
  constructor() {
    this._map = new Map();
  }

  setProperty(property, value) {
    if (typeof property !== 'string') {
      return;
    }
    const stringValue = typeof value === 'string' ? value : String(value);
    this._map.set(property, stringValue);
  }

  removeProperty(property) {
    this._map.delete(property);
  }

  getPropertyValue(property) {
    return this._map.get(property) ?? '';
  }
}

class FakeElement extends FakeEventTarget {
  constructor(options = {}) {
    super();
    this.nodeName = options.nodeName ?? 'DIV';
    this.dataset = { ...options.dataset };
    this.attributes = new Map();
    this.style = new FakeStyle();
    this.classList = new FakeClassList();
    this.children = options.children ? [...options.children] : [];
    this._selectorMap = options.selectorMap ?? new Map();
    this._textSelectorMap = options.textSelectorMap ?? new Map();
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    if (this.attributes.has(name)) {
      return this.attributes.get(name);
    }
    const dataKey = name.startsWith('data-') ? name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase()) : null;
    if (dataKey && this.dataset && dataKey in this.dataset) {
      return this.dataset[dataKey];
    }
    return null;
  }

  querySelector(selector) {
    if (this._selectorMap.has(selector)) {
      return this._selectorMap.get(selector) ?? null;
    }
    const results = this.querySelectorAll(selector);
    return results.length > 0 ? results[0] : null;
  }

  querySelectorAll(selector) {
    if (this._selectorMap.has(selector)) {
      const mapped = this._selectorMap.get(selector);
      if (!mapped) {
        return [];
      }
      return Array.isArray(mapped) ? mapped : [mapped];
    }
    if (this._textSelectorMap.has(selector)) {
      return this._textSelectorMap.get(selector) ?? [];
    }
    return this.children.flatMap((child) => child.querySelectorAll(selector));
  }
}

const createEvent = (type, props = {}) => ({ type, ...props });

const rafQueue = new Map();
let rafId = 1;
let currentTime = 0;

const requestAnimationFrame = (callback) => {
  const id = rafId += 1;
  rafQueue.set(id, callback);
  return id;
};

const cancelAnimationFrame = (id) => {
  rafQueue.delete(id);
};

const advanceFrame = (step = 16.67) => {
  currentTime += step;
  const callbacks = Array.from(rafQueue.values());
  rafQueue.clear();
  callbacks.forEach((callback) => {
    try {
      callback(currentTime);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[TestHarness] RAF callback failed', error);
    }
  });
};

const advanceFrames = (count, step = 16.67) => {
  for (let index = 0; index < count; index += 1) {
    if (rafQueue.size === 0 && index > 8) {
      break;
    }
    advanceFrame(step);
  }
};

const registerSelectors = (documentStub, map) => {
  documentStub.__selectorRegistry = map;
};

const setupGlobalEnvironment = () => {
  const windowTarget = new FakeEventTarget();
  const documentTarget = new FakeEventTarget();

  const documentElement = new FakeElement({ nodeName: 'HTML' });
  documentElement.scrollHeight = 4000;
  const body = new FakeElement({ nodeName: 'BODY' });

  documentElement.style.setProperty('--hero-pointer-tilt-x', '0');
  documentElement.style.setProperty('--hero-pointer-tilt-y', '0');
  documentElement.style.setProperty('--moire-opacity', '0.2');

  body.dataset = {};

  Object.assign(documentTarget, {
    documentElement,
    body,
    hidden: false,
    addEventListener: documentTarget.addEventListener.bind(documentTarget),
    removeEventListener: documentTarget.removeEventListener.bind(documentTarget),
    dispatchEvent: documentTarget.dispatchEvent.bind(documentTarget),
    querySelector(selector) {
      const registry = this.__selectorRegistry || {};
      const value = registry[selector];
      if (!value) {
        return null;
      }
      if (Array.isArray(value)) {
        return value[0] ?? null;
      }
      return value ?? null;
    },
    querySelectorAll(selector) {
      const registry = this.__selectorRegistry || {};
      const value = registry[selector];
      if (!value) {
        return [];
      }
      return Array.isArray(value) ? value.slice() : [value];
    },
  });

  const heroText = new FakeElement({ nodeName: 'DIV' });
  const heroSection = new FakeElement({
    nodeName: 'SECTION',
    dataset: { section: 'hero' },
    selectorMap: new Map([
      ['.hero-text', heroText],
      ['[data-visualizer-card]', []],
    ]),
  });

  const cards = Array.from({ length: 3 }, (_, index) => {
    const card = new FakeElement({ nodeName: 'ARTICLE' });
    card.setAttribute('data-scroll-card-depth', (index + 1).toString());
    return card;
  });

  heroSection._selectorMap.set('[data-visualizer-card]', cards);

  const moireLayer = new FakeElement({ nodeName: 'DIV', dataset: { moireLayer: '' } });
  const sections = [heroSection];

  const selectorRegistry = {
    '[data-moire-layer]': [moireLayer],
    '[data-section]': sections,
    '.card, .signal-card': cards,
    '.card': cards,
    '.signal-card': [],
    '[data-scroll-scene="hero"]': [heroSection],
    '[data-visualizer-card]': cards,
  };

  registerSelectors(documentTarget, selectorRegistry);

  cards.forEach((card) => {
    card.classList.add('card');
  });

  documentTarget.documentElement = documentElement;
  documentTarget.body = body;
  selectorRegistry['[data-scroll-scene="hero"]'][0].querySelector = heroSection.querySelector.bind(heroSection);

  windowTarget.innerWidth = 1280;
  windowTarget.innerHeight = 720;
  windowTarget.pageYOffset = 0;
  windowTarget.addEventListener = windowTarget.addEventListener.bind(windowTarget);
  windowTarget.removeEventListener = windowTarget.removeEventListener.bind(windowTarget);
  windowTarget.dispatchEvent = windowTarget.dispatchEvent.bind(windowTarget);
  windowTarget.requestAnimationFrame = requestAnimationFrame;
  windowTarget.cancelAnimationFrame = cancelAnimationFrame;
  windowTarget.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

  class CustomEventPolyfill {
    constructor(type, params = {}) {
      this.type = type;
      this.detail = params.detail;
    }
  }

  windowTarget.CustomEvent = CustomEventPolyfill;
  globalThis.CustomEvent = CustomEventPolyfill;

  windowTarget.Lenis = class {
    constructor() {
      this.scroll = { value: 0, instance: { scroll: 0 } };
      this.listeners = new Map();
    }

    on(event, handler) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event).add(handler);
    }

    off(event, handler) {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(handler);
      }
    }

    raf() {}

    destroy() {
      this.listeners.clear();
    }
  };

  const gsapUtils = {
    toArray(selector) {
      return documentTarget.querySelectorAll(selector);
    },
    clamp(min, max, value) {
      return Math.min(max, Math.max(min, value));
    },
  };

  windowTarget.gsap = {
    utils: gsapUtils,
    timeline(config = {}) {
      const timeline = {
        scrollTrigger: config.scrollTrigger
          ? { ...config.scrollTrigger, isActive: true, kill() {} }
          : null,
        add() { return this; },
        addLabel() { return this; },
        from() { return this; },
        to() { return this; },
        fromTo() { return this; },
        eventCallback() { return this; },
        kill() {},
        progress(value) {
          if (typeof value === 'number') {
            this._progress = value;
            return this;
          }
          return this._progress ?? 0;
        },
      };
      return timeline;
    },
    registerPlugin() {},
    set() {},
  };

  class FakeIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe(target) {
      this.target = target;
    }

    unobserve() {}

    disconnect() {}

    trigger(entry) {
      if (typeof this.callback === 'function') {
        this.callback([entry]);
      }
    }
  }

  windowTarget.ScrollTrigger = {
    addEventListener() {},
    removeEventListener() {},
    matchMedia() { return { add() {}, revert() {} }; },
    scrollerProxy() {},
    defaults() {},
    refresh() {},
    getAll() { return []; },
  };

  windowTarget.IntersectionObserver = FakeIntersectionObserver;

  windowTarget.__CLEAR_SEAS_POLYTOPAL = {
    setPreset() {},
    setMorphProgress() {},
    transitionTo() {},
  };

  const performanceStub = {
    now: () => currentTime,
  };

  const getComputedStyle = (element) => ({
    getPropertyValue(property) {
      return element?.style?.getPropertyValue(property) ?? '';
    },
  });

  globalThis.window = windowTarget;
  globalThis.document = documentTarget;
  globalThis.performance = performanceStub;
  globalThis.requestAnimationFrame = requestAnimationFrame;
  globalThis.cancelAnimationFrame = cancelAnimationFrame;
  globalThis.getComputedStyle = getComputedStyle;
  globalThis.IntersectionObserver = FakeIntersectionObserver;

  return {
    window: windowTarget,
    document: documentTarget,
    documentElement,
    body,
    moireLayer,
    cards,
    heroSection,
  };
};

const fireMouseEvent = (documentStub, windowStub, type, props) => {
  const event = createEvent(type, props);
  documentStub.dispatchEvent(event);
  windowStub.dispatchEvent(event);
};

const fireScrollEvent = (windowStub, value) => {
  windowStub.pageYOffset = value;
  windowStub.dispatchEvent(createEvent('scroll'));
};

const run = async () => {
  const harness = setupGlobalEnvironment();
  const currentDir = dirname(fileURLToPath(import.meta.url));

  const heroScriptPath = pathToFileURL(resolve(currentDir, '../../scripts/scroll-choreography-phase1.js'));
  await import(heroScriptPath);

  const orchestratorModulePath = pathToFileURL(resolve(currentDir, '../../src/js/managers/VisualOrchestrator.js'));
  const { VisualOrchestrator } = await import(orchestratorModulePath);

  const orchestrator = new VisualOrchestrator({});

  advanceFrames(6);

  const initialTilt = parseFloat(
    harness.documentElement.style.getPropertyValue('--hero-pointer-tilt-x') || '0'
  );

  fireMouseEvent(harness.document, harness.window, 'mousemove', { clientX: 320, clientY: 180 });
  advanceFrames(4);
  fireMouseEvent(harness.document, harness.window, 'mousemove', { clientX: 960, clientY: 360 });
  advanceFrames(18);

  const updatedTilt = parseFloat(
    harness.documentElement.style.getPropertyValue('--hero-pointer-tilt-x') || '0'
  );

  assert.ok(
    Number.isFinite(updatedTilt) && Math.abs(updatedTilt - initialTilt) > 0.05,
    `Pointer tilt should react to mouse activity (initial: ${initialTilt}, updated: ${updatedTilt})`
  );

  fireScrollEvent(harness.window, 240);
  advanceFrames(10);

  const beforeOpacity = parseFloat(
    harness.documentElement.style.getPropertyValue('--moire-opacity') || '0'
  );

  let receivedStateUpdates = 0;
  harness.window.addEventListener('visualStateUpdate', () => {
    receivedStateUpdates += 1;
  });

  const detail = {
    state: {
      intensity: 0.78,
      chaos: 0.32,
      speed: 0.82,
      hue: 210,
      rgbOffset: 0.0011,
      moireIntensity: 0.24,
    },
    multipliers: {
      mouseActivity: 1.08,
      scrollVelocity: 0.94,
      cardHover: 1.0,
      timeOfDay: 1.0,
      userEnergy: 0.92,
    },
    context: {
      section: 'hero',
      scroll: 0.12,
      userEnergy: 0.74,
      mouseActivity: 0.68,
      scrollVelocity: 0.42,
      hoveredCards: 0,
    },
  };

  harness.window.dispatchEvent(new harness.window.CustomEvent('visualStateUpdate', { detail }));

  advanceFrames(40);

  const afterOpacity = parseFloat(
    harness.documentElement.style.getPropertyValue('--moire-opacity') || '0'
  );

  assert.ok(
    Number.isFinite(afterOpacity) && afterOpacity > beforeOpacity + 0.01,
    `Moire opacity should increase after broadcast (before: ${beforeOpacity}, after: ${afterOpacity})`
  );

  assert.ok(receivedStateUpdates >= 1, 'Visual state update listener should be notified');

  orchestrator.manager = null; // hint for GC
};

run()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
    process.exit(1);
  });
