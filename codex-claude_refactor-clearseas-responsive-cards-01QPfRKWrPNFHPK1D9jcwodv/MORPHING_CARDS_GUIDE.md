# Responsive Morphing Cards System

## Overview

The Responsive Morphing Cards system is inspired by the [minoots-web](https://domusgpt.github.io/minoots-web/) intelligent card design, integrated with Clear Seas Solutions' dynamic visualizer parameter sweep system.

## Features

✨ **Circular to Expanded Transformations**
- Cards start as circular elements (420px × 420px)
- Smoothly morph into expanded layouts (up to 1300px wide) on hover/focus
- Organic cubic-bezier transitions (1.4s duration)

🎨 **Visualizer Integration**
- Cards respond to real-time visual parameters: `--visual-hue`, `--visual-intensity`, `--visual-energy`, `--visual-chaos`
- Dynamic glow effects driven by user interaction
- RGB chromatic aberration on high energy states
- Moiré pattern overlays that respond to scroll velocity

📱 **Fully Responsive**
- **Desktop (1200px+)**: Full morphing behavior with two-column expanded layouts
- **Tablet (768px-1200px)**: Single-column expanded layouts, reduced card sizes
- **Mobile (<768px)**: Optimized smaller cards, simplified transforms for performance

♿ **Accessible**
- Keyboard navigation support (tabindex, focus states)
- Reduced motion respect for accessibility preferences
- Clear focus indicators
- Semantic HTML structure

## Basic Usage

### HTML Structure

```html
<article class="morph-card" data-fractal-card tabindex="0">
  <div class="morph-card__content">
    <div class="morph-card__header">
      <div class="morph-card__icon">
        <!-- SVG icon here -->
      </div>
      <h3 class="morph-card__title">Card Title</h3>
    </div>
    <div>
      <p class="morph-card__description">
        Brief description shown in circular state
      </p>
      <div class="morph-card__details">
        <div class="morph-card__features">
          <div class="morph-card__feature">
            <h4>Feature Title</h4>
            <p>Feature description</p>
          </div>
          <!-- More features -->
        </div>
      </div>
    </div>
  </div>
</article>
```

### Grid Container

```html
<div class="morph-cards-grid">
  <!-- Multiple morph-card elements -->
</div>
```

## Integration with Existing Cards

You can apply morphing behavior to existing card classes by adding the `morph` class:

```html
<!-- Capability cards -->
<article class="capability-card morph-card" data-fractal-card>
  <!-- Content -->
</article>

<!-- Platform cards -->
<article class="platform-card morph-card" data-fractal-card>
  <!-- Content -->
</article>

<!-- Signal cards -->
<article class="signal-card morph-card" data-fractal-card>
  <!-- Content -->
</article>
```

## Visualizer Parameter Integration

The morphing cards system is tightly integrated with the Visual Orchestrator, which manages these CSS custom properties:

### Available Visual Parameters

```css
--visual-hue          /* 0-360deg, changes based on section and mouse position */
--visual-intensity    /* 0-1, modulated by user activity and section */
--visual-energy       /* 0-1, tracks user engagement (mouse, scroll) */
--visual-chaos        /* 0-1, increases with interaction, affects rotation jitter */
--visual-speed        /* 0-2, animation speed multiplier */
--visual-rgb-offset   /* 0-0.02, chromatic aberration amount */
--visual-moire        /* 0-1, moiré pattern intensity */
```

### How Cards Use These Parameters

1. **Glow Effects**: Cards pulse with `--visual-intensity` and `--visual-energy`
   ```css
   box-shadow: 0 0 calc(20px + var(--visual-energy) * 40px) hsla(var(--visual-hue), 80%, 60%, ...);
   ```

2. **Color Shifts**: Border and glow colors follow `--visual-hue`
   ```css
   border-color: hsla(var(--visual-hue), 80%, 60%, ...);
   ```

3. **Chaos Rotation**: Subtle rotation jitter based on `--visual-chaos`
   ```css
   transform: ... rotate(calc(var(--visual-chaos) * 2deg - 1deg));
   ```

4. **RGB Aberration**: Chromatic split effect on high `--visual-rgb-offset`
   - Creates ghost copy of card with screen blend mode
   - Offset increases with mouse velocity

5. **Moiré Overlay**: Pattern intensity scales with `--visual-moire`
   - Increases during scroll
   - Rotates with chaos parameter

## Responsive Breakpoints

### Desktop (1200px+)
- Full circular cards: 420px × 420px
- Expanded: up to 1300px wide
- Two-column grid in expanded state
- Full 3D transforms and effects

### Tablet (768px - 1200px)
- Circular cards: 340px × 340px
- Expanded: up to 1100px wide
- Single-column grid in expanded state
- Reduced gaps and padding

### Mobile (<768px)
- Circular cards: 300px × 300px
- Expanded: up to 500px wide
- Single-column layouts
- Simplified transforms (no 3D rotation)
- Smaller icons and reduced padding

## Advanced Features

### Sticky Positioning (Minoots-style)

```html
<article class="morph-card sticky" data-fractal-card>
  <!-- Content -->
</article>
```

Cards with the `sticky` class will stick to the top of the viewport as you scroll (disabled on mobile).

### Manual Expansion State

```html
<article class="morph-card is-expanded" data-fractal-card>
  <!-- Content -->
</article>
```

Add `is-expanded` class to force a card into expanded state (useful for JavaScript-controlled states).

### Feature Grid Customization

The expanded cards use an auto-fit grid for features:

```css
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
```

This automatically adjusts the number of columns based on available space while maintaining minimum readable width.

## Performance Considerations

1. **Reduced Motion**: The system respects `prefers-reduced-motion` and disables animations
2. **Mobile Optimization**: 3D transforms are removed on mobile for better performance
3. **GPU Acceleration**: Transforms use `translateY` and `scale` for hardware acceleration
4. **Lazy Effects**: Moiré and RGB aberration effects only activate when visual parameters exceed thresholds

## Accessibility

- All cards have `tabindex="0"` for keyboard navigation
- Focus states trigger the same morphing as hover
- Clear focus indicators with visualizer-colored outlines
- Semantic heading hierarchy maintained
- No information is hidden from screen readers

## Section-Based Visual Profiles

The Visual Orchestrator changes parameters based on the current section:

| Section      | Hue | Intensity | Chaos | Form    |
|--------------|-----|-----------|-------|---------|
| Hero         | 180 | 0.52      | 0.12  | Lattice |
| Capabilities | 200 | 0.58      | 0.08  | Crystal |
| Research     | 240 | 0.62      | 0.22  | Nebula  |
| Platforms    | 160 | 0.68      | 0.18  | Vortex  |

Cards automatically inherit these visual themes as users scroll through sections.

## Example: Complete Card

```html
<article class="morph-card" data-fractal-card tabindex="0">
  <div class="morph-card__content">
    <div class="morph-card__header">
      <div class="morph-card__icon">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <path d="M50 10L80 30V70L50 90L20 70V30L50 10Z"
                stroke="currentColor"
                stroke-width="2"
                fill="rgba(0, 212, 255, 0.1)"/>
        </svg>
      </div>
      <h3 class="morph-card__title">Spatial AI & Robotics</h3>
    </div>
    <div>
      <p class="morph-card__description">
        Advanced perception systems for GPS-denied navigation,
        autonomous vehicles, and XR devices.
      </p>
      <div class="morph-card__details">
        <div class="morph-card__features">
          <div class="morph-card__feature">
            <h4>4D State Representation</h4>
            <p>Quaternion-based spatial tracking with temporal braiding.</p>
          </div>
          <div class="morph-card__feature">
            <h4>Visual-Inertial Odometry</h4>
            <p>Fused sensor data for precise localization.</p>
          </div>
          <div class="morph-card__feature">
            <h4>Embodied AI Platforms</h4>
            <p>Full-stack robotics integration.</p>
          </div>
        </div>
        <a href="#" class="btn btn-primary" style="margin-top: 2rem;">
          Learn More →
        </a>
      </div>
    </div>
  </div>
</article>
```

## Browser Support

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **CSS Grid**: Required for layout
- **CSS Custom Properties**: Required for visualizer integration
- **Backdrop Filter**: Optional (graceful degradation)
- **Intersection Observer**: Used for section detection (polyfill available)

## Credits

- **Design Inspiration**: [minoots-web](https://domusgpt.github.io/minoots-web/) intelligent card system
- **Visualizer Integration**: Clear Seas Solutions Visual Orchestrator
- **Author**: Paul Phillips - paul@clearseassolutions.com
- **License**: © 2025 Clear Seas Solutions

---

**"The Revolution Will Not Be In A Structured Format"** 🌟
