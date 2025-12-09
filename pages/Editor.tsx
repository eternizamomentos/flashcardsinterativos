import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Wand2, X, GripVertical, Loader2, ArrowLeft } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { Flashcard, FlashcardSet } from '../types';
import { generateFlashcardsFromText } from '../services/geminiService';
import { logError } from '../utils/logger';

const Editor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createSet, updateSet, getSet, settings } = useStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  // AI State
  const [aiText, setAiText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const existingSet = getSet(id);
      if (existingSet) {
        setTitle(existingSet.title);
        setCategory(existingSet.category);
        setCards(existingSet.cards);
      } else {
        navigate('/');
      }
    }
  }, [id, getSet, navigate]);

  const handleAddCard = () => {
    setErrorMessage(null);
    const newCard: Flashcard = {
      id: Math.random().toString(36).substr(2, 9),
      front: '',
      back: '',
      status: 'new',
      nextReview: Date.now(),
      interval: 0,
      easeFactor: 2.5
    };
    setCards([...cards, newCard]);
  };

  const updateCard = (cardId: string, field: 'front' | 'back', value: string) => {
    setErrorMessage(null);
    setCards(cards.map(c => c.id === cardId ? { ...c, [field]: value } : c));
  };

  const removeCard = (cardId: string) => {
    setCards(cards.filter(c => c.id !== cardId));
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMessage('Por favor, dê um nome ao baralho.');
      return;
    }

    const setPayload: FlashcardSet = {
      id: id || Math.random().toString(36).substr(2, 9),
      title,
      category: category || 'Geral',
      cards: cards.filter(c => c.front.trim() || c.back.trim()), // Filter empty
      createdAt: Date.now(),
      lastStudied: null
    };

    if (id) {
      updateSet(id, setPayload);
    } else {
      createSet(setPayload);
    }
    navigate('/');
  };

  const handleAiGenerate = async () => {
    if (!aiText.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateFlashcardsFromText(aiText);
      const newCards: Flashcard[] = generated.map(g => ({
        ...g,
        status: 'new',
        nextReview: Date.now(),
        interval: 0,
        easeFactor: 2.5
      }));
      setCards([...cards, ...newCards]);
      setIsAiModalOpen(false);
      setAiText('');
      setErrorMessage(null);
    } catch (error) {
      logError('Erro ao gerar flashcards:', error);
      setErrorMessage('Erro ao gerar flashcards. Verifique sua chave de API ou tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isDark = settings.theme === 'dark';

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center mb-6">
         <button onClick={() => navigate('/')} className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft size={20} />
         </button>
         <h2 className="text-2xl font-bold">{id ? 'Editar Baralho' : 'Novo Baralho'}</h2>
      </div>

      <div className={`p-6 rounded-2xl shadow-sm border mb-8 ${isDark ? 'bg-dark-surface border-secondary' : 'bg-white border-gray-100'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 opacity-70">Nome do Baralho</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: História do Brasil"
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
              }`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 opacity-70">Categoria</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Humanas"
              className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                 isDark ? 'bg-dark-bg border-gray-700 text-white' : 'bg-gray-50 border-gray-200'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Cartões ({cards.length})</h3>
        <div className="flex gap-2">
           <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-primary text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
          >
            <Wand2 size={16} />
            <span>Gerar com IA</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
              className={`group relative p-4 rounded-xl border ${
                isDark ? 'bg-dark-surface border-secondary' : 'bg-white border-gray-100'
              }`}
            >
              <div className="absolute top-4 left-3 text-gray-300 cursor-grab active:cursor-grabbing">
                <GripVertical size={20} />
              </div>
              <button
                onClick={() => removeCard(card.id)}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors"
              >
                <X size={18} />
              </button>

              <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">Frente</label>
                   <textarea
                    rows={2}
                    value={card.front}
                    onChange={(e) => updateCard(card.id, 'front', e.target.value)}
                    className={`w-full p-2.5 rounded-md text-sm resize-none focus:ring-1 focus:ring-primary outline-none ${
                        isDark ? 'bg-dark-bg text-white' : 'bg-gray-50'
                    }`}
                    placeholder="Pergunta ou termo..."
                   />
                </div>
                <div>
                   <label className="text-xs font-semibold uppercase text-gray-400 mb-1 block">Verso</label>
                   <textarea
                    rows={2}
                    value={card.back}
                    onChange={(e) => updateCard(card.id, 'back', e.target.value)}
                    className={`w-full p-2.5 rounded-md text-sm resize-none focus:ring-1 focus:ring-primary outline-none ${
                        isDark ? 'bg-dark-bg text-white' : 'bg-gray-50'
                    }`}
                    placeholder="Resposta ou definição..."
                   />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex flex-col items-center space-y-4">
         <button
          onClick={handleAddCard}
          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center font-medium"
        >
          <Plus size={20} className="mr-2" />
          Adicionar Cartão
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 bg-red-100 text-red-900 rounded p-3 border border-red-300">
          {errorMessage}
        </div>
      )}

      {/* Floating Save Button */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 border-t flex justify-end md:justify-center ${isDark ? 'bg-dark-surface border-secondary' : 'bg-white border-gray-200'}`}>
         <div className="w-full max-w-3xl flex justify-end space-x-3">
            <button onClick={() => navigate('/')} className="px-6 py-2.5 font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancelar</button>
            <button 
              onClick={handleSave}
              className="px-8 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 flex items-center transition-transform active:scale-95"
            >
              <Save size={18} className="mr-2" />
              Salvar Baralho
            </button>
         </div>
      </div>

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${isDark ? 'bg-dark-surface' : 'bg-white'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center">
                <Wand2 className="mr-2 text-accent" />
                Gerar com Inteligência Artificial
              </h3>
              <button onClick={() => setIsAiModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Cole um texto longo, resumo ou lista de tópicos abaixo. A IA irá extrair automaticamente as perguntas e respostas principais.
            </p>

            <textarea 
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              className={`w-full h-40 p-4 rounded-xl mb-4 text-sm resize-none focus:ring-2 focus:ring-primary outline-none ${
                isDark ? 'bg-dark-bg text-gray-100' : 'bg-gray-50'
              }`}
              placeholder="Cole seu texto aqui..."
            />

            <div className="flex justify-end">
              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiText.trim()}
                className="flex items-center px-6 py-2.5 bg-primary text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : 'Gerar Flashcards'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Editor;
