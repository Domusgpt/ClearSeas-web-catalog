const { chromium } = require('playwright');
const path = require('path');

async function testOrchestration() {
    console.log('🎭 Starting visual orchestration test...\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000 // Slow down so we can see what's happening
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Navigate to the site
    const htmlPath = 'file://' + path.resolve(__dirname, '../index.html');
    console.log('📄 Loading:', htmlPath);
    await page.goto(htmlPath);

    // Wait for page to load
    await page.waitForTimeout(3000);

    console.log('\n=== VISUAL INSPECTION ===\n');

    // 1. Check if libraries loaded
    console.log('1️⃣ Checking libraries...');
    const libsLoaded = await page.evaluate(() => {
        return {
            Lenis: typeof Lenis !== 'undefined',
            GSAP: typeof gsap !== 'undefined',
            ScrollTrigger: typeof ScrollTrigger !== 'undefined'
        };
    });
    console.log('   Libraries:', libsLoaded);

    // 2. Check hero visibility
    console.log('\n2️⃣ Checking hero section visibility...');
    const heroVisible = await page.evaluate(() => {
        const hero = document.querySelector('#hero');
        const heroText = hero?.querySelector('.hero-text h1');
        if (!heroText) return { found: false };

        const styles = window.getComputedStyle(heroText);
        return {
            found: true,
            opacity: styles.opacity,
            display: styles.display,
            visibility: styles.visibility,
            text: heroText.textContent.substring(0, 50)
        };
    });
    console.log('   Hero:', heroVisible);

    // 3. Check VIB3+ visualizer
    console.log('\n3️⃣ Checking VIB3+ visualizer...');
    const vib3Status = await page.evaluate(() => {
        const container = document.querySelector('.vib3-master-viz');
        const iframe = container?.querySelector('iframe');

        if (!container || !iframe) {
            return { found: false };
        }

        const containerStyles = window.getComputedStyle(container);
        return {
            found: true,
            containerOpacity: containerStyles.opacity,
            containerDisplay: containerStyles.display,
            iframeSrc: iframe.src,
            hasControls: iframe.src.includes('controls=1'),
            hasMenu: iframe.src.includes('menu=1')
        };
    });
    console.log('   VIB3+:', vib3Status);

    // 4. Check cards
    console.log('\n4️⃣ Checking cards...');
    const cardsStatus = await page.evaluate(() => {
        const cards = document.querySelectorAll('.signal-card, .capability-card, .platform-card');
        const results = [];

        cards.forEach((card, i) => {
            if (i < 3) { // Check first 3
                const styles = window.getComputedStyle(card);
                results.push({
                    index: i,
                    opacity: styles.opacity,
                    display: styles.display,
                    transform: styles.transform
                });
            }
        });

        return {
            total: cards.length,
            samples: results
        };
    });
    console.log('   Cards:', cardsStatus);

    // 5. Check orchestrator
    console.log('\n5️⃣ Checking master orchestrator...');
    const orchestratorStatus = await page.evaluate(() => {
        return {
            lenisInstance: window.lenis ? 'exists' : 'missing',
            bodyClasses: document.body.className
        };
    });
    console.log('   Orchestrator:', orchestratorStatus);

    // 6. Take screenshot
    console.log('\n6️⃣ Taking screenshot...');
    await page.screenshot({
        path: 'test-screenshot.png',
        fullPage: true
    });
    console.log('   Screenshot saved: test-screenshot.png');

    // 7. Scroll test
    console.log('\n7️⃣ Testing scroll...');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(2000);

    const scrollStatus = await page.evaluate(() => {
        return {
            scrollY: window.scrollY,
            pageHeight: document.body.scrollHeight
        };
    });
    console.log('   Scroll:', scrollStatus);

    // 8. Console errors
    console.log('\n8️⃣ Checking console messages...');
    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.waitForTimeout(1000);
    console.log('   Console messages:');
    consoleLogs.forEach(log => console.log('   ', log));

    console.log('\n=== TEST COMPLETE ===\n');
    console.log('Browser will stay open for 10 seconds for visual inspection...');

    await page.waitForTimeout(10000);
    await browser.close();
}

testOrchestration().catch(console.error);
