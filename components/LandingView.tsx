
import React from 'react';
import { Layers, Globe, Zap, Users, Moon, Sun, Server, ShieldCheck } from 'lucide-react';
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
      {/* Nexus Status Indicator */}
      <div className="flex justify-between items-center mb-8 px-2">
        <div className="flex items-center gap-2">
           <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
           </div>
           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500/80">Nexus Online</span>
        </div>
        
        <button 
          onClick={onToggleNightMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl glass-morphism transition-all active:scale-95 border ${isNightMode ? 'border-fuchsia-500/50' : 'border-white/10'}`}
        >
          {isNightMode ? (
            <>
              <Moon size={14} className="text-fuchsia-400" />
              <span className="text-[8px] font-black text-fuchsia-400 uppercase tracking-widest">Spectral View</span>
            </>
          ) : (
            <>
              <Sun size={14} className="text-amber-400" />
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Classic View</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center mb-12 animate-entry">
        <div className="relative inline-block mb-6">
          <div className={`absolute inset-0 blur-3xl rounded-full opacity-30 ${isNightMode ? 'bg-fuchsia-600' : 'bg-indigo-600'}`}></div>
          <div className={`relative p-5 rounded-[2rem] transition-colors duration-500 border ${isNightMode ? 'bg-fuchsia-600/20 border-fuchsia-500/30' : 'bg-indigo-600/20 border-indigo-500/30'}`}>
            <Layers className={isNightMode ? 'text-fuchsia-500' : 'text-indigo-500'} size={48} />
          </div>
        </div>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">{t.title}</h1>
        <p className={`font-black mb-6 uppercase tracking-[0.3em] text-[10px] transition-colors duration-500 ${isNightMode ? 'text-fuchsia-400' : 'text-indigo-400'}`}>
          {t.subtitle}
        </p>
        <p className="text-slate-400 leading-relaxed text-sm font-medium px-4">
          {t.landingDesc}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-12">
        {[
          { icon: Globe, title: "Geolocated AR", desc: "Digital totems anchored to history.", action: () => setView('explore') },
          { icon: Users, title: "Local Talent", desc: "Digital creators on global stages.", action: () => setView('gallery') },
          { icon: Zap, title: "Catalogs", desc: "Current exhibitions and events.", action: () => setView('exhibitions') },
          { icon: ShieldCheck, title: "Nexus Link", desc: "Verified spatial data security.", action: () => setView('play') }
        ].map((item, i) => (
          <div 
            key={i}
            onClick={item.action} 
            className="glass-morphism p-5 rounded-[2rem] border border-white/5 cursor-pointer hover:border-indigo-500/30 active:scale-95 transition-all group overflow-hidden relative"
          >
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <item.icon size={48} />
             </div>
             <item.icon className={`mb-3 relative z-10 transition-colors ${isNightMode ? 'text-fuchsia-500' : 'text-indigo-500'} group-hover:scale-110 transition-transform`} size={24} />
             <h3 className="text-white font-black text-[11px] mb-1 uppercase tracking-tight relative z-10">{item.title}</h3>
             <p className="text-slate-500 text-[9px] leading-tight font-medium relative z-10">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl transition-all duration-700 border ${isNightMode ? 'bg-gradient-to-br from-fuchsia-900/80 to-slate-900 border-fuchsia-500/20 shadow-fuchsia-500/10' : 'bg-gradient-to-br from-indigo-900/80 to-slate-900 border-indigo-500/20 shadow-indigo-500/10'}`}>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-2 leading-none uppercase tracking-tight">{t.startExploring}</h2>
          <p className={`text-xs mb-8 font-medium leading-relaxed max-w-[80%] ${isNightMode ? 'text-fuchsia-200/60' : 'text-indigo-200/60'}`}>Navigate through Riyadh and find digital markers to unlock exclusive AR art layers.</p>
          <button 
            onClick={() => setView('explore')}
            className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all active:scale-95 shadow-xl ${isNightMode ? 'bg-fuchsia-600 text-white shadow-fuchsia-600/50' : 'bg-white text-indigo-950 shadow-white/20'}`}
          >
            {t.openMap}
          </button>
        </div>
        <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 transition-colors ${isNightMode ? 'bg-fuchsia-500/40' : 'bg-indigo-500/40'}`}></div>
      </div>
      
      <div className="mt-12 text-center">
         <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.4em]">Awasser s4 Spatial Protocol v2.1 • Powered by Gemini & Supabase</p>
      </div>
    </div>
  );
};

export default LandingView;
