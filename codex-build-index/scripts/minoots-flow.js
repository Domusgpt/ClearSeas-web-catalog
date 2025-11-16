/**
 * Simone-style flow choreography for Clear Seas.
 * Drives hero orbitals, overlay morphing, and the expanding orb section.
 */

const { gsap } = window;
const ScrollTrigger = window.ScrollTrigger;

function animateHeroOrbitals() {
    const orbitals = gsap.utils.toArray('.hero-orbital');
    const overlay = document.getElementById('minoots-overlay');
    if (!orbitals.length) return;

    const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: '+=160%',
            scrub: 1.2
        }
    });

    tl.to('.hero-immersive__content', { yPercent: -8, scale: 0.96, opacity: 0.92 }, 0)
        .to(orbitals, {
            opacity: 0.35,
            scale: 1.25,
            duration: 1.2,
            stagger: 0.08,
            filter: 'blur(0px)'
        }, 0)
        .to(orbitals, {
            xPercent: (index) => (index % 2 === 0 ? -15 : 18),
            yPercent: (index) => (index < 2 ? -10 : 12),
            rotate: (index) => (index % 2 === 0 ? 8 : -6),
            duration: 1.2
        }, 0.2)
        .to(document.documentElement, {
            '--minoots-density': 0.55,
            '--minoots-scale': 0.92,
            '--minoots-twist': '-4deg'
        }, 0)
        .call(() => overlay?.classList.add('is-condensing'), [], 0.2)
        .call(() => overlay?.classList.remove('is-condensing'), [], 0.95);
}

function animateExpandingOrb() {
    const orb = document.querySelector('[data-expanding-orb]');
    if (!orb) return;

    const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
            trigger: '#expansion',
            start: 'top top',
            end: '+=200%',
            scrub: 1.2,
            pin: true
        }
    });

    tl.to(orb, {
        width: 'min(90vw, 900px)',
        height: 'min(70vh, 520px)',
        borderRadius: '32px',
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.75), rgba(8, 10, 18, 0.85))'
    }, 0)
        .to('.expanding-orb__line--accent', { opacity: 1 }, 0.1)
        .to('.expanding-orb__line--secondary', { opacity: 0.85 }, 0.2)
        .to(document.documentElement, {
            '--minoots-density': 0.65,
            '--minoots-scale': 1.1,
            '--minoots-twist': '6deg'
        }, 0.15);
}

function initSimoneFlow() {
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    animateHeroOrbitals();
    animateExpandingOrb();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimoneFlow);
} else {
    initSimoneFlow();
}
