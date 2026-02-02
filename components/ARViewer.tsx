
import React, { useEffect, useRef, useState } from 'react';
import { X, Sparkles, MessageSquare, Info, Volume2, Square, Loader2, Palette, Waves, Navigation, Monitor, Camera, Send, Quote, Trophy, Move, Radio, Eye, MapPin, Search, Zap, Globe, HelpCircle, ChevronRight, MousePointer2 } from 'lucide-react';
import { Artwork } from '../types';
import { getCulturalInsights, askMuseumGuide, generateNarrationAudio, identifyLandmarkFromImage } from '../services/geminiService';
import QuizModule from './QuizModule';

// Helper functions for audio decoding as per Gemini API guidelines
// Fix for Error in file components/ARViewer.tsx on line 237: Cannot find name 'decodeBase64'.
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Fix for Error in file components/ARViewer.tsx on line 237: Cannot find name 'decodeAudioData'.
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ModelViewer = 'model-viewer' as any;

interface ARViewerProps {
  artwork?: Artwork;
  onClose: () => void;
}

type ViewMode = 'studio' | 'ar';
type FilterType = 'none' | 'glow' | 'glitch' | 'vintage' | 'neon';

const FILTERS: { id: FilterType; label: string; class: string }[] = [
  { id: 'none', label: 'Raw', class: '' },
  { id: 'glow', label: 'Glow', class: 'brightness-[1.2] saturate-[1.5] contrast-[1.1] drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' },
  { id: 'glitch', label: 'Glitch', class: 'animate-pulse hue-rotate-180 opacity-90' },
  { id: 'vintage', label: 'Vintage', class: 'sepia-[.4] saturate-[.6] contrast-[1.05] brightness-[.9] grayscale-[.2]' },
  { id: 'neon', label: 'Neon', class: 'saturate-[2.5] hue-rotate-[290deg] brightness-110' },
];

