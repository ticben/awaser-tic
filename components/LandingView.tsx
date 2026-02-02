
import React from 'react';
import { Layers, Globe, Zap, Users, Moon, Sun } from 'lucide-react';
import { Language, ViewState } from '../types';
import { translations } from '../translations';

interface LandingViewProps {
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  setView: (view: ViewState) => void;
  lang: Language;
}

const LandingView: React.FC<LandingViewProps> = ({ isNightMode, onToggleNightMode, setView, lang }) => {
  const t = translations[lang];

  return (
    <div className="h-full pt-24 px-6 overflow-y-auto pb-32 transition-colors duration-500 no-scrollbar">
      {/* Theme & Access Toggle */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={onToggleNightMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl glass-morphism transition-all active:scale-95 ${isNightMode ? 'border-fuchsia-500/50' : 'border-white/10'}`}
        >
          {isNightMode ? (
            <>
              <Moon size={16} className="text-fuchsia-400" />
              <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest">Night Active</span>
            </>
          ) : (
            <>
              <Sun size={16} className="text-amber-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Normal View</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center mb-12 animate-entry">
        <div className={`inline-block p-4 rounded-3xl mb-6 transition-colors duration-500 ${isNightMode ? 'bg-fuchsia-600/20' : 'bg-indigo-600/20'}`}>
          <Layers className={isNightMode ? 'text-fuchsia-500' : 'text-indigo-500'} size={48} />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">{t.title}</h1>
        <p className={`font-black mb-6 uppercase tracking-[0.2em] text-xs transition-colors duration-500 ${isNightMode ? 'text-fuchsia-400' : 'text-indigo-300'}`}>
          {t.subtitle}
        </p>
        <p className="text-slate-400 leading-relaxed text-sm font-medium">
          {t.landingDesc}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-12">
        <div 
          onClick={() => setView('explore')} 
          className="glass-morphism p-5 rounded-3xl border border-white/5 cursor-pointer hover:border-indigo-500/30 active:scale-95 transition-all group"
        >
          <Globe className={`mb-3 transition-colors ${isNightMode ? 'text-fuchsia-500' : 'text-indigo-500'} group-hover:scale-110 transition-transform`} size={24} />
          <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Geolocated AR</h3>
          <p className="text-slate-500 text-[10px] leading-tight">Digital totems anchored to historical sites.</p>
        </div>
        <div 
          onClick={() => setView('gallery')} 
          className="glass-morphism p-5 rounded-3xl border border-white/5 cursor-pointer hover:border-indigo-500/30 active:scale-95 transition-all group"
        >
          <Users className={`mb-3 transition-colors ${isNightMode ? 'text-fuchsia-500' : 'text-indigo-500'} group-hover:scale-110 transition-transform`} size={24} />
          <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Local Talent</h3>
          <p className="text-slate-500 text-[10px] leading-tight">Empowering digital creators with new stages.</p>
        </div>
        <div 
          onClick={() => setView('exhibitions')}
          className="glass-morphism p-5 rounded-3xl border border-white/5 cursor-pointer hover:border-indigo-500/30 active:scale-95 transition-all group"
        >
          <Zap className={`mb-3 transition-colors ${isNightMode ? 'text-fuchsia-500' : 'text-indigo-500'} group-hover:scale-110 transition-transform`} size={24} />
          <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Catalogs</h3>
          <p className="text-slate-500 text-[10px] leading-tight">Browse current exhibitions and events.</p>
        </div>
        <div 
          onClick={() => setView('play')}
          className="glass-morphism p-5 rounded-3xl border border-white/5 cursor-pointer hover:border-indigo-500/30 active:scale-95 transition-all group"
        >
          <Layers className={`mb-3 transition-colors ${isNightMode ? 'text-fuchsia-500' : 'text-indigo-500'} group-hover:scale-110 transition-transform`} size={24} />
          <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-tight">Urban Play</h3>
          <p className="text-slate-500 text-[10px] leading-tight">Gamified cultural mediation experience.</p>
        </div>
      </div>

      <div className={`rounded-[40px] p-8 relative overflow-hidden shadow-2xl transition-all duration-500 border border-white/10 ${isNightMode ? 'bg-gradient-to-br from-fuchsia-900 to-slate-900 shadow-fuchsia-500/20' : 'bg-gradient-to-br from-indigo-900 to-slate-800 shadow-indigo-500/20'}`}>
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white mb-2">{t.startExploring}</h2>
          <p className={`text-sm mb-8 font-medium leading-relaxed ${isNightMode ? 'text-fuchsia-200' : 'text-indigo-200'}`}>Navigate through the city and find the digital markers to unlock exclusive AR art.</p>
          <button 
            onClick={() => setView('explore')}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all active:scale-95 shadow-xl ${isNightMode ? 'bg-fuchsia-500 text-white shadow-fuchsia-500/50' : 'bg-white text-indigo-900 shadow-white/10'}`}
          >
            {t.openMap}
          </button>
        </div>
        <div className={`absolute top-0 right-0 w-48 h-48 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 transition-colors ${isNightMode ? 'bg-fuchsia-500/30' : 'bg-indigo-500/30'}`}></div>
      </div>
    </div>
  );
};

export default LandingView;
