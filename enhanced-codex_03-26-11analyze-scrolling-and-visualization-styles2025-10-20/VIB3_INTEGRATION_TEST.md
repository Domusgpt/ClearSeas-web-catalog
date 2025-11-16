# VIB3+ Shader Integration - Testing Guide

## What Changed

Replaced the generic 4D polytope system with **actual VIB3+ engine shader extraction**:
- **Quantum System**: Full shader implementation from `/mnt/c/Users/millz/vib3-plus-engine/src/quantum/QuantumVisualizer.js`
- **Holographic System**: Full shader implementation from `/mnt/c/Users/millz/vib3-plus-engine/src/holograms/HolographicVisualizer.js`

## How It Works

### Card Detection
The system automatically finds these card types:
- `.signal-card` → Quantum shader (even index)
- `.capability-card` → Holographic shader (odd index)
- `.platform-card` → Quantum shader (even index)
- `.research-lab` → Holographic shader (odd index)
- `.step` → Quantum shader (even index)

### Visual Behavior

**On Page Load:**
- System initializes silently
- WebGL contexts created for each card
- Canvases positioned as overlays with opacity: 0

**On Card Hover:**
- Canvas fades in (0.5s transition)
- Shader begins rendering with 4D rotation
- Mouse position controls rotation parameters:
  - `rot4dXW = (mouseX - 0.5) * π * 2`
  - `rot4dYW = (mouseY - 0.5) * π * 2`
  - `rot4dZW = ((mouseX + mouseY) / 2 - 0.5) * π`

**On Mouse Move:**
- Real-time 4D rotation updates
- Lattice functions respond to mouse position
- Holographic shimmer effects modulate

**On Mouse Leave:**
- Canvas fades out (0.5s transition)
- Shader stops updating parameters

## Testing Checklist

### Basic Functionality
- [ ] Page loads without console errors
- [ ] No "WebGL not supported" message
- [ ] Hover over any card triggers visualization
- [ ] Canvas opacity transitions smoothly (0.5s)

### Quantum System Test
- [ ] Hover over **Signal cards** (hero section)
- [ ] Verify hypercube/sphere/wave lattice patterns appear
- [ ] Move mouse around card → 4D rotation changes
- [ ] Look for RGB color separation (Quantum signature)
- [ ] Verify geometric intensity responds to morphFactor

### Holographic System Test
- [ ] Hover over **Capability cards**
- [ ] Verify tetrahedron/hypercube lattice with shimmer
- [ ] Move mouse → holographic glow modulates
- [ ] Look for depth-based color gradients
- [ ] Verify lattice intensity varies smoothly

### Mouse Interaction
- [ ] Mouse position controls rotation (visual changes with movement)
- [ ] Fast mouse movement → rotation catches up smoothly
- [ ] Mouse at top-left vs bottom-right shows different rotations
- [ ] Diagonal mouse movement combines rotation axes

### Performance
- [ ] Smooth 60fps rendering (check DevTools performance)
- [ ] CPU usage <10% (check Task Manager)
- [ ] No jank or stuttering
- [ ] Multiple card hovers don't cause lag

### Browser Compatibility
- [ ] Chrome: Full support
- [ ] Firefox: Full support
- [ ] Edge: Full support
- [ ] Safari: Full support (if available)

## Technical Verification

### Console Checks

Open DevTools console and run:

```javascript
// Verify system loaded
window.cardPolytopeEnhancer !== undefined
// Expected: true

// Check number of visualizers
window.cardPolytopeEnhancer.visualizers.size
// Expected: ~17 (number of cards on page)

// Check first visualizer mode
[...window.cardPolytopeEnhancer.visualizers.values()][0].visualizer.mode
// Expected: 'quantum' or 'holographic'

// Get all modes
[...window.cardPolytopeEnhancer.visualizers.values()].map(v => v.visualizer.mode)
// Expected: Alternating ['quantum', 'holographic', 'quantum', ...]
```

### Shader Verification

```javascript
// Check if WebGL contexts are active
const visualizers = [...window.cardPolytopeEnhancer.visualizers.values()];
visualizers.every(v => v.visualizer.gl !== null)
// Expected: true

// Verify geometry assignments (0-23 range)
visualizers.map(v => v.visualizer.geometry)
// Expected: Array of random numbers from 0-23

// Check 4D rotation parameters
visualizers[0].visualizer.params
// Expected: Object with rot4dXW, rot4dYW, rot4dZW, etc.
```

