import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Clock, Layers, PlayCircle, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { FlashcardSet } from '../types';
import { saveAs } from 'file-saver'; // certifique-se de instalar 'file-saver' nas dependências do projeto
import { v4 as uuidv4 } from 'uuid'; // certifique-se de instalar 'uuid'
import { logError } from '../utils/logger';

const Dashboard: React.FC = () => {
  const { sets, createSet, deleteSet, settings } = useStore();
  const navigate = useNavigate();
  const [importError, setImportError] = React.useState<string|null>(null);
  const [importSuccess, setImportSuccess] = React.useState<string|null>(null);

  const calculateDueCards = (set: FlashcardSet) => {
    const now = Date.now();
    return set.cards.filter(c => c.nextReview <= now).length;
  };

  const calculateMastery = (set: FlashcardSet) => {
    if (set.cards.length === 0) return 0;
    const graduated = set.cards.filter(c => c.status === 'graduated').length;
    return Math.round((graduated / set.cards.length) * 100);
  };

  // Exporta um único baralho como arquivo JSON
  const handleExport = (set: FlashcardSet) => {
    try {
      const blob = new Blob([JSON.stringify(set, null, 2)], { type: 'application/json' });
      saveAs(blob, `${set.title.replace(/\s/g, '_')}_baralho.json`);
    } catch (err) {
      logError('Erro ao exportar baralho:', err, set);
      setImportError('Erro ao exportar baralho. Veja o console para detalhes.');
    }
  };

  // Importa baralho(s) via input - aceita objeto único ou array
  const handleImport = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    try {
      const file = evt.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Detecta se é array ou objeto único
      const isArray = Array.isArray(data);
      const setsToImport = isArray ? data : [data];
      
      if (setsToImport.length === 0) {
        setImportError('Arquivo vazio ou sem baralhos válidos.');
        logError('Arquivo vazio na importação', data);
        return;
      }

      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // Processa cada baralho
      setsToImport.forEach((setData: any, index: number) => {
        try {
          // Validação do formato
          if (!setData || typeof setData !== 'object') {
            errors.push(`Item ${index + 1}: não é um objeto válido`);
            skippedCount++;
            return;
          }

          if (!setData.title || typeof setData.title !== 'string') {
            errors.push(`Item ${index + 1}: título inválido ou ausente`);
            skippedCount++;
            return;
          }

          if (!Array.isArray(setData.cards)) {
            errors.push(`Item ${index + 1}: campo "cards" deve ser um array`);
            skippedCount++;
            return;
          }

          // Valida cards
          const validCards = setData.cards.filter((card: any) => 
            card && 
            typeof card.front === 'string' && 
            typeof card.back === 'string' &&
            card.front.trim() !== '' &&
            card.back.trim() !== ''
          );

          if (validCards.length === 0 && setData.cards.length > 0) {
            errors.push(`Item ${index + 1}: nenhum card válido encontrado`);
            skippedCount++;
            return;
          }

          // Gera novo ID se já existir
          let newId = uuidv4();
          let newTitle = setData.title;
          if (sets.some(s => s.id === setData.id)) {
            newId = uuidv4();
            newTitle = `${setData.title} (importado)`;
          }

          // Cria o baralho importado
          const importedSet: FlashcardSet = {
            id: newId,
            title: newTitle,
            category: setData.category || 'Geral',
            cards: validCards.map((card: any) => ({
              id: card.id || uuidv4(),
              front: card.front.trim(),
              back: card.back.trim(),
              status: card.status || 'new',
              nextReview: card.nextReview || Date.now(),
              interval: card.interval || 0,
              easeFactor: card.easeFactor || 2.5,
            })),
            createdAt: setData.createdAt || Date.now(),
            lastStudied: setData.lastStudied || null,
          };

          createSet(importedSet);
          importedCount++;
          logError('Baralho importado:', importedSet);
        } catch (err) {
          errors.push(`Item ${index + 1}: erro ao processar - ${err}`);
          skippedCount++;
          logError(`Erro ao importar item ${index + 1}:`, err, setData);
        }
      });

      // Mensagem de resultado
      if (importedCount > 0) {
        const successMsg = isArray 
          ? `${importedCount} baralho(s) importado(s) com sucesso!${skippedCount > 0 ? ` (${skippedCount} ignorado(s))` : ''}`
          : `Baralho "${setsToImport[0].title}" importado com sucesso!`;
        setImportSuccess(successMsg);
      } else {
        setImportError(`Nenhum baralho foi importado.${errors.length > 0 ? ' Verifique o console para detalhes.' : ''}`);
      }

      if (errors.length > 0) {
        logError('Erros durante importação em lote:', errors);
      }

      evt.target.value = '';
    } catch (err) {
      setImportError('Falha ao importar baralho(s). Verifique se o arquivo JSON está válido.');
      logError('Erro ao importar baralho', err);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-1">Meus Baralhos</h2>
          <p className={`${settings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Continue sua jornada de aprendizado.
          </p>
        </div>
        <div className="flex space-x-2 items-center">
          <label className="inline-flex items-center px-4 py-3 bg-green-100 hover:bg-green-200 text-green-800 rounded-xl font-medium cursor-pointer transition-shadow shadow-green-200 shadow-sm">
            <input
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            Importar Baralho
          </label>
          <Link
            to="/create"
            className="inline-flex items-center justify-center space-x-2 bg-primary hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 font-medium"
          >
            <Plus size={20} />
            <span>Novo Baralho</span>
          </Link>
        </div>
      </div>
      {(importError || importSuccess) && (
        <div className={`my-2 px-3 py-2 rounded font-semibold ${importError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {importError || importSuccess}
        </div>
      )}

      {sets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed rounded-3xl ${settings.theme === 'dark' ? 'border-secondary bg-dark-surface/50' : 'border-gray-200 bg-white/50'}`}
        >
          <div className="bg-blue-50 p-4 rounded-full mb-4 dark:bg-blue-900/20">
            <Layers size={40} className="text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhum baralho encontrado</h3>
          <p className="text-gray-500 max-w-sm mb-6">Comece criando seu primeiro conjunto de flashcards para estudar.</p>
          <Link to="/create" className="text-primary font-medium hover:underline">Criar agora &rarr;</Link>
        </motion.div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sets.map((set) => {
            const dueCount = calculateDueCards(set);
            const mastery = calculateMastery(set);
            const isDark = settings.theme === 'dark';

            return (
              <motion.div
                key={set.id}
                variants={item}
                className={`group relative flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  isDark
                    ? 'bg-dark-surface border-secondary hover:border-primary/50'
                    : 'bg-white border-gray-100 hover:border-blue-100 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    isDark ? 'bg-secondary text-blue-300' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {set.category || 'Geral'}
                  </span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.preventDefault(); navigate(`/edit/${set.id}`); }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-400 hover:text-primary transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if(confirm('Tem certeza que deseja excluir este baralho?')) deleteSet(set.id);
                      }}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-gray-400 hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={e => { e.preventDefault(); handleExport(set); }}
                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md text-gray-400 hover:text-blue-500 transition-colors"
                      title="Exportar"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 16.5A1 1 0 0 1 11 15.5V5a1 1 0 1 1 2 0v10.5a1 1 0 0 1-1 1ZM8.21 12.79a1 1 0 1 0-1.42 1.42l3.5 3.5a1 1 0 0 0 1.42 0l3.5-3.5a1 1 0 0 0-1.42-1.42L13 14.09V5a1 1 0 0 0-2 0v9.09l-1.29-1.3Z"></path></svg>
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2 line-clamp-1">{set.title}</h3>

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <div className="flex items-center">
                    <Layers size={14} className="mr-1.5" />
                    {set.cards.length} cartas
                  </div>
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1.5" />
                    {dueCount} para hoje
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-auto">
                   <div className="flex justify-between text-xs mb-1.5 font-medium">
                     <span className="flex items-center text-gray-500"><TrendingUp size={12} className="mr-1"/> Domínio</span>
                     <span className="text-primary">{mastery}%</span>
                   </div>
                   <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                     <div
                      className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${mastery}%` }}
                     />
                   </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                   <Link
                    to={`/study/${set.id}`}
                    className={`flex items-center justify-center w-full py-2.5 rounded-lg font-medium transition-colors ${
                      dueCount > 0
                        ? 'bg-primary text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-secondary dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                   >
                     <PlayCircle size={18} className="mr-2" />
                     {dueCount > 0 ? 'Estudar Agora' : 'Revisar Tudo'}
                   </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
