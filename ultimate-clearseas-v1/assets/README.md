# Assets Directory

## Product Images

Place product screenshots in the `products/` subdirectory.

### Recommended Specifications

**Format:** JPG or PNG
**Dimensions:** 800x600px (4:3 aspect ratio)
**File Size:** < 200KB (optimized)

### Product Images Needed

1. **parserator-screenshot.jpg** - Parserator dashboard/interface
2. **aris-screenshot.jpg** - ARIS vessel or control interface
3. **esys-screenshot.jpg** - ESYS sensor dashboard
4. **outek-screenshot.jpg** - OUTEK robotic system
5. **nimbus-screenshot.jpg** - Nimbus Guardian security dashboard

### Founder Image

**founder-paul-phillips.jpg** - Professional headshot or portrait
- Dimensions: 600x600px (1:1 aspect ratio)
- Format: JPG
- File Size: < 150KB

### How to Replace Placeholders

1. Add images to this directory
2. Update HTML in `index.html`:

```html
<!-- Replace placeholder div with actual image -->
<div class="product-image">
    <img src="assets/products/parserator-screenshot.jpg" alt="Parserator Dashboard">
</div>
```

3. Add CSS for images in `styles/main.css`:

```css
.product-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-medium);
}

.product-card:hover .product-image img {
    transform: scale(1.1);
}
```

---

**A Paul Phillips Manifestation**
