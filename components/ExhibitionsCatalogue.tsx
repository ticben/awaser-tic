
import React from 'react';
import { ExperienceJourney, Language } from '../types';
import { Calendar, Clock, Sparkles, ChevronRight, Users, MapPin, Search, Loader2 } from 'lucide-react';
import { translations } from '../translations';

interface ExhibitionsCatalogueProps {
  exhibitions: ExperienceJourney[];
  onSelect: (exhibition: ExperienceJourney) => void;
  lang: Language;
  isLoading?: boolean;
}

const MOCK_EXHIBITIONS: ExperienceJourney[] = [
  {
    id: 'e1',
    theme: 'Desert Neons: 2030',
    creator: 'Dr. Noura Al-Saud',
    points: [],
    qrCodeUrl: '#',
    createdAt: '2024-05-01',
    isEvent: true,
    startDate: '2024-06-01',
    endDate: '2024-08-30',
    coverImage: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800'
  },
  {
    id: 'e2',
    theme: 'Murals of Masmak',
    creator: 'Historical Society',
    points: [],
    qrCodeUrl: '#',
    createdAt: '2024-04-15',
    isEvent: false,
    coverImage: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=800'
  }
];

const ExhibitionsCatalogue: React.FC<ExhibitionsCatalogueProps> = ({ exhibitions, onSelect, lang, isLoading }) => {
  const t = translations[lang];
  const isAr = lang === 'ar';

  const allExhibitions = [...MOCK_EXHIBITIONS, ...exhibitions];

  return (
    <div className={`h-full bg-slate-950 pt-28 pb-40 px-6 overflow-y-auto no-scrollbar ${isAr ? 'rtl' : 'ltr'}`}>
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-indigo-500" size={20} />
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">{t.program}</h1>
        </div>
        <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xs">
          Discover curated virtual exhibitions hosted across Riyadh's urban landscape.
        </p>
      </div>

      <div className="relative mb-10">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
        <input 
          placeholder="Search exhibitions..." 
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
           <Loader2 className="text-indigo-500 animate-spin" size={32} />
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hydrating Global Catalogue...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {allExhibitions.map((ex, idx) => (
            <div 
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="group relative glass-morphism rounded-[40px] overflow-hidden border border-white/5 shadow-2xl transition-all active:scale-95 cursor-pointer"
            >
              {/* Cover Image */}
              <div className="h-64 relative">
                <img 
                  src={ex.coverImage || `https://picsum.photos/seed/${ex.id}/800/600`} 
                  alt={ex.theme} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                
                {/* Badges */}
                <div className="absolute top-6 left-6 flex gap-2">
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl backdrop-blur-md border ${ex.isEvent ? 'bg-fuchsia-600/90 border-fuchsia-400/50 text-white' : 'bg-indigo-600/90 border-indigo-400/50 text-white'}`}>
                    {ex.isEvent ? t.timedExhibitions : 'Permanent'}
                  </div>
                  {ex.isEvent && (
                    <div className="px-4 py-1.5 bg-emerald-500/90 border border-emerald-400/50 rounded-full text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                      {t.activeEvents}
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-black text-white leading-tight mb-2 group-hover:text-indigo-400 transition-colors">
                      {ex.theme}
                    </h3>
                    <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Users size={12} className="text-indigo-500" /> {ex.creator}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-indigo-500" /> {ex.points?.length || 0} Sites</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>

                {ex.isEvent && (
                  <div className="pt-6 border-t border-white/5 flex items-center gap-3 text-slate-300">
                    <Calendar size={14} className="text-fuchsia-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {ex.startDate} — {ex.endDate}
                    </span>
                  </div>
                )}
              </div>

              {/* Hover Accent */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">Awasser Museum Protocol • Riyadh 2024</p>
      </div>
    </div>
  );
};

export default ExhibitionsCatalogue;
