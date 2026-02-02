
import React, { useState, useEffect } from 'react';
import { Globe, Sparkles, MapPin, Loader2, RefreshCw, X, Zap, Box, Database, LogOut, Factory, Hammer, Monitor, Trash2, Activity, FileText, Cloud, Server, Cpu, Plus, Anchor, Eye, ArrowRight, ChevronRight, ChevronLeft, Settings, Building2, CheckCircle2, Link as LinkIcon, Layers, Smartphone, Image as ImageIcon, Shield, Palette, User, Bell, Languages, HardDrive, Upload, Map as MapIcon } from 'lucide-react';
import { enhanceJourneyPoints, searchDeploymentSites } from '../services/geminiService';
import { MediaAsset, ExperienceJourney, Language, PortalMode, POI } from '../types';
import { translations } from '../translations';
import { db, supabase } from '../lib/supabase';

interface DashboardProps {
  onPublishJourney: (journey: ExperienceJourney) => void;
  onExit: () => void;
  lang: Language;
  portalMode: PortalMode;
}

const Dashboard: React.FC<DashboardProps> = ({ onPublishJourney, onExit, lang, portalMode }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'spatial' | 'forge' | 'settings'>('overview');
  const t = translations[lang];
  const isAr = lang === 'ar';
  
  const [mediaVault, setMediaVault] = useState<MediaAsset[]>([]);
  const [exhibitions, setExhibitions] = useState<ExperienceJourney[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [nexusStatus, setNexusStatus] = useState<'online' | 'offline' | 'error'>('offline');

  // --- FORGE CMS STATE ---
  const [forgeStep, setForgeStep] = useState<1 | 2 | 3 | 4>(1);
  const [forgeTheme, setForgeTheme] = useState('');
  const [forgeCity, setForgeCity] = useState('');
  const [forgeCountry, setForgeCountry] = useState('');
  const [forgeOrg, setForgeOrg] = useState('Independent Curator');
  
  const [forgePoints, setForgePoints] = useState<{title: string, locationName: string, lat?: number, lng?: number}[]>([]);
  const [newPointInput, setNewPointInput] = useState('');
  
  const [enhancedPoints, setEnhancedPoints] = useState<any[]>([]);
  const [isForging, setIsForging] = useState(false);
  
  const [selectedAssetForPoint, setSelectedAssetForPoint] = useState<Record<number, string>>({});

  useEffect(() => {
    syncNexusData();
  }, []);

  async function syncNexusData() {
    try {
      setIsSyncing(true);
      const { error } = await supabase.from('artworks').select('id').limit(1);
      if (error) throw error;
      setNexusStatus('online');
      const [exList, mediaList] = await Promise.all([db.exhibitions.getAll(), db.mediaVault.getAll()]);
      setExhibitions(exList || []);
      setMediaVault(mediaList || []);
    } catch (error) {
      console.error("Nexus Sync Failed", error);
      setNexusStatus('error');
    } finally {
      setIsSyncing(false);
    }
  }

  const handleAddPoint = async () => {
    if (!newPointInput.trim()) return;
    setIsForging(true);
    // Use Gemini to resolve point location roughly or find landmarks
    const siteData = await searchDeploymentSites(newPointInput, forgeCity);
    const newPoint = { 
      title: newPointInput, 
      locationName: newPointInput,
      // Default to 0 if not found, usually searchDeploymentSites would provide chunks with coordinates if toolConfig is correct
      lat: 0, lng: 0 
    };
    setForgePoints([...forgePoints, newPoint]);
    setNewPointInput('');
    setIsForging(false);
  };

  const handleConsultAssistant = async () => {
    if (!forgeTheme || forgePoints.length === 0) return;
    setIsForging(true);
    try {
      const enhancement = await enhanceJourneyPoints(forgeTheme, forgeCity, forgePoints);
      if (enhancement) {
        setEnhancedPoints(forgePoints.map((p, i) => ({ ...p, ...enhancement[i] })));
        setForgeStep(3);
      }
    } catch (err) {
      console.error("Gemini assistance failed", err);
    } finally {
      setIsForging(false);
    }
  };

  const handleFinalizeJourney = async () => {
    setIsForging(true);
    // Rough geocoding for cities if center is missing (in a real app, use Google Geocoding API)
    const finalPoints: POI[] = enhancedPoints.map((p, i) => ({
      id: `p-${Date.now()}-${i}`,
      title: p.title,
      description: p.description,
      location: { 
        lat: p.lat || 0, 
        lng: p.lng || 0, 
        name: p.locationName, 
        city: forgeCity 
      },
      narrativeInsight: p.narrativeInsight,
      anchoredAssetId: selectedAssetForPoint[i],
      displayMode: p.recommendedMode || 'hybrid'
    }));

    const newJourney = {
      theme: forgeTheme,
      city: forgeCity,
      country: forgeCountry,
      organization: forgeOrg,
      creator: "Nexus Architect",
      points: finalPoints,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=awasser-exp-${Date.now()}`,
      is_event: true,
      cover_image: mediaVault[0]?.url || "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800"
    };

    try {
      const saved = await db.exhibitions.create(newJourney);
      setExhibitions([saved, ...exhibitions]);
      onPublishJourney(saved);
      setForgeStep(1);
      setForgePoints([]);
      setEnhancedPoints([]);
      setActiveTab('overview');
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setIsForging(false);
    }
  };

  return (
    <div className={`flex h-screen w-full bg-[#010409] text-slate-100 overflow-hidden font-sans ${isAr ? 'rtl' : 'ltr'}`}>
      <aside className="w-80 flex-shrink-0 bg-[#0d1117] border-r border-white/5 flex flex-col z-30 shadow-2xl">
        <div className="p-10 flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-fuchsia-600 rounded-[1.25rem] flex items-center justify-center">
            <Cpu className="text-white" size={30} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter">AWASSER</h2>
            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.3em] mt-1.5">Global CMS v4</p>
          </div>
        </div>
        <nav className="flex-1 px-6 space-y-2">
          {[{ id: 'overview', label: "Control Center", icon: <Activity size={20} /> }, { id: 'forge', label: "Global Forge", icon: <Factory size={20} /> }, { id: 'media', label: "Vault Assets", icon: <Database size={20} /> }, { id: 'settings', label: "Nexus Config", icon: <Settings size={20} /> }].map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${activeTab === item.id ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}>
              <div className={`${activeTab === item.id ? 'text-indigo-400' : 'text-slate-600'}`}>{item.icon}</div>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-10 border-t border-white/5 bg-white/[0.02]">
          <button onClick={onExit} className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-red-400"><LogOut size={20} /><span className="text-[10px] font-black uppercase tracking-widest">Logout</span></button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-28 border-b border-white/5 px-16 flex items-center justify-between backdrop-blur-3xl bg-black/20">
          <div>
            <h1 className="text-3xl font-black text-white uppercase">{activeTab}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] flex items-center gap-2"><Globe size={12} className="text-indigo-500" /> Multi-City Spatial Node</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-16 no-scrollbar">
          {activeTab === 'forge' ? (
            <div className="max-w-5xl mx-auto space-y-12">
               <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                  {[1, 2, 3, 4].map(step => (
                    <div key={step} className="flex items-center gap-4 group">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${forgeStep === step ? 'bg-indigo-600 text-white shadow-xl' : forgeStep > step ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-600'}`}>
                          {forgeStep > step ? <CheckCircle2 size={16} /> : step}
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${forgeStep === step ? 'text-white' : 'text-slate-600'}`}>{step === 1 ? 'Concept' : step === 2 ? 'Sites' : step === 3 ? 'Anchor' : 'Publish'}</span>
                       {step < 4 && <div className="w-12 h-px bg-white/5 mx-2"></div>}
                    </div>
                  ))}
               </div>

               {forgeStep === 1 && (
                 <div className="glass-morphism p-12 rounded-[3.5rem] border border-white/5 space-y-10 animate-in fade-in slide-in-from-bottom-6">
                    <div className="space-y-4 text-center">
                       <h2 className="text-3xl font-black text-white uppercase">Global Project Initiation</h2>
                       <p className="text-xs text-slate-500">Deploy digital museum infrastructure to any city worldwide.</p>
                    </div>
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Exhibition Theme</label>
                          <input value={forgeTheme} onChange={e => setForgeTheme(e.target.value)} placeholder="e.g., Cyberpunk Heritage" className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-white font-black text-lg focus:border-indigo-600" />
                       </div>
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">City</label>
                             <input value={forgeCity} onChange={e => setForgeCity(e.target.value)} placeholder="e.g., Paris, Tokyo..." className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-white font-black text-lg focus:border-indigo-600" />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Country</label>
                             <input value={forgeCountry} onChange={e => setForgeCountry(e.target.value)} placeholder="e.g., France, Japan..." className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-white font-black text-lg focus:border-indigo-600" />
                          </div>
                       </div>
                    </div>
                    <button onClick={() => setForgeStep(2)} disabled={!forgeTheme || !forgeCity} className="w-full py-6 bg-white text-indigo-950 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-30">Lock Geolocation <ChevronRight size={18} className="inline ml-2"/></button>
                 </div>
               )}

               {forgeStep === 2 && (
                 <div className="grid grid-cols-12 gap-10">
                    <div className="col-span-5 space-y-8">
                       <div className="glass-morphism p-10 rounded-[3rem] border border-white/5 space-y-8">
                          <h3 className="text-xl font-black text-white uppercase">Map Anchors</h3>
                          <div className="space-y-3">
                             <input value={newPointInput} onChange={e => setNewPointInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPoint()} placeholder="Enter Local Landmark..." className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-indigo-600 outline-none" />
                             <button onClick={handleAddPoint} className="w-full py-4 bg-indigo-600 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"><Plus size={16} /> Add to City Grid</button>
                          </div>
                          <div className="pt-8 border-t border-white/5">
                             <button onClick={handleConsultAssistant} disabled={forgePoints.length === 0 || isForging} className="w-full py-6 bg-white text-indigo-950 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3">
                                {isForging ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />} Consult AI Architect
                             </button>
                          </div>
                       </div>
                    </div>
                    <div className="col-span-7 space-y-6">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">{forgeCity} Project Ledger</h4>
                       <div className="space-y-4">
                          {forgePoints.map((p, i) => (
                            <div key={i} className="glass-morphism p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                               <div className="flex items-center gap-6">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs">{i+1}</div>
                                  <h5 className="font-black text-white uppercase">{p.title}</h5>
                               </div>
                               <button onClick={() => setForgePoints(forgePoints.filter((_, idx) => idx !== i))} className="p-3 text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
               )}
               {/* Steps 3 and 4 remain similar but work with dynamic points */}
               {forgeStep === 3 && (
                 <div className="space-y-12">
                   <div className="flex justify-between items-end">
                      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Spatial Synthesis</h2>
                      <button onClick={() => setForgeStep(4)} className="px-10 py-5 bg-indigo-600 rounded-2xl text-white text-[10px] font-black uppercase shadow-2xl">Publish Global <ChevronRight size={18}/></button>
                   </div>
                   <div className="grid grid-cols-2 gap-8">
                      {enhancedPoints.map((p, i) => (
                        <div key={i} className="glass-morphism p-8 rounded-[3rem] border border-white/5 space-y-6">
                           <div className="flex items-center gap-5">
                              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white"><MapPin size={28}/></div>
                              <div>
                                 <h4 className="text-xl font-black text-white uppercase">{p.title}</h4>
                                 <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">{forgeCity} Anchor</p>
                              </div>
                           </div>
                           <div className="p-5 bg-black/40 rounded-2xl text-[11px] text-slate-400 italic">{p.narrativeInsight}</div>
                           <select value={selectedAssetForPoint[i] || ''} onChange={e => setSelectedAssetForPoint({...selectedAssetForPoint, [i]: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-[10px] font-black uppercase outline-none">
                              <option value="">Select Asset from Vault...</option>
                              {mediaVault.map(asset => (<option key={asset.id} value={asset.id}>{asset.title}</option>))}
                           </select>
                        </div>
                      ))}
                   </div>
                 </div>
               )}
               {forgeStep === 4 && (
                 <div className="max-w-3xl mx-auto glass-morphism p-12 rounded-[4rem] border border-indigo-500/20 text-center space-y-10">
                    <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white mx-auto"><CheckCircle2 size={56} /></div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Global Node Ready</h2>
                    <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 text-left space-y-4">
                       <div className="flex justify-between items-center pb-4 border-b border-white/5"><span className="text-[10px] font-black text-slate-500 uppercase">City Hub</span><span className="text-sm font-black text-white uppercase">{forgeCity}, {forgeCountry}</span></div>
                    </div>
                    <button onClick={handleFinalizeJourney} disabled={isForging} className="w-full py-6 bg-indigo-600 rounded-3xl text-white text-xs font-black uppercase shadow-2xl flex items-center justify-center gap-3">
                       {isForging ? <Loader2 className="animate-spin" size={20}/> : <Anchor size={20}/>} Broadcast to Global Grid
                    </button>
                 </div>
               )}
            </div>
          ) : (
            <div className="space-y-12">
               {/* Other tabs content */}
               <div className="grid grid-cols-4 gap-8">
                  {[ { label: "Total Exhibitions", val: exhibitions.length, color: "text-indigo-400" }, { label: "Global Hubs", val: new Set(exhibitions.map(e => e.city)).size, color: "text-emerald-400" } ].map((s, i) => (
                    <div key={i} className="glass-morphism p-8 rounded-[2.5rem] border border-white/5">
                       <p className="text-[10px] font-black text-slate-500 uppercase mb-4">{s.label}</p>
                       <h4 className={`text-5xl font-black ${s.color} tracking-tighter`}>{s.val}</h4>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
