const { chromium } = require('playwright');

async function testDeployed() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const errors = [];
    const logs = [];

    page.on('console', msg => {
        const text = msg.text();
        logs.push(`[${msg.type()}] ${text}`);
        console.log(`[CONSOLE ${msg.type()}] ${text}`);
    });

    page.on('pageerror', error => {
        errors.push(error.message);
        console.log(`[ERROR] ${error.message}`);
    });

    console.log('Loading https://domusgpt.github.io/ClearSeas-Enhanced/\n');

    try {
        await page.goto('https://domusgpt.github.io/ClearSeas-Enhanced/', {
            waitUntil: 'domcontentloaded',
            timeout: 15000
        });

        await page.waitForTimeout(3000);

        console.log('\n=== Canvas Check ===');
        const canvasExists = await page.$('#quantum-background');
        console.log('Canvas exists:', !!canvasExists);

        if (canvasExists) {
            const canvasInfo = await page.evaluate(() => {
                const canvas = document.getElementById('quantum-background');
                return {
                    width: canvas.width,
                    height: canvas.height,
                    clientWidth: canvas.clientWidth,
                    clientHeight: canvas.clientHeight,
                    style: canvas.getAttribute('style')
                };
            });
            console.log('Canvas info:', canvasInfo);
        }

        console.log('\n=== WebGL Check ===');
        const webglStatus = await page.evaluate(() => {
            const canvas = document.getElementById('quantum-background');
            if (!canvas) return { error: 'Canvas not found' };

            const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
            if (!gl) return { error: 'WebGL context failed' };

            return {
                version: gl.getParameter(gl.VERSION),
                vendor: gl.getParameter(gl.VENDOR),
                renderer: gl.getParameter(gl.RENDERER),
                maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE)
            };
        });
        console.log('WebGL status:', webglStatus);

        console.log('\n=== App Check ===');
        const appStatus = await page.evaluate(() => {
            return {
                clearSeasApp: typeof window.clearSeasApp,
                visualizer: window.clearSeasApp?.quantumVisualizer ? 'exists' : 'missing',
                gl: window.clearSeasApp?.quantumVisualizer?.gl ? 'exists' : 'missing',
                program: window.clearSeasApp?.quantumVisualizer?.program ? 'exists' : 'missing'
            };
        });
        console.log('App status:', appStatus);

        console.log('\n=== Errors ===');
        console.log(errors.length ? errors : 'No errors');

        console.log('\n=== Keeping browser open for 20 seconds ===');
        await page.waitForTimeout(20000);

    } catch (error) {
        console.error('Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testDeployed();
