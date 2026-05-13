const fs = require('fs');
const dotenv = require('dotenv');
// Using regular parse since dotenv might not be available, but this is a vite project
const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const gamesToRevert = [
  "Dinossauro Evolution", "Dinosaur Evolution", "Ants IO", "Slither Mini Kindom",
  "Slither Mini Kingdom", "Boss Office Life", "Best Sonic Boom Mod", 
  "Cute Pet Friends", "2d car Runner", "Top Motorcycle Bike Racing Game", 
  "Cute Snake io", "Beauty Manicure", "Gold Miner HD", "Jungle Adventures 3", 
  "Jet Ski Racing", "Mega Escape Car", "Tec tak Toe", "Tic Tac Toe", 
  "Fruit basket", "Marble", "Field of Dreans", "Field of Dreams", 
  "Bubble Shooter", "Sonic Jigsaw", "Escape Room", "High schook", 
  "High School", "Butterfly connect", "Jewel Quest", "Panda Supermarket", 
  "Golf Masters", "Flappy Dunk", "Ludo Wizard", "StackBall.io"
];

async function run() {
  const { data } = await supabase.from('games').select('id, title, config');
  let count = 0;
  for (const g of data) {
    if (gamesToRevert.some(n => g.title.toLowerCase().includes(n.toLowerCase()))) {
      await supabase.from('games').update({config: {...g.config, width: 800, height: 600}}).eq('id', g.id);
      count++;
    }
  }
  console.log('Fixed ' + count + ' games!');
}
run();
