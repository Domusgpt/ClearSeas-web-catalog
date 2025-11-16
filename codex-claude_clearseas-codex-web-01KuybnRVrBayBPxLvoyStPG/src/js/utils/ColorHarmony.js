/**
 * Clearseas Codex - Color Harmony System
 * Author: Paul Phillips
 *
 * INNOVATIVE FEATURE: Perceptually uniform color harmonies using Lab color space.
 * Provides complementary, analogous, triadic, and split-complementary color schemes.
 */

import { VISUALIZER_CONFIG } from '../config/VisualizerConfig.js';

/**
 * Color Harmony System
 * Generates harmonious color schemes and provides smooth transitions
 */
export class ColorHarmony {
    constructor(options = {}) {
        this.options = {
            mode: options.mode || VISUALIZER_CONFIG.colorHarmony.mode,
            useLabSpace: options.useLabSpace ?? VISUALIZER_CONFIG.colorHarmony.useLabSpace,
            ...options
        };

        this.config = VISUALIZER_CONFIG.colorHarmony;
        this.currentHue = 200; // Starting hue
        this.targetHue = 200;
    }

    /**
     * Set harmony mode
     * @param {string} mode - 'complementary', 'analogous', 'triadic', 'split-complementary'
     */
    setMode(mode) {
        if (['complementary', 'analogous', 'triadic', 'split-complementary'].includes(mode)) {
            this.options.mode = mode;
        }
    }

    /**
     * Generate harmonious colors from base hue
     * @param {number} baseHue - Base hue (0-360)
     * @param {number} saturation - Saturation (0-100)
     * @param {number} lightness - Lightness (0-100)
     * @returns {Object} Color scheme with multiple colors
     */
    generateScheme(baseHue, saturation = 70, lightness = 60) {
        const mode = this.options.mode;

        switch (mode) {
            case 'complementary':
                return this.generateComplementary(baseHue, saturation, lightness);
            case 'analogous':
                return this.generateAnalogous(baseHue, saturation, lightness);
            case 'triadic':
                return this.generateTriadic(baseHue, saturation, lightness);
            case 'split-complementary':
                return this.generateSplitComplementary(baseHue, saturation, lightness);
            default:
                return this.generateComplementary(baseHue, saturation, lightness);
        }
    }

    /**
     * Generate complementary color scheme
     * @param {number} hue - Base hue
     * @param {number} saturation - Saturation
     * @param {number} lightness - Lightness
     * @returns {Object} Color scheme
     */
    generateComplementary(hue, saturation, lightness) {
        const complementHue = (hue + this.config.complementaryOffset) % 360;

        return {
            primary: this.hslToRgb(hue, saturation, lightness),
            secondary: this.hslToRgb(complementHue, saturation, lightness),
            accent: this.hslToRgb(hue, saturation * 0.8, lightness * 1.1),
            background: this.hslToRgb(hue, saturation * 0.3, lightness * 0.2),
            hues: [hue, complementHue],
            mode: 'complementary'
        };
    }

    /**
     * Generate analogous color scheme
     * @param {number} hue - Base hue
     * @param {number} saturation - Saturation
     * @param {number} lightness - Lightness
     * @returns {Object} Color scheme
     */
    generateAnalogous(hue, saturation, lightness) {
        const spread = this.config.analogousSpread;
        const hue1 = (hue - spread + 360) % 360;
        const hue2 = (hue + spread) % 360;

        return {
            primary: this.hslToRgb(hue, saturation, lightness),
            secondary: this.hslToRgb(hue1, saturation, lightness),
            accent: this.hslToRgb(hue2, saturation, lightness),
            background: this.hslToRgb(hue, saturation * 0.3, lightness * 0.2),
            hues: [hue1, hue, hue2],
            mode: 'analogous'
        };
    }

