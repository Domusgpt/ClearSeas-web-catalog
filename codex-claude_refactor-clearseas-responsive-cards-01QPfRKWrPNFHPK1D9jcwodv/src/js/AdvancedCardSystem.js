/**
 * ADVANCED CARD SYSTEM WITH CHOREOGRAPHED VISUALIZER EVENTS
 * Each card has unique behavioral profiles and orchestrated sequences
 */

export class AdvancedCardSystem {
  constructor() {
    this.cards = new Map();
    this.lockedCard = null;
    this.backdrop = null;
    this.splitContainer = null;
    this.initialized = false;
    this.activeChoreography = null;

    // CARD-SPECIFIC CHOREOGRAPHY PROFILES
    this.cardProfiles = {
      // Spatial AI - Geometric precision, crystalline patterns - 3X MORE DRAMATIC
      'spatial-ai': {
        lock: {
          sequence: [
            { time: 0, intensity: 0.2, chaos: 0.01, speed: 0.15, hue: 175, rgbOffset: 0.0005, moireIntensity: 0.02, description: 'Gentle entry' },
            { time: 250, intensity: 0.85, chaos: 0.15, speed: 0.75, hue: 190, rgbOffset: 0.008, moireIntensity: 0.25, description: 'Crystal formation BURST' },
            { time: 500, intensity: 1.0, chaos: 0.25, speed: 1.1, hue: 200, rgbOffset: 0.012, moireIntensity: 0.45, description: 'Peak complexity EXPLOSION' },
            { time: 1000, intensity: 0.7, chaos: 0.08, speed: 0.4, hue: 185, rgbOffset: 0.003, moireIntensity: 0.12, description: 'Settle into focus' }
          ],
          moirePattern: 'crystalline',
          particleMode: 'geometric'
        },
        split: {
          sequence: [
            { time: 0, intensity: 0.7, chaos: 0.3, speed: 1.2, hue: 175, moireIntensity: 0.3, description: 'Fragmentation BEGINS' },
            { time: 150, intensity: 1.0, chaos: 0.8, speed: 2.5, hue: 205, moireIntensity: 0.75, description: 'EXPLOSIVE dispersion' },
            { time: 400, intensity: 0.8, chaos: 0.4, speed: 1.5, hue: 185, moireIntensity: 0.4, description: 'Segments stabilize' }
          ],
          splitEffect: 'shatter'
        }
      },

      // Embodied AI - Organic flows, neural networks - 3X MORE DRAMATIC
      'embodied-ai': {
        lock: {
          sequence: [
            { time: 0, intensity: 0.5, chaos: 0.4, speed: 0.9, hue: 200, rgbOffset: 0.004, moireIntensity: 0.08, description: 'Neural awakening SURGE' },
            { time: 400, intensity: 1.0, chaos: 0.85, speed: 2.2, hue: 210, rgbOffset: 0.015, moireIntensity: 0.65, description: 'EXPLOSIVE synaptic storm' },
            { time: 800, intensity: 0.95, chaos: 0.7, speed: 1.8, hue: 205, rgbOffset: 0.011, moireIntensity: 0.5, description: 'Network THRASHING' },
            { time: 1400, intensity: 0.75, chaos: 0.35, speed: 0.95, hue: 202, rgbOffset: 0.005, moireIntensity: 0.2, description: 'Intense thinking state' }
          ],
          moirePattern: 'organic',
          particleMode: 'neural'
        },
        takeover: {
          sequence: [
            { time: 0, intensity: 0.8, chaos: 0.4, speed: 1.1, hue: 200, moireIntensity: 0.3, description: 'Aggressive expansion' },
            { time: 300, intensity: 1.0, chaos: 0.55, speed: 0.85, hue: 205, moireIntensity: 0.45, description: 'TOTAL immersion' }
          ]
        }
      },

      // Perception Systems - Wavelike, scanning patterns - 3X MORE DRAMATIC
      'perception': {
        lock: {
          sequence: [
            { time: 0, intensity: 0.4, chaos: 0.12, speed: 0.6, hue: 240, rgbOffset: 0.002, moireIntensity: 0.05, description: 'Scan initialization PULSE' },
            { time: 250, intensity: 0.85, chaos: 0.35, speed: 1.5, hue: 250, rgbOffset: 0.012, moireIntensity: 0.4, description: 'INTENSE scanning waves' },
            { time: 500, intensity: 1.0, chaos: 0.65, speed: 2.0, hue: 245, rgbOffset: 0.018, moireIntensity: 0.7, description: 'DEEP perception OVERLOAD' },
            { time: 1000, intensity: 0.8, chaos: 0.25, speed: 0.95, hue: 242, rgbOffset: 0.007, moireIntensity: 0.3, description: 'High-intensity processing' }
          ],
          moirePattern: 'wave',
          particleMode: 'scan'
        }
      },

      // Research Innovation - Chaotic discovery, explosive creativity - 3X MORE DRAMATIC
      'research': {
        lock: {
          sequence: [
            { time: 0, intensity: 0.6, chaos: 0.55, speed: 1.3, hue: 240, rgbOffset: 0.009, moireIntensity: 0.15, description: 'Exploration ERUPTS' },
            { time: 350, intensity: 1.0, chaos: 0.95, speed: 2.8, hue: 255, rgbOffset: 0.022, moireIntensity: 0.85, description: 'MASSIVE discovery explosion' },
            { time: 700, intensity: 1.0, chaos: 1.0, speed: 3.2, hue: 250, rgbOffset: 0.028, moireIntensity: 0.95, description: 'SUPERNOVA innovation peak' },
            { time: 1300, intensity: 0.9, chaos: 0.7, speed: 1.8, hue: 245, rgbOffset: 0.014, moireIntensity: 0.55, description: 'Intense insight crystallization' }
          ],
          moirePattern: 'chaos',
          particleMode: 'explosion'
        },
        split: {
          sequence: [
            { time: 0, intensity: 0.9, chaos: 0.75, speed: 2.0, hue: 240, moireIntensity: 0.5, description: 'VIOLENT idea fragmentation' },
            { time: 250, intensity: 1.0, chaos: 1.0, speed: 3.5, hue: 260, moireIntensity: 0.9, description: 'NUCLEAR creative burst' },
            { time: 600, intensity: 0.95, chaos: 0.85, speed: 2.5, hue: 250, moireIntensity: 0.65, description: 'EXTREME multi-threaded thinking' }
          ],
          splitEffect: 'burst'
        },
        takeover: {
          sequence: [
            { time: 0, intensity: 0.9, chaos: 0.65, speed: 1.8, hue: 240, moireIntensity: 0.45, description: 'AGGRESSIVE research mode' },
            { time: 400, intensity: 1.0, chaos: 0.55, speed: 1.4, hue: 245, moireIntensity: 0.6, description: 'EXTREME deep focus' }
          ]
        }
      },

      // Platform Engineering - Rhythmic, systematic, pulsing - 3X MORE DRAMATIC
      'platform': {
        lock: {
          sequence: [
            { time: 0, intensity: 0.55, chaos: 0.22, speed: 0.9, hue: 160, rgbOffset: 0.005, moireIntensity: 0.1, description: 'RAPID system initialization' },
            { time: 300, intensity: 0.9, chaos: 0.45, speed: 1.8, hue: 165, rgbOffset: 0.013, moireIntensity: 0.5, description: 'INTENSE build process' },
            { time: 600, intensity: 1.0, chaos: 0.6, speed: 2.2, hue: 170, rgbOffset: 0.017, moireIntensity: 0.7, description: 'EXPLOSIVE deployment' },
            { time: 1100, intensity: 0.85, chaos: 0.35, speed: 1.3, hue: 163, rgbOffset: 0.008, moireIntensity: 0.35, description: 'HIGH-POWER steady state' }
          ],
          moirePattern: 'pulse',
          particleMode: 'systematic'
        },
        split: {
          sequence: [
            { time: 0, intensity: 0.85, chaos: 0.4, speed: 1.6, hue: 160, moireIntensity: 0.35, description: 'AGGRESSIVE microservices split' },
            { time: 300, intensity: 1.0, chaos: 0.75, speed: 2.8, hue: 170, moireIntensity: 0.8, description: 'MASSIVE distributed activation' },
            { time: 700, intensity: 0.9, chaos: 0.5, speed: 1.9, hue: 165, moireIntensity: 0.5, description: 'POWER service mesh' }
          ],
          splitEffect: 'distribute'
        }
      },

      // Engagement - Warm, inviting, flow states - 3X MORE DRAMATIC
      'engagement': {
        lock: {
          sequence: [
            { time: 0, intensity: 0.65, chaos: 0.4, speed: 1.2, hue: 300, rgbOffset: 0.007, moireIntensity: 0.15, description: 'POWERFUL invitation' },
            { time: 350, intensity: 0.95, chaos: 0.65, speed: 2.0, hue: 310, rgbOffset: 0.014, moireIntensity: 0.6, description: 'INTENSE connection surge' },
            { time: 750, intensity: 1.0, chaos: 0.7, speed: 1.8, hue: 305, rgbOffset: 0.011, moireIntensity: 0.75, description: 'EXTREME flow state' }
          ],
          moirePattern: 'flow',
          particleMode: 'warm'
        }
      }
    };

    console.log('🎯 AdvancedCardSystem with Choreography initialized');
  }

