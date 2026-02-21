import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Smile, Users, Heart, Star, Sparkles, User, Apple, Box, CheckCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

// --- Data ---
type Category = 'animals' | 'people' | 'objects' | 'fruits';

interface CardData {
    id: string;
    text: string;
    icon: string; // Emoji
    category: Category;
    isSpecial?: boolean;
    specialAction?: string;
}

const CARDS: CardData[] = [
    // Animals
    { id: 'Lion', text: 'Leão', icon: '🦁', category: 'animals' },
    { id: 'Sheep', text: 'Ovelha', icon: '🐑', category: 'animals' },
    { id: 'Fish', text: 'Peixe', icon: '🐟', category: 'animals' },
    { id: 'Dove', text: 'Pomba', icon: '🕊️', category: 'animals' },
    { id: 'Dog', text: 'Cachorro', icon: '🐶', category: 'animals' },
    { id: 'Cat', text: 'Gato', icon: '🐱', category: 'animals' },
    { id: 'Monkey', text: 'Macaco', icon: '🐵', category: 'animals' },
    { id: 'Elephant', text: 'Elefante', icon: '🐘', category: 'animals' },

    // People
    { id: 'Dad', text: 'Papai', icon: '👨', category: 'people', isSpecial: true, specialAction: 'Dê um abraço nele e diga porque você o ama!' },
    { id: 'Mom', text: 'Mamãe', icon: '👩', category: 'people', isSpecial: true, specialAction: 'Dê um abraço apertado e diga o que mais ama nela!' },
    { id: 'Baby', text: 'Bebê', icon: '👶', category: 'people' },
    { id: 'Grandma', text: 'Vovó', icon: '👵', category: 'people' },
    { id: 'Pastor', text: 'Pastor', icon: '👔', category: 'people' },
    { id: 'Teacher', text: 'Professor(a)', icon: '📚', category: 'people' },

    // Objects
    { id: 'Ball', text: 'Bola', icon: '⚽', category: 'objects' },
    { id: 'Phone', text: 'Celular', icon: '📱', category: 'objects' },
    { id: 'Toothbrush', text: 'Escova de Dentes', icon: '🪥', category: 'objects' },
    { id: 'Bible', text: 'Bíblia', icon: '📖', category: 'objects' },
    { id: 'Guitar', text: 'Violão', icon: '🎸', category: 'objects' },
    { id: 'Mic', text: 'Microfone', icon: '🎤', category: 'objects' },

    // Fruits
    { id: 'Banana', text: 'Banana', icon: '🍌', category: 'fruits' },
    { id: 'Apple', text: 'Maçã', icon: '🍎', category: 'fruits' },
    { id: 'Grape', text: 'Uva', icon: '🍇', category: 'fruits' },
    { id: 'Watermelon', text: 'Melancia', icon: '🍉', category: 'fruits' },
];

import { ArrowLeft, RefreshCw, Smile, Users, Heart, Star, Sparkles, User, Apple, Box, CheckCircle, PawPrint } from 'lucide-react';

