document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    const heroSection = document.querySelector('#hero');
    const heroText = document.querySelector('.hero-text');
    const heroPanels = document.querySelector('.hero-panels');
    const capabilitiesSection = document.querySelector('#capabilities');

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: heroSection,
            start: 'top top',
            end: '+=3000', // Increased end point for more scroll room
            scrub: true,
            pin: true,
        }
    });

    // Animate hero text and panels out of view
    tl.to([heroText, heroPanels], {
        opacity: 0,
        y: -200, // Increased distance
        duration: 0.5 // Faster animation
    });

    // Morphing effect on the hero section
    tl.to(heroSection, {
        borderRadius: "20px", // Rounded corners
        scale: 0.9, // Scale down slightly
        duration: 1,
        ease: "power2.inOut"
    }, "-=0.2"); // Overlap with previous animation slightly

    // Un-morph back to original state
    tl.to(heroSection, {
        borderRadius: "0px",
        scale: 1,
        duration: 1,
        ease: "power2.inOut"
    });

    // Fade in capabilities section
    tl.from(capabilitiesSection, {
        opacity: 0,
        duration: 1
    }, ">-0.5"); // Start this animation 0.5s before the previous one ends

    // Animate the visualizers
    if (window.smoothScrollCardEnhancer && window.smoothScrollCardEnhancer.visualizers) {
        const heroCards = document.querySelectorAll('#hero .signal-card');
        heroCards.forEach(card => {
            const data = window.smoothScrollCardEnhancer.visualizers.get(card);
            if (data && data.visualizer) {
                const viz = data.visualizer;
                tl.to(viz.params.morphFactor, { value: 3.0, duration: 1, ease: "power2.inOut" }, 0);
                tl.to(viz.params.gridDensity, { value: 5.0, duration: 1, ease: "power2.inOut" }, 0);
                tl.to(viz.params.intensity, { value: 1.0, duration: 1, ease: "power2.inOut" }, 0);
                tl.to(viz.params.chaos, { value: 0.8, duration: 1, ease: "power2.inOut" }, 0);

                // And back to normal
                tl.to(viz.params.morphFactor, { value: 1.0, duration: 1, ease: "power2.inOut" }, ">");
                tl.to(viz.params.gridDensity, { value: 15.0, duration: 1, ease: "power2.inOut" }, "<");
                tl.to(viz.params.intensity, { value: 0.6, duration: 1, ease: "power2.inOut" }, "<");
                tl.to(viz.params.chaos, { value: 0.2, duration: 1, ease: "power2.inOut" }, "<");
            }
        });
    }
});