    /**
     * Generate triadic color scheme
     * @param {number} hue - Base hue
     * @param {number} saturation - Saturation
     * @param {number} lightness - Lightness
     * @returns {Object} Color scheme
     */
    generateTriadic(hue, saturation, lightness) {
        const offset = this.config.triadicOffset;
        const hue1 = (hue + offset) % 360;
        const hue2 = (hue + offset * 2) % 360;

        return {
            primary: this.hslToRgb(hue, saturation, lightness),
            secondary: this.hslToRgb(hue1, saturation, lightness),
            accent: this.hslToRgb(hue2, saturation, lightness),
            background: this.hslToRgb(hue, saturation * 0.3, lightness * 0.2),
            hues: [hue, hue1, hue2],
            mode: 'triadic'
        };
    }

    /**
     * Generate split-complementary color scheme
     * @param {number} hue - Base hue
     * @param {number} saturation - Saturation
     * @param {number} lightness - Lightness
     * @returns {Object} Color scheme
     */
    generateSplitComplementary(hue, saturation, lightness) {
        const spread = this.config.splitComplementarySpread;
        const complementHue = (hue + 180) % 360;
        const hue1 = (complementHue - spread / 2 + 360) % 360;
        const hue2 = (complementHue + spread / 2) % 360;

        return {
            primary: this.hslToRgb(hue, saturation, lightness),
            secondary: this.hslToRgb(hue1, saturation, lightness),
            accent: this.hslToRgb(hue2, saturation, lightness),
            background: this.hslToRgb(hue, saturation * 0.3, lightness * 0.2),
            hues: [hue, hue1, hue2],
            mode: 'split-complementary'
        };
    }

    /**
     * Smoothly transition to a new target hue
     * @param {number} targetHue - Target hue (0-360)
     * @param {number} deltaTime - Time delta for smooth interpolation
     */
    transitionToHue(targetHue, deltaTime = 16) {
        this.targetHue = targetHue;

        // Smooth interpolation
        const speed = this.config.harmonyTransitionSpeed * deltaTime;
        const diff = this.targetHue - this.currentHue;

        // Handle circular hue wrapping (shortest path)
        let shortestDiff = diff;
        if (Math.abs(diff) > 180) {
            shortestDiff = diff > 0 ? diff - 360 : diff + 360;
        }

        this.currentHue += shortestDiff * speed;

        // Wrap to 0-360
        if (this.currentHue < 0) this.currentHue += 360;
        if (this.currentHue >= 360) this.currentHue -= 360;
    }

    /**
     * Get current interpolated hue
     * @returns {number} Current hue
     */
    getCurrentHue() {
        return this.currentHue;
    }

    /**
     * Get current color scheme
     * @param {number} saturation - Saturation (0-100)
     * @param {number} lightness - Lightness (0-100)
     * @returns {Object} Current color scheme
     */
    getCurrentScheme(saturation = 70, lightness = 60) {
        return this.generateScheme(this.currentHue, saturation, lightness);
    }

    // ===== COLOR SPACE CONVERSIONS =====