const ARViewer: React.FC<ARViewerProps> = ({ artwork, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const modelRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('studio');
  const [insight, setInsight] = useState<string>('Initializing digital experience...');
  const [showChat, setShowChat] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('none');
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  const [spatialDistance, setSpatialDistance] = useState(5);
  const [isSpatialAudioActive, setIsSpatialAudioActive] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [foundLandmark, setFoundLandmark] = useState<any>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const spatialNodesRef = useRef<any>(null);

  const [mouseRotation, setMouseRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  useEffect(() => {
    if (viewMode === 'ar') {
      setupCamera();
    } else {
      stopCamera();
      setFoundLandmark(null);
    }
  }, [viewMode]);

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied", err);
      setViewMode('studio');
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (artwork) loadInsights();
    return () => {
      stopCamera();
      stopNarration();
      stopSpatialAudio();
    };
  }, [artwork]);

  const scanEnvironment = async () => {
    if (!videoRef.current || isScanning) return;
    setIsScanning(true);
    setFoundLandmark(null);

    const video = videoRef.current;
    const canvas = hiddenCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      const result = await identifyLandmarkFromImage(base64);
      if (result && result.recognized) {
        setFoundLandmark(result);
      }
    }
    setIsScanning(false);
  };

  const startSpatialAudio = () => {
    if (isSpatialAudioActive || !artwork || artwork.category !== 'Soundscape') return;
    if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const panner = ctx.createPanner();
    const analyser = ctx.createAnalyser();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, ctx.currentTime);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(110, ctx.currentTime);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    panner.panningModel = 'HRTF';
    analyser.fftSize = 256;

    osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(panner); panner.connect(analyser); analyser.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 2);

    osc1.start(); osc2.start();
    spatialNodesRef.current = { osc1, osc2, gain, panner, filter, analyser };
    setIsSpatialAudioActive(true);
    requestAnimationFrame(updateVisualizer);
  };

  const stopSpatialAudio = () => {
    if (spatialNodesRef.current) {
      const { osc1, osc2, gain } = spatialNodesRef.current;
      const ctx = audioContextRef.current;
      if (ctx) { gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5); setTimeout(() => { osc1.stop(); osc2.stop(); spatialNodesRef.current = null; }, 600); }
    }
    setIsSpatialAudioActive(false);
  };

  useEffect(() => {
    if (spatialNodesRef.current && audioContextRef.current) {
      const { panner, filter, gain } = spatialNodesRef.current;
      const rad = (mouseRotation * Math.PI) / 180;
      const radius = spatialDistance;
      const x = Math.sin(rad) * radius;
      const z = Math.cos(rad) * radius;
      panner.positionX.setTargetAtTime(x, audioContextRef.current.currentTime, 0.1);
      panner.positionZ.setTargetAtTime(z, audioContextRef.current.currentTime, 0.1);
      const freq = Math.max(100, 2000 - (spatialDistance * 180));
      filter.frequency.setTargetAtTime(freq, audioContextRef.current.currentTime, 0.1);
      const volume = Math.max(0, 0.5 - (spatialDistance * 0.04));
      gain.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.1);
    }
  }, [mouseRotation, spatialDistance]);

  const updateVisualizer = () => {
    if (!spatialNodesRef.current || !canvasRef.current) return;
    const { analyser } = spatialNodesRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      ctx.fillStyle = `rgba(99, 102, 241, ${dataArray[i] / 255})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
    if (isSpatialAudioActive) requestAnimationFrame(updateVisualizer);
  };

  const loadInsights = async () => {
    if (!artwork) return;
    const text = await getCulturalInsights(artwork.location.name, artwork.title);
    setInsight(text);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    setDragStart(clientX);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const delta = clientX - dragStart;
    setMouseRotation(prev => (prev + (delta * 0.5) + 360) % 360);
    setDragStart(clientX);
  };

  const handleDragEnd = () => setIsDragging(false);

  const handleAsk = async (e?: React.FormEvent, questionOverride?: string) => {
    if (e) e.preventDefault();
    const q = questionOverride || chatQuestion;
    if (!q.trim()) return;
    setChatQuestion('');
    setIsChatLoading(true);
    setChatResponse(null);
    const answer = await askMuseumGuide(q, `Artwork: ${artwork?.title}. Category: ${artwork?.category}.`);
    setChatResponse(answer);
    setIsChatLoading(false);
  };

  const startNarration = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!artwork || isNarrating) { if (isNarrating) stopNarration(); return; }
    setIsAudioLoading(true);
    const base64Audio = await generateNarrationAudio(artwork.description);
    if (!base64Audio) { setIsAudioLoading(false); return; }
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => { setIsNarrating(false); audioSourceRef.current = null; };
      audioSourceRef.current = source;
      source.start(0);
      setIsNarrating(true);
    } catch (err) { console.error(err); } finally { setIsAudioLoading(false); }
  };

  const stopNarration = () => { if (audioSourceRef.current) { audioSourceRef.current.stop(); audioSourceRef.current = null; } setIsNarrating(false); };

  return (
    <div className="fixed inset-0 z-[60] bg-[#020617] flex flex-col overflow-hidden select-none">
      <canvas ref={hiddenCanvasRef} className="hidden" />
      
      <div className={`absolute inset-0 transition-all duration-700 ${FILTERS.find(f => f.id === currentFilter)?.class || ''}`}>
        {viewMode === 'ar' ? (
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-black to-slate-950">
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15)_0%,transparent_70%)]"></div>
          </div>
        )}
        
        <div 
          ref={containerRef}
          onMouseDown={handleDragStart} onMouseMove={handleDragMove} onMouseUp={handleDragEnd}
          onTouchStart={handleDragStart} onTouchMove={handleDragMove} onTouchEnd={handleDragEnd}
          className="absolute inset-0 flex items-center justify-center z-[4] pointer-events-auto"
        >
          <div className="relative transition-transform duration-75 ease-out flex items-center justify-center" style={{ transform: viewMode === 'ar' ? `rotateY(${mouseRotation}deg)` : 'none' }}>
            {artwork?.modelUrl ? (
              <div className="w-[80vw] h-[60vh]">
                <ModelViewer ref={modelRef} src={artwork.modelUrl} auto-rotate camera-controls className="w-full h-full" environment-image="neutral" shadow-intensity="1" />
              </div>
            ) : (
              <div className="relative group max-w-[90vw] max-h-[70vh]">
                <img src={artwork?.imageUrl} className={`rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/10 transition-all duration-1000 ${viewMode === 'ar' ? 'animate-ar-pulse opacity-80 scale-90' : 'scale-100 opacity-100'}`} alt="Digital Art" />
                {viewMode === 'studio' && <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl -z-10 rounded-full animate-pulse"></div>}
              </div>
            )}
          </div>
        </div>

        {viewMode === 'ar' && foundLandmark && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
             <div className="animate-in zoom-in fade-in duration-500 glass-morphism p-8 rounded-[40px] border-2 border-indigo-500/30 max-w-xs shadow-[0_0_40px_rgba(99,102,241,0.2)] pointer-events-auto relative">
                <button onClick={() => setFoundLandmark(null)} className="absolute -top-3 -right-3 p-2 bg-indigo-600 rounded-full text-white shadow-lg"><X size={16} /></button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-indigo-600/20 rounded-2xl text-indigo-400 border border-indigo-500/20"><MapPin size={24} /></div>
                  <div>
                    <h3 className="text-lg font-black text-white">{foundLandmark.landmark}</h3>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Recognized Landmark</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-6 font-medium">{foundLandmark.history}</p>
                <div className="pt-6 border-t border-white/5">
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">Suggested Art Theme</p>
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
                    <Sparkles size={14} /> {foundLandmark.suggestedTheme}
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="relative z-50 flex justify-between items-start p-8 pt-16 pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          <button onClick={onClose} className="p-4 bg-black/40 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-white/10 transition-all"><X size={24} /></button>
          <div className="flex bg-black/40 backdrop-blur-xl rounded-full p-1 border border-white/10">
            <button onClick={() => setViewMode('studio')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'studio' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Monitor size={16} /> Studio
            </button>
            <button onClick={() => setViewMode('ar')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'ar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Camera size={16} /> AR View
            </button>
          </div>
        </div>

        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={() => setShowTutorial(true)} 
            className="p-4 bg-black/40 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-indigo-600/50 transition-all"
          >
            <HelpCircle size={24} />
          </button>
          {viewMode === 'ar' && (
            <button 
              onClick={scanEnvironment} 
              disabled={isScanning}
              className={`p-4 rounded-full text-white backdrop-blur-xl border border-white/10 transition-all ${isScanning ? 'bg-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-black/40'}`}
            >
              {isScanning ? <Loader2 size={24} className="animate-spin" /> : <Zap size={24} />}
            </button>
          )}
          {artwork?.category === 'Soundscape' && (
            <button onClick={() => isSpatialAudioActive ? stopSpatialAudio() : startSpatialAudio()} className={`p-4 rounded-full text-white backdrop-blur-xl border border-white/10 transition-all ${isSpatialAudioActive ? 'bg-fuchsia-600' : 'bg-black/40'}`}>
              <Waves size={24} className={isSpatialAudioActive ? 'animate-pulse' : ''} />
            </button>
          )}
          <button onClick={() => setCurrentFilter(f => f === 'none' ? 'glow' : 'none')} className={`p-4 rounded-full text-white backdrop-blur-xl border border-white/10 ${currentFilter !== 'none' ? 'bg-indigo-600' : 'bg-black/40'}`}>
            <Palette size={24} />
          </button>
        </div>
      </div>

      <div className="relative z-50 p-8 pb-12 mt-auto pointer-events-none">
        <div className="max-w-xl mx-auto w-full pointer-events-auto">
          {!showQuiz && !showTutorial && (
            <div className="glass-morphism rounded-[40px] p-8 border border-white/10 shadow-2xl space-y-6">
              {artwork?.category === 'Soundscape' && isSpatialAudioActive && (
                <div className="space-y-4 animate-in slide-in-from-bottom-2">
                  <canvas ref={canvasRef} width={400} height={40} className="w-full h-10 rounded-xl bg-black/20" />
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <Move size={16} className="text-indigo-400" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                        <span>Physical Anchor</span> <span>Distance: {spatialDistance}m</span>
                      </div>
                      <input type="range" min="1" max="10" step="0.1" value={spatialDistance} onChange={(e) => setSpatialDistance(parseFloat(e.target.value))} className="w-full accent-indigo-500 bg-white/10 h-1 rounded-full appearance-none cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20"><Sparkles size={24} className="animate-pulse" /></div>
                  <div>
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">AI Guide Active</h4>
                    <p className="text-sm font-black text-white">{artwork?.title}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={startNarration} className="p-3 bg-white/5 rounded-2xl text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all">
                    {isAudioLoading ? <Loader2 className="animate-spin" size={20} /> : isNarrating ? <Square size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed pl-8 italic border-l-2 border-indigo-500/20">{insight}</p>

              <div className="flex gap-4">
                <button onClick={() => setShowChat(true)} className="flex-1 py-4 bg-indigo-600 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 active:scale-95 transition-all shadow-xl shadow-indigo-600/20">
                  <MessageSquare size={18} /> Tour Guide
                </button>
                <button onClick={() => setShowQuiz(true)} className="px-6 bg-white/5 rounded-2xl text-white border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                  <Trophy size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TUTORIAL OVERLAY */}
      {showTutorial && (
        <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-8 animate-in fade-in duration-500">
          <div className="glass-morphism rounded-[48px] border border-white/10 p-10 max-w-sm w-full shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="w-20 h-20 bg-indigo-600 rounded-[30px] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 mb-2">
                 <Globe size={40} className="animate-pulse" />
               </div>
               <h3 className="text-2xl font-black text-white tracking-tight uppercase">Interface Guide</h3>
               <p className="text-xs text-slate-400 font-medium">Master the Awasser spatial protocol for an optimal experience.</p>
            </div>

            <div className="space-y-6">
               <div className="flex items-start gap-5">
                 <div className="p-3 bg-white/5 rounded-2xl text-indigo-400 border border-white/5"><MousePointer2 size={18} /></div>
                 <div>
                   <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Spatial Orbit</h4>
                   <p className="text-[10px] text-slate-500 leading-relaxed">Drag anywhere to rotate the artifact and inspect digital details.</p>
                 </div>
               </div>
               
               <div className="flex items-start gap-5">
                 <div className="p-3 bg-white/5 rounded-2xl text-indigo-400 border border-white/5"><Zap size={18} /></div>
                 <div>
                   <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">Urban Scan</h4>
                   <p className="text-[10px] text-slate-500 leading-relaxed">In AR Mode, use the scan button to identify local landmarks around you.</p>
                 </div>
               </div>

               <div className="flex items-start gap-5">
                 <div className="p-3 bg-white/5 rounded-2xl text-indigo-400 border border-white/5"><MessageSquare size={18} /></div>
                 <div>
                   <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">AI Mediator</h4>
                   <p className="text-[10px] text-slate-500 leading-relaxed">Tap Tour Guide for contextual insights and a deep dive into the art.</p>
                 </div>
               </div>
            </div>

            <button 
              onClick={() => setShowTutorial(false)}
              className="w-full py-5 bg-white text-indigo-900 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Engage Layer <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {showChat && (
        <div className="absolute inset-0 z-[100] flex flex-col bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
              <header className="p-8 pt-20 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[20px] bg-indigo-600 flex items-center justify-center text-white shadow-2xl"><Sparkles size={28} /></div>
                  <div><h3 className="text-white font-black text-lg tracking-tight">Digital Arts Guide</h3><p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Contextual Analysis</p></div>
                </div>
                <button onClick={() => setShowChat(false)} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><X size={24} /></button>
              </header>
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {chatResponse && (
                  <div className="flex gap-5 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white shadow-xl"><Sparkles size={24} /></div>
                    <div className="bg-indigo-600/10 p-8 rounded-[35px] border border-indigo-500/20 max-w-[85%] shadow-inner">
                      <p className="text-sm text-white leading-relaxed">{chatResponse}</p>
                    </div>
                  </div>
                )}
                {isChatLoading && <div className="flex gap-5 animate-pulse"><div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex-shrink-0 flex items-center justify-center text-indigo-400"><Loader2 className="animate-spin" size={24} /></div></div>}
              </div>
              <footer className="p-8 bg-slate-900/50 border-t border-white/5 space-y-8 pb-16">
                <form onSubmit={handleAsk} className="flex gap-4">
                  <input value={chatQuestion} onChange={e => setChatQuestion(e.target.value)} placeholder="Ask about the digital art technique..." className="flex-1 bg-white/5 border border-white/10 rounded-[25px] px-8 py-5 text-sm text-white outline-none focus:border-indigo-500 transition-all shadow-inner" />
                  <button type="submit" disabled={isChatLoading || !chatQuestion.trim()} className="bg-indigo-600 p-5 rounded-[25px] text-white disabled:opacity-50 hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-600/40"><Send size={24} /></button>
                </form>
              </footer>
           </div>
        </div>
      )}

      {showQuiz && artwork && (
        <div className="absolute inset-0 z-[150] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-6">
           <div className="glass-morphism rounded-[40px] border border-white/10 w-full max-w-lg shadow-2xl overflow-hidden">
              <header className="p-8 border-b border-white/5 flex justify-between items-center bg-indigo-600/10">
                 <div className="flex items-center gap-3"><Trophy className="text-amber-400" size={24} /><h3 className="text-white font-black text-lg uppercase tracking-tight">Cultural Challenge</h3></div>
                 <button onClick={() => setShowQuiz(false)} className="p-2 text-slate-400 hover:text-white transition-all"><X size={24} /></button>
              </header>
              <QuizModule artwork={artwork} onClose={() => setShowQuiz(false)} onComplete={(score) => { alert(`Challenge Complete! Score: ${score}/3`); setShowQuiz(false); }} />
           </div>
        </div>
      )}
    </div>
  );
};

export default ARViewer;
