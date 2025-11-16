/**
 * Analyze weare-simone.webflow.io scroll behavior tick by tick
 * Capture screenshots at each scroll position to understand the mechanics
 */

const { chromium } = require('playwright');
const fs = require('fs');

async function analyzeSimoneScroll() {
    console.log('🔍 Analyzing https://weare-simone.webflow.io/ scroll behavior\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    // Create output directory
    const outputDir = '/mnt/c/Users/millz/Desktop/simone-analysis';
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('📂 Output directory:', outputDir);
    console.log('');

    try {
        console.log('🌐 Loading site...');
        await page.goto('https://weare-simone.webflow.io/', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await page.waitForTimeout(2000);
        console.log('✅ Site loaded\n');

        // Get initial viewport info
        const viewportHeight = await page.evaluate(() => window.innerHeight);
        console.log(`📐 Viewport height: ${viewportHeight}px\n`);

        // Analyze multiple scroll positions
        const scrollPositions = [
            { name: 'initial', scrollY: 0, description: 'Initial page load' },
            { name: 'tick1', scrollY: 100, description: 'First scroll wheel tick (~100px)' },
            { name: 'tick2', scrollY: 200, description: 'Second tick (~200px)' },
            { name: 'tick3', scrollY: 300, description: 'Third tick (~300px)' },
            { name: 'section1-start', scrollY: 500, description: 'Entering first section' },
            { name: 'section1-mid', scrollY: 800, description: 'Mid first section' },
            { name: 'section1-end', scrollY: 1200, description: 'End first section' },
            { name: 'section2-start', scrollY: 1500, description: 'Entering second section' },
            { name: 'section2-mid', scrollY: 2000, description: 'Mid second section' },
            { name: 'section3', scrollY: 3000, description: 'Third section' }
        ];

        for (const pos of scrollPositions) {
            console.log(`📍 ${pos.description} (scrollY: ${pos.scrollY}px)`);

            // Scroll to position
            await page.evaluate((y) => window.scrollTo(0, y), pos.scrollY);
            await page.waitForTimeout(500); // Let animations settle

            // Get current scroll state
            const scrollState = await page.evaluate(() => {
                return {
                    scrollY: window.scrollY,
                    scrollHeight: document.documentElement.scrollHeight,
                    // Find all sections with data-scroll-section or similar
                    sections: Array.from(document.querySelectorAll('section, [data-scroll-section]')).map((section, i) => {
                        const rect = section.getBoundingClientRect();
                        return {
                            index: i,
                            tagName: section.tagName,
                            classes: section.className,
                            top: Math.round(rect.top),
                            bottom: Math.round(rect.bottom),
                            height: Math.round(rect.height),
                            inView: rect.top < window.innerHeight && rect.bottom > 0
                        };
                    }),
                    // Find pinned elements
                    pinnedElements: Array.from(document.querySelectorAll('[style*="position: fixed"], [style*="position:fixed"]')).map(el => {
                        return {
                            tagName: el.tagName,
                            classes: el.className,
                            style: el.getAttribute('style')
                        };
                    }),
                    // Get computed styles of key elements
                    headerStyle: (() => {
                        const header = document.querySelector('header');
                        if (!header) return null;
                        const style = window.getComputedStyle(header);
                        return {
                            position: style.position,
                            top: style.top,
                            transform: style.transform,
                            opacity: style.opacity
                        };
                    })(),
                    // Check for ScrollTrigger instances
                    scrollTriggers: window.ScrollTrigger ? window.ScrollTrigger.getAll().map(st => ({
                        trigger: st.trigger?.className || 'unknown',
                        start: st.start,
                        end: st.end,
                        progress: Math.round(st.progress * 100) / 100,
                        isActive: st.isActive,
                        pin: st.pin ? st.pin.className : null
                    })) : []
                };
            });

            console.log(`  ScrollY: ${scrollState.scrollY}px`);
            console.log(`  Sections in view: ${scrollState.sections.filter(s => s.inView).length}`);
            console.log(`  Pinned elements: ${scrollState.pinnedElements.length}`);
            if (scrollState.scrollTriggers.length > 0) {
                console.log(`  Active ScrollTriggers: ${scrollState.scrollTriggers.filter(st => st.isActive).length}/${scrollState.scrollTriggers.length}`);
            }

            // Save detailed state to JSON
            fs.writeFileSync(
                `${outputDir}/${pos.name}-state.json`,
                JSON.stringify(scrollState, null, 2)
            );

            // Take screenshot
            await page.screenshot({
                path: `${outputDir}/${pos.name}-screenshot.png`,
                fullPage: false
            });

            console.log(`  ✅ Saved: ${pos.name}-screenshot.png & ${pos.name}-state.json\n`);
        }

        // Now do a continuous scroll analysis
        console.log('🎬 Analyzing continuous scroll behavior...\n');

        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(1000);

        const tickAnalysis = [];

        // Scroll 10 ticks, capturing state after each
        for (let tick = 0; tick < 10; tick++) {
            const beforeScroll = await page.evaluate(() => ({
                scrollY: window.scrollY,
                time: Date.now()
            }));

            // Single scroll wheel tick (deltaY ~100px)
            await page.mouse.wheel(0, 100);
            await page.waitForTimeout(100); // Animation frame time

            const afterScroll = await page.evaluate(() => {
                const sections = Array.from(document.querySelectorAll('section, [data-scroll-section]'));
                const visibleSection = sections.find(section => {
                    const rect = section.getBoundingClientRect();
                    return rect.top < window.innerHeight / 2 && rect.bottom > window.innerHeight / 2;
                });

                return {
                    scrollY: window.scrollY,
                    time: Date.now(),
                    deltaY: window.scrollY - beforeScroll.scrollY,
                    visibleSection: visibleSection ? {
                        classes: visibleSection.className,
                        top: Math.round(visibleSection.getBoundingClientRect().top),
                        transform: window.getComputedStyle(visibleSection).transform
                    } : null,
                    // Get background/visualizer element state
                    backgroundState: (() => {
                        const bg = document.querySelector('.background, [class*="background"], canvas');
                        if (!bg) return null;
                        const style = window.getComputedStyle(bg);
                        return {
                            opacity: style.opacity,
                            transform: style.transform,
                            filter: style.filter
                        };
                    })()
                };
            });

            tickAnalysis.push({
                tick: tick + 1,
                scrollY: afterScroll.scrollY,
                deltaY: afterScroll.deltaY,
                visibleSection: afterScroll.visibleSection,
                backgroundState: afterScroll.backgroundState
            });

            console.log(`  Tick ${tick + 1}: scrollY=${afterScroll.scrollY}px, delta=${afterScroll.deltaY}px`);
        }

        // Save tick analysis
        fs.writeFileSync(
            `${outputDir}/tick-by-tick-analysis.json`,
            JSON.stringify(tickAnalysis, null, 2)
        );

        console.log('\n✅ Tick-by-tick analysis saved\n');

        // Extract CSS and JavaScript
        console.log('📦 Extracting site assets...\n');

        const css = await page.evaluate(() => {
            return Array.from(document.styleSheets)
                .filter(sheet => sheet.href && sheet.href.includes('webflow'))
                .map(sheet => sheet.href)
                .join('\n');
        });

        const scripts = await page.evaluate(() => {
            return Array.from(document.scripts)
                .filter(script => script.src && (script.src.includes('gsap') || script.src.includes('webflow')))
                .map(script => script.src)
                .join('\n');
        });

        fs.writeFileSync(`${outputDir}/css-links.txt`, css);
        fs.writeFileSync(`${outputDir}/script-links.txt`, scripts);

        console.log('✅ Asset links extracted\n');

        // Analyze GSAP ScrollTrigger configuration
        const scrollTriggerConfig = await page.evaluate(() => {
            if (!window.ScrollTrigger) return null;

            return window.ScrollTrigger.getAll().map(st => ({
                trigger: st.trigger?.className || st.trigger?.id || 'unknown',
                vars: {
                    start: st.vars.start,
                    end: st.vars.end,
                    scrub: st.vars.scrub,
                    pin: !!st.vars.pin,
                    markers: st.vars.markers,
                    onUpdate: !!st.vars.onUpdate,
                    onToggle: !!st.vars.onToggle
                },
                progress: st.progress,
                isActive: st.isActive
            }));
        });

        if (scrollTriggerConfig) {
            fs.writeFileSync(
                `${outputDir}/scrolltrigger-config.json`,
                JSON.stringify(scrollTriggerConfig, null, 2)
            );
            console.log('✅ ScrollTrigger configuration extracted\n');
        }

        console.log('🎉 Analysis complete!');
        console.log(`📂 All files saved to: ${outputDir}\n`);

        // Keep browser open for 10 seconds
        await page.waitForTimeout(10000);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await browser.close();
    }
}

analyzeSimoneScroll().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