const CATEGORIES = [
    { id: 'animals', label: 'Animais', icon: <PawPrint className="w-6 h-6" />, color: 'bg-orange-100 text-orange-600 border-orange-200' },
    { id: 'people', label: 'Pessoas', icon: <Users className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600 border-blue-200' },
    { id: 'objects', label: 'Objetos', icon: <Box className="w-5 h-5" />, color: 'bg-purple-100 text-purple-600 border-purple-200' },
    { id: 'fruits', label: 'Frutas', icon: <Apple className="w-5 h-5" />, color: 'bg-red-100 text-red-600 border-red-200' },
];

export default function CharadesGame() {
    const navigate = useNavigate();

    // State
    const [gameState, setGameState] = useState<'menu' | 'drawing' | 'acting' | 'challenge'>('menu');
    const [currentCard, setCurrentCard] = useState<CardData | null>(null);

    // Logic
    const drawCard = (category?: Category) => {
        setGameState('drawing');

        // Filter deck
        const pool = category ? CARDS.filter(c => c.category === category) : CARDS;

        // Random pick
        setTimeout(() => {
            const randomCard = pool[Math.floor(Math.random() * pool.length)];
            setCurrentCard(randomCard);
            setGameState('acting'); // Start Acting Phase
        }, 1500);
    };

    const handleGuessed = () => {
        if (currentCard?.isSpecial) {
            setGameState('challenge'); // Go to Love Challenge Phase
        } else {
            // No challenge? Just loop back or show small celebration
            setGameState('challenge'); // Let's simplify: every card has a "Done" state, but special ones have extra text.
        }
    }

    return (
        <div className="min-h-screen bg-amber-50 flex flex-col font-sans select-none overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 z-20 glass border-b border-amber-200 bg-amber-100/80 backdrop-blur-md">
                <div className="container max-w-md mx-auto px-4 py-3 flex items-center justify-between">
                    <button onClick={() => navigate('/games')} className="w-10 h-10 rounded-full bg-white/50 hover:bg-white/80 flex items-center justify-center transition-colors shadow-sm text-amber-800">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-fredoka font-bold text-xl text-amber-800 flex items-center gap-2">
                        <Smile className="w-6 h-6" /> Mímica
                    </h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">

                {gameState === 'menu' && (
                    <div className="w-full space-y-6 animate-in slide-in-from-bottom-5 fade-in duration-500">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-amber-900 font-fredoka mb-2">Quem vou imitar?</h2>
                            <p className="text-amber-700">Escolha uma categoria para sortear!</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => drawCard()}
                                className="col-span-2 p-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-lg transform active:scale-95 transition-all text-white font-bold text-xl flex flex-col items-center gap-2 border-b-4 border-orange-600"
                            >
                                <Sparkles className="w-8 h-8 animate-pulse" />
                                Surpresa (Aleatório)
                            </button>

                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => drawCard(cat.id as Category)}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transform active:scale-95 transition-all shadow-sm h-32",
                                        cat.color,
                                        "bg-white"
                                    )}
                                >
                                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl", cat.color.replace('text-', 'bg-').split(' ')[0], "bg-opacity-20")}>
                                        {cat.icon}
                                    </div>
                                    <span className="font-bold">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {gameState === 'drawing' && (
                    <div className="flex flex-col items-center animate-in zoom-in spin-in-3 duration-1000">
                        <div className="w-40 h-56 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center border-4 border-white animate-bounce">
                            <span className="text-6xl">?</span>
                        </div>
                        <p className="mt-8 text-xl font-bold text-amber-800 animate-pulse">Sorteando...</p>
                    </div>
                )}

                {/* PHASE 1: ACTING (No Special Instructions visible yet) */}
                {gameState === 'acting' && currentCard && (
                    <div className="w-full max-w-sm relative group perspective-1000 animate-in zoom-in-90 duration-500">
                        <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-amber-200 overflow-hidden relative">
                            {/* Top Pattern */}
                            <div className="h-32 bg-amber-100 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#d97706 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
                                <span className="text-[5rem] drop-shadow-lg transform hover:scale-110 transition-transform duration-300 block">
                                    {currentCard.icon}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="p-8 text-center space-y-4">
                                <div>
                                    <p className="text-amber-500 font-bold uppercase tracking-wider text-sm mb-1">Você é...</p>
                                    <h2 className="text-4xl font-black text-slate-800 font-fredoka">{currentCard.text}</h2>
                                </div>

                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                    <p className="text-amber-800 font-bold mb-1">🤫 Shhh! </p>
                                    <p className="text-amber-700 text-sm">Não fale nada! Apenas faça mímica.</p>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleGuessed}
                                        className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-transform flex items-center justify-center gap-2 text-lg"
                                    >
                                        <CheckCircle className="w-6 h-6" />
                                        Eles Adivinharam!
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PHASE 2: CHALLENGE REVEAL (After Guessing) */}
                {gameState === 'challenge' && currentCard && (
                    <div className="w-full max-w-sm relative group perspective-1000 animate-in zoom-in-90 duration-500">
                        {/* Wrapper for visual feedback (Confetti) */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-300 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                        </div>

                        <div className="bg-white rounded-[2rem] shadow-2xl border-4 border-amber-200 overflow-hidden relative z-10">
                            <div className="h-24 bg-green-100 flex items-center justify-center">
                                <Star className="w-16 h-16 text-green-500 animate-bounce" fill="currentColor" />
                            </div>

                            <div className="p-8 text-center space-y-6">
                                <div>
                                    <h2 className="text-3xl font-black text-green-600 font-fredoka mb-2">Muito Bem!</h2>
                                    <p className="text-slate-600">Vocês acertaram que era <b>{currentCard.text}</b>!</p>
                                </div>

                                {/* Special Instruction - NOW REVEALED */}
                                {currentCard.isSpecial ? (
                                    <div className="bg-rose-50 border-2 border-rose-200 p-5 rounded-2xl flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
                                        <Heart className="w-10 h-10 text-rose-500 fill-rose-500 animate-pulse" />
                                        <div>
                                            <p className="text-rose-800 font-black text-lg uppercase tracking-wide mb-1">Desafio do Amor</p>
                                            <p className="text-rose-700 font-medium text-lg leading-tight">
                                                "{currentCard.specialAction}"
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                                        <p className="text-amber-800 font-bold">🎉 Ponto para a família!</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        onClick={() => setGameState('menu')}
                                        className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold shadow-lg shadow-slate-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                        Próxima Carta
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