    /**
     * Convert HSL to RGB
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @returns {Object} { r, g, b } (0-255)
     */
    hslToRgb(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l; // Achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    /**
     * Convert RGB to HSL
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {Object} { h, s, l } (h: 0-360, s: 0-100, l: 0-100)
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // Achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / d + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / d + 4) / 6;
                    break;
            }
        }

        return {
            h: h * 360,
            s: s * 100,
            l: l * 100
        };
    }

    /**
     * Convert RGB to Lab (perceptually uniform color space)
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {Object} { l, a, b } (Lab values)
     */
    rgbToLab(r, g, b) {
        // First convert RGB to XYZ
        let x = r / 255;
        let y = g / 255;
        let z = b / 255;

        // Apply gamma correction
        x = x > 0.04045 ? Math.pow((x + 0.055) / 1.055, 2.4) : x / 12.92;
        y = y > 0.04045 ? Math.pow((y + 0.055) / 1.055, 2.4) : y / 12.92;
        z = z > 0.04045 ? Math.pow((z + 0.055) / 1.055, 2.4) : z / 12.92;

        // Observer = 2°, Illuminant = D65
        x = x * 100 * 0.4124 + y * 100 * 0.3576 + z * 100 * 0.1805;
        y = x * 100 * 0.2126 + y * 100 * 0.7152 + z * 100 * 0.0722;
        z = x * 100 * 0.0193 + y * 100 * 0.1192 + z * 100 * 0.9505;

        // XYZ to Lab
        x = x / 95.047;
        y = y / 100.000;
        z = z / 108.883;

        x = x > 0.008856 ? Math.pow(x, 1 / 3) : (7.787 * x) + (16 / 116);
        y = y > 0.008856 ? Math.pow(y, 1 / 3) : (7.787 * y) + (16 / 116);
        z = z > 0.008856 ? Math.pow(z, 1 / 3) : (7.787 * z) + (16 / 116);

        return {
            l: (116 * y) - 16,
            a: 500 * (x - y),
            b: 200 * (y - z)
        };
    }

    /**
     * Calculate perceptual color difference (Delta E) in Lab space
     * @param {Object} lab1 - { l, a, b }
     * @param {Object} lab2 - { l, a, b }
     * @returns {number} Delta E (perceptual difference)
     */
    deltaE(lab1, lab2) {
        const dL = lab1.l - lab2.l;
        const da = lab1.a - lab2.a;
        const db = lab1.b - lab2.b;

        return Math.sqrt(dL * dL + da * da + db * db);
    }

    /**
     * Interpolate between two colors in Lab space (perceptually uniform)
     * @param {Object} rgb1 - { r, g, b }
     * @param {Object} rgb2 - { r, g, b }
     * @param {number} t - Interpolation factor (0-1)
     * @returns {Object} { r, g, b }
     */
    interpolateLab(rgb1, rgb2, t) {
        const lab1 = this.rgbToLab(rgb1.r, rgb1.g, rgb1.b);
        const lab2 = this.rgbToLab(rgb2.r, rgb2.g, rgb2.b);

        const labInterpolated = {
            l: lab1.l + (lab2.l - lab1.l) * t,
            a: lab1.a + (lab2.a - lab1.a) * t,
            b: lab1.b + (lab2.b - lab1.b) * t
        };

        return this.labToRgb(labInterpolated.l, labInterpolated.a, labInterpolated.b);
    }

    /**
     * Convert Lab to RGB
     * @param {number} l - Lightness
     * @param {number} a - a* (green-red)
     * @param {number} b - b* (blue-yellow)
     * @returns {Object} { r, g, b } (0-255)
     */
    labToRgb(l, a, b) {
        // Lab to XYZ
        let y = (l + 16) / 116;
        let x = a / 500 + y;
        let z = y - b / 200;

        x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16 / 116) / 7.787);
        y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16 / 116) / 7.787);
        z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16 / 116) / 7.787);

        // XYZ to RGB
        let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
        let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
        let b_rgb = x * 0.0557 + y * -0.2040 + z * 1.0570;

        // Apply gamma correction
        r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
        g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
        b_rgb = b_rgb > 0.0031308 ? 1.055 * Math.pow(b_rgb, 1 / 2.4) - 0.055 : 12.92 * b_rgb;

        return {
            r: Math.max(0, Math.min(255, Math.round(r * 255))),
            g: Math.max(0, Math.min(255, Math.round(g * 255))),
            b: Math.max(0, Math.min(255, Math.round(b_rgb * 255)))
        };
    }

    /**
     * Format RGB as CSS color string
     * @param {Object} rgb - { r, g, b }
     * @returns {string} CSS color string
     */
    toColorString(rgb) {
        return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    /**
     * Format RGB as hex color string
     * @param {Object} rgb - { r, g, b }
     * @returns {string} Hex color string
     */
    toHex(rgb) {
        const toHex = (n) => {
            const hex = n.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
    }
}

/**
 * Create a color harmony system
 * @param {Object} options - Configuration options
 * @returns {ColorHarmony}
 */
export function createColorHarmony(options = {}) {
    return new ColorHarmony(options);
}

export default ColorHarmony;
