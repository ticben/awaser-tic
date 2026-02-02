
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Navigation, ZoomIn, ZoomOut, MousePointer2, Sparkles, RefreshCw, Smartphone } from 'lucide-react';
import { Artwork, Language } from '../types';

interface MapExplorerProps {
  artworks: Artwork[];
  onSelectArtwork: (artwork: Artwork) => void;
  lang: Language;
}

const MapExplorer: React.FC<MapExplorerProps> = ({ artworks, onSelectArtwork, lang }) => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [previewArtwork, setPreviewArtwork] = useState<Artwork | null>(null);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [deviceTilt, setDeviceTilt] = useState({ beta: 0, gamma: 0 });
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

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

  const requestDeviceOrientation = async () => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      alert("Motion sensors not supported on this device/browser.");
      return;
    }

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission !== 'granted') return;
      } catch (err) {
        return;
      }
    }

    setMotionEnabled(true);
    const handleOrientation = (event: DeviceOrientationEvent) => {
      setDeviceTilt({ beta: (event.beta ?? 0) * 0.4, gamma: (event.gamma ?? 0) * 0.6 });
    };
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });
  };

  const resetMap = () => setPreviewArtwork(null);

  const focusedOffset = useMemo(() => {
    if (!previewArtwork) return 0;
    const idx = artworks.findIndex(a => a.id === previewArtwork.id);
    return idx * -380;
  }, [previewArtwork, artworks]);

  return (
    <div className="relative h-full w-full bg-[#050505] overflow-hidden flex flex-col perspective-2000">
      <div className="absolute top-10 right-10 z-[70] flex flex-col gap-3">
        <button 
          onClick={resetMap}
          className={`px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all border flex items-center gap-3 ${previewArtwork ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-white/10 text-white/40 border-white/10 opacity-50 cursor-not-allowed'}`}
          disabled={!previewArtwork}
        >
          <RefreshCw className="w-4 h-4" />
          RESET SPATIAL VIEW
        </button>

        {!motionEnabled && (
          <button
            onClick={requestDeviceOrientation}
            className="px-6 py-3 rounded-2xl font-black text-[10px] tracking-[0.2em] bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 backdrop-blur-md"
          >
            <Smartphone className="w-4 h-4" />
            ENABLE MOTION CONTROL
          </button>
        )}
      </div>

      <div className="absolute top-10 left-10 z-[70] pointer-events-none">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-1">Urban Explorer</h1>
        <p className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2">
          <Sparkles size={12} className="animate-pulse" /> Grid Sync: Online
        </p>
      </div>

      <div 
        ref={mapContainerRef}
        className="absolute inset-0 will-change-transform"
        style={{ 
          transformStyle: 'preserve-3d',
          transform: previewArtwork 
            ? `translateZ(420px) rotateX(62deg) rotateZ(2deg) translate3d(${focusedOffset}px, 180px, 0)`
            : motionEnabled
              ? `rotateX(${deviceTilt.beta}deg) rotateY(${deviceTilt.gamma}deg) rotateZ(-6deg) translateZ(20px)`
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
                  <div className={`absolute w-12 h-12 border-2 border-indigo-500/50 rounded-full ${isFocused ? 'animate-pulse' : ''}`}></div>
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
