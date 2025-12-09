import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, PlusCircle, Settings as SettingsIcon, BookOpen } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { settings } = useStore();

  const navItems = [
    { path: '/', icon: <LayoutGrid size={20} />, label: 'Dashboard' },
    { path: '/create', icon: <PlusCircle size={20} />, label: 'Criar' },
    { path: '/settings', icon: <SettingsIcon size={20} />, label: 'Ajustes' },
  ];

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${getFontSizeClass()} ${settings.theme === 'dark' ? 'bg-dark-bg text-dark-text' : 'bg-background text-text'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-md shadow-sm border-b ${settings.theme === 'dark' ? 'bg-dark-surface/80 border-secondary' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-primary text-white p-1.5 rounded-lg shadow-lg shadow-primary/30">
              <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">Flashcards Interativos</h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-secondary dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Icon would go here (omitted for brevity, utilizing bottom nav for mobile) */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 border-t ${settings.theme === 'dark' ? 'bg-dark-surface border-secondary' : 'bg-white border-gray-200'} pb-safe`}>
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
             )
          })}
        </div>
      </div>
    </div>
  );
};

export default Layout;
