const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    const folderUrl = 'https://drive.google.com/drive/folders/1F8zpI2I4L_jPJMYpLlwlWQhLRjks2PcO?usp=sharing';
    console.log(`Testing scraper for: ${folderUrl}`);

    try {
        const response = await axios.get(folderUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        console.log('HTML Length:', html.length);

        let driveData = null;
        $('script').each((i, el) => {
            const content = $(el).html();
            if (content && content.includes('window._DRIVE_IV_INITIAL_DATA')) {
                console.log('Found _DRIVE_IV_INITIAL_DATA script');
                try {
                    const jsonStr = content.split('window._DRIVE_IV_INITIAL_DATA = ')[1].split(';')[0];
                    driveData = JSON.parse(jsonStr);
                    console.log('Successfully parsed JSON data');
                } catch (e) {
                    console.error("Error parsing drive data", e.message);
                }
            }
        });

        const pdfRegex = /"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"application\/pdf"/g;
        let match;
        let count = 0;

        while ((match = pdfRegex.exec(html)) !== null) {
            const [_, id, name] = match;
            if (id.length > 20) {
                console.log(`Found PDF: ${name} (${id})`);
                count++;
            }
        }
        console.log(`Total Regex Matches: ${count}`);

    } catch (e) {
        console.error("Error fetching URL:", e.message);
    }
}

test();
