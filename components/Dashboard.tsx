
import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Users, 
  Sparkles,
  MapPin,
  Search,
  Loader2,
  ExternalLink,
  Navigation,
  RefreshCw,
  X,
  Zap,
  Layers,
  Box,
  Upload,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Settings,
  Bell,
  Command,
  LayoutGrid,
  Database,
  ShieldCheck,
  LogOut,
  Factory,
  Hammer,
  Video,
  Image as ImageIcon,
  Map as MapIcon,
  Info,
  ChevronRight,
  Monitor,
  Trash2,
  Save,
  Activity,
  FileText,
  Link as LinkIcon,
  Cloud,
  Server,
  Cpu,
  Trophy,
  Plus,
  PenTool,
  Anchor,
  Eye,
  ArrowRight
} from 'lucide-react';
import { searchDeploymentSites, enhanceJourneyPoints, getSiteSuitability } from '../services/geminiService';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'spatial' | 'forge'>('overview');
  const t = translations[lang];
  const isAr = lang === 'ar';
  
  const [mediaVault, setMediaVault] = useState<MediaAsset[]>([]);
  const [exhibitions, setExhibitions] = useState<ExperienceJourney[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [nexusStatus, setNexusStatus] = useState<'online' | 'offline' | 'error'>('offline');

  // Forge State
  const [forgeTheme, setForgeTheme] = useState('');
  const [forgePoints, setForgePoints] = useState<{title: string, locationName: string}[]>([]);
  const [newPointInput, setNewPointInput] = useState('');
  const [enhancedPoints, setEnhancedPoints] = useState<any[]>([]);
  const [isForging, setIsForging] = useState(false);
  const [forgeStep, setForgeStep] = useState<'curate' | 'review'>('curate');

  // Modal State
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

  const handleAddForgePoint = () => {
    if (!newPointInput.trim()) return;
    setForgePoints([...forgePoints, { title: newPointInput, locationName: newPointInput }]);
    setNewPointInput('');
  };

  const handleRemoveForgePoint = (index: number) => {
    setForgePoints(forgePoints.filter((_, i) => i !== index));
  };

  // Fix: Implemented handleIngestAsset function for resource vault management
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
        setMediaVault(prev => [{
          ...added,
          sizeInMb: added.size_in_mb,
          createdAt: added.created_at
        }, ...prev]);
        setShowIngestModal(false);
        setNewAsset({ title: '', type: 'photo' as any, url: '' });
      }
    } catch (err) {
      console.error("Ingestion failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConsultGemini = async () => {
    if (!forgeTheme || forgePoints.length === 0) return;
    setIsForging(true);
    try {
      const enhancement = await enhanceJourneyPoints(forgeTheme, forgePoints);
      if (enhancement) {
        const merged = forgePoints.map((p, i) => ({
          ...p,
          ...enhancement[i]
        }));
        setEnhancedPoints(merged);
        setForgeStep('review');
      }
    } catch (err) {
      console.error("Gemini Assistance Failed", err);
    } finally {
      setIsForging(false);
    }
  };

  const handleFinalizeForge = async () => {
    setIsForging(true);
    const finalPoints: POI[] = enhancedPoints.map((p, i) => ({
      id: `p-${Date.now()}-${i}`,
      title: p.title,
      description: p.description,
      location: { lat: 24.7136, lng: 46.6753, name: p.locationName },
      narrativeInsight: `${p.narrativeInsight}\n\n[Vision: ${p.digitalVision}]`
    }));

    const newExpo = {
      theme: forgeTheme,
      creator: "Curator Nexus",
      points: finalPoints,
      qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=awasser-expo-${Date.now()}`,
      is_event: true,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      cover_image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800"
    };

    try {
      const saved = await db.exhibitions.create(newExpo);
      const typedSaved: ExperienceJourney = {
        ...saved,
        qrCodeUrl: saved.qr_code_url,
        isEvent: saved.is_event,
        startDate: saved.start_date,
        endDate: saved.end_date,
        createdAt: saved.created_at,
        coverImage: saved.cover_image
      };
      setExhibitions([typedSaved, ...exhibitions]);
      onPublishJourney(typedSaved);
      setForgeTheme('');
      setForgePoints([]);
      setEnhancedPoints([]);
      setForgeStep('curate');
      setActiveTab('overview');
    } catch (err) {
      console.error("Forge Persistence Failed", err);
    } finally {
      setIsForging(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: "Control Center", icon: <LayoutGrid size={20} /> },
    { id: 'forge', label: "Digital Forge", icon: <Factory size={20} /> },
    { id: 'spatial', label: "Spatial Engine", icon: <Globe size={20} /> },
    { id: 'media', label: "Resource Vault", icon: <Database size={20} /> },
  ];

  return (
    <div className={`flex h-screen w-full bg-[#010409] text-slate-100 overflow-hidden font-sans ${isAr ? 'rtl' : 'ltr'}`}>
      
      {/* SIDEBAR */}
      <aside className="w-80 flex-shrink-0 bg-[#0d1117] border-x border-white/5 flex flex-col z-30 shadow-2xl">
        <div className="p-10 flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-fuchsia-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-indigo-500/20">
            <Cpu className="text-white" size={30} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter leading-none">AWASSER</h2>
            <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.3em] mt-1.5">Production Nexus</p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {menuItems.map((item) => (
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
          <div className="mb-8 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Server size={14} className={nexusStatus === 'online' ? 'text-emerald-500' : 'text-red-500'} />
                   <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Link</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${nexusStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
             </div>
             <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <p className="text-[9px] font-mono text-slate-500 break-all leading-relaxed">NEXUS_ID: moqahxuwuqqsqimiotgv</p>
             </div>
          </div>
          <button 
            onClick={onExit}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">Deactivate Session</span>
          </button>
        </div>
      </aside>

      {/* WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 to-[#010409]">
        
        <header className="h-28 flex-shrink-0 border-b border-white/5 px-16 flex items-center justify-between z-20 backdrop-blur-3xl bg-black/20">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{menuItems.find(i => i.id === activeTab)?.label}</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
              <Activity size={12} className="text-indigo-500" /> Operational Matrix • Collaborative Forge
            </p>
          </div>
          
          <div className="flex items-center gap-10">
            <button onClick={syncNexusData} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5">
              <RefreshCw size={22} className={isSyncing ? 'animate-spin' : ''} />
            </button>
            <div className="flex items-center gap-5 pl-10 border-l border-white/5">
              <div className="text-right">
                <p className="text-xs font-black text-white uppercase tracking-tighter">Master Curator</p>
                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">Nexus Architect</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 border border-white/20 shadow-xl p-1">
                 <div className="w-full h-full rounded-xl bg-slate-900 overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/bottts-neutral/svg?seed=AwasserAdmin" alt="Profile" />
                 </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-16 space-y-16 no-scrollbar">
          {isSyncing ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
               <div className="relative">
                  <Loader2 size={64} className="text-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse"></div>
                  </div>
               </div>
               <p className="text-sm font-black text-slate-600 uppercase tracking-[0.5em] animate-pulse">Synchronizing Cloud Nexus...</p>
            </div>
          ) : activeTab === 'overview' ? (
            <>
              <div className="grid grid-cols-4 gap-10">
                {[
                  { label: "Cloud Exhibits", value: exhibitions.length, icon: <Monitor />, color: "text-indigo-400", sub: "Persistent" },
                  { label: "Active Anchors", value: "112", icon: <MapPin />, color: "text-emerald-400", sub: "Riyadh Grid" },
                  { label: "Global Sync", value: nexusStatus === 'online' ? "Live" : "Failed", icon: <Cloud />, color: nexusStatus === 'online' ? "text-emerald-400" : "text-red-400", sub: "Supabase" },
                  { label: "Vault Assets", value: mediaVault.length, icon: <Database />, color: "text-amber-400", sub: "Media Cluster" }
                ].map((stat, i) => (
                  <div key={i} className="glass-morphism p-10 rounded-[2.5rem] group hover:border-indigo-500/30 transition-all border border-white/5 bg-white/[0.02]">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`p-5 rounded-2xl bg-white/5 border border-white/5 ${stat.color}`}>
                        {stat.icon}
                      </div>
                      <div className="p-1.5 bg-emerald-500/10 rounded-full">
                         <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${stat.color === 'text-red-400' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                      </div>
                    </div>
                    <h4 className="text-5xl font-black text-white mb-2 tracking-tighter">{stat.value}</h4>
                    <div className="flex justify-between items-end">
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{stat.label}</p>
                       <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{stat.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-morphism rounded-[3.5rem] overflow-hidden border border-white/5">
                <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">Exhibition Production Ledger</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Real-time database sync</p>
                  </div>
                  <button onClick={() => setActiveTab('forge')} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95">Initiate New Forge</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      <tr>
                        <th className="px-12 py-8">Theme / Concept</th>
                        <th className="px-12 py-8">Project Status</th>
                        <th className="px-12 py-8 text-right">Synchronization Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm font-medium">
                      {exhibitions.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-12 py-20 text-center text-slate-500 uppercase font-black text-[10px] tracking-widest">No persistent exhibits detected</td>
                        </tr>
                      ) : (
                        exhibitions.map((expo) => (
                          <tr key={expo.id} className="hover:bg-white/[0.02] transition-all group">
                            <td className="px-12 py-10">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Monitor size={18} />
                                 </div>
                                 <p className="font-black text-white uppercase group-hover:text-indigo-400 transition-colors">{expo.theme}</p>
                              </div>
                            </td>
                            <td className="px-12 py-10">
                              <div className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live in Grid</span>
                              </div>
                            </td>
                            <td className="px-12 py-10 text-right text-slate-500 text-xs font-mono">
                               {new Date(expo.createdAt || '').toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : activeTab === 'forge' ? (
            <div className="max-w-6xl mx-auto space-y-12">
               {/* Progress Header */}
               <div className="flex items-center justify-between bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-xl">
                       <Hammer size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">Exhibition Forge</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Collaborative AI-Human Curation</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${forgeStep === 'curate' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-slate-500'}`}>1. Site Curation</div>
                     <ArrowRight size={16} className="text-slate-700" />
                     <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${forgeStep === 'review' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-slate-500'}`}>2. Synthesis & Review</div>
                  </div>
               </div>

               {forgeStep === 'curate' ? (
                 <div className="grid grid-cols-12 gap-10">
                    <div className="col-span-5 space-y-10">
                       <div className="glass-morphism p-10 rounded-[3rem] border border-white/5 space-y-8">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Exhibition Theme</label>
                             <input 
                               value={forgeTheme}
                               onChange={e => setForgeTheme(e.target.value)}
                               placeholder="e.g., Echoes of Al-Masmak"
                               className="w-full bg-black/40 border border-white/10 rounded-[2rem] py-5 px-8 text-white font-black text-lg focus:outline-none focus:border-indigo-600 transition-all"
                             />
                          </div>

                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Anchor New Site</label>
                             <div className="flex gap-4">
                                <input 
                                  value={newPointInput}
                                  onChange={e => setNewPointInput(e.target.value)}
                                  onKeyPress={e => e.key === 'Enter' && handleAddForgePoint()}
                                  placeholder="Enter Landmark Name..."
                                  className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:outline-none focus:border-indigo-600 transition-all"
                                />
                                <button onClick={handleAddForgePoint} className="p-4 bg-indigo-600 rounded-2xl text-white shadow-lg active:scale-95 transition-all">
                                   <Plus size={20} />
                                </button>
                             </div>
                          </div>

                          <button 
                            onClick={handleConsultGemini}
                            disabled={isForging || !forgeTheme || forgePoints.length === 0}
                            className="w-full py-6 bg-white text-indigo-950 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl disabled:opacity-30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                          >
                            {isForging ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                            Consult Digital Assistant
                          </button>
                       </div>
                    </div>

                    <div className="col-span-7 space-y-6">
                       <div className="flex items-center justify-between px-6">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Site Ledger ({forgePoints.length})</h3>
                          <button onClick={() => setForgePoints([])} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:underline">Clear Path</button>
                       </div>
                       
                       <div className="space-y-4">
                          {forgePoints.length === 0 ? (
                            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                               <MapIcon size={48} className="text-slate-800 mx-auto mb-4" />
                               <p className="text-sm font-black text-slate-700 uppercase tracking-widest">No sites selected for this journey</p>
                            </div>
                          ) : (
                            forgePoints.map((p, i) => (
                              <div key={i} className="glass-morphism p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-between group animate-in slide-in-from-right-4">
                                 <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                       <span className="font-black text-sm">{i + 1}</span>
                                    </div>
                                    <div>
                                       <h4 className="text-lg font-black text-white uppercase">{p.title}</h4>
                                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Spatial Anchor Point</p>
                                    </div>
                                 </div>
                                 <button onClick={() => handleRemoveForgePoint(i)} className="p-3 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={20} />
                                 </button>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="flex justify-between items-center">
                       <div>
                          <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Assistant Review</h3>
                          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Refining the spatial experience for {forgeTheme}</p>
                       </div>
                       <div className="flex gap-4">
                          <button onClick={() => setForgeStep('curate')} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">Back to Curation</button>
                          <button onClick={handleFinalizeForge} disabled={isForging} className="px-10 py-4 bg-indigo-600 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3">
                             {isForging ? <Loader2 className="animate-spin" size={18} /> : <Anchor size={18} />}
                             Finalize & Anchor Journey
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                       {enhancedPoints.map((p, i) => (
                         <div key={i} className="glass-morphism p-10 rounded-[3rem] border border-white/5 space-y-6 relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                               <Sparkles size={120} />
                            </div>
                            <div className="flex items-center gap-6">
                               <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl">
                                  <MapPin size={32} />
                               </div>
                               <div>
                                  <h4 className="text-2xl font-black text-white uppercase tracking-tight">{p.title}</h4>
                                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em]">Site {i + 1} • Digital Vision Active</p>
                               </div>
                            </div>
                            
                            <div className="space-y-6">
                               <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5">
                                  <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                     <FileText size={12} /> Narrative Synthesis
                                  </h5>
                                  <p className="text-xs text-slate-300 leading-relaxed italic">{p.description}</p>
                               </div>

                               <div className="p-6 bg-indigo-600/5 rounded-[2rem] border border-indigo-500/20">
                                  <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                     <Eye size={12} /> Digital Art Vision
                                  </h5>
                                  <p className="text-xs text-white font-medium leading-relaxed">{p.digitalVision}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
               )}
            </div>
          ) : activeTab === 'media' && (
            <div className="space-y-12">
               <div className="flex justify-between items-end bg-white/[0.02] p-10 rounded-[3rem] border border-white/5">
                  <div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Resource Vault</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-2">Digital Asset Repository</p>
                  </div>
                  <button onClick={() => setShowIngestModal(true)} className="px-12 py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-2xl transition-all">
                    Ingest Global Asset
                  </button>
               </div>
               
               {mediaVault.length === 0 ? (
                 <div className="py-32 text-center glass-morphism rounded-[3rem] border border-dashed border-white/10">
                    <Database size={64} className="text-slate-800 mx-auto mb-6" />
                    <p className="text-sm font-black text-slate-600 uppercase tracking-widest">No assets in cloud cluster</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-4 gap-10">
                   {mediaVault.map(asset => (
                     <div key={asset.id} className="glass-morphism p-10 rounded-[3rem] group border border-white/5 hover:border-indigo-500/30 transition-all relative overflow-hidden">
                        <div className="relative h-56 rounded-[2rem] overflow-hidden mb-8 bg-black/40 border border-white/5 flex items-center justify-center group-hover:scale-[1.02] transition-transform">
                           {asset.type === 'model' ? <Box size={72} className="text-indigo-500/30" /> : <ImageIcon size={72} className="text-indigo-500/30" />}
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                           <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{asset.type}</span>
                              <div className="px-2 py-0.5 bg-indigo-600 rounded-md text-[8px] font-black text-white uppercase">Live</div>
                           </div>
                        </div>
                        <h4 className="text-xl font-black text-white mb-2 truncate uppercase tracking-tighter">{asset.title}</h4>
                        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest pt-4 border-t border-white/5">
                           <span>{asset.sizeInMb} MB</span>
                           <span className="text-indigo-400">Persistent</span>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
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
                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-4">Cloud URI</label>
                    <input 
                      type="url"
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
