import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:8000")
        await page.evaluate("window.scrollTo(0, 1000)")
        await asyncio.sleep(2)
        await page.screenshot(path="verification.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
