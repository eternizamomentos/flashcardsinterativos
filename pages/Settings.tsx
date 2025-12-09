import React from 'react';
import { Moon, Sun, Type, Globe, Check } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { AppSettings } from '../types';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useStore();

  const isDark = settings.theme === 'dark';

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">Ajustes</h2>

      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-dark-surface border-secondary' : 'bg-white border-gray-100 shadow-sm'}`}>
        
        {/* Theme Section */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center mb-4">
            <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
              {isDark ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <h3 className="font-semibold text-lg">Aparência</h3>
              <p className="text-sm text-gray-500">Escolha como você quer ver o app</p>
            </div>
          </div>
          
          <div className="flex bg-gray-100 dark:bg-black/20 p-1 rounded-xl">
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !isDark ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Claro
            </button>
            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                isDark ? 'bg-secondary shadow-sm text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Escuro
            </button>
          </div>
        </div>

        {/* Font Size Section */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
           <div className="flex items-center mb-4">
            <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Type size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Tamanho da Fonte</h3>
              <p className="text-sm text-gray-500">Ajuste a legibilidade dos textos</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                onClick={() => updateSettings({ fontSize: size })}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-center ${
                  settings.fontSize === size 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {size === 'small' && 'Pequena'}
                {size === 'medium' && 'Média'}
                {size === 'large' && 'Grande'}
              </button>
            ))}
          </div>
        </div>

        {/* Language Section */}
        <div className="p-6">
           <div className="flex items-center mb-4">
            <div className={`p-2 rounded-lg mr-3 ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>
              <Globe size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Idioma</h3>
              <p className="text-sm text-gray-500">Região e linguagem da interface</p>
            </div>
          </div>
          
          <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'border-primary/30 bg-primary/10' : 'border-primary/20 bg-blue-50/50'}`}>
            <div className="flex items-center">
              <span className="text-2xl mr-3">🇧🇷</span>
              <span className="font-medium">Português (Brasil)</span>
            </div>
            <div className="bg-primary text-white rounded-full p-1">
              <Check size={14} />
            </div>
          </div>
        </div>

      </div>
      
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">Versão 1.0.0 • Flashcards Interativos</p>
      </div>
    </div>
  );
};

export default Settings;
