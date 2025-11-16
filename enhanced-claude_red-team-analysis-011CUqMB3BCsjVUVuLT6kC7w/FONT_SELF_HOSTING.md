# Self-Hosting Google Fonts

## Why Self-Host?
- **Privacy**: No requests to Google servers
- **Performance**: Faster loading from your own CDN
- **Security**: Full control over font files
- **GDPR Compliance**: No third-party data sharing

## How to Self-Host

### Option 1: Google Webfonts Helper (Recommended)
1. Visit https://gwfh.mranftl.com/fonts
2. Search for "Inter" and "Space Grotesk"
3. Select weights: 400, 500, 600, 700
4. Download the zip file
5. Extract to `/assets/fonts/`
6. Copy the provided CSS to `/assets/fonts/fonts.css`

### Option 2: Manual Download with wget
```bash
# Download Inter font family
wget --user-agent="Mozilla/5.0" -O assets/fonts/inter.css \
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"

# Download Space Grotesk font family
wget --user-agent="Mozilla/5.0" -O assets/fonts/space-grotesk.css \
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"

# Then download each font file referenced in the CSS
```

### Option 3: Using fontsource (npm)
```bash
npm install @fontsource/inter @fontsource/space-grotesk

# Then import in your CSS:
# @import '@fontsource/inter/400.css';
# @import '@fontsource/inter/500.css';
# @import '@fontsource/inter/600.css';
# @import '@fontsource/inter/700.css';
# @import '@fontsource/space-grotesk/400.css';
# @import '@fontsource/space-grotesk/500.css';
# @import '@fontsource/space-grotesk/600.css';
# @import '@fontsource/space-grotesk/700.css';
```

## Update HTML
Once fonts are self-hosted, remove these lines from `index.html`:
```html
<!-- Remove these: -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- Replace with: -->
<link rel="stylesheet" href="assets/fonts/fonts.css">
```

## Update CSP
After self-hosting, update the Content Security Policy to remove Google Fonts:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
               style-src 'self' 'unsafe-inline';
               font-src 'self';
               img-src 'self' data: https:;
               media-src 'self';
               connect-src 'self';
               frame-ancestors 'none';
               base-uri 'self';
               form-action 'self' mailto:;">
```

Note: `font-src` changed from `https://fonts.gstatic.com` to just `'self'`
