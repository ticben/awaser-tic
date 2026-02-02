
import React from 'react';
import { Camera, Map as MapIcon, Image as ImageIcon, Info, Trophy, BookOpen } from 'lucide-react';
import { ViewState, Language } from '../types';
import { translations } from '../translations';

interface HeaderProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  lang: Language;
  onARClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, lang, onARClick }) => {
  const t = translations[lang];

  return (
    <header className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
      <nav className="glass-morphism rounded-full px-4 py-4 flex justify-between items-center shadow-2xl border border-white/10 backdrop-blur-xl">
        <button 
          onClick={() => setView('landing')}
          className={`p-2 rounded-full transition-all relative group active:scale-90 ${currentView === 'landing' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          title={t.info}
        >
          <Info size={20} />
        </button>
        <button 
          onClick={() => setView('exhibitions')}
          className={`p-2 rounded-full transition-all relative group active:scale-90 ${currentView === 'exhibitions' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          title={t.catalogue}
        >
          <BookOpen size={20} />
        </button>
        <button 
          onClick={() => setView('explore')}
          className={`p-2 rounded-full transition-all relative group active:scale-90 ${currentView === 'explore' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          title={t.explore}
        >
          <MapIcon size={20} />
        </button>
        
        <button 
          onClick={onARClick || (() => setView('ar-view'))}
          className={`p-4 bg-indigo-500 rounded-full -translate-y-8 shadow-indigo-500/50 shadow-xl transition-all hover:scale-110 active:scale-95 text-white center-ar-btn flex items-center justify-center`}
        >
          <Camera size={28} />
        </button>

        <button 
          onClick={() => setView('play')}
          className={`p-2 rounded-full transition-all relative group active:scale-90 ${currentView === 'play' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          title={t.play}
        >
          <Trophy size={20} />
        </button>

        <button 
          onClick={() => setView('gallery')}
          className={`p-2 rounded-full transition-all relative group active:scale-90 ${currentView === 'gallery' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          title={t.gallery}
        >
          <ImageIcon size={20} />
        </button>
      </nav>
    </header>
  );
};

export default Header;
