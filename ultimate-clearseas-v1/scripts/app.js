/**
 * Clear Seas Solutions - Main Application
 * A Paul Phillips Manifestation
 * "The Revolution Will Not be in a Structured Format"
 * © 2025 Paul Phillips - Clear Seas Solutions LLC
 */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌊 Clear Seas Solutions - Initializing...');

    // Initialize visualizer
    const visualizer = new ClearSeasVisualizer('visualizer-canvas');

    if (!visualizer.gl) {
        console.error('Failed to initialize WebGL visualizer');
        // Fallback: add gradient background
        document.getElementById('visualizer-canvas').style.background =
            'linear-gradient(135deg, #001a33 0%, #003366 100%)';
    } else {
        console.log('✅ WebGL Visualizer initialized successfully');
    }

    // Navigation scroll effect
    const nav = document.querySelector('.main-nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for section-based visualizer presets
    const sections = document.querySelectorAll('[data-visualizer-preset]');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const preset = entry.target.getAttribute('data-visualizer-preset');
                if (preset && visualizer.setPreset) {
                    visualizer.setPreset(preset);
                    console.log(`🎨 Switched to preset: ${preset}`);
                }
            }
        });
    }, {
        threshold: 0.5
    });

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

    // Product card hover effects
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const productName = card.getAttribute('data-product');

        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
            if (visualizer.setProductHover) {
                visualizer.setProductHover(productName);
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            if (visualizer.resetFromProductHover) {
                visualizer.resetFromProductHover();
            }
        });
    });

    // Animate elements on scroll
    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, {
        threshold: 0.1
    });

    // Observe all cards for animation
    document.querySelectorAll('.product-card, .capability-card, .contact-card').forEach(el => {
        animateOnScroll.observe(el);
    });

    // Contact form handling
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };

            console.log('📧 Form submitted:', formData);

            // Show success message
            showNotification('Message sent! We\'ll get back to you soon.', 'success');

            // Reset form
            contactForm.reset();

            // In production, you would send this to a backend API
            // Example:
            // fetch('/api/contact', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });
        });
    }

    // Parallax effect for scroll indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');

    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            if (scrolled > 200) {
                scrollIndicator.style.opacity = '0';
            } else {
                scrollIndicator.style.opacity = '1';
            }
        });
    }

    // Reality transition parallax effect
    const realityTransitions = document.querySelectorAll('.reality-transition');

    window.addEventListener('scroll', () => {
        realityTransitions.forEach(transition => {
            const rect = transition.getBoundingClientRect();
            const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);

            if (scrollProgress >= 0 && scrollProgress <= 1) {
                const overlay = transition.querySelector('.reality-overlay');
                if (overlay) {
                    const opacity = 0.3 + (Math.sin(scrollProgress * Math.PI) * 0.4);
                    overlay.style.opacity = opacity;
                }

                const content = transition.querySelector('.reality-content');
                if (content) {
                    const scale = 0.9 + (Math.sin(scrollProgress * Math.PI) * 0.1);
                    content.style.transform = `scale(${scale})`;
                }
            }
        });
    });

    // Add stagger animation to product cards
    const staggerCards = () => {
        productCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';

            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    };

    // Trigger stagger when products section is visible
    const productsSection = document.getElementById('products');
    let productsAnimated = false;

    const productsSectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !productsAnimated) {
                staggerCards();
                productsAnimated = true;
            }
        });
    }, {
        threshold: 0.2
    });

    if (productsSection) {
        productsSectionObserver.observe(productsSection);
    }

    // Capability cards hover effect with scale
    const capabilityCards = document.querySelectorAll('.capability-card');

    capabilityCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    // Founder highlights counter animation
    const animateCounters = () => {
        const highlights = document.querySelectorAll('.highlight-number');

        highlights.forEach(highlight => {
            const target = highlight.textContent;
            const isPercent = target.includes('%');
            const isPlus = target.includes('+');
            const numValue = parseInt(target.replace(/[^0-9]/g, ''));

            let current = 0;
            const increment = numValue / 50; // 50 steps
            const duration = 2000; // 2 seconds
            const stepTime = duration / 50;

            const counter = setInterval(() => {
                current += increment;
                if (current >= numValue) {
                    current = numValue;
                    clearInterval(counter);
                }

                highlight.textContent = Math.floor(current) + (isPlus ? '+' : '') + (isPercent ? '%' : '');
            }, stepTime);
        });
    };

    // Trigger counter animation when about section is visible
    const aboutSection = document.getElementById('about');
    let countersAnimated = false;

    const aboutSectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersAnimated) {
                animateCounters();
                countersAnimated = true;
            }
        });
    }, {
        threshold: 0.5
    });

    if (aboutSection) {
        aboutSectionObserver.observe(aboutSection);
    }

    // Keyboard navigation support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close any open modals or reset state
            if (visualizer.resetFromProductHover) {
                visualizer.resetFromProductHover();
            }
        }
    });

    // Add focus styles for accessibility
    document.querySelectorAll('a, button, input, textarea').forEach(el => {
        el.addEventListener('focus', function() {
            this.style.outline = '2px solid var(--cyan-bright)';
            this.style.outlineOffset = '2px';
        });

        el.addEventListener('blur', function() {
            this.style.outline = '';
            this.style.outlineOffset = '';
        });
    });

    // Performance monitoring
    if (window.performance) {
        window.addEventListener('load', () => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`⚡ Page load time: ${pageLoadTime}ms`);
        });
    }

    // Handle visibility change (pause visualizer when tab is hidden)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (visualizer.stop) {
                visualizer.stop();
            }
        } else {
            if (visualizer.start) {
                visualizer.start();
            }
        }
    });

    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.cta-button');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.5)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s ease-out';
            ripple.style.pointerEvents = 'none';

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple animation to CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    console.log('✅ Clear Seas Solutions - Initialization complete!');
});

// Utility function for notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '100px';
    notification.style.right = '20px';
    notification.style.padding = '1rem 2rem';
    notification.style.background = type === 'success'
        ? 'rgba(0, 255, 100, 0.9)'
        : 'rgba(0, 150, 255, 0.9)';
    notification.style.color = 'white';
    notification.style.borderRadius = '10px';
    notification.style.zIndex = '10000';
    notification.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    notification.style.animation = 'slideInRight 0.5s ease';
    notification.style.fontWeight = '600';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Add notification animations
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyle);

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error caught:', e.error);
    // In production, send to error tracking service
});

// Prevent console errors from breaking the site
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Error:', msg, 'at', url, lineNo, columnNo);
    return false;
};

// Export for debugging
window.ClearSeasApp = {
    version: '1.0.0',
    debug: true,
    showNotification
};

console.log('🌊 Clear Seas Solutions v1.0.0 - A Paul Phillips Manifestation');
console.log('💡 "The Revolution Will Not be in a Structured Format"');
