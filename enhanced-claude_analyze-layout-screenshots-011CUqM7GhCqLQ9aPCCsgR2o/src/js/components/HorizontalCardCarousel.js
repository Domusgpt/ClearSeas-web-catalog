/**
 * HorizontalCardCarousel
 *
 * Revolutionary horizontal-scrolling hero section
 * Cards slide horizontally like Apple product pages
 *
 * @author Clear Seas Solutions
 * @version 2.0
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class HorizontalCardCarousel {
    constructor(container, options = {}) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!this.container) {
            console.error('HorizontalCardCarousel: Container not found');
            return;
        }

        this.options = {
            spacing: 100, // px between cards
            cardScale: 0.85, // scale for inactive cards
            animationDuration: 1.5,
            ease: 'power2.inOut',
            mobile: window.innerWidth <= 768,
            ...options
        };

        this.cards = [];
        this.currentCard = 0;
        this.scrollTrigger = null;

        this.init();
    }

    init() {
        this.setupCards();

        if (this.options.mobile) {
            this.setupMobileCarousel();
        } else {
            this.setupDesktopScroll();
        }

        this.setupNavigation();

        console.log('🎠 HorizontalCardCarousel initialized');
    }

    /**
     * Setup cards array and initial states
     */
    setupCards() {
        const cardElements = this.container.querySelectorAll('[data-card]');

        cardElements.forEach((card, index) => {
            this.cards.push({
                element: card,
                index,
                name: card.dataset.card
            });

            // Set initial state
            gsap.set(card, {
                opacity: index === 0 ? 1 : 0.3,
                scale: index === 0 ? 1 : this.options.cardScale,
                x: index * (card.offsetWidth + this.options.spacing)
            });
        });
    }

    /**
     * Desktop: Horizontal scroll triggered by vertical scroll
     */
    setupDesktopScroll() {
        const totalWidth = this.cards.reduce((sum, card) =>
            sum + card.element.offsetWidth + this.options.spacing, 0);

        // Create horizontal scroll animation
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: this.container,
                start: 'top top',
                end: () => `+=${totalWidth}`,
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                onUpdate: (self) => {
                    const progress = self.progress;
                    const cardIndex = Math.floor(progress * this.cards.length);
                    this.setActiveCard(cardIndex);
                }
            }
        });

        this.cards.forEach((card, index) => {
            if (index > 0) {
                tl.to(this.container, {
                    x: -((card.element.offsetWidth + this.options.spacing) * index),
                    duration: 1,
                    ease: this.options.ease
                }, index);
            }

            // Scale and opacity animations
            tl.to(card.element, {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                ease: this.options.ease
            }, index)
            .to(card.element, {
                scale: this.options.cardScale,
                opacity: 0.3,
                duration: 0.5,
                ease: this.options.ease
            }, index + 0.5);
        });

        this.scrollTrigger = tl.scrollTrigger;
    }

    /**
     * Mobile: Swipeable carousel
     */
    setupMobileCarousel() {
        // Use CSS scroll-snap for native feel
        this.container.style.cssText = `
            display: flex;
            overflow-x: scroll;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scroll-padding: 0;
            gap: ${this.options.spacing}px;
        `;

        this.cards.forEach(card => {
            card.element.style.cssText = `
                scroll-snap-align: center;
                flex-shrink: 0;
                width: 85vw;
                max-width: 400px;
            `;
        });

        // Track scroll position to update active card
        let scrollTimeout;
        this.container.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.updateMobileActiveCard();
            }, 150);
        });

        // Add dots indicator
        this.createDotsIndicator();
    }

    /**
     * Create dots indicator for mobile
     */
    createDotsIndicator() {
        const dots = document.createElement('div');
        dots.className = 'carousel-dots';
        dots.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 20px;
        `;

        this.cards.forEach((card, index) => {
            const dot = document.createElement('button');
            dot.className = 'carousel-dot';
            dot.style.cssText = `
                width: 8px;
                height: 8px;
                border-radius: 50%;
                border: none;
                background: rgba(255, 255, 255, 0.3);
                transition: background 0.3s, transform 0.3s;
                cursor: pointer;
            `;

            if (index === 0) {
                dot.style.background = 'rgba(0, 212, 255, 1)';
                dot.style.transform = 'scale(1.2)';
            }

            dot.addEventListener('click', () => {
                this.scrollToCard(index);
            });

            dots.appendChild(dot);
        });

        this.container.parentElement.appendChild(dots);
        this.dotsContainer = dots;
    }

    /**
     * Update active card on mobile based on scroll position
     */
    updateMobileActiveCard() {
        const containerRect = this.container.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;

        let closestCard = 0;
        let closestDistance = Infinity;

        this.cards.forEach((card, index) => {
            const cardRect = card.element.getBoundingClientRect();
            const cardCenterX = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(centerX - cardCenterX);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestCard = index;
            }
        });

        this.setActiveCard(closestCard);
    }

    /**
     * Set active card and update indicators
     */
    setActiveCard(index) {
        if (this.currentCard === index) return;

        this.currentCard = index;

        // Update dots if mobile
        if (this.dotsContainer) {
            const dots = this.dotsContainer.querySelectorAll('.carousel-dot');
            dots.forEach((dot, i) => {
                if (i === index) {
                    dot.style.background = 'rgba(0, 212, 255, 1)';
                    dot.style.transform = 'scale(1.2)';
                } else {
                    dot.style.background = 'rgba(255, 255, 255, 0.3)';
                    dot.style.transform = 'scale(1)';
                }
            });
        }

        // Dispatch event for external listeners
        this.container.dispatchEvent(new CustomEvent('cardchange', {
            detail: {
                index,
                card: this.cards[index]
            }
        }));
    }

    /**
     * Scroll to specific card (mobile)
     */
    scrollToCard(index) {
        if (!this.cards[index]) return;

        const card = this.cards[index].element;
        card.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });

        this.setActiveCard(index);
    }

    /**
     * Setup keyboard/button navigation
     */
    setupNavigation() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.options.mobile) return;

            if (e.key === 'ArrowRight' && this.currentCard < this.cards.length - 1) {
                this.next();
            } else if (e.key === 'ArrowLeft' && this.currentCard > 0) {
                this.previous();
            }
        });
    }

    /**
     * Navigate to next card
     */
    next() {
        if (this.currentCard < this.cards.length - 1) {
            if (this.options.mobile) {
                this.scrollToCard(this.currentCard + 1);
            } else {
                // Desktop: scroll page to trigger animation
                const scrollAmount = window.pageYOffset + window.innerHeight / this.cards.length;
                window.scrollTo({
                    top: scrollAmount,
                    behavior: 'smooth'
                });
            }
        }
    }

    /**
     * Navigate to previous card
     */
    previous() {
        if (this.currentCard > 0) {
            if (this.options.mobile) {
                this.scrollToCard(this.currentCard - 1);
            } else {
                const scrollAmount = window.pageYOffset - window.innerHeight / this.cards.length;
                window.scrollTo({
                    top: scrollAmount,
                    behavior: 'smooth'
                });
            }
        }
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.scrollTrigger) {
            this.scrollTrigger.kill();
        }

        if (this.dotsContainer) {
            this.dotsContainer.remove();
        }

        console.log('🗑️  HorizontalCardCarousel destroyed');
    }

    /**
     * Refresh (call after DOM changes)
     */
    refresh() {
        if (this.scrollTrigger) {
            this.scrollTrigger.refresh();
        }
    }
}

export default HorizontalCardCarousel;