## Expected Visual Differences

### Quantum System (Even Index Cards)
- **Lattice Types**: Hypercube grids, spherical shells, wave interference
- **Colors**: HSV-based with hue modulation
- **Geometry**: 24 variants (base, hypersphere core, hypertetrahedron core)
- **Motion**: Smooth 4D rotation with morphFactor influence
- **Signature**: Geometric intensity modulation

### Holographic System (Odd Index Cards)
- **Lattice Types**: Tetrahedron vertices with shimmer, enhanced hypercube wireframes
- **Colors**: Depth-based gradients with holographic glow
- **Geometry**: Dynamic variant selection based on morphFactor
- **Motion**: 4D rotation with mouse-reactive parameters
- **Signature**: Temporal shimmer effects, lattice glow

## Known Issues / Edge Cases

### Reduced Motion Preference
- System respects `prefers-reduced-motion: reduce`
- Logs: "Polytope visualizations disabled due to reduced motion preference"
- No errors, cards work normally without shaders

### WebGL Not Supported
- System detects and disables gracefully
- Logs: "WebGL not supported, polytope visualizations disabled"
- Cards function normally without visualizations

### Multiple Cards
- All cards get individual WebGL contexts
- Each runs independent render loop
- Shared `requestAnimationFrame` for efficiency

## File Locations

- **Main Script**: `/tmp/ClearSeas-Enhanced/scripts/card-polytope-visualizer.js` (22KB)
- **Integration**: `/tmp/ClearSeas-Enhanced/index.html` (line 414)
- **Source**: Extracted from `/mnt/c/Users/millz/vib3-plus-engine/`

## VIB3+ Engine Integration Details

### Quantum Shader Features Extracted
- Full 6D rotation matrices (XY, XZ, YZ, XW, YW, ZW)
- `warpHypersphereCore()` function for geometry 8-15
- `applyCoreWarp()` function for core type selection
- Lattice functions: `hypercubeLattice`, `sphereLattice`, `waveLattice`
- HSV to RGB color conversion
- Geometry encoding: `geometry = coreIndex * 8 + baseIndex`

### Holographic Shader Features Extracted
- Enhanced tetrahedron lattice with shimmer
- Enhanced hypercube wireframe with glow
- `getDynamicGeometry()` for variant morphing
- Mouse-reactive parameter modulation
- Touch and scroll reactivity (parameters in place)

## Manual Test: Create Standalone Visualizer

Open console and run:

```javascript
// Create a standalone test
const testCanvas = document.createElement('canvas');
testCanvas.width = 400;
testCanvas.height = 400;
testCanvas.style.cssText = 'position: fixed; top: 20px; right: 20px; border: 2px solid cyan; z-index: 9999;';
document.body.appendChild(testCanvas);

const testViz = new CardPolytopeVisualizer(testCanvas, 'quantum');
testViz.setMousePosition(0.5, 0.5);

function testRender() {
  testViz.render();
  requestAnimationFrame(testRender);
}
testRender();

// Should see: Quantum shader rendering in top-right corner
// Move mouse over it to test interaction (won't respond as there's no hover handler)
```

## Success Criteria

✅ **Integration Complete** if:
1. All cards detect and create canvas overlays
2. Hover triggers fade-in of WebGL shader
3. Mouse movement changes 4D rotation visibly
4. Quantum and Holographic shaders alternate correctly
5. No console errors or WebGL failures
6. Performance remains smooth (60fps)
7. Browser DevTools shows ~17 visualizers initialized

## Next Steps

After testing confirms success:
1. ✅ Commit the integration (DONE - commit 86bbc61)
2. 🔄 Run this test suite
3. 📸 Capture screenshots of different shader modes
4. 🚀 Deploy to GitHub Pages
5. 🌐 Verify deployment at https://domusgpt.github.io/ClearSeas-Enhanced/

---

**🌟 A Paul Phillips Manifestation**

© 2025 Paul Phillips - Clear Seas Solutions LLC
*"The Revolution Will Not be in a Structured Format"*
