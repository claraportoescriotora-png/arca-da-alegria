const fs = require('fs');
const sql = fs.readFileSync('scratch/games_import.sql', 'utf8');

const games = [];
const regex = /\('(.*?)',\s*'(.*?)',\s*'(.*?)',\s*'(.*?)',\s*'(.*?)',\s*'(.*?)',\s*(\d+),\s*'(.*?)',\s*(false|true),\s*'(.*?)'\)/gs;

let match;
while ((match = regex.exec(sql)) !== null) {
  games.push({
    title: match[1].replace(/''/g, "'"),
    type: 'embed',
    image_url: match[3],
    game_url: match[4],
    config: JSON.parse(match[8]),
    is_active: false,
    status: 'available'
  });
}

fs.writeFileSync('public/games_feed_processed.json', JSON.stringify(games, null, 2));
console.log('Processed ' + games.length + ' games with correct schema.');
