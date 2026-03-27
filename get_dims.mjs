import https from 'https';
import sizeOf from 'image-size';

const urls = [
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/logo%20meu%20amiguito%20por%20extenso.webp",
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/natameseufilhoheroamiguito%20(1).webp",
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/familianatan%20(1).webp",
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/Daneil%20e%20a%20ovelhinha.webp",
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/smartphonemockupamiguito.webp",
    "https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/mockupmissoes.webp"
];

async function getSize(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                try {
                    const dimensions = sizeOf(Buffer.concat(chunks));
                    resolve({url, w: dimensions.width, h: dimensions.height});
                } catch(e) {
                    resolve({url, error: e.message});
                }
            });
        }).on('error', reject);
    });
}

Promise.all(urls.map(getSize)).then(results => console.log(results));
