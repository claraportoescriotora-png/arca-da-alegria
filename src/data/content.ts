// Stories data with generated images
import storyNoahArk from '@/assets/story-noah-ark.png';
import storyGoodSamaritan from '@/assets/story-good-samaritan.png';
import storyDavidGoliath from '@/assets/story-david-goliath.png';
import storyMoses from '@/assets/story-moses.png';
import storyDanielLions from '@/assets/story-daniel-lions.png';
import storyJonahWhale from '@/assets/story-jonah-whale.png';
import criacaoImg from '@/assets/criacao.jpg';
import joseImg from '@/assets/jose-do-egito.jpg';
import dezMandamentosImg from '@/assets/dez-mandamentos.jpg';
import musicaImg from '@/assets/musica-amor.jpg';
import gamePuzzleImg from '@/assets/game-puzzle.jpg';
import gameQuizImg from '@/assets/game-quiz.jpg';
import gameFindImg from '@/assets/game-find.jpg';
import gameMemoryImg from '@/assets/game-memory.jpg';

export interface Story {
  id: string;
  title: string;
  image: string;
  category: string;
  duration: string;
  progress?: number;
  content: string;
}

export const stories: Story[] = [
  {
    id: 'arca-de-noe',
    title: 'A Arca de Noé',
    image: storyNoahArk,
    category: 'Antigo Testamento',
    duration: '5 min',
    progress: 0.66,
    content: 'Há muito tempo, Deus viu que as pessoas estavam fazendo coisas muito ruins. Mas havia um homem chamado Noé que era bom e obedecia a Deus. Então Deus disse a Noé: "Vou enviar uma grande chuva. Construa uma arca grande para você, sua família e dois de cada animal." Noé trabalhou muito e construiu a arca. Quando ficou pronta, todos os animais entraram: girafas, elefantes, leões, pássaros e muitos outros! A chuva caiu por 40 dias, mas todos estavam seguros na arca. Quando a água baixou, Noé viu um lindo arco-íris no céu - era a promessa de Deus de que nunca mais haveria um dilúvio assim.'
  },
  {
    id: 'bom-samaritano',
    title: 'O Bom Samaritano',
    image: storyGoodSamaritan,
    category: 'Parábolas',
    duration: '4 min',
    content: 'Jesus contou uma história sobre um homem que viajava por uma estrada perigosa. Ladrões o atacaram e o deixaram machucado. Um homem importante passou, viu ele ali, mas não parou para ajudar. Outro homem também passou e também não ajudou. Mas então veio um samaritano - alguém que muitos não gostavam. Ele parou, cuidou das feridas do homem, colocou-o em seu burrinho e o levou para um lugar seguro. Jesus perguntou: "Quem foi o bom vizinho?" A resposta é clara: aquele que ajudou! Devemos ajudar todos, não importa quem sejam.'
  },
  {
    id: 'davi-e-golias',
    title: 'Davi e Golias',
    image: storyDavidGoliath,
    category: 'Antigo Testamento',
    duration: '6 min',
    content: 'Os israelitas estavam com medo de um gigante chamado Golias. Ele era muito alto e forte! Todos os soldados tinham medo dele. Mas Davi, um jovem pastor de ovelhas, não teve medo. Ele disse: "Deus está comigo!" Davi não usou espada nem armadura. Ele pegou apenas cinco pedrinhas lisas e sua funda. Com fé em Deus, Davi lançou uma pedra que acertou Golias bem na testa, e o gigante caiu! Davi nos ensina que, com Deus ao nosso lado, podemos enfrentar qualquer desafio, não importa quão grande pareça.'
  },
  {
    id: 'bebe-moises',
    title: 'O Bebê Moisés',
    image: storyMoses,
    category: 'Antigo Testamento',
    duration: '5 min',
    content: 'No Egito, um rei mau queria machucar todos os bebês hebreus. Mas uma mamãe corajosa escondeu seu bebê em uma cestinha especial e colocou nas águas do rio Nilo. A cestinha flutuou suavemente entre as plantas. A princesa do Egito foi ao rio e encontrou o bebê chorando. Seu coração se encheu de amor! Ela decidiu cuidar dele e deu o nome de Moisés. Deus protegeu Moisés porque tinha um plano especial para ele. Quando cresceu, Moisés ajudou seu povo a ser livre!'
  },
  {
    id: 'daniel-na-cova-dos-leoes',
    title: 'Daniel na Cova dos Leões',
    image: storyDanielLions,
    category: 'Antigo Testamento',
    duration: '5 min',
    content: 'Daniel amava muito a Deus e orava três vezes por dia. Algumas pessoas más ficaram com inveja e fizeram uma lei: ninguém podia orar a Deus! Mas Daniel continuou orando. Por causa disso, ele foi jogado numa cova cheia de leões famintos! Todos pensaram que seria o fim de Daniel. Mas Deus enviou um anjo que fechou a boca dos leões. Na manhã seguinte, o rei correu até a cova e ficou muito feliz ao ver Daniel vivo! Os leões não tinham machucado Daniel porque Deus o protegeu. Daniel mostrou que devemos sempre confiar em Deus.'
  },
  {
    id: 'jonas-e-a-baleia',
    title: 'Jonas e a Baleia',
    image: storyJonahWhale,
    category: 'Antigo Testamento',
    duration: '5 min',
    content: 'Deus pediu a Jonas para ir a uma cidade chamada Nínive e falar sobre Seu amor. Mas Jonas teve medo e fugiu num barco! Uma grande tempestade veio e Jonas foi jogado no mar. Então, uma baleia enorme engoliu Jonas! Dentro da barriga da baleia, Jonas orou a Deus e pediu perdão. Depois de três dias, a baleia cuspiu Jonas na praia. Desta vez, Jonas obedeceu a Deus e foi a Nínive. As pessoas ouviram a mensagem e mudaram seus corações. Jonas aprendeu que não podemos fugir de Deus e que é sempre melhor obedecer.'
  }
];

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  category: string;
}

