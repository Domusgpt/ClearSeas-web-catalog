/**
 * DOM Sanitizer Utility
 * Provides safe methods for DOM manipulation to prevent XSS
 *
 * © 2025 Clear Seas Solutions LLC - Paul Phillips
 */

export class DOMSanitizer {
    /**
     * Safely set text content (XSS-safe alternative to innerHTML for text)
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text content to set
     */
    static setText(element, text) {
        if (!element) return;
        element.textContent = text;
    }

    /**
     * Safely create HTML from template with sanitized values
     * Only allows whitelisted tags and escapes all user content
     * @param {string} template - HTML template
     * @param {Object} values - Values to interpolate (will be escaped)
     */
    static safeHTML(template, values = {}) {
        // Escape HTML special characters in values
        const escaped = {};
        for (const [key, value] of Object.entries(values)) {
            escaped[key] = this.escapeHTML(String(value));
        }

        // Simple template replacement
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return escaped[key] !== undefined ? escaped[key] : match;
        });
    }

    /**
     * Escape HTML special characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    static escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Safely append child element
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} child - Child element to append
     */
    static appendChild(parent, child) {
        if (!parent || !child) return;
        parent.appendChild(child);
    }

    /**
     * Create element with safe attributes
     * @param {string} tagName - HTML tag name
     * @param {Object} attributes - Attributes to set
     * @param {string} textContent - Text content (optional)
     */
    static createElement(tagName, attributes = {}, textContent = null) {
        const element = document.createElement(tagName);

        // Whitelist of safe attributes
        const safeAttributes = ['class', 'id', 'style', 'data-*', 'aria-*', 'role', 'href', 'src', 'alt', 'title'];

        for (const [key, value] of Object.entries(attributes)) {
            // Check if attribute is safe
            const isSafe = safeAttributes.some(safe =>
                safe === key || (safe.endsWith('*') && key.startsWith(safe.slice(0, -1)))
            );

            if (isSafe) {
                element.setAttribute(key, value);
            }
        }

        if (textContent !== null) {
            element.textContent = textContent;
        }

        return element;
    }

    /**
     * Validate numeric values (for debug overlays, stats, etc.)
     * @param {any} value - Value to validate
     * @returns {boolean} True if value is a safe number
     */
    static isNumeric(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }

    /**
     * Sanitize numeric display value
     * @param {any} value - Value to sanitize
     * @param {number} decimals - Decimal places
     * @returns {string} Sanitized numeric string
     */
    static sanitizeNumeric(value, decimals = 2) {
        if (!this.isNumeric(value)) {
            return '0.00';
        }
        return value.toFixed(decimals);
    }
}

/**
 * A Paul Phillips Manifestation
 * "The Revolution Will Not be in a Structured Format"
 * © 2025 Clear Seas Solutions LLC
 */
