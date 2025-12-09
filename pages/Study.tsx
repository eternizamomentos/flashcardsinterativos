import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCw, CheckCircle2, ChevronRight, ChevronLeft, Award } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { Flashcard, SRSStatus } from '../types';
import { logError } from '../utils/logger';

// Simple SRS Logic
const calculateNextReview = (rating: 'easy' | 'medium' | 'hard', currentInterval: number, currentEase: number) => {
  let newInterval = 0;
  let newEase = currentEase;

  if (rating === 'hard') {
    newInterval = 0; // Same day
    newEase = Math.max(1.3, currentEase - 0.2);
  } else if (rating === 'medium') {
    newInterval = currentInterval === 0 ? 1 : Math.round(currentInterval * 1.5);
    newEase = Math.max(1.3, currentEase - 0.15);
  } else if (rating === 'easy') {
    newInterval = currentInterval === 0 ? 3 : Math.round(currentInterval * currentEase * 1.3); // Bonus
    newEase = currentEase + 0.15;
  }

  // Convert days to milliseconds for storage
  const nextReviewDate = Date.now() + (newInterval * 24 * 60 * 60 * 1000);
  
  return { nextReviewDate, newInterval, newEase };
};

const Study: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSet, updateSet, settings } = useStore();
  
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidCount, setInvalidCount] = useState(0);

  useEffect(() => {
    // Reset caso navegação troque de baralho ou retorne
    setSessionCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
    setError(null);
    setInvalidCount(0);

    if (id) {
      const set = getSet(id);
      logError({
        context: 'INICIO DA SESSÃO',
        id,
        setExists: !!set,
        setSnapshot: set,
      });
      if (!set) {
        logError({ contexto: 'Baralho não encontrado', id });
        setError('Baralho não encontrado.');
        return;
      }
      if (!set.cards || !Array.isArray(set.cards) || set.cards.length === 0) {
        logError({ contexto: 'Baralho sem cards ou cards inválidos', id, cards: set.cards });
        setError('Este baralho não possui nenhum cartão para estudar.');
        return;
      }
      // Filtragem e validação dos cards
      const now = Date.now();
      let invalids = 0;
      const due = set.cards.filter((c, idx) => {
        const valido = c && typeof c.front === 'string' && typeof c.back === 'string' && c.front.trim() !== '' && c.back.trim() !== '' && typeof c.id === 'string';
        if (!valido) {
          invalids++;
          logError({ contexto: 'Card inválido detectado', idx, card: c });
        }
        return valido && (c.nextReview <= now || c.status === 'new');
      }).sort((a, b) => a.nextReview - b.nextReview);
      setInvalidCount(invalids);
      if (invalids > 0) logError({ contexto: 'Resumo da filtragem', totalCards: set.cards.length, removidos: invalids });

      if (due.length > 0) {
        setSessionCards(due);
        setError(null);
        logError({ contexto: 'Sessão inicializada', totalCards: set.cards.length, cardsVálidos: due.length, removidos: invalids });
      } else {
        setIsFinished(true);
        setError(null);
        logError({ contexto: 'Nenhum card disponível após filtragem', totalCards: set.cards.length, removidos: invalids });
      }
    }
  }, [id, getSet]);

  useEffect(() => {
    if (currentIndex >= sessionCards.length && sessionCards.length > 0) {
      logError({ contexto: 'currentIndex acima do limite', currentIndex, sessionCardsLength: sessionCards.length });
      setCurrentIndex(sessionCards.length - 1);
    }
  }, [currentIndex, sessionCards.length]);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleAnswer = useCallback((rating: 'easy' | 'medium' | 'hard') => {
    if (!id || sessionCards.length === 0) {
      logError({ contexto: 'Tentou responder sem sessões válidas', id, sessionCards });
      return;
    }
    const currentCard = sessionCards[currentIndex];
    if (!currentCard || !('interval' in currentCard) || !('easeFactor' in currentCard)) {
      setError('Este cartão está corrompido ou incompleto.');
      logError({ contexto: 'Card inválido ao responder', currentIndex, card: currentCard });
      return;
    }
    const { nextReviewDate, newInterval, newEase } = calculateNextReview(rating, currentCard.interval, currentCard.easeFactor);
    let newStatus: SRSStatus = 'learning';
    if (newInterval > 21) newStatus = 'graduated';
    else if (newInterval > 0) newStatus = 'review';
    // Update global store
    const fullSet = getSet(id);
    if (fullSet) {
      const updatedCards = fullSet.cards.map(c =>
        c.id === currentCard.id
          ? { ...c, nextReview: nextReviewDate, interval: newInterval, easeFactor: newEase, status: newStatus }
          : c
      );
      updateSet(id, { cards: updatedCards, lastStudied: Date.now() });
    }
    if (currentIndex < sessionCards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
    } else {
      setIsFinished(true);
      logError({ contexto: 'Final da sessão', id, currentIndex, total: sessionCards.length });
    }
  }, [id, sessionCards, currentIndex, getSet, updateSet]);

  const isDark = settings.theme === 'dark';

  if (error) {
    logError({ contexto: 'Render de erro na UI', error, sessionCards, currentIndex });
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-red-800 dark:text-red-200">
        <h2 className="text-2xl font-bold mb-2">Algo deu errado</h2>
        <p className="mb-3">{error}{invalidCount > 0 && ` (${invalidCount} card(s) inválido(s) não serão mostrados)`}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-8 py-3 bg-primary text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  if (isFinished) {
    logError({ contexto: 'Render de sessão finalizada', sessionCards, currentIndex });
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }} 
          className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-6"
        >
          <Award size={48} />
        </motion.div>
        <h2 className="text-3xl font-bold mb-2">Parabéns!</h2>
        <p className="text-gray-500 mb-8 max-w-md">Você revisou todos os cartões pendentes para este baralho. Volte amanhã para manter o conhecimento fresco.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-primary text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  if (sessionCards.length === 0) {
    logError({ contexto: 'Render de sessão vazia', sessionCards, currentIndex });
    return <div className="p-8 text-center">Carregando sessão de estudo...</div>;
  }

  const currentCard = sessionCards[currentIndex];
  if (!currentCard || typeof currentCard.front !== 'string' || typeof currentCard.back !== 'string') {
    setError('O cartão atual está corrompido.');
    logError({ contexto: 'Detectado cartão inválido ao renderizar', currentIndex, card: currentCard, sessionCards });
    return null;
  }
  const progress = ((currentIndex) / sessionCards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-140px)]">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center w-full max-w-xs mx-4">
           <div className="flex justify-between w-full text-xs font-medium text-gray-400 mb-1.5">
              <span>Cartão {currentIndex + 1} de {sessionCards.length}</span>
              <span>{Math.round(progress)}%</span>
           </div>
           <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-primary" 
               initial={{ width: 0 }}
               animate={{ width: `${progress}%` }}
             />
           </div>
        </div>
        <div className="w-6" /> {/* Spacer for centering */}
      </div>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center perspective-1000 relative">
         <div className="relative w-full aspect-[4/3] md:aspect-[16/10] cursor-pointer group" onClick={handleFlip}>
            <motion.div
              className={`absolute inset-0 w-full h-full rounded-3xl shadow-xl border p-8 md:p-12 flex flex-col items-center justify-center text-center backface-hidden transition-all duration-500 ${
                isDark ? 'bg-dark-surface border-secondary' : 'bg-white border-gray-100'
              }`}
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              style={{ backfaceVisibility: 'hidden' }}
            >
              <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-widest text-gray-400">Frente</span>
              <p className={`text-2xl md:text-3xl font-medium leading-relaxed select-none ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                {currentCard.front}
              </p>
              <div className="absolute bottom-6 text-gray-400 text-sm flex items-center opacity-50 group-hover:opacity-100 transition-opacity">
                <RotateCw size={14} className="mr-1.5" /> Clique para virar
              </div>
            </motion.div>

            <motion.div
              className={`absolute inset-0 w-full h-full rounded-3xl shadow-xl border p-8 md:p-12 flex flex-col items-center justify-center text-center backface-hidden transition-all duration-500 ${
                isDark ? 'bg-dark-surface border-secondary' : 'bg-white border-blue-50'
              }`}
              initial={false}
              animate={{ rotateY: isFlipped ? 360 : 180 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <span className="absolute top-6 left-6 text-xs font-bold uppercase tracking-widest text-primary">Verso</span>
              <p className={`text-xl md:text-2xl leading-relaxed select-none ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                {currentCard.back}
              </p>
            </motion.div>
         </div>
      </div>

      {/* Controls */}
      <div className="mt-8 h-24">
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <motion.div 
              key="flip-btn"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <button 
                onClick={handleFlip}
                className="w-full max-w-sm py-4 bg-secondary text-white dark:bg-white dark:text-black rounded-xl font-semibold shadow-lg active:scale-[0.98] transition-all"
              >
                Mostrar Resposta
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="rate-btns"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-4"
            >
              <button 
                onClick={() => handleAnswer('hard')}
                className="flex flex-col items-center justify-center py-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-xl font-medium hover:bg-red-200 transition-colors border border-transparent hover:border-red-300"
              >
                <span className="text-sm mb-1">Difícil</span>
                <span className="text-xs opacity-70">Hoje</span>
              </button>
              <button 
                onClick={() => handleAnswer('medium')}
                className="flex flex-col items-center justify-center py-3 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-xl font-medium hover:bg-blue-200 transition-colors border border-transparent hover:border-blue-300"
              >
                <span className="text-sm mb-1">Médio</span>
                <span className="text-xs opacity-70">+1 dia</span>
              </button>
              <button 
                onClick={() => handleAnswer('easy')}
                className="flex flex-col items-center justify-center py-3 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-xl font-medium hover:bg-green-200 transition-colors border border-transparent hover:border-green-300"
              >
                <span className="text-sm mb-1">Fácil</span>
                <span className="text-xs opacity-70">+3 dias</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Study;
