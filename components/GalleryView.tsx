
import React, { useState, useEffect } from 'react';
import { Artwork, Language } from '../types';
import { translations } from '../translations';
import { History, Sparkles, Clock } from 'lucide-react';

interface GalleryViewProps {
  artworks: Artwork[];
  onSelectArtwork: (artwork: Artwork) => void;
  lang: Language;
}

const GalleryView: React.FC<GalleryViewProps> = ({ artworks, onSelectArtwork, lang }) => {
  const t = translations[lang];
  const [recentArtworks, setRecentArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    const savedIds = localStorage.getItem('awasser_recently_viewed');
    if (savedIds) {
      const ids: string[] = JSON.parse(savedIds);
      const matched = ids
        .map(id => artworks.find(art => art.id === id))
        .filter(Boolean) as Artwork[];
      setRecentArtworks(matched);
    }
  }, [artworks]);

  return (
    <div className="h-full bg-slate-950 pt-32 pb-40 px-6 overflow-y-auto no-scrollbar">
      {recentArtworks.length > 0 && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Clock size={16} className="text-indigo-400" />
            <h2 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">{t.recentlyViewed}</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
            {recentArtworks.map(artwork => (
              <div key={`recent-${artwork.id}`} onClick={() => onSelectArtwork(artwork)} className="flex-shrink-0 w-44 snap-start cursor-pointer active:scale-95 transition-transform">
                <div className="glass-morphism rounded-[28px] overflow-hidden border border-white/10 shadow-lg relative aspect-[4/5]">
                  <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover opacity-70" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-1 truncate">{artwork.artist}</p>
                    <h3 className="text-sm font-bold text-white truncate">{artwork.title}</h3>
                  </div>
                  <div className="absolute top-3 right-3 p-1.5 bg-indigo-600/80 rounded-full text-white shadow-lg"><Sparkles size={10} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Digital Vault</h1>
        <p className="text-slate-500 text-xs font-medium leading-relaxed">Archived and active virtual installations from Riyadh's spatial cloud.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {artworks.map(artwork => (
          <div key={artwork.id} onClick={() => onSelectArtwork(artwork)} className="group glass-morphism rounded-[40px] overflow-hidden cursor-pointer transform transition-all active:scale-95 border border-white/5 shadow-2xl">
            <div className="h-56 relative overflow-hidden">
              <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-6 left-6 bg-indigo-600/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg">{artwork.category}</div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-2">
                 <h3 className="text-2xl font-black text-white leading-none">{artwork.title}</h3>
                 <div className="p-2 bg-white/5 rounded-xl text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <History size={16} />
                 </div>
              </div>
              <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">@{artwork.artist}</p>
              <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed font-medium mb-6">{artwork.description}</p>
              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]"></div>
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.15em]">{artwork.location.name}</span>
                </div>
                <div className="text-white font-black text-[9px] uppercase tracking-widest group-hover:text-indigo-400 transition-colors">Enter Spatial Layer →</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryView;
