(function () {
  const TILE_SELECTOR = '[data-tile-asset]';

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(TILE_SELECTOR).forEach((element) => {
      const directSrc = (element.dataset.tileSrc || '').trim();
      if (directSrc) {
        probeSources(element, [directSrc]);
        applyOptionalOverrides(element);
        return;
      }

      const assetBase = (element.dataset.tileAsset || '').trim();
      if (!assetBase) {
        return;
      }

      const candidates = buildCandidateList(assetBase);
      if (!candidates.length) {
        return;
      }

      probeSources(element, candidates);
      applyOptionalOverrides(element);
    });
  });

  function buildCandidateList(base) {
    const sanitized = base.replace(/\s+/g, '-');
    const patterns = [sanitized];

    if (!/-tile$/i.test(sanitized)) {
      patterns.push(`${sanitized}-tile`);
    }

    const primaryExtensions = ['webp', 'png'];
    const fallbackExtensions = ['jpg', 'jpeg'];
    const sources = [];

    patterns.forEach((pattern) => {
      primaryExtensions.forEach((ext) => {
        sources.push(`assets/patterns/${pattern}.${ext}`);
      });
    });

    patterns.forEach((pattern) => {
      fallbackExtensions.forEach((ext) => {
        sources.push(`assets/patterns/${pattern}.${ext}`);
      });
    });

    return sources;
  }

  function probeSources(element, sources) {
    if (!sources.length) {
      return;
    }

    const [current, ...remaining] = sources;
    const image = new Image();

    image.onload = () => {
      if (image.naturalWidth === 0 || image.naturalHeight === 0) {
        probeSources(element, remaining);
        return;
      }

      applyTileImage(element, current);
    };

    image.onerror = () => {
      probeSources(element, remaining);
    };

    image.src = current;
  }

  function applyTileImage(element, url) {
    const cssUrl = `url('${url}')`;
    if (element.classList.contains('hero')) {
      element.style.setProperty('--hero-tile-override', cssUrl);
    } else {
      element.style.setProperty('--tile-image-override', cssUrl);
    }
  }

  function applyOptionalOverrides(element) {
    const position = (element.dataset.tilePosition || '').trim();
    if (position) {
      if (element.classList.contains('hero')) {
        element.style.setProperty('--hero-tile-position', position);
      } else {
        element.style.setProperty('--tile-position', position);
      }
    }

    const size = (element.dataset.tileSize || '').trim();
    if (size) {
      const targetVar = element.classList.contains('hero') ? '--hero-tile-size' : '--tile-size';
      element.style.setProperty(targetVar, size);
    }

    const mobileSize = (element.dataset.tileMobileSize || '').trim();
    if (mobileSize && !element.classList.contains('hero')) {
      element.style.setProperty('--tile-size-mobile', mobileSize);
    }
  }
})();
