const fs = require('fs');
const sql = fs.readFileSync('scratch/games_import.sql', 'utf8');

const games = [];
const regex = /\('(.*?)',\s*'(.*?)',\s*'(.*?)',\s*'(.*?)',\s*'(.*?)',\s*'(.*?)',\s*(\d+),\s*'(.*?)',\s*(false|true),\s*'(.*?)'\)/g;

let match;
while ((match = regex.exec(sql)) !== null) {
  games.push({
    title: match[1].replace(/''/g, "'"),
    provider: match[2],
    image_url: match[3],
    iframe_url: match[4],
    description: match[5].replace(/''/g, "'"),
    difficulty: match[6],
    duration_minutes: parseInt(match[7], 10),
    settings: JSON.parse(match[8]),
    is_active: match[9] === 'true',
    status: match[10]
  });
}

fs.writeFileSync('public/games_feed_processed.json', JSON.stringify(games, null, 2));
console.log('Processed ' + games.length + ' games.');
