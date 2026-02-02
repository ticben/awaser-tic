
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Navigation, ZoomIn, ZoomOut, MousePointer2, Sparkles, RefreshCw, Smartphone, Globe, Layers, X } from 'lucide-react';
import { Artwork, Language } from '../types';

/**
 * Fixed: Added global declaration for google to fix "Cannot find name 'google'"
 */
declare var google: any;

interface MapExplorerProps {
  artworks: Artwork[];
  onSelectArtwork: (artwork: Artwork) => void;
  lang: Language;
}

const DARK_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#020617" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#6366f1" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#6366f1" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#334155" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const MapExplorer: React.FC<MapExplorerProps> = ({ artworks, onSelectArtwork, lang }) => {
  const [viewType, setViewType] = useState<'spatial' | 'satellite'>('spatial');
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [previewArtwork, setPreviewArtwork] = useState<Artwork | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<HTMLDivElement>(null);
  /**
   * Fixed: Use any to avoid "Cannot find namespace 'google'" error if type definitions are missing
   */
  const mapInstance = useRef<any>(null);

  // Helper to extract Drive File ID
  function extractFileId(url: string | undefined) {
    if (!url) return '';
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
  }

  // Initialize Google Map
  useEffect(() => {
    if (viewType === 'satellite' && googleMapRef.current && !mapInstance.current) {
      /**
       * Fixed: Uses global google instance from declared variable
       */
      const map = new google.maps.Map(googleMapRef.current, {
        center: { lat: 24.7136, lng: 46.6753 },
        zoom: 12,
        styles: DARK_MAP_STYLE,
        disableDefaultUI: true,
        zoomControl: true,
      });

      mapInstance.current = map;

      artworks.forEach(point => {
        /**
         * Fixed: Uses global google instance
         */
        const marker = new google.maps.Marker({
          position: { lat: point.location.lat, lng: point.location.lng },
          map: map,
          title: point.title,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#6366f1',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
            scale: 8
          }
        });

        const driveImg = extractFileId(point.imageUrl);
        const driveAudio = extractFileId(point.audioUrl);
        const driveVideo = extractFileId(point.videoUrl);

        const contentString = `
          <div style="max-width: 280px; font-family: 'Plus Jakarta Sans', sans-serif; background: #020617; color: white; padding: 12px; border-radius: 16px; direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; text-align: ${lang === 'ar' ? 'right' : 'left'};">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 800; text-transform: uppercase; color: #6366f1;">${point.title}</h3>
            <p style="font-size: 11px; color: #94a3b8; margin-bottom: 12px;">${point.description}</p>
            
            ${driveImg ? `<img src="https://drive.google.com/uc?export=view&id=${driveImg}" style="width:100%; border-radius:12px; margin-bottom:12px; border: 1px solid rgba(255,255,255,0.1);" />` : `<img src="${point.imageUrl}" style="width:100%; border-radius:12px; margin-bottom:12px;" />`}
            
            ${point.audioUrl ? `
              <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 12px; margin-bottom: 8px;">
                <audio controls style="width: 100%; height: 30px;">
                  <source src="https://drive.google.com/uc?export=view&id=${driveAudio}" type="audio/mpeg">
                </audio>
              </div>
            ` : ''}

            ${point.videoUrl ? `
              <video controls style="width: 100%; border-radius: 12px; margin-bottom: 8px;">
                <source src="https://drive.google.com/uc?export=view&id=${driveVideo}" type="video/mp4">
              </video>
            ` : ''}

            <button id="enter-ar-${point.id}" style="width: 100%; background: #6366f1; color: white; border: none; padding: 10px; border-radius: 12px; font-weight: 800; font-size: 10px; text-transform: uppercase; cursor: pointer; letter-spacing: 1px;">
              ${lang === 'ar' ? 'دخول الواقع المعزز ←' : 'Enter AR Layer →'}
            </button>
          </div>
        `;

        /**
         * Fixed: Uses global google instance
         */
        const infoWindow = new google.maps.InfoWindow({
          content: contentString,
          maxWidth: 300,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
          /**
           * Fixed: Uses global google instance
           */
          google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
            const btn = document.getElementById(`enter-ar-${point.id}`);
            if (btn) btn.onclick = () => onSelectArtwork(point);
          });
        });
      });
    }
  }, [viewType, artworks, lang, onSelectArtwork]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!mapContainerRef.current) return;
      const rect = mapContainerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMouse({
        x: (x - 0.5) * 2,
        y: (y - 0.5) * 2,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const resetMap = () => setPreviewArtwork(null);

  const focusedOffset = useMemo(() => {
    if (!previewArtwork) return 0;
    const idx = artworks.findIndex(a => a.id === previewArtwork.id);
    return idx * -380;
  }, [previewArtwork, artworks]);

  return (
    <div className="relative h-full w-full bg-[#050505] overflow-hidden flex flex-col perspective-2000">
      
      {/* View Toggles */}
      <div className="absolute top-10 right-10 z-[70] flex flex-col gap-3">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-1 flex">
           <button 
            onClick={() => setViewType('spatial')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'spatial' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             <Layers size={14} /> Spatial
           </button>
           <button 
            onClick={() => setViewType('satellite')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'satellite' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
           >
             <Globe size={14} /> Satellite
           </button>
        </div>

        {viewType === 'spatial' && (
          <button 
            onClick={resetMap}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all border flex items-center gap-3 ${previewArtwork ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-white/10 text-white/40 border-white/10 opacity-50 cursor-not-allowed'}`}
            disabled={!previewArtwork}
          >
            <RefreshCw className="w-4 h-4" />
            RESET SPATIAL VIEW
          </button>
        )}
      </div>

      <div className="absolute top-10 left-10 z-[70] pointer-events-none">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-1">Urban Explorer</h1>
        <p className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2">
          <Sparkles size={12} className="animate-pulse" /> {viewType === 'spatial' ? 'Spatial Grid Sync' : 'Geolocated Link'}
        </p>
      </div>

      {/* SATELLITE GOOGLE MAP VIEW */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${viewType === 'satellite' ? 'opacity-100 z-50' : 'opacity-0 -z-10'}`}>
        <div ref={googleMapRef} className="w-full h-full" />
      </div>

      {/* SPATIAL 3D GRID VIEW */}
      <div 
        ref={mapContainerRef}
        className={`absolute inset-0 will-change-transform ${viewType === 'spatial' ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: previewArtwork 
            ? `translateZ(420px) rotateX(62deg) rotateZ(2deg) translate3d(${focusedOffset}px, 180px, 0)`
            : `rotateX(${mouse.y * 10}deg) rotateY(${mouse.x * -18}deg) rotateZ(-6deg) translateZ(20px)`,
          transition: previewArtwork ? 'transform 1.3s cubic-bezier(0.23, 1, 0.32, 1)' : 'transform 0.4s ease-out',
        }}
        onClick={(e) => e.target === e.currentTarget && resetMap()}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4200px] h-[4200px] opacity-[0.08] pointer-events-none"
          style={{ backgroundImage: 'linear-gradient(to right, #6366f1 1.5px, transparent 1.5px), linear-gradient(to bottom, #6366f1 1.5px, transparent 1.5px)', backgroundSize: '90px 90px', maskImage: 'radial-gradient(circle, white 15%, transparent 75%)', transform: 'translateZ(-600px) scale(1.4)' }}
        />

        {artworks.map((art, i) => {
          const isFocused = previewArtwork?.id === art.id;
          const xPos = (i - (artworks.length - 1) / 2) * 380; 
          const yPos = (i - (artworks.length - 1) / 2) * 140;

          return (
            <div key={art.id} className="absolute left-1/2 top-1/2 transition-all duration-1000" style={{ transform: `translate(${xPos}px, ${yPos}px) translateZ(0)`, transformStyle: 'preserve-3d', zIndex: isFocused ? 120 : i + 1 }}>
              <div className="group relative cursor-pointer" style={{ transformStyle: 'preserve-3d' }} onClick={(e) => { e.stopPropagation(); isFocused ? onSelectArtwork(art) : setPreviewArtwork(art); }}>
                <div className="absolute -inset-10 flex items-center justify-center">
                  <div className={`absolute w-20 h-20 border border-indigo-500/30 rounded-full animate-[ping_3s_infinite] ${isFocused ? 'scale-150' : ''}`}></div>
                </div>

                <div className={`p-4 rounded-[22px] border-2 transition-all duration-[900ms] ${isFocused ? 'bg-indigo-600 border-white text-white shadow-[0_20px_50px_rgba(99,102,241,0.6)]' : 'bg-slate-950 border-indigo-500/30 text-indigo-400 group-hover:border-indigo-400'}`}
                  style={{ transform: isFocused ? 'rotateX(-60deg) translateZ(120px) scale(1.08)' : 'rotateX(-65deg) translateZ(0) scale(0.92)', transformStyle: 'preserve-3d' }}>
                  <MapPin size={isFocused ? 32 : 24} fill={isFocused ? "currentColor" : "none"} />
                </div>

                <div className={`absolute -top-[340px] left-1/2 -translate-x-1/2 w-80 p-6 glass-effect rounded-[40px] shadow-[0_35px_70px_rgba(0,0,0,0.55)] transition-all duration-[1000ms] ${isFocused ? 'opacity-100' : 'opacity-0 translate-y-20 pointer-events-none'}`}
                  style={{ transform: isFocused ? 'rotateX(-58deg) translateZ(160px) scale(1.1)' : 'rotateX(-65deg) translateZ(20px) scale(0.8)', transformStyle: 'preserve-3d' }}>
                  <img src={art.imageUrl} className="w-full h-40 object-cover rounded-[28px] mb-4" alt={art.title} />
                  <h4 className="text-white font-black text-lg mb-1 uppercase tracking-tight">{art.title}</h4>
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-3">@{art.artist}</p>
                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{art.location.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); onSelectArtwork(art); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Enter AR →</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MapExplorer;