export const videos: Video[] = [
  {
    id: 'video-1',
    title: 'A Criação do Mundo',
    thumbnail: criacaoImg,
    duration: '8:30',
    category: 'Músicas'
  },
  {
    id: 'video-2',
    title: 'Canção do Amor de Deus',
    thumbnail: musicaImg,
    duration: '3:45',
    category: 'Músicas'
  },
  {
    id: 'video-3',
    title: 'Os 10 Mandamentos para Crianças',
    thumbnail: dezMandamentosImg,
    duration: '10:00',
    category: 'Aprendizado'
  },
  {
    id: 'video-4',
    title: 'A História de José do Egito',
    thumbnail: joseImg,
    duration: '12:15',
    category: 'Histórias'
  }
];

export interface Game {
  id: string;
  title: string;
  image: string;
  difficulty: string;
  duration: string;
  xp: number;
}

export const games: Game[] = [
  {
    id: 'game-1',
    title: 'Quebra-cabeça da Arca',
    image: gamePuzzleImg,
    difficulty: 'Fácil',
    duration: '5 min',
    xp: 50
  },
  {
    id: 'game-2',
    title: 'Quiz Bíblico',
    image: gameQuizImg,
    difficulty: 'Médio',
    duration: '10 min',
    xp: 100
  },
  {
    id: 'game-3',
    title: 'Encontre os Animais',
    image: gameFindImg,
    difficulty: 'Fácil',
    duration: '3 min',
    xp: 30
  },
  {
    id: 'game-4',
    title: 'Jogo da Memória',
    image: gameMemoryImg,
    difficulty: 'Fácil',
    duration: '8 min',
    xp: 40
  }
];

export interface Activity {
  id: string;
  title: string;
  image: string;
  type: string;
}

export const activities: Activity[] = [
  {
    id: 'activity-1',
    title: 'Colorir a Arca de Noé',
    image: storyNoahArk,
    type: 'Colorir'
  },
  {
    id: 'activity-2',
    title: 'Labirinto do Bom Samaritano',
    image: storyGoodSamaritan,
    type: 'Labirinto'
  },
  {
    id: 'activity-3',
    title: 'Ligue os Pontos - Davi',
    image: storyDavidGoliath,
    type: 'Ligue os Pontos'
  },
  {
    id: 'activity-4',
    title: 'Recortar e Colar - Moisés',
    image: storyMoses,
    type: 'Recortar'
  }
];
