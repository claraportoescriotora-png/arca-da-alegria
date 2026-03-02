import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface QuizAlternative {
    id?: string;
    text: string;
    is_correct: boolean;
}

interface QuizQuestion {
    id: string;
    content_id: string;
    question: string;
    order_index?: number;
    quiz_alternatives: QuizAlternative[];
}

interface AdminStoryQuizDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storyId: string;
    storyTitle: string;
}

export function AdminStoryQuizDialog({ open, onOpenChange, storyId, storyTitle }: AdminStoryQuizDialogProps) {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<QuizQuestion>>({ question: '', quiz_alternatives: [] });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && storyId) {
            fetchQuiz();
            setIsEditing(false);
        }
    }, [open, storyId]);

    const fetchQuiz = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('quiz_questions')
                .select(`
                    id,
                    content_id,
                    question,
                    order_index,
                    quiz_alternatives (
                        id,
                        text,
                        is_correct
                    )
                `)
                .eq('content_id', storyId)
                .order('order_index', { ascending: true });

            if (error) throw error;
            setQuestions(data || []);
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao carregar quiz", description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = () => {
        setCurrentQuestion({
            question: '',
            quiz_alternatives: [
                { text: '', is_correct: true },
                { text: '', is_correct: false },
                { text: '', is_correct: false },
                { text: '', is_correct: false },
            ]
        });
        setIsEditing(true);
    };

    const handleEditQuestion = (q: QuizQuestion) => {
        setCurrentQuestion(q);
        setIsEditing(true);
    };

    const handleDeleteQuestion = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;
        try {
            const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
            if (error) throw error;
            toast({ title: "Pergunta excluída com sucesso!" });
            fetchQuiz();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
        }
    };

    const handleAlternativeChange = (index: number, text: string) => {
        const newAlts = [...(currentQuestion.quiz_alternatives || [])];
        newAlts[index] = { ...newAlts[index], text };
        setCurrentQuestion({ ...currentQuestion, quiz_alternatives: newAlts });
    };

    const handleSetCorrectAlternative = (index: number) => {
        const newAlts = currentQuestion.quiz_alternatives?.map((alt, i) => ({
            ...alt,
            is_correct: i === index
        })) || [];
        setCurrentQuestion({ ...currentQuestion, quiz_alternatives: newAlts });
    };

    const handleSaveQuestion = async () => {
        if (!currentQuestion.question?.trim()) {
            toast({ variant: "destructive", title: "Atenção", description: "A pergunta não pode ficar vazia." });
            return;
        }

        const validAlternatives = currentQuestion.quiz_alternatives?.filter(a => a.text.trim() !== '') || [];
        if (validAlternatives.length < 2) {
            toast({ variant: "destructive", title: "Atenção", description: "Adicione pelo menos 2 alternativas." });
            return;
        }

        if (!validAlternatives.some(a => a.is_correct)) {
            toast({ variant: "destructive", title: "Atenção", description: "Marque qual alternativa é a correta." });
            return;
        }

        setSaving(true);
        try {
            let questionId = currentQuestion.id;

            if (currentQuestion.id) {
                // Update Question
                const { error: qError } = await supabase
                    .from('quiz_questions')
                    .update({ question: currentQuestion.question })
                    .eq('id', currentQuestion.id);
                if (qError) throw qError;
            } else {
                // Insert Question
                const { data: newQ, error: qError } = await supabase
                    .from('quiz_questions')
                    .insert({
                        content_id: storyId,
                        question: currentQuestion.question,
                        order_index: questions.length
                    })
                    .select()
                    .single();
                if (qError) throw qError;
                questionId = newQ.id;
            }

            // Upsert Alternatives
            if (questionId) {
                // For simplicity: delete old ones and insert new ones to handle additions/deletions easily
                if (currentQuestion.id) {
                    await supabase.from('quiz_alternatives').delete().eq('question_id', questionId);
                }

                const altsToInsert = validAlternatives.map(alt => ({
                    question_id: questionId,
                    text: alt.text,
                    is_correct: alt.is_correct
                }));

                const { error: aError } = await supabase
                    .from('quiz_alternatives')
                    .insert(altsToInsert);
                if (aError) throw aError;
            }

            toast({ title: "Pergunta salva com sucesso!" });
            setIsEditing(false);
            fetchQuiz();
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Quiz: {storyTitle}</DialogTitle>
                    <DialogDescription>
                        Gerencie as perguntas do quiz desta história.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : isEditing ? (
                    <div className="space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="space-y-2">
                            <Label className="text-base font-bold text-slate-700">A Pergunta</Label>
                            <Input
                                placeholder="Insira a pergunta aqui..."
                                value={currentQuestion.question || ''}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                                className="text-lg py-6"
                            />
                        </div>

                        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <Label className="text-base font-bold text-slate-700">Alternativas</Label>
                            <p className="text-sm text-slate-500 mb-4">Selecione a caixinha verde para indicar a resposta correta.</p>

                            {currentQuestion.quiz_alternatives?.map((alt, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div
                                        className={`p-1 rounded-full cursor-pointer transition-colors ${alt.is_correct ? 'text-green-500 bg-green-100' : 'text-slate-300 hover:text-green-400 hover:bg-green-50'}`}
                                        onClick={() => handleSetCorrectAlternative(index)}
                                    >
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <Input
                                        placeholder={`Alternativa ${index + 1}`}
                                        value={alt.text}
                                        onChange={(e) => handleAlternativeChange(index, e.target.value)}
                                        className={alt.is_correct ? "border-green-300 ring-1 ring-green-300 bg-green-50/30" : ""}
                                    />
                                    {/* Remove option button could go here, but fixed 4 options is easier for kids UI */}
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="flex justify-between w-full">
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Voltar para lista</Button>
                            <Button onClick={handleSaveQuestion} disabled={saving} className="bg-blue-600">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Salvar Pergunta
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="flex justify-end p-2">
                            <Button onClick={handleAddQuestion} className="bg-blue-600">
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Pergunta
                            </Button>
                        </div>

                        {questions.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Nenhum quiz cadastrado para esta história.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((q, i) => (
                                    <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start justify-between gap-4">
                                        <div className="space-y-2 flex-1">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                <span className="bg-blue-100 text-blue-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">
                                                    {i + 1}
                                                </span>
                                                {q.question}
                                            </h4>
                                            <ul className="pl-8 space-y-1">
                                                {q.quiz_alternatives?.map((alt, j) => (
                                                    <li key={alt.id || j} className={`text-sm flex items-center gap-2 ${alt.is_correct ? 'text-green-600 font-medium' : 'text-slate-500'}`}>
                                                        {alt.is_correct ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
                                                        {alt.text}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditQuestion(q)} className="text-blue-500 hover:bg-blue-50">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-50">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
