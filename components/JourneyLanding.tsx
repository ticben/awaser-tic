
import React from 'react';
import { ExperienceJourney, Language } from '../types';
// Fixed: Added missing 'Users' import from 'lucide-react'.
import { ArrowLeft, MapPin, Share2, QrCode, ScrollText, Play, Navigation, ChevronRight, ChevronLeft, Calendar, Sparkles, Megaphone, Clock, Users } from 'lucide-react';
import { translations } from '../translations';

const JourneyLanding: React.FC<{ journey: ExperienceJourney; onBack: () => void; lang: Language }> = ({ journey, onBack, lang }) => {
  const t = translations[lang];
  const isAr = lang === 'ar';
  const isEvent = journey.isEvent;

  return (
    <div className={`fixed inset-0 z-[150] bg-slate-950 overflow-y-auto pb-32 ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Hero Header */}
      <div className="relative h-[50vh] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10"></div>
        <img 
          src={isEvent 
            ? "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=1200" 
            : "https://images.unsplash.com/photo-1548543604-a87a9989feae?q=80&w=1200"
          } 
          className="w-full h-full object-cover" 
          alt="Exhibition Cover" 
        />
        
        <div className="absolute top-12 left-6 right-6 z-20 flex justify-between items-center">
          <button onClick={onBack} className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 transition-all active:scale-90">
            {isAr ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </button>
          <div className="flex gap-2">
             <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 transition-all active:scale-90"><Share2 size={24} /></button>
          </div>
        </div>

        <div className="absolute bottom-10 left-6 right-6 z-20">
          <div className="flex items-center gap-2 mb-3">
            <div className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isEvent ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30' : 'bg-indigo-600 text-white'}`}>
              {isEvent ? <><Sparkles size={10} /> Temporary Exhibition</> : "Permanent Museum Path"}
            </div>
            {isEvent && (
              <div className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black uppercase text-white tracking-widest flex items-center gap-1.5">
                <Clock size={10} /> Limited Time
              </div>
            )}
          </div>
          <h1 className="text-4xl font-black text-white leading-none uppercase tracking-tight mb-2">{journey.theme}</h1>
          <div className="flex items-center gap-4 text-slate-300 text-xs font-medium">
             <span className="flex items-center gap-1"><Users size={12} className="text-indigo-400" /> {journey.creator}</span>
             <span className="h-3 w-px bg-white/20"></span>
             <span className="flex items-center gap-1"><MapPin size={12} className="text-indigo-400" /> 8 Locations</span>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-8 mt-6">
        
        {/* Exhibition Meta Card */}
        {isEvent && (journey.startDate || journey.endDate) && (
          <div className="glass-morphism p-6 rounded-[32px] border border-fuchsia-500/30 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-fuchsia-600 rounded-2xl text-white"><Calendar size={20} /></div>
                <div>
                   <p className="text-[10px] text-fuchsia-400 font-black uppercase tracking-widest">Exhibition Timeline</p>
                   <p className="text-sm font-bold text-white">
                      {journey.startDate || 'Now'} — {journey.endDate || 'TBD'}
                   </p>
                </div>
             </div>
             <div className="px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase">Active Now</div>
          </div>
        )}

        {/* QR Access Card */}
        <div className="glass-morphism p-6 rounded-[32px] border border-white/10 flex items-center gap-6 shadow-2xl relative overflow-hidden group">
          <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ${isEvent ? 'bg-fuchsia-500/10' : 'bg-indigo-500/10'}`}></div>
          <div className="relative z-10 p-1 bg-white rounded-2xl shadow-lg">
             <img src={journey.qrCodeUrl} className="w-24 h-24 rounded-xl" alt="Access QR" />
          </div>
          <div className="flex-1 relative z-10">
            <h3 className="text-white font-black text-xs uppercase tracking-wider mb-1">{t.spatialAccess}</h3>
            <p className="text-slate-400 text-[10px] leading-relaxed">{t.scanDesc}</p>
          </div>
        </div>

        {/* Exhibition Path */}
        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em]">{t.experiencePath}</h4>
              <span className="text-[10px] font-black text-indigo-400">0% VISITED</span>
           </div>

           <div className="space-y-6">
              {journey.points.map((point, idx) => (
                <div key={point.id} className="relative pl-12 group">
                    {/* Timeline Line */}
                    {idx < journey.points.length - 1 && (
                      <div className={`absolute ${isAr ? 'right-[19px]' : 'left-[19px]'} top-10 bottom-[-32px] w-0.5 bg-white/5`}></div>
                    )}
                    
                    {/* Point Marker */}
                    <div className={`absolute ${isAr ? 'right-0' : 'left-0'} top-1 w-10 h-10 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center z-10 shadow-lg group-hover:border-indigo-500 transition-colors`}>
                       <span className="text-[10px] font-black text-slate-500 group-hover:text-indigo-400">{idx + 1}</span>
                    </div>

                    <div className="glass-morphism p-6 rounded-[32px] border border-white/5 hover:border-indigo-500/20 transition-all group-hover:translate-x-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-400"><MapPin size={12} /></div>
                        <ChevronRight size={14} className="text-slate-700 group-hover:text-white transition-colors" />
                      </div>
                      <h5 className="text-base font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{point.title}</h5>
                      <p className="text-[10px] text-slate-500 font-black uppercase mb-4 tracking-widest">{point.location.name}</p>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium mb-6 line-clamp-2">{point.description}</p>
                      
                      <div className="flex gap-2">
                        <button className="flex-1 py-2.5 bg-white/5 rounded-xl text-white text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-white/10 active:scale-95"><ScrollText size={12} /> Insights</button>
                        <button className="flex-1 py-2.5 bg-indigo-600/20 rounded-xl text-indigo-400 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-indigo-600 hover:text-white active:scale-95"><Play size={12} /> Preview</button>
                      </div>
                    </div>
                </div>
              ))}
           </div>
        </div>

        <div className="pt-8">
           <button className={`w-full py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isEvent ? 'bg-fuchsia-600 text-white shadow-fuchsia-500/30' : 'bg-indigo-600 text-white shadow-indigo-500/30'}`}>
              <Navigation size={20} /> {isEvent ? "Start Exhibition Navigation" : t.startNavigation}
           </button>
           <p className="text-center text-[9px] text-slate-600 font-black uppercase tracking-[0.3em] mt-6">Awasser s4 Spatial Protocol v2.1</p>
        </div>
      </div>
    </div>
  );
};

export default JourneyLanding;
