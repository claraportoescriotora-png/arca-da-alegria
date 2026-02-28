const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Wait for React to render
    await page.goto('http://localhost:8080/home', { waitUntil: 'load' });
    await page.waitForTimeout(4000);

    // Get bounding boxes
    const data = await page.evaluate(() => {
        const getRect = (text) => {
            const el = Array.from(document.querySelectorAll('h2, p, div, span, img, section')).find(e => e.innerText === text || e.alt === text);
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom, text: text };
        };

        const seriesTitleEl = Array.from(document.querySelectorAll('h2')).find(e => e.innerText === 'Séries & Filmes');
        const seriesContainerRect = seriesTitleEl ? seriesTitleEl.parentElement.parentElement.getBoundingClientRect() : null;

        // Find the Midinho card
        const midinhoTitle = Array.from(document.querySelectorAll('p')).find(e => e.innerText.includes('Midinho'));
        const midinhoContainerRect = midinhoTitle ? midinhoTitle.parentElement.getBoundingClientRect() : null;

        // Find the Jogos Divertidos section
        const jogosTitleEl = Array.from(document.querySelectorAll('h2')).find(e => e.innerText === 'Jogos Divertidos');
        const jogosContainerRect = jogosTitleEl ? jogosTitleEl.parentElement.parentElement.getBoundingClientRect() : null;

        // Find the Encontre Jesus card
        const encontreTitle = Array.from(document.querySelectorAll('h3, p, span, div')).find(e => e.innerText === 'Encontre Jesus' || e.innerText === 'Subindo ao Céu');
        const encontreContainerRect = encontreTitle ? encontreTitle.closest('.cursor-pointer')?.getBoundingClientRect() : null;

        return {
            main: document.querySelector('main')?.getBoundingClientRect(),
            seriesContainer: seriesContainerRect,
            seriesTitle: getRect('Séries & Filmes'),
            midinhoContainer: midinhoContainerRect,
            midinhoImage: Array.from(document.querySelectorAll('img')).find(img => img.src && img.src.includes('midinho'))?.getBoundingClientRect() || getRect('Midinho, O Pequeno Missionário'),
            jogosContainer: jogosContainerRect,
            jogosTitle: getRect('Jogos Divertidos'),
            firstGameContainer: encontreContainerRect,
        };
    });

    fs.writeFileSync('dom_report.json', JSON.stringify(data, null, 2));
    console.log("Done");
    await browser.close();
})();
