# 🧪 Orchestration System Testing Guide

## Quick Test

1. **Open the test page:**
   - Navigate to `test-orchestration.html` in your browser
   - Click "Run All Tests" button
   - All tests should show green status indicators

2. **Check browser console:**
   - Press F12 to open DevTools
   - Look for these messages:
   ```
   ✅ All libraries loaded successfully
   🎭 ORCHESTRATION: Complete! All animations initialized
   🎴 VIB3+ CARDS: Complete! Listening to X cards
   🧲 CURSOR: Complete! Tracking X elements
   🎨 CANVAS: Complete! Animating X nodes at 60fps
   ```

3. **Visual Tests:**

### Test 1: Smooth Scrolling
- **What to test:** Scroll the page up and down
- **Expected:** Smooth momentum scrolling with easing (not instant jumps)
- **Pass criteria:** Scrolling feels like butter, has momentum

### Test 2: VIB3+ Card Interactions
- **What to test:** Hover over any card (signal-card, platform-card, etc.)
- **Expected:**
  - Card tilts in 3D as you move mouse
  - VIB3+ visualizer appears behind card
  - Card floats up slightly
  - Glow effect appears
  - Elastic bounce back when mouse leaves
- **Pass criteria:** Smooth 3D tilt with VIB3+ iframe visible

### Test 3: Magnetic Cursor
- **What to test:** Move cursor over buttons, links, and cards
- **Expected:**
  - Custom cursor dot + ring visible
  - Ring expands when hovering interactive elements
  - Elements slightly pull toward cursor
  - Color changes for different element types
- **Pass criteria:** Cursor changes are smooth, magnetic pull is visible

### Test 4: Scroll Animations
- **What to test:** Scroll down the page slowly
- **Expected:**
  - Section headings fade in and slide up
  - Cards reveal with stagger effect
  - Backgrounds move at different speeds (parallax)
  - List items slide in from left
  - Gradient bars animate from left to right
- **Pass criteria:** All elements animate smoothly on scroll

### Test 5: Canvas Background
- **What to test:** Move mouse around the page
- **Expected:**
  - Animated particle network in background
  - Particles connect with lines
  - Particles move toward cursor when close
  - Smooth 60fps animation
- **Pass criteria:** Canvas animates without stuttering

## Console Debugging

### Expected Console Output (in order):

```
✅ All libraries loaded successfully
Lenis: function
GSAP: function 3.12.5
ScrollTrigger: function

🎨 CANVAS: Complete! Animating 35 nodes at 60fps
🎨 CANVAS: RAF running = true

🎭 ORCHESTRATION: Starting initialization...
🎭 ORCHESTRATION: Lenis = function
🎭 ORCHESTRATION: gsap = function
🎭 ORCHESTRATION: ScrollTrigger = function
✨ ORCHESTRATION: Complete! All animations initialized
✨ ORCHESTRATION: Lenis instance = [Object]
✨ ORCHESTRATION: ScrollTrigger instances = 20+

🎴 VIB3+ CARDS: Starting initialization...
🎴 VIB3+ CARDS: GSAP available = function
✨ VIB3+ CARDS: Complete! Listening to 15+ cards
✨ VIB3+ CARDS: Container created = true

🧲 CURSOR: Starting initialization...
🧲 CURSOR: GSAP available = function
✨ CURSOR: Complete! Tracking 50+ elements
✨ CURSOR: Cursor elements created = true
```

### Common Issues and Fixes:

#### Issue: "Missing libraries" error
**Fix:** Check internet connection, CDN might be blocked

#### Issue: No VIB3+ visualizer appears
**Symptoms:** Card tilts but no iframe behind it
**Fix:** Check that `https://domusgpt.github.io/vib3-plus-engine/` is accessible

#### Issue: No magnetic cursor
**Symptoms:** Default cursor still visible
**Fix:** Check console for "CURSOR: Complete!" message
- If missing: GSAP might not have loaded
- On touch device: Cursor is intentionally disabled

#### Issue: Scroll is not smooth
**Symptoms:** Page jumps instead of smooth scroll
**Fix:** Check for "Lenis instance = [Object]" in console
- If missing: Lenis failed to initialize

#### Issue: Animations not triggering
**Symptoms:** Elements don't fade in on scroll
**Fix:** Check ScrollTrigger instances count
- Should be 20+
- If 0: GSAP ScrollTrigger didn't load

## Performance Monitoring

When running locally:
- FPS counter appears in top-right corner
- Green = 55-60 fps (excellent)
- Yellow = 30-55 fps (acceptable)
- Red = <30 fps (poor - check for issues)

## Mobile Testing

On mobile devices:
- Smooth scroll: Should work (native)
- VIB3+ cards: Disabled (performance)
- Magnetic cursor: Disabled (no hover state)
- Animations: Simplified
- Canvas: Reduced opacity

This is intentional for performance!

## Test Checklist

- [ ] Test page shows all green indicators
- [ ] Console shows all success messages
- [ ] Smooth scrolling works
- [ ] Cards tilt with VIB3+ visualizer
- [ ] Magnetic cursor visible and working
- [ ] Scroll animations trigger
- [ ] Canvas background animates smoothly
- [ ] No console errors
- [ ] FPS stays above 30

## Need Help?

Check the full console output - all systems log their initialization status with emojis for easy scanning.
