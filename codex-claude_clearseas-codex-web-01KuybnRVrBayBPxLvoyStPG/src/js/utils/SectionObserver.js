/**
 * Clearseas Codex - Section Observer Utility
 * Author: Paul Phillips
 *
 * Centralized section observation logic using IntersectionObserver API.
 * Eliminates duplication between VisualOrchestrator and app-enhanced.
 */

export class SectionObserver {
    constructor(options = {}) {
        this.options = {
            threshold: options.threshold || [0, 0.25, 0.5, 0.75, 1.0],
            rootMargin: options.rootMargin || '0px',
            root: options.root || null,
            ...options
        };

        this.sections = new Map(); // sectionId -> { element, callbacks, visibility, intersectionRatio }
        this.observer = null;
        this.currentSection = null;
        this.previousSection = null;

        this.initialize();
    }

    initialize() {
        const observerOptions = {
            threshold: this.options.threshold,
            rootMargin: this.options.rootMargin,
            root: this.options.root
        };

        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            observerOptions
        );

        console.log('✅ SectionObserver initialized');
    }

    /**
     * Register a section to observe
     * @param {string} sectionId - Unique section identifier
     * @param {HTMLElement} element - Section element to observe
     * @param {Object} callbacks - { onEnter, onLeave, onVisibilityChange, onBecomeActive }
     */
    observe(sectionId, element, callbacks = {}) {
        if (!element) {
            console.warn(`Cannot observe section "${sectionId}": element not found`);
            return;
        }

        this.sections.set(sectionId, {
            element,
            callbacks: {
                onEnter: callbacks.onEnter || null,
                onLeave: callbacks.onLeave || null,
                onVisibilityChange: callbacks.onVisibilityChange || null,
                onBecomeActive: callbacks.onBecomeActive || null
            },
            visibility: false,
            intersectionRatio: 0
        });

        this.observer.observe(element);
    }

    /**
     * Unobserve a section
     * @param {string} sectionId - Section identifier
     */
    unobserve(sectionId) {
        const section = this.sections.get(sectionId);
        if (section) {
            this.observer.unobserve(section.element);
            this.sections.delete(sectionId);
        }
    }

    /**
     * Handle intersection changes
     * @param {IntersectionObserverEntry[]} entries
     */
    handleIntersection(entries) {
        entries.forEach(entry => {
            // Find section by element
            const sectionId = this.findSectionIdByElement(entry.target);
            if (!sectionId) return;

            const section = this.sections.get(sectionId);
            const wasVisible = section.visibility;
            const isVisible = entry.isIntersecting;

            // Update section data
            section.visibility = isVisible;
            section.intersectionRatio = entry.intersectionRatio;

            // Trigger callbacks
            if (isVisible && !wasVisible) {
                // Section entered viewport
                if (section.callbacks.onEnter) {
                    section.callbacks.onEnter({
                        sectionId,
                        element: entry.target,
                        intersectionRatio: entry.intersectionRatio
                    });
                }
            } else if (!isVisible && wasVisible) {
                // Section left viewport
                if (section.callbacks.onLeave) {
                    section.callbacks.onLeave({
                        sectionId,
                        element: entry.target,
                        intersectionRatio: entry.intersectionRatio
                    });
                }
            }

            // Visibility change callback (fires on any change)
            if (section.callbacks.onVisibilityChange) {
                section.callbacks.onVisibilityChange({
                    sectionId,
                    element: entry.target,
                    isVisible,
                    intersectionRatio: entry.intersectionRatio
                });
            }
        });

        // Determine most visible section
        this.updateActiveSection();
    }

    /**
     * Find section ID by element
     * @param {HTMLElement} element
     * @returns {string|null} Section ID
     */
    findSectionIdByElement(element) {
        for (const [sectionId, section] of this.sections.entries()) {
            if (section.element === element) {
                return sectionId;
            }
        }
        return null;
    }

    /**
     * Update the currently active section (most visible)
     */
    updateActiveSection() {
        let mostVisibleSection = null;
        let maxRatio = 0;

        // Find section with highest intersection ratio
        for (const [sectionId, section] of this.sections.entries()) {
            if (section.visibility && section.intersectionRatio > maxRatio) {
                maxRatio = section.intersectionRatio;
                mostVisibleSection = sectionId;
            }
        }

        // Update current section if changed
        if (mostVisibleSection && mostVisibleSection !== this.currentSection) {
            this.previousSection = this.currentSection;
            this.currentSection = mostVisibleSection;

            // Trigger onBecomeActive callback
            const section = this.sections.get(this.currentSection);
            if (section.callbacks.onBecomeActive) {
                section.callbacks.onBecomeActive({
                    sectionId: this.currentSection,
                    previousSection: this.previousSection,
                    element: section.element,
                    intersectionRatio: section.intersectionRatio
                });
            }
        }
    }

    /**
     * Observe multiple sections at once
     * @param {Array} sectionsConfig - Array of { id, element, callbacks }
     */
    observeMultiple(sectionsConfig) {
        sectionsConfig.forEach(config => {
            this.observe(config.id, config.element, config.callbacks);
        });
    }

    /**
     * Observe sections by selector
     * @param {string} selector - CSS selector for sections
     * @param {Function} idExtractor - Function to extract ID from element (el => el.id)
     * @param {Object} callbacks - Callbacks to apply to all sections
     */
    observeBySelector(selector, idExtractor = (el) => el.id, callbacks = {}) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            const sectionId = idExtractor(element);
            if (sectionId) {
                this.observe(sectionId, element, callbacks);
            }
        });
    }

    /**
     * Get current section
     * @returns {string|null} Current section ID
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * Get previous section
     * @returns {string|null} Previous section ID
     */
    getPreviousSection() {
        return this.previousSection;
    }

    /**
     * Get section data
     * @param {string} sectionId - Section identifier
     * @returns {Object|null} Section data
     */
    getSection(sectionId) {
        return this.sections.get(sectionId) || null;
    }

    /**
     * Get all visible sections
     * @returns {Array} Array of visible section IDs
     */
    getVisibleSections() {
        const visible = [];
        for (const [sectionId, section] of this.sections.entries()) {
            if (section.visibility) {
                visible.push(sectionId);
            }
        }
        return visible;
    }

    /**
     * Get intersection ratio for a section
     * @param {string} sectionId - Section identifier
     * @returns {number} Intersection ratio (0-1)
     */
    getIntersectionRatio(sectionId) {
        const section = this.sections.get(sectionId);
        return section ? section.intersectionRatio : 0;
    }

    /**
     * Check if a section is visible
     * @param {string} sectionId - Section identifier
     * @returns {boolean} Whether the section is visible
     */
    isVisible(sectionId) {
        const section = this.sections.get(sectionId);
        return section ? section.visibility : false;
    }

    /**
     * Manually set the current section (useful for forced transitions)
     * @param {string} sectionId - Section identifier
     */
    setCurrentSection(sectionId) {
        if (this.sections.has(sectionId)) {
            this.previousSection = this.currentSection;
            this.currentSection = sectionId;

            const section = this.sections.get(sectionId);
            if (section.callbacks.onBecomeActive) {
                section.callbacks.onBecomeActive({
                    sectionId,
                    previousSection: this.previousSection,
                    element: section.element,
                    intersectionRatio: section.intersectionRatio,
                    forced: true
                });
            }
        }
    }

    /**
     * Get all section IDs
     * @returns {Array} Array of section IDs
     */
    getAllSectionIds() {
        return Array.from(this.sections.keys());
    }

    /**
     * Cleanup and disconnect observer
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }

        this.sections.clear();
        this.currentSection = null;
        this.previousSection = null;

        console.log('✅ SectionObserver destroyed');
    }
}

/**
 * Helper function to create a simple section observer
 * @param {Object} options - Configuration options
 * @returns {SectionObserver} Configured observer instance
 */
export function createSectionObserver(options = {}) {
    return new SectionObserver(options);
}

/**
 * Helper function to observe sections with common patterns
 * @param {string} selector - CSS selector for sections
 * @param {Function} onSectionChange - Callback when active section changes
 * @param {Object} observerOptions - IntersectionObserver options
 * @returns {SectionObserver} Configured observer instance
 */
export function observeSections(selector, onSectionChange, observerOptions = {}) {
    const observer = new SectionObserver(observerOptions);

    observer.observeBySelector(
        selector,
        (el) => el.id || el.dataset.section,
        {
            onBecomeActive: (data) => {
                if (onSectionChange) {
                    onSectionChange(data.sectionId, data.previousSection, data);
                }
            }
        }
    );

    return observer;
}

export default SectionObserver;
