# Testing Notes & Known Issues

## Playwright Testing Limitations

### WebGL in Headless Browsers
**Issue**: Playwright's headless Chromium doesn't properly support WebGL, causing page crashes when WebGL operations are attempted.

**Evidence**:
- Test pages crash with "Target crashed" after reporting "WebGL not supported"
- Even minimal WebGL test pages fail in headless mode
- Tried flags: `--use-gl=swiftshader`, `--enable-webgl`, `--enable-accelerated-2d-canvas` - still no WebGL support

**Solution**:
- Added try-catch error handling in polychora initialization
- System now fails gracefully when WebGL unavailable
- Page continues to function even without WebGL rendering

### Testing Recommendations

**For Visual Testing**:
1. Use real browser (not headless): `chromium.launch({ headless: false })`
2. Test on actual devices/phones where WebGL works
3. Use browser DevTools for debugging

**For Functional Testing**:
- Test DOM structure and CSS without WebGL
- Test user interactions (scroll, click, mouse movement)
- Test responsive design breakpoints

## Potential Issues to Check Manually

### 1. CSS Conflicts
**What to check**:
- Is the dark teal background (rgb(0, 50, 62)) visible?
- Is text readable with cream color (rgb(252, 247, 240))?
- Are lime green accents (rgb(204, 255, 102)) showing on buttons/CTAs?

**Files involved**:
- `styles/simone-theme.css` - New theme (loads last, highest priority)
- `styles/clear-seas-enhanced.css` - Existing styles
- `styles/clear-seas-home.css` - Base styles

**Fixed**:
- Added `!important` to critical color properties in simone-theme to ensure they apply

### 2. Layout Issues
**What to check**:
- Are sections stacking correctly?
- Is the header fixed and visible?
- Do cards have proper spacing?
- Is content readable on mobile?

**Key selectors to inspect**:
```css
body           - Should have dark teal background
.site-header   - Should be fixed with backdrop blur
.signal-card   - Should have glassmorphic effect
.hero          - Should be full viewport height
```

### 3. Canvas Rendering
**What to check**:
- Is `#polytope-canvas` created in DOM?
- Does it have proper z-index (-1)?
- Is it behind content?
- Does it render when WebGL available?

**Console messages to look for**:
```
✅ Enhanced Polychora System initialized successfully
⚠️  WebGL not available - Enhanced Polychora System will not render
```

### 4. Typography
**What to check**:
- Is Space Grotesk loading for headings?
- Is letter-spacing tight enough (-0.02 to -0.03em)?
- Are font sizes responsive (using clamp())?
- Is line-height comfortable (1.6-1.7)?

### 5. Interactions
**What to check**:
- Mouse movement: Does polytope respond?
- Scroll: Do polytopes cycle every 500px scroll?
- Time: Do polytopes auto-cycle every 15 seconds?
- Hover: Do buttons/cards have hover effects?

## Manual Testing Checklist

### Desktop (1920x1080)
- [ ] Page loads without errors
- [ ] Dark teal background visible
- [ ] Header fixed at top with blur effect
- [ ] Hero section fills viewport
- [ ] Cards have glassmorphic effect
- [ ] Buttons have lime green background
- [ ] Hover effects work smoothly
- [ ] Canvas renders (if WebGL available)
- [ ] Mouse interaction works
- [ ] Scroll is smooth

### Tablet (768x1024)
- [ ] Layout adjusts to 2-column grid
- [ ] Header navigation collapses
- [ ] Touch interactions work
- [ ] Canvas scales properly
- [ ] Typography remains readable

### Mobile (375x667)
- [ ] Layout stacks to single column
- [ ] Mobile menu accessible
- [ ] Touch targets large enough (44x44px)
- [ ] Text readable without zooming
- [ ] Canvas doesn't block interaction
- [ ] Performance acceptable

## Known Good States

### What SHOULD Work
1. ✅ Page loads and displays content
2. ✅ Dark teal/cream/lime color scheme applies
3. ✅ Layout responsive at all breakpoints
4. ✅ Graceful degradation when WebGL unavailable
5. ✅ All user interactions (scroll, click, hover)

### What Requires WebGL
1. 🎨 4D polytope visualizations
2. 🎨 Glassmorphic shader effects
3. 🎨 Holographic shimmer
4. 🎨 Chromatic aberration

**Note**: Page functions fully without WebGL, just without the advanced visual effects.

## Debugging Commands

### Check if WebGL available:
```javascript
const canvas = document.getElementById('polytope-canvas');
const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
console.log('WebGL available:', !!gl);
if (gl) console.log('Version:', gl.getParameter(gl.VERSION));
```

### Check polychora system:
```javascript
console.log('Polychora exists:', !!window.polychoraSystem);
console.log('Initialized:', window.polychora System?.isInitialized);
console.log('Visualizers:', window.polychoraSystem?.visualizers?.length);
```

### Check styling:
```javascript
const body = document.body;
const styles = window.getComputedStyle(body);
console.log('Background:', styles.backgroundColor);
console.log('Color:', styles.color);
console.log('Font:', styles.fontFamily);
```

### Force polytope change:
```javascript
window.polychoraSystem?.setPolytope(0); // Tesseract
window.polychoraSystem?.setPolytope(1); // 16-Cell
window.polychoraSystem?.setPolytope(2); // 24-Cell
window.polychoraSystem?.setPolytope(3); // 120-Cell
window.polychoraSystem?.setPolytope(4); // 600-Cell
window.polychoraSystem?.setPolytope(5); // 5-Cell
```

## Common Issues & Fixes

### Issue: Page is all white
**Cause**: simone-theme.css not loading or being overridden
**Fix**: Check browser console for CSS load errors, verify file path

### Issue: Text not readable
**Cause**: Color contrast insufficient
**Fix**: Adjust --text-primary or --bg-primary in simone-theme.css

### Issue: Canvas not visible
**Cause**: WebGL not supported or z-index issues
**Fix**: Check console for WebGL messages, inspect canvas z-index

### Issue: Layout broken on mobile
**Cause**: CSS grid/flex not responsive
**Fix**: Check media queries in simone-theme.css

### Issue: Performance slow
**Cause**: Too many canvases rendering or shader too complex
**Fix**: Reduce canvas count, simplify shader, or lower DPR

## Next Steps

1. **Test on real device** (not headless browser)
2. **Check browser console** for actual errors
3. **Inspect element styles** to verify CSS application
4. **Test all breakpoints** (375px, 768px, 1024px, 1920px)
5. **Verify interactions** work as expected

## Contact

If issues persist, provide:
1. Browser/device info
2. Console error messages
3. Screenshot showing the issue
4. Steps to reproduce

This will help diagnose the actual problem vs test environment limitations.
