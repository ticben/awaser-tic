
import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Sparkles,
  MapPin,
  Loader2,
  RefreshCw,
  X,
  Zap,
  Box,
  Database,
  LogOut,
  Factory,
  Hammer,
  Monitor,
  Trash2,
  Activity,
  FileText,
  Cloud,
  Server,
  Cpu,
  Plus,
  Anchor,
  Eye,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Settings,
  Building2,
  CheckCircle2,
  Link as LinkIcon,
  Layers,
  Smartphone,
  Image as ImageIcon,
  Shield,
  Palette,
  User,
  Bell,
  Languages,
  HardDrive,
  Upload
} from 'lucide-react';
import { enhanceJourneyPoints } from '../services/geminiService';
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
  const [forgeCity, setForgeCity] = useState('Global Grid');
  const [forgeOrg, setForgeOrg] = useState('Independent Curator');
  
  const [forgePoints, setForgePoints] = useState<{title: string, locationName: string}[]>([]);
  const [newPointInput, setNewPointInput] = useState('');
  
  const [enhancedPoints, setEnhancedPoints] = useState<any[]>([]);
  const [isForging, setIsForging] = useState(false);
  
  const [selectedAssetForPoint, setSelectedAssetForPoint] = useState<Record<number, string>>({});

  // --- SETTINGS STATE ---
  const [settingsData, setSettingsData] = useState({
    orgName: 'Independent Curator',
    primaryColor: '#6366f1',
    storageLimit: '5GB',
    autoSync: true,
    publicAccess: true
  });

  // --- MEDIA INGESTION STATE ---
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ title: '', type: 'photo' as any, url: '' });

  useEffect(() => {
    syncNexusData();
  }, []);

  async function syncNexusData() {
    try {
      setIsSyncing(true);
      const { error } = await supabase.from('artworks').select('id').limit(1);
      if (error) throw error;
      setNexusStatus('online');

      const [exList, mediaList] = await Promise.all([
        db.exhibitions.getAll(),
        db.mediaVault.getAll()
      ]);
      setExhibitions(exList || []);
      setMediaVault(mediaList || []);
    } catch (error) {
      console.error("Nexus Sync Failed", error);
      setNexusStatus('error');
    } finally {
      setIsSyncing(false);
    }
  }

  const handleIngestAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.title || !newAsset.url) return;
    
    setIsSyncing(true);
    try {
      const added = await db.mediaVault.add({
        ...newAsset,
        status: 'live',
        size_in_mb: Math.floor(Math.random() * 50) + 1
      });
      if (added) {
        setMediaVault(prev => [added, ...prev]);
        setShowIngestModal(false);
        setNewAsset({ title: '', type: 'photo' as any, url: '' });
      }
    } catch (err) {
      console.error("Ingestion failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddPoint = () => {
    if (!newPointInput.trim()) return;
    setForgePoints([...forgePoints, { title: newPointInput, locationName: newPointInput }]);
    setNewPointInput('');
  };

  const handleConsultAssistant = async () => {
    if (!forgeTheme || forgePoints.length === 0) return;
    setIsForging(true);
    try {
      const enhancement = await enhanceJourneyPoints(forgeTheme, forgeCity, forgePoints);
      if (enhancement) {
        setEnhancedPoints(forgePoints.map((p, i) => ({
          ...p,
          ...enhancement[i]
        })));
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
    const finalPoints: POI[] = enhancedPoints.map((p, i) => ({
      id: `p-${Date.now()}-${i}`,
      title: p.title,
      description: p.description,
      location: { lat: 0, lng: 0, name: p.locationName, city: forgeCity },
      narrativeInsight: p.narrativeInsight,
      anchoredAssetId: selectedAssetForPoint[i],
      displayMode: p.recommendedMode || 'hybrid'
    }));

    const newJourney = {
      theme: forgeTheme,
      city: forgeCity,
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
      
      {/* SIDEBAR */}
      <aside className="w-80 flex-shrink-0 bg-[#0d1117] border-r border-white/5 flex flex-col z-30 shadow-2xl">
        <div className="p-10 flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-fuchsia-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <Cpu className="text-white" size={30} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter leading-none">AWASSER</h2>
            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.3em] mt-1.5">CMS v4 Production</p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {[
            { id: 'overview', label: "Control Center", icon: <Activity size={20} /> },
            { id: 'forge', label: "Exhibition Forge", icon: <Factory size={20} /> },
            { id: 'media', label: "Vault Assets", icon: <Database size={20} /> },
            { id: 'settings', label: "Nexus Config", icon: <Settings size={20} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-white/10 text-white border border-white/10 shadow-lg' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <div className={`${activeTab === item.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-indigo-400'}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-10 border-t border-white/5 bg-white/[0.02]">
          <div className="mb-6 space-y-3">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Global Link</span>
                <div className={`w-2 h-2 rounded-full ${nexusStatus === 'online' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
             </div>
             <div className="p-3 bg-black/40 rounded-xl border border-white/5 truncate">
                <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">{forgeOrg}</span>
             </div>
          </div>
          <button onClick={onExit} className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors">
            <LogOut size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Logout Nexus</span>
          </button>
        </div>
      </aside>

      {/* WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 to-[#010409]">
        
        <header className="h-28 flex-shrink-0 border-b border-white/5 px-16 flex items-center justify-between z-20 backdrop-blur-3xl bg-black/20">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{activeTab}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
              <Cloud size={12} className="text-indigo-500" /> Multi-Tenant Spatial Cloud
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-xs font-black text-white uppercase">{forgeOrg}</p>
              <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Administrator</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 p-1">
               <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${forgeOrg}`} className="w-full h-full rounded-xl" alt="org" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-16 no-scrollbar">
          {activeTab === 'overview' ? (
            <div className="space-y-12">
               <div className="grid grid-cols-4 gap-8">
                  {[
                    { label: "Total Exhibitions", val: exhibitions.length, color: "text-indigo-400" },
                    { label: "Digital Anchors", val: exhibitions.reduce((acc, ex) => acc + (ex.points?.length || 0), 0), color: "text-fuchsia-400" },
                    { label: "Vault Resources", val: mediaVault.length, color: "text-amber-400" },
                    { label: "Global Nodes", val: "Online", color: "text-emerald-400" }
                  ].map((s, i) => (
                    <div key={i} className="glass-morphism p-8 rounded-[2.5rem] border border-white/5">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">{s.label}</p>
                       <h4 className={`text-5xl font-black ${s.color} tracking-tighter`}>{s.val}</h4>
                    </div>
                  ))}
               </div>

               <div className="glass-morphism rounded-[3rem] border border-white/5 overflow-hidden">
                  <div className="p-10 border-b border-white/5 flex justify-between items-center">
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">Active Projects Ledger</h3>
                     <button onClick={() => setActiveTab('forge')} className="px-8 py-3 bg-indigo-600 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl">Start New Project</button>
                  </div>
                  <div className="p-6">
                     {exhibitions.length === 0 ? (
                       <p className="py-20 text-center text-slate-600 font-black uppercase text-xs tracking-widest">No projects in cloud</p>
                     ) : (
                       <div className="space-y-4">
                          {exhibitions.map(ex => (
                            <div key={ex.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                               <div className="flex items-center gap-6">
                                  <div className="w-12 h-12 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400">
                                     <Globe size={24} />
                                  </div>
                                  <div>
                                     <h5 className="text-lg font-black text-white uppercase">{ex.theme}</h5>
                                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{ex.city} • {ex.points?.length || 0} Anchors</p>
                                  </div>
                               </div>
                               <button className="p-4 text-slate-600 hover:text-white transition-all"><ArrowRight size={20} /></button>
                            </div>
                          ))}
                       </div>
                     )}
                  </div>
               </div>
            </div>
          ) : activeTab === 'forge' ? (
            <div className="max-w-5xl mx-auto space-y-12">
               {/* Progress Bar */}
               <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
                  {[1, 2, 3, 4].map(step => (
                    <div key={step} className="flex items-center gap-4 group">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${forgeStep === step ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : forgeStep > step ? 'bg-emerald-500 text-white' : 'bg-white/5 text-slate-600'}`}>
                          {forgeStep > step ? <CheckCircle2 size={16} /> : step}
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${forgeStep === step ? 'text-white' : 'text-slate-600'}`}>
                          {step === 1 ? 'Concept' : step === 2 ? 'Sites' : step === 3 ? 'Anchor' : 'Publish'}
                       </span>
                       {step < 4 && <div className="w-12 h-px bg-white/5 mx-2"></div>}
                    </div>
                  ))}
               </div>

               {/* Step 1: Concept */}
               {forgeStep === 1 && (
                 <div className="glass-morphism p-12 rounded-[3.5rem] border border-white/5 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <div className="space-y-4">
                       <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Define Exhibition Concept</h2>
                       <p className="text-xs text-slate-500 font-medium">Initialize your project with a theme and global city anchor.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Exhibition Theme</label>
                          <input value={forgeTheme} onChange={e => setForgeTheme(e.target.value)} placeholder="e.g., Neon Silk Road" className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-white font-black text-lg focus:outline-none focus:border-indigo-600" />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Target City</label>
                          <input value={forgeCity} onChange={e => setForgeCity(e.target.value)} placeholder="e.g., Tokyo, Riyadh, London..." className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-white font-black text-lg focus:outline-none focus:border-indigo-600" />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Organization / Tenant</label>
                       <input value={forgeOrg} onChange={e => setForgeOrg(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-8 text-white font-bold text-sm focus:outline-none focus:border-indigo-600" />
                    </div>
                    <button onClick={() => setForgeStep(2)} disabled={!forgeTheme || !forgeCity} className="w-full py-6 bg-white text-indigo-950 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 disabled:opacity-30">Configure Site Ledger <ChevronRight size={18} className="inline ml-2"/></button>
                 </div>
               )}

               {/* Step 2: Site Ledger */}
               {forgeStep === 2 && (
                 <div className="grid grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <div className="col-span-5 space-y-8">
                       <div className="glass-morphism p-10 rounded-[3rem] border border-white/5 space-y-8">
                          <h3 className="text-xl font-black text-white uppercase tracking-tight">Anchor Site</h3>
                          <div className="space-y-3">
                             <input value={newPointInput} onChange={e => setNewPointInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPoint()} placeholder="Enter Landmark Name..." className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-indigo-600 outline-none" />
                             <button onClick={handleAddPoint} className="w-full py-4 bg-indigo-600 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"><Plus size={16} /> Add to Path</button>
                          </div>
                          <div className="pt-8 border-t border-white/5">
                             <button onClick={handleConsultAssistant} disabled={forgePoints.length === 0 || isForging} className="w-full py-6 bg-white text-indigo-950 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-30">
                                {isForging ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                                Consult Nexus Assistant
                             </button>
                          </div>
                       </div>
                    </div>
                    <div className="col-span-7 space-y-6">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Experience Path Ledger ({forgePoints.length})</h4>
                       <div className="space-y-4">
                          {forgePoints.length === 0 ? (
                            <div className="py-24 border-2 border-dashed border-white/5 rounded-[3rem] text-center">
                               <MapPin size={48} className="text-slate-800 mx-auto mb-4" />
                               <p className="text-xs font-black text-slate-700 uppercase tracking-widest">ledger empty</p>
                            </div>
                          ) : (
                            forgePoints.map((p, i) => (
                              <div key={i} className="glass-morphism p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                                 <div className="flex items-center gap-6">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-xs">{i+1}</div>
                                    <h5 className="font-black text-white uppercase">{p.title}</h5>
                                 </div>
                                 <button onClick={() => setForgePoints(forgePoints.filter((_, idx) => idx !== i))} className="p-3 text-slate-700 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                 </div>
               )}

               {/* Step 3: Asset Anchoring */}
               {forgeStep === 3 && (
                 <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
                    <div className="flex justify-between items-end">
                       <div>
                          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Asset & Narrative Synthesis</h2>
                          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Assistant has generated visions. Now anchor vault resources.</p>
                       </div>
                       <button onClick={() => setForgeStep(4)} className="px-10 py-5 bg-indigo-600 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3">Review & Publish <ArrowRight size={18}/></button>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                       {enhancedPoints.map((p, i) => (
                         <div key={i} className="glass-morphism p-8 rounded-[3rem] border border-white/5 space-y-6 relative group overflow-hidden">
                            <div className="flex items-center gap-5">
                               <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><MapPin size={28}/></div>
                               <div>
                                  <h4 className="text-xl font-black text-white uppercase">{p.title}</h4>
                                  <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Site {i+1} • {p.recommendedMode}</p>
                               </div>
                            </div>
                            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-[11px] text-slate-400 leading-relaxed italic">{p.narrativeInsight}</div>
                            
                            <div className="space-y-3">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Anchor Digital Resource</label>
                               <select 
                                 value={selectedAssetForPoint[i] || ''} 
                                 onChange={e => setSelectedAssetForPoint({...selectedAssetForPoint, [i]: e.target.value})}
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-[10px] font-black uppercase tracking-widest focus:border-indigo-600 outline-none"
                               >
                                  <option value="">Select Asset from Vault...</option>
                                  {mediaVault.map(asset => (
                                    <option key={asset.id} value={asset.id}>{asset.title} ({asset.type})</option>
                                  ))}
                               </select>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}

               {/* Step 4: Review & Publish */}
               {forgeStep === 4 && (
                 <div className="max-w-3xl mx-auto glass-morphism p-12 rounded-[4rem] border border-indigo-500/20 text-center space-y-10 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/40 mx-auto mb-4">
                       <CheckCircle2 size={56} />
                    </div>
                    <div>
                       <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Synthesis Complete</h2>
                       <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto mt-2">Your exhibition is ready to be anchored to the global spatial cloud.</p>
                    </div>
                    <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 text-left space-y-4">
                       <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Theme</span>
                          <span className="text-sm font-black text-white uppercase">{forgeTheme}</span>
                       </div>
                       <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</span>
                          <span className="text-sm font-black text-white uppercase">{forgeCity}</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Path points</span>
                          <span className="text-sm font-black text-white uppercase">{enhancedPoints.length} sites</span>
                       </div>
                    </div>
                    <div className="flex gap-6">
                       <button onClick={() => setForgeStep(3)} className="flex-1 py-6 bg-white/5 border border-white/10 rounded-3xl text-slate-400 text-xs font-black uppercase tracking-widest">Back to Forge</button>
                       <button onClick={handleFinalizeJourney} disabled={isForging} className="flex-[2] py-6 bg-indigo-600 rounded-3xl text-white text-xs font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                          {isForging ? <Loader2 className="animate-spin" size={20}/> : <Anchor size={20}/>}
                          Publish to Global Grid
                       </button>
                    </div>
                 </div>
               )}
            </div>
          ) : activeTab === 'media' ? (
            <div className="space-y-12">
               <div className="flex justify-between items-end bg-white/[0.02] p-12 rounded-[3.5rem] border border-white/5">
                  <div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Vault Repository</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Cloud-hosted high-fidelity assets</p>
                  </div>
                  <button onClick={() => setShowIngestModal(true)} className="px-12 py-5 bg-indigo-600 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-2xl flex items-center gap-2">
                    <Upload size={18} /> Ingest Global Asset
                  </button>
               </div>
               
               {mediaVault.length === 0 ? (
                 <div className="py-40 text-center glass-morphism rounded-[4rem] border-2 border-dashed border-white/5 animate-in fade-in duration-700">
                    <Database size={64} className="text-slate-800 mx-auto mb-6" />
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Vault is empty • Ready to ingest</p>
                    <button onClick={() => setShowIngestModal(true)} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Start Onboarding Assets</button>
                 </div>
               ) : (
                 <div className="grid grid-cols-4 gap-8">
                    {mediaVault.map(asset => (
                      <div key={asset.id} className="glass-morphism p-8 rounded-[2.5rem] border border-white/5 group hover:border-indigo-500/30 transition-all relative">
                         <div className="h-44 bg-black/40 rounded-2xl mb-6 flex items-center justify-center text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {asset.type === 'model' ? <Box size={64} /> : <ImageIcon size={64} />}
                         </div>
                         <h5 className="text-lg font-black text-white uppercase truncate">{asset.title}</h5>
                         <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            <span>{asset.type}</span>
                            <span>{asset.sizeInMb}MB</span>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          ) : (
             <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex justify-between items-end">
                   <div>
                      <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Nexus Configuration</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Global System & Identity Controls</p>
                   </div>
                   <button onClick={syncNexusData} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Save Changes</button>
                </div>

                <div className="grid grid-cols-12 gap-10">
                   {/* Left Col: Identity */}
                   <div className="col-span-4 space-y-10">
                      <div className="glass-morphism p-10 rounded-[3.5rem] border border-white/5 space-y-8">
                         <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                            <div className="p-3 bg-indigo-600/10 rounded-2xl text-indigo-400"><Building2 size={24}/></div>
                            <h3 className="text-lg font-black text-white uppercase">Tenant Identity</h3>
                         </div>
                         <div className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Organization Name</label>
                               <input 
                                 value={settingsData.orgName} 
                                 onChange={e => setSettingsData({...settingsData, orgName: e.target.value})}
                                 className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold text-sm focus:border-indigo-600 outline-none"
                               />
                            </div>
                            <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                               <div className="flex items-center gap-3">
                                  <Palette size={18} className="text-indigo-400" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Branding Theme</span>
                               </div>
                               <div className="flex gap-2">
                                  <div className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white cursor-pointer shadow-lg shadow-indigo-600/30"></div>
                                  <div className="w-6 h-6 rounded-full bg-fuchsia-600 border border-white/20 cursor-pointer"></div>
                                  <div className="w-6 h-6 rounded-full bg-emerald-600 border border-white/20 cursor-pointer"></div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="glass-morphism p-10 rounded-[3.5rem] border border-white/5 space-y-6">
                         <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cloud Storage</h4>
                            <span className="text-[9px] font-black text-indigo-400">{settingsData.storageLimit}</span>
                         </div>
                         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full w-2/3 bg-indigo-600"></div>
                         </div>
                         <div className="flex justify-between items-center text-[8px] font-black text-slate-600 uppercase tracking-widest">
                            <span>3.2GB Used</span>
                            <span>Limit {settingsData.storageLimit}</span>
                         </div>
                      </div>
                   </div>

                   {/* Right Col: System Settings */}
                   <div className="col-span-8 space-y-10">
                      <div className="glass-morphism p-10 rounded-[4rem] border border-white/5 space-y-10">
                         <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                            <div className="p-3 bg-emerald-600/10 rounded-2xl text-emerald-400"><Shield size={24}/></div>
                            <h3 className="text-lg font-black text-white uppercase">System Matrix</h3>
                         </div>

                         <div className="grid grid-cols-2 gap-8">
                            {[
                              { label: "Automatic Cloud Sync", desc: "Real-time exhibition replication", icon: <RefreshCw size={20}/>, enabled: settingsData.autoSync },
                              { label: "Public API Access", desc: "Allow external explorer calls", icon: <Globe size={20}/>, enabled: settingsData.publicAccess },
                              { label: "Nexus Notifications", desc: "Push alerts for curator events", icon: <Bell size={20}/>, enabled: true },
                              { label: "Encryption Guard", desc: "Enhanced spatial data protection", icon: <Shield size={20}/>, enabled: true },
                              { label: "Global Localization", desc: "Auto-translate AI narratives", icon: <Languages size={20}/>, enabled: false },
                              { label: "Telemetry Ledger", desc: "Track visitor influence paths", icon: <Activity size={20}/>, enabled: true }
                            ].map((s, i) => (
                              <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-between group hover:border-indigo-500/20 transition-all">
                                 <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                                       {s.icon}
                                    </div>
                                    <div>
                                       <h5 className="text-sm font-black text-white uppercase tracking-tight">{s.label}</h5>
                                       <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{s.desc}</p>
                                    </div>
                                 </div>
                                 <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${s.enabled ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${s.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="p-10 bg-red-600/5 border border-red-500/10 rounded-[3rem] flex justify-between items-center">
                         <div className="flex items-center gap-6">
                            <div className="p-4 bg-red-600/20 rounded-2xl text-red-500"><Trash2 size={24}/></div>
                            <div>
                               <h4 className="text-lg font-black text-white uppercase">Danger Zone</h4>
                               <p className="text-[10px] text-red-500/60 font-black uppercase tracking-widest mt-1">Permanently purge all persistent Nexus data</p>
                            </div>
                         </div>
                         <button className="px-10 py-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Execute Purge</button>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </main>

      {/* Ingest Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-8">
           <div className="glass-morphism border border-white/10 rounded-[4rem] p-16 max-w-2xl w-full shadow-[0_0_100px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-12">
                 <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Asset Ingestion</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Inject to persistent cloud</p>
                 </div>
                 <button onClick={() => setShowIngestModal(false)} className="p-4 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all"><X size={28} /></button>
              </div>
              <form onSubmit={handleIngestAsset} className="space-y-10">
                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-4">Identifier</label>
                    <input 
                      required
                      value={newAsset.title}
                      onChange={e => setNewAsset({...newAsset, title: e.target.value})}
                      placeholder="e.g., Al-Masmak High Fidelity 3D"
                      className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 px-10 text-white font-black text-lg focus:outline-none focus:border-indigo-600"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-4">Modality</label>
                    <select 
                      value={newAsset.type}
                      onChange={e => setNewAsset({...newAsset, type: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 px-10 text-white font-black focus:outline-none focus:border-indigo-600"
                    >
                      <option value="photo">Photo (2D)</option>
                      <option value="model">Model (3D)</option>
                      <option value="video">Video (MP4)</option>
                      <option value="audio">Soundscape</option>
                    </select>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-4">Cloud URI</label>
                    <input 
                      type="url"
                      required
                      value={newAsset.url}
                      onChange={e => setNewAsset({...newAsset, url: e.target.value})}
                      placeholder="https://cloud.nexus/assets/masmak_v1"
                      className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 px-10 text-white font-mono text-xs focus:outline-none focus:border-indigo-600"
                    />
                 </div>
                 <button type="submit" className="w-full py-8 bg-white text-indigo-950 rounded-[2.5rem] font-black text-lg uppercase tracking-widest shadow-2xl hover:scale-[1.01] active:scale-95 transition-all">Execute Ingestion</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
