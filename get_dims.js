const https = require('https');
const http = require('http');

const urls = [
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/logo%20meu%20amiguito%20por%20extenso.webp",
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/natameseufilhoheroamiguito%20(1).webp",
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/familianatan%20(1).webp",
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/Daneil%20e%20a%20ovelhinha.webp",
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/smartphonemockupamiguito.webp",
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/mockupmissoes.webp"
];

// image-size fallback parser (fast for webp)
async function getWebpSize(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let chunks = [];
            res.on('data', (chunk) => {
                chunks.push(chunk);
                let buffer = Buffer.concat(chunks);
                if (buffer.length > 30) {
                    // check WEBP signature
                    if (buffer.toString('ascii', 8, 12) === 'WEBP') {
                        // find VP8X or VP8 or VP8L
                        const chunkHeader = buffer.toString('ascii', 12, 16);
                        let w = 0, h = 0;
                        if (chunkHeader === 'VP8X') {
                            w = 1 + buffer.readUIntLE(24, 3);
                            h = 1 + buffer.readUIntLE(27, 3);
                            resolve({ url, w, h });
                            res.destroy();
                        } else if (chunkHeader === 'VP8 ') {
                            w = buffer.readUInt16LE(26) & 0x3fff;
                            h = buffer.readUInt16LE(28) & 0x3fff;
                            resolve({ url, w, h });
                            res.destroy();
                        } else if (chunkHeader === 'VP8L') {
                            let b1 = buffer[21];
                            let b2 = buffer[22];
                            let b3 = buffer[23];
                            let b4 = buffer[24];
                            w = 1 + (((b2 & 0x3F) << 8) | b1);
                            h = 1 + (((b4 & 0xF) << 10) | (b3 << 2) | ((b2 & 0xC0) >> 6));
                            resolve({ url, w, h });
                            res.destroy();
                        }
                    }
                }
            });
            res.on('end', () => resolve(null));
        }).on('error', reject);
    });
}

Promise.all(urls.map(getWebpSize)).then(results => {
    console.log(JSON.stringify(results, null, 2));
});