  init() {
    if (this.initialized) {
      console.warn('⚠️ AdvancedCardSystem already initialized');
      return;
    }

    console.log('🎯 AdvancedCardSystem initializing...');

    this.createBackdrop();
    this.createSplitContainer();
    this.setupCards();

    this.initialized = true;
    console.log('✅ AdvancedCardSystem initialized with choreographed profiles');
  }

  createBackdrop() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'card-lock-backdrop';
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.unlockCard();
      }
    });
    document.body.appendChild(this.backdrop);
  }

  createSplitContainer() {
    this.splitContainer = document.createElement('div');
    this.splitContainer.className = 'card-split-container';
    document.body.appendChild(this.splitContainer);
  }

  setupCards() {
    const cards = document.querySelectorAll('.neo-morph-card');
    console.log(`🔍 Found ${cards.length} cards`);

    if (cards.length === 0) {
      console.warn('⚠️ No .neo-morph-card elements found!');
      return;
    }

    cards.forEach((card, index) => {
      const cardId = `card-${index}`;
      card.dataset.cardId = cardId;

      const behaviorMode = card.dataset.behavior || 'expand';
      const cardType = card.dataset.cardType || this.inferCardType(card);

      // Set card type for CSS animations
      card.dataset.cardType = cardType;
      card.dataset.choreographyActive = 'false';

      console.log(`  Card ${index}: type=${cardType}, behavior=${behaviorMode}`);

      // Add close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'card-close-btn';
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Close card');
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.unlockCard();
      });
      card.appendChild(closeBtn);

      // Setup click handler
      card.addEventListener('click', (e) => {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a, button')) {
          return;
        }

        if (!card.classList.contains('is-locked')) {
          console.log(`🖱️ Card ${index} (${cardType}) clicked`);
          this.lockCard(card, behaviorMode, cardType);
        }
      });

      // Store card data
      this.cards.set(cardId, {
        element: card,
        behaviorMode,
        cardType,
        index
      });
    });

    console.log(`✅ ${this.cards.size} cards configured with choreography`);
  }

  inferCardType(card) {
    // Infer card type from content
    const title = card.querySelector('.morph-card__title')?.textContent?.toLowerCase() || '';

    if (title.includes('spatial') || title.includes('robotics')) return 'spatial-ai';
    if (title.includes('embodied') || title.includes('platform')) return 'embodied-ai';
    if (title.includes('perception') || title.includes('vision')) return 'perception';
    if (title.includes('research') || title.includes('innovation')) return 'research';
    if (title.includes('platform') || title.includes('engineering')) return 'platform';
    if (title.includes('engagement') || title.includes('contact')) return 'engagement';

    return 'spatial-ai'; // default
  }

  lockCard(card, behaviorMode = 'expand', cardType = 'spatial-ai') {
    if (this.lockedCard) {
      console.warn('⚠️ Card already locked, unlocking first');
      this.unlockCard();
      return;
    }

    console.log(`🔒 Locking ${cardType} card with mode: ${behaviorMode}`);

    this.lockedCard = card;

    // Freeze scroll
    document.body.classList.add('card-locked');
    document.body.dataset.cardState = 'locked';

    // Show backdrop
    this.backdrop.classList.add('is-visible');

    // Lock the card
    card.classList.add('is-locked');

    // Get card profile and start choreographed sequence
    const profile = this.cardProfiles[cardType] || this.cardProfiles['spatial-ai'];
    const lockProfile = profile.lock || profile;

    // Execute choreographed sequence
    this.executeChoreography(lockProfile.sequence, cardType);

    // Dispatch event
    window.dispatchEvent(new CustomEvent('cardLocked', {
      detail: { card, mode: behaviorMode, type: cardType }
    }));

    // Handle behavior mode after lock animation
    if (behaviorMode !== 'expand') {
      setTimeout(() => {
        switch (behaviorMode) {
          case 'split':
            this.splitCard(card, cardType);
            break;
          case 'takeover':
            this.takeoverCard(card, cardType);
            break;
        }
      }, 800);
    }
  }

  executeChoreography(sequence, cardType) {
    console.log(`🎭 Executing choreography for ${cardType}:`, sequence);

    // Cancel any active choreography
    if (this.activeChoreography) {
      this.activeChoreography.forEach(timeout => clearTimeout(timeout));
    }

    this.activeChoreography = [];

    // Activate CSS choreography animation on locked card
    if (this.lockedCard) {
      this.lockedCard.dataset.choreographyActive = 'true';
      this.lockedCard.dataset.cardType = cardType;
      console.log(`  🎨 Activated CSS choreography for ${cardType}`);
    }

    // Execute each step in the sequence
    sequence.forEach((step, index) => {
      const timeout = setTimeout(() => {
        console.log(`  🎬 Step ${index + 1}: ${step.description}`);

        // Notify visualizer with this step's parameters
        this.notifyVisualizer('choreography-step', {
          step: index,
          total: sequence.length,
          ...step,
          cardType
        });
      }, step.time);

      this.activeChoreography.push(timeout);
    });
  }

  unlockCard() {
    if (!this.lockedCard) {
      return;
    }

    console.log('🔓 Unlocking card');

    // Cancel choreography
    if (this.activeChoreography) {
      this.activeChoreography.forEach(timeout => clearTimeout(timeout));
      this.activeChoreography = null;
    }

    const card = this.lockedCard;

    // Deactivate CSS choreography animation
    card.dataset.choreographyActive = 'false';
    console.log('  🎨 Deactivated CSS choreography');

    // Exit any special modes
    if (card.classList.contains('is-takeover')) {
      card.classList.remove('is-takeover');
    }

    if (this.splitContainer.classList.contains('is-visible')) {
      this.exitSplitMode();
    }

    // Unlock card
    card.classList.remove('is-locked');

    // Hide backdrop
    this.backdrop.classList.remove('is-visible');

    // Restore scroll
    document.body.classList.remove('card-locked');
    document.body.dataset.cardState = 'normal';

    // Notify visualizer
    this.notifyVisualizer('unlock', {});

    // Dispatch event
    window.dispatchEvent(new CustomEvent('cardUnlocked', {
      detail: { card }
    }));

    this.lockedCard = null;
  }

  splitCard(card, cardType = 'spatial-ai') {
    console.log(`🔀 Splitting ${cardType} card`);

    document.body.dataset.cardState = 'splitting';

    // Get features
    const features = card.querySelectorAll('.morph-card__feature');
    if (features.length === 0) {
      console.warn('⚠️ No features found to split');
      return;
    }

    console.log(`  Found ${features.length} features to split`);

    // Hide locked card
    card.style.opacity = '0';

    // Create split segments
    this.splitContainer.innerHTML = '';

    features.forEach((feature, index) => {
      const segment = document.createElement('div');
      segment.className = 'split-card-segment';

      // Clone feature content
      const h4 = feature.querySelector('h4');
      const p = feature.querySelector('p');

      if (h4) {
        const title = document.createElement('h3');
        title.textContent = h4.textContent;
        title.style.cssText = 'font-size: 1.75rem; margin-bottom: 1.5rem; color: rgba(255,255,255,0.95);';
        segment.appendChild(title);
      }

      if (p) {
        const desc = document.createElement('p');
        desc.textContent = p.textContent;
        desc.style.cssText = 'font-size: 1.1rem; line-height: 1.7; color: rgba(255,255,255,0.8);';
        segment.appendChild(desc);
      }

      this.splitContainer.appendChild(segment);
    });

    // Add close button to split container
    const closeBtn = document.createElement('button');
    closeBtn.className = 'card-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = 'position: fixed; top: 2rem; right: 2rem; z-index: 10002;';
    closeBtn.addEventListener('click', () => this.unlockCard());
    this.splitContainer.appendChild(closeBtn);

    // Show split container
    setTimeout(() => {
      this.splitContainer.classList.add('is-visible');
    }, 100);

    // Execute split choreography
    const profile = this.cardProfiles[cardType] || this.cardProfiles['spatial-ai'];
    const splitProfile = profile.split;

    if (splitProfile && splitProfile.sequence) {
      this.executeChoreography(splitProfile.sequence, cardType);
    }
  }

  exitSplitMode() {
    console.log('🔀 Exiting split mode');

    this.splitContainer.classList.remove('is-visible');

    // Restore card opacity
    if (this.lockedCard) {
      this.lockedCard.style.opacity = '1';
    }

    setTimeout(() => {
      this.splitContainer.innerHTML = '';
    }, 600);
  }

  takeoverCard(card, cardType = 'spatial-ai') {
    console.log(`🎬 Takeover mode: ${cardType}`);

    document.body.dataset.cardState = 'takeover';
    card.classList.add('is-takeover');

    // Execute takeover choreography
    const profile = this.cardProfiles[cardType] || this.cardProfiles['spatial-ai'];
    const takeoverProfile = profile.takeover;

    if (takeoverProfile && takeoverProfile.sequence) {
      this.executeChoreography(takeoverProfile.sequence, cardType);
    } else {
      // Fallback if no takeover profile
      this.notifyVisualizer('takeover', {
        intensity: 0.95,
        chaos: 0.2,
        speed: 0.4,
        cardType
      });
    }
  }

  notifyVisualizer(event, params) {
    console.log(`🎨 Notifying visualizer: ${event}`, params);

    // Dispatch event
    window.dispatchEvent(new CustomEvent('cardSystemEvent', {
      detail: { event, params }
    }));
  }

  dispose() {
    if (this.backdrop) {
      this.backdrop.remove();
    }
    if (this.splitContainer) {
      this.splitContainer.remove();
    }
    if (this.activeChoreography) {
      this.activeChoreography.forEach(timeout => clearTimeout(timeout));
    }
    this.cards.clear();
    this.initialized = false;
    console.log('🗑️ AdvancedCardSystem disposed');
  }
}

// Initialize when DOM is ready
function initAdvancedCardSystem() {
  console.log('🚀 initAdvancedCardSystem called');

  setTimeout(() => {
    if (!window.advancedCardSystem) {
      window.advancedCardSystem = new AdvancedCardSystem();
      window.advancedCardSystem.init();
    }
  }, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdvancedCardSystem);
} else {
  initAdvancedCardSystem();
}

export default AdvancedCardSystem;
