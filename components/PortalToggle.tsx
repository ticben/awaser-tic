
import React from 'react';
import { User, PenTool, LayoutDashboard } from 'lucide-react';
import { PortalMode, Language } from '../types';
import { translations } from '../translations';

interface PortalToggleProps {
  mode: PortalMode;
  setMode: (mode: PortalMode) => void;
  lang: Language;
}

const PortalToggle: React.FC<PortalToggleProps> = ({ mode, setMode, lang }) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  const modes: { id: PortalMode; icon: React.ReactNode; label: string }[] = [
    { id: 'visitor', icon: <User size={14} />, label: t.visitor },
    { id: 'creator', icon: <PenTool size={14} />, label: t.creator },
    { id: 'curator', icon: <LayoutDashboard size={14} />, label: t.curator },
  ];

  const getActiveIndex = () => modes.findIndex(m => m.id === mode);

  return (
    <div className="w-[300px]">
      <div className="glass-morphism p-1 rounded-full border border-white/10 flex relative shadow-2xl backdrop-blur-md">
        {/* Sliding Background */}
        <div 
          className="absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-indigo-600 rounded-full transition-all duration-500 ease-out shadow-lg shadow-indigo-500/30"
          style={{ 
            left: isAr ? 'auto' : `calc(${getActiveIndex() * 33.33}% + 2px)`,
            right: isAr ? `calc(${getActiveIndex() * 33.33}% + 2px)` : 'auto'
          }}
        />
        
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full relative z-10 transition-colors duration-300 ${
              mode === m.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {m.icon}
            <span className="text-[8px] font-black uppercase tracking-wider mt-0.5">{m.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PortalToggle;
