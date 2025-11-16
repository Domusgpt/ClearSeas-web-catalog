# Deployment Security Configuration

This document covers security configurations for different hosting platforms.

## ✅ Implemented Security Features

### 1. Subresource Integrity (SRI)
All CDN-loaded scripts now include SRI hashes:
- GSAP 3.13.0: `sha384-HOvlOYPIs/zjoIkWUGXkVmXsjr8GuZLV+Q+rcPwmJOVZVpvTSXQChiN4t9Euv9Vc`
- ScrollTrigger 3.13.0: `sha384-P8VzCVnT9NBUkMrpcIZrJbA7EBjJvh/fJS6PmP+4nLIM284DtsImIv8D0fFjIkeh`
- SplitType 0.3.4: `sha384-qhGa4JxHKAhO2EZeAxho+91Bv86LP2GZ83iNGk/vcw4ZdzbHv5/n1NuuYaqYTqcT`

### 2. Content Security Policy (CSP)
Implemented via meta tag in `index.html`. Restricts:
- Scripts to self + jsDelivr CDN
- Styles to self + Google Fonts
- Fonts to self + Google Fonts CDN
- Images to self + data URIs + HTTPS
- Frames completely blocked
- Forms to self + mailto

### 3. External Link Security
All external links now use `rel="noopener noreferrer"` to prevent:
- Tabnabbing attacks
- Referer header leakage
- Window.opener exploitation

### 4. Error Boundaries
Render loops now include try-catch blocks with:
- Error counting (max 10 consecutive errors)
- Automatic shutdown on repeated failures
- Error logging for debugging

### 5. DOM Sanitization Utility
Created `DOMSanitizer.js` for safe DOM manipulation:
- HTML escaping
- Safe element creation
- Attribute whitelisting
- Numeric validation

---

## Platform-Specific Configuration

### GitHub Pages (Current)

**Limitations:**
- Cannot set custom HTTP headers
- CSP must be via meta tag (already implemented)
- No server-side configuration

**Current Setup:**
✅ CSP via `<meta http-equiv="Content-Security-Policy">`
✅ SRI on all CDN scripts
✅ Secure external links

**Recommendations:**
If enhanced security headers are needed, migrate to Netlify or Cloudflare Pages.

---

### Netlify (Recommended)

**Setup:**
1. Deploy to Netlify
2. The `_headers` file will be automatically applied
3. All security headers configured automatically

**Verification:**
```bash
curl -I https://your-site.netlify.app
```

Look for these headers:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`

**Build Command:**
```
# None needed - static site
```

**Publish Directory:**
```
.
```

---

### Cloudflare Pages

**Setup:**
1. Deploy to Cloudflare Pages
2. The `_headers` file will be automatically applied
3. Additional security via Cloudflare WAF (optional)

**Cloudflare Additional Features:**
- DDoS protection (automatic)
- Bot protection
- Rate limiting (via Workers)
- Web Application Firewall (WAF)

**Workers Enhancement (Optional):**
Create a Cloudflare Worker for additional security:

```javascript
export default {
  async fetch(request, env, ctx) {
    const response = await env.ASSETS.fetch(request);
    const newHeaders = new Headers(response.headers);

    // Additional security headers
    newHeaders.set('X-Robots-Tag', 'all');
    newHeaders.set('X-Content-Type-Options', 'nosniff');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};
```

---

### Vercel

**Setup:**
Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; media-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' mailto:;"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

---

## Security Checklist

### Pre-Deployment
- [ ] All CDN scripts have SRI hashes
- [ ] CSP is configured (meta tag or headers)
- [ ] External links use `noopener noreferrer`
- [ ] No debug code in production
- [ ] No console.logs exposing sensitive data
- [ ] Error boundaries implemented
- [ ] Dependencies are up to date (`npm audit`)

### Post-Deployment
- [ ] Test CSP with browser DevTools
- [ ] Verify HTTPS is enforced
- [ ] Check security headers with https://securityheaders.com
- [ ] Validate SRI with browser Network tab
- [ ] Test on multiple browsers
- [ ] Check for mixed content warnings

### Monthly Maintenance
- [ ] Update dependencies (`npm update`)
- [ ] Run security audit (`npm audit`)
- [ ] Check for new CVEs affecting dependencies
- [ ] Review access logs for suspicious activity
- [ ] Test all security headers still active

---

## Testing Security

### 1. Test CSP
Open browser DevTools Console and try:
```javascript
eval('alert(1)')  // Should be blocked by CSP
```

### 2. Test SRI
Modify a CDN URL hash - script should fail to load

### 3. Test External Links
Click external link - should not allow `window.opener` access

### 4. Security Headers Test
Visit: https://securityheaders.com/?q=https://your-site.com

Target Score: **A+**

### 5. Mozilla Observatory
Visit: https://observatory.mozilla.org/analyze/your-site.com

Target Score: **90+**

---

## Incident Response

If a security issue is discovered:

1. **Immediate:**
   - Take site offline if actively exploited
   - Document the issue
   - Notify stakeholders

2. **Investigation:**
   - Identify affected systems/users
   - Determine attack vector
   - Check logs for compromise indicators

3. **Remediation:**
   - Fix vulnerability
   - Update dependencies
   - Deploy patched version
   - Regenerate SRI hashes if CDN compromised

4. **Post-Incident:**
   - Update security documentation
   - Add monitoring for similar issues
   - Consider penetration testing

---

## Security Contacts

**Report Security Issues:**
- Email: Paul@clearseassolutions.com
- Subject: [SECURITY] Brief description
- Include: Steps to reproduce, impact assessment, suggested fix

**Responsible Disclosure:**
- 90-day disclosure timeline
- Credit given to researchers
- No legal action for good-faith research

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [MDN Security Guide](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy Reference](https://content-security-policy.com/)

---

**Last Updated:** 2025-11-05
**Review Schedule:** Monthly
**Next Review:** 2025-12-05

---

**A Paul Phillips Manifestation**
© 2025 Clear Seas Solutions LLC
*"The Revolution Will Not be in a Structured Format"*
