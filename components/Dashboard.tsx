
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
  Cloud
} from 'lucide-react';
import { searchDeploymentSites, planExperienceJourney, getSiteSuitability } from '../services/geminiService';
import { MediaAsset, ExperienceJourney, Language, PortalMode } from '../types';
import { translations } from '../translations';
import { db } from '../lib/supabase';

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

  // Forge State
  const [forgeTheme, setForgeTheme] = useState('');
  const [isForging, setIsForging] = useState(false);

  // Spatial Engine State
  const [mapSearch, setMapSearch] = useState('');
  const [spatialResults, setSpatialResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSiteForAnalysis, setSelectedSiteForAnalysis] = useState<string | null>(null);
  const [suitabilityReport, setSuitabilityReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | undefined>();

  useEffect(() => {
    syncNexusData();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation denied", err)
      );
    }
  }, []);

  async function syncNexusData() {
    try {
      setIsSyncing(true);
      const [exList, mediaList] = await Promise.all([
        db.exhibitions.getAll(),
        db.mediaVault.getAll()
      ]);
      setExhibitions(exList || []);
      setMediaVault(mediaList || []);
    } catch (error) {
      console.error("Nexus Sync Failed", error);
    } finally {
      setIsSyncing(false);
    }
  }

  const handleForge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgeTheme.trim()) return;
    setIsForging(true);
    const result = await planExperienceJourney(forgeTheme, "Riyadh Center");
    if (result) {
      const newExpo = {
        theme: result.theme || forgeTheme,
        creator: "Master Curator",
        points: result.points || [],
        qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=awasser-expo-${Date.now()}`,
        is_event: true,
        start_date: '2024-10-01',
        end_date: '2024-12-31'
      };

      try {
        const saved = await db.exhibitions.create(newExpo);
        // Map to internal type
        const typedSaved: ExperienceJourney = {
          ...saved,
          qrCodeUrl: saved.qr_code_url,
          isEvent: saved.is_event,
          startDate: saved.start_date,
          endDate: saved.end_date,
          createdAt: saved.created_at
        };
        setExhibitions([typedSaved, ...exhibitions]);
        onPublishJourney(typedSaved);
        setForgeTheme('');
        setActiveTab('overview');
      } catch (err) {
        console.error("Forge Persistence Failed", err);
      }
    }
    setIsForging(false);
  };

  const handleSpatialSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearch.trim()) return;
    setIsSearching(true);
    setSuitabilityReport(null);
    const results = await searchDeploymentSites(mapSearch, userLocation);
    setSpatialResults(results.locations || []);
    setIsSearching(false);
  };

  const handleAnalyzeSite = async (siteName: string) => {
    setSelectedSiteForAnalysis(siteName);
    setIsAnalyzing(true);
    const report = await getSiteSuitability(siteName);
    setSuitabilityReport(report);
    setIsAnalyzing(false);
  };

  const handleIngestAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.title) return;
    const asset = {
      title: newAsset.title,
      type: newAsset.type,
      url: newAsset.url || '#',
      status: 'optimizing',
      size_in_mb: Math.floor(Math.random() * 500) + 10
    };
    
    try {
      const saved = await db.mediaVault.add(asset);
      const typedSaved: MediaAsset = {
        ...saved,
        sizeInMb: saved.size_in_mb,
        createdAt: saved.created_at
      };
      setMediaVault([typedSaved, ...mediaVault]);
      setShowIngestModal(false);
      setNewAsset({ title: '', type: 'photo' as any, url: '' });
    } catch (err) {
      console.error("Asset Ingestion Failed", err);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (window.confirm('Are you sure you want to purge this asset from the spatial repository?')) {
      try {
        await db.mediaVault.delete(id);
        setMediaVault(prev => prev.filter(a => a.id !== id));
        setShowEditModal(false);
        setEditingAsset(null);
      } catch (err) {
        console.error("Purge Failed", err);
      }
    }
  };

  const menuItems = [
    { id: 'overview', label: "Dashboard", icon: <LayoutGrid size={20} /> },
    { id: 'forge', label: "Digital Forge", icon: <Factory size={20} /> },
    { id: 'spatial', label: "Spatial Engine", icon: <Globe size={20} /> },
    { id: 'media', label: "Resource Vault", icon: <Database size={20} /> },
  ];

  const [showIngestModal, setShowIngestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [newAsset, setNewAsset] = useState({ title: '', type: 'photo' as any, url: '' });

  return (
    <div className={`flex h-screen w-full bg-[#020617] text-slate-100 overflow-hidden font-sans ${isAr ? 'rtl' : 'ltr'}`}>
      
      {/* SIDEBAR */}
      <aside className="w-72 flex-shrink-0 bg-[#0f172a]/80 backdrop-blur-xl border-x border-white/5 flex flex-col z-30 shadow-2xl">
        <div className="p-8 flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <Command className="text-white" size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter">AWASSER</h2>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Nexus Cloud Linked</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-[20px] transition-all group ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <div className={`${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                {item.icon}
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <ShieldCheck className="text-emerald-500" size={16} />
               <span className="text-[10px] font-black uppercase text-slate-400">Secure Protocol</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <Cloud size={12} className={isSyncing ? 'text-amber-500 animate-bounce' : 'text-emerald-500'} />
             </div>
          </div>
          <button 
            onClick={onExit}
            className="w-full flex items-center gap-4 px-4 py-3 text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-[10px] font-black uppercase">Close Factory</span>
          </button>
        </div>
      </aside>

      {/* WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)]">
        
        <header className="h-24 flex-shrink-0 border-b border-white/5 px-12 flex items-center justify-between glass-morphism z-20">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">{menuItems.find(i => i.id === activeTab)?.label}</h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Section 04 • Riyadh Arts Collective</p>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6 border-r border-white/10 pr-8">
               <button onClick={syncNexusData} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all relative">
                 <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
               </button>
               <button className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><Settings size={20} /></button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-black text-white">Curator Admin</p>
                <p className="text-[9px] text-indigo-400 font-bold uppercase">Super User</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 border border-white/20"></div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 space-y-12 animate-entry">
          {isSyncing && activeTab !== 'forge' && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
               <Loader2 size={48} className="text-indigo-500 animate-spin" />
               <p className="text-sm font-black text-slate-500 uppercase tracking-widest animate-pulse">Synchronizing Global Nexus...</p>
            </div>
          )}
          
          {!isSyncing && activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-4 gap-8">
                {[
                  { label: "Digital Exhibits", value: exhibitions.length, icon: <Monitor />, color: "text-indigo-400" },
                  { label: "Spatial Anchors", value: "84", icon: <MapPin />, color: "text-emerald-400" },
                  { label: "Monthly Visits", value: "24.5k", icon: <Users />, color: "text-fuchsia-400" },
                  { label: "Assets Hosted", value: mediaVault.length, icon: <Database />, color: "text-amber-400" }
                ].map((stat, i) => (
                  <div key={i} className="dashboard-card p-8 rounded-[32px] group">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-all`}>
                        {stat.icon}
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CLOUD</span>
                    </div>
                    <h4 className="text-4xl font-black text-white mb-2">{stat.value}</h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="dashboard-card rounded-[48px] overflow-hidden">
                <div className="p-10 border-b border-white/5 flex justify-between items-center bg-indigo-600/5">
                  <h3 className="text-xl font-black text-white">Museum Production Ledger</h3>
                  <button onClick={() => setActiveTab('forge')} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">New Production</button>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <tr>
                      <th className="px-10 py-6">Exhibition Title</th>
                      <th className="px-10 py-6">Production Status</th>
                      <th className="px-10 py-6 text-center">Modality</th>
                      <th className="px-10 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm font-medium">
                    {exhibitions.map((expo) => (
                      <tr key={expo.id} className="hover:bg-white/5 transition-all group">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                              <Factory size={20} />
                            </div>
                            <div>
                              <p className="font-black text-white group-hover:text-indigo-400 transition-colors">{expo.theme}</p>
                              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{expo.creator}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Deployed</span>
                          </div>
                        </td>
                        <td className="px-10 py-8 text-center">
                          <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black text-slate-400 uppercase border border-white/10">Mixed Reality</span>
                        </td>
                        <td className="px-10 py-8 text-right">
                           <button className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><MoreVertical size={18} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'forge' && (
            <div className="max-w-4xl mx-auto py-12">
               <div className="text-center mb-16">
                  <div className="inline-block p-6 bg-indigo-600/10 rounded-[40px] text-indigo-500 mb-8 border border-indigo-500/20">
                    <Hammer size={56} className="animate-bounce" />
                  </div>
                  <h2 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase">Exhibition Forge</h2>
                  <p className="text-slate-500 max-w-xl mx-auto text-lg leading-relaxed font-medium">
                    Synthesize digital experiences by linking assets, narratives, and spatial anchors.
                  </p>
               </div>

               <div className="dashboard-card p-12 rounded-[64px] border-2 border-indigo-500/20">
                  <form onSubmit={handleForge} className="space-y-12">
                     <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-2">Creative Directive</label>
                        <textarea 
                          required
                          value={forgeTheme}
                          onChange={e => setForgeTheme(e.target.value)}
                          rows={3}
                          placeholder="e.g. A digital retrospective of Riyadh's modernist movement..." 
                          className="w-full bg-white/5 border border-white/10 rounded-[30px] p-8 text-2xl font-black text-white focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-800 resize-none"
                        />
                     </div>
                     <button 
                       type="submit"
                       disabled={isForging}
                       className="w-full py-8 bg-white text-indigo-900 rounded-[35px] font-black text-lg uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                     >
                       {isForging ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                       {isForging ? "Manufacturing..." : "Initiate Forge Sequence"}
                     </button>
                  </form>
               </div>
            </div>
          )}

          {!isSyncing && activeTab === 'media' && (
            <div className="space-y-10">
               <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">Resource Vault</h2>
                    <p className="text-sm text-slate-500 font-medium uppercase tracking-widest mt-1">Master Depository for Digital Assets</p>
                  </div>
                  <button onClick={() => setShowIngestModal(true)} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 rounded-[24px] text-white text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl">
                    <Upload size={18} /> Ingest Asset
                  </button>
               </div>

               <div className="grid grid-cols-4 gap-8">
                 {mediaVault.map(asset => (
                   <div key={asset.id} className="dashboard-card p-8 rounded-[40px] group border border-white/5 hover:border-indigo-500/30">
                      <div className="relative h-48 rounded-[30px] overflow-hidden mb-8 bg-slate-900/50 border border-white/5 group-hover:scale-[1.02] transition-transform duration-500 shadow-inner">
                         <div className="absolute inset-0 flex items-center justify-center text-indigo-500/10 group-hover:text-indigo-500/30 transition-colors duration-500">
                            {asset.type === 'model' ? <Box size={80} /> : asset.type === 'video' ? <Video size={80} /> : <ImageIcon size={80} />}
                         </div>
                         <div className="absolute bottom-4 right-4 flex gap-2">
                            <button 
                              onClick={() => { setEditingAsset(asset); setShowEditModal(true); }}
                              className="p-2 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-indigo-600 transition-colors"
                            >
                               <Settings size={14} />
                            </button>
                         </div>
                      </div>
                      <h4 className="text-lg font-black text-white mb-2 group-hover:text-indigo-400 transition-colors truncate">{asset.title}</h4>
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                         <span className="flex items-center gap-2">{asset.type} • {asset.sizeInMb}MB</span>
                         <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black ${
                           asset.status === 'live' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' : 
                           asset.status === 'error' ? 'text-red-500 border-red-500/20 bg-red-500/10' :
                           'text-amber-500 border-amber-500/20 bg-amber-500/10'
                         }`}>
                           {asset.status}
                         </span>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Ingest Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
           <div className="bg-[#0f172a] border border-white/10 rounded-[48px] p-12 max-w-xl w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-2xl font-black text-white tracking-tight">Ingest New Asset</h3>
                 <button onClick={() => setShowIngestModal(false)} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><X size={20} /></button>
              </div>

              <form onSubmit={handleIngestAsset} className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Identity</label>
                    <input 
                      required
                      value={newAsset.title}
                      onChange={e => setNewAsset({...newAsset, title: e.target.value})}
                      placeholder="e.g. Turaif Spatial Scan 01"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white focus:outline-none focus:border-indigo-500"
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Digital Endpoint (URL)</label>
                    <div className="relative">
                       <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                       <input 
                         type="url"
                         value={newAsset.url}
                         onChange={e => setNewAsset({...newAsset, url: e.target.value})}
                         placeholder="https://cloud.awasser.factory/artifact-04"
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-8 text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                       />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Modality</label>
                    <div className="grid grid-cols-4 gap-3">
                       {['photo', 'video', 'model', 'audio'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewAsset({...newAsset, type: type as any})}
                            className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${newAsset.type === type ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'}`}
                          >
                            {type}
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="pt-6">
                    <button type="submit" className="w-full py-5 bg-white text-indigo-900 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] transition-all">Start Injection Sequence</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && editingAsset && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
           <div className="bg-[#0f172a] border border-white/10 rounded-[48px] p-12 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white">
                       <Settings size={24} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white tracking-tight">Manage Asset</h3>
                       <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">ID: {editingAsset.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowEditModal(false)} className="p-3 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><X size={20} /></button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setShowEditModal(false); }} className="space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Title</label>
                          <input 
                            required
                            value={editingAsset.title}
                            onChange={e => setEditingAsset({...editingAsset, title: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-indigo-500"
                          />
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Endpoint Link</label>
                          <input 
                            value={editingAsset.url}
                            onChange={e => setEditingAsset({...editingAsset, url: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                          />
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="p-8 bg-white/5 rounded-[32px] border border-white/5 space-y-4">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Footprint</h4>
                          <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-400">Size:</span>
                             <span className="text-sm font-black text-white">{editingAsset.sizeInMb} MB</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-8 flex gap-4">
                    <button type="submit" className="flex-1 py-5 bg-indigo-600 rounded-[24px] text-white text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3">
                       <Save size={18} /> Update Matrix
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteAsset(editingAsset.id)}
                      className="px-8 py-5 bg-red-600/10 border border-red-500/20 text-red-500 rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3"
                    >
                       <Trash2 size={18} /> Purge
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
