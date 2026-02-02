
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
  Link as LinkIcon
} from 'lucide-react';
import { searchDeploymentSites, planExperienceJourney, getSiteSuitability } from '../services/geminiService';
import { MediaAsset, ExperienceJourney, Language, PortalMode } from '../types';
import { translations } from '../translations';

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
  
  const [mediaVault, setMediaVault] = useState<MediaAsset[]>([
    { id: 'm1', title: '1950s Riyadh Market Scan', type: 'archive', url: 'https://archive.org/riyadh1', status: 'live', sizeInMb: 145.2, createdAt: '2024-03-10' },
    { id: 'm2', title: 'Masmak Fort Aerial Video', type: 'video', url: 'https://vimeo.com/fort', status: 'optimizing', sizeInMb: 890.5, createdAt: '2024-03-12' },
    { id: 'm5', title: 'Ancient Pottery Artifact', type: 'model', url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb', status: 'live', sizeInMb: 4.2, createdAt: '2024-03-18' },
    { id: 'm6', title: 'Diriyah Ambient Audio', type: 'audio', url: '#', status: 'live', sizeInMb: 12.8, createdAt: '2024-03-20' }
  ]);

  const [exhibitions, setExhibitions] = useState<ExperienceJourney[]>([
    { id: 'j-1', theme: 'Bridges of Diriyah', creator: 'H. Al-Faisal', points: Array(8).fill({}), qrCodeUrl: '#', createdAt: '2024-04-10', isEvent: true, startDate: '2024-05-01', endDate: '2024-06-01' },
    { id: 'j-2', theme: 'Modernist Echoes', creator: 'Studio 22', points: Array(5).fill({}), qrCodeUrl: '#', createdAt: '2024-04-12', isEvent: false },
    { id: 'j-3', theme: 'Neon Oasis', creator: 'Awasser Factory', points: Array(12).fill({}), qrCodeUrl: '#', createdAt: '2024-04-15', isEvent: true, startDate: '2024-07-01', endDate: '2024-08-15' }
  ]);

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

  // Media Vault State
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [newAsset, setNewAsset] = useState({ title: '', type: 'photo' as any, url: '' });

  const handleForge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgeTheme.trim()) return;
    setIsForging(true);
    const result = await planExperienceJourney(forgeTheme, "Riyadh Center");
    if (result) {
      const newExpo: ExperienceJourney = {
        id: `expo-${Date.now()}`,
        theme: result.theme || forgeTheme,
        creator: "Master Curator",
        points: result.points || [],
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=awasser-expo-${Date.now()}`,
        createdAt: new Date().toLocaleDateString(),
        isEvent: true,
        startDate: '2024-10-01',
        endDate: '2024-12-31'
      };
      setExhibitions([newExpo, ...exhibitions]);
      onPublishJourney(newExpo);
      setForgeTheme('');
      setActiveTab('overview');
    }
    setIsForging(false);
  };

  const handleSpatialSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearch.trim()) return;
    setIsSearching(true);
    setSuitabilityReport(null);
    const results = await searchDeploymentSites(mapSearch);
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

  const handleIngestAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.title) return;
    const asset: MediaAsset = {
      id: `m-${Date.now()}`,
      title: newAsset.title,
      type: newAsset.type,
      url: newAsset.url || '#',
      status: 'optimizing',
      sizeInMb: Math.floor(Math.random() * 500) + 10,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setMediaVault([asset, ...mediaVault]);
    setShowIngestModal(false);
    setNewAsset({ title: '', type: 'photo', url: '' });
  };

  const handleUpdateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;
    setMediaVault(prev => prev.map(a => a.id === editingAsset.id ? editingAsset : a));
    setShowEditModal(false);
    setEditingAsset(null);
  };

  const handleDeleteAsset = (id: string) => {
    if (window.confirm('Are you sure you want to purge this asset from the spatial repository? This action cannot be undone.')) {
      setMediaVault(prev => prev.filter(a => a.id !== id));
      setShowEditModal(false);
      setEditingAsset(null);
    }
  };

  const menuItems = [
    { id: 'overview', label: "Dashboard", icon: <LayoutGrid size={20} /> },
    { id: 'forge', label: "Digital Forge", icon: <Factory size={20} /> },
    { id: 'spatial', label: "Spatial Engine", icon: <Globe size={20} /> },
    { id: 'media', label: "Resource Vault", icon: <Database size={20} /> },
  ];

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
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Digital Art Factory</p>
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
          <div className="flex items-center gap-3 mb-6">
             <ShieldCheck className="text-emerald-500" size={16} />
             <span className="text-[10px] font-black uppercase text-slate-400">Secure Protocol</span>
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
               <button className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all relative">
                 <Bell size={20} />
                 <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
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
          
          {activeTab === 'overview' && (
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
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">v4.0</span>
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

          {activeTab === 'spatial' && (
            <div className="space-y-10">
               <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">Spatial Engine</h2>
                    <p className="text-sm text-slate-500 font-medium uppercase tracking-widest mt-1">Grounding & Site Suitability Analysis</p>
                  </div>
               </div>

               <div className="grid grid-cols-12 gap-8">
                  {/* Search Sidebar */}
                  <div className="col-span-4 space-y-6">
                     <div className="dashboard-card p-8 rounded-[40px] border border-white/10">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Site Discovery</h4>
                        <form onSubmit={handleSpatialSearch} className="space-y-4">
                           <div className="relative">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                              <input 
                                value={mapSearch}
                                onChange={e => setMapSearch(e.target.value)}
                                placeholder="Search location in Riyadh..." 
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-indigo-500"
                              />
                           </div>
                           <button 
                             type="submit"
                             disabled={isSearching}
                             className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all disabled:opacity-50"
                           >
                             {isSearching ? <Loader2 className="animate-spin" size={16} /> : <MapIcon size={16} />}
                             Analyze Terrain
                           </button>
                        </form>
                     </div>

                     <div className="space-y-4">
                        {spatialResults.map((loc, idx) => (
                           <div key={idx} className="dashboard-card p-6 rounded-[32px] border border-white/5 hover:border-indigo-500/40 transition-all group">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="p-2.5 bg-indigo-600/10 rounded-xl text-indigo-400">
                                    <MapPin size={20} />
                                 </div>
                                 <a href={loc.maps?.uri} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all">
                                    <ExternalLink size={16} />
                                 </a>
                              </div>
                              <h5 className="text-white font-black text-sm mb-4">{loc.maps?.title || "Anchor Site " + (idx+1)}</h5>
                              <button 
                                onClick={() => handleAnalyzeSite(loc.maps?.title)}
                                className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"
                              >
                                Verify Suitability
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Analysis View */}
                  <div className="col-span-8">
                     {selectedSiteForAnalysis ? (
                        <div className="dashboard-card p-12 rounded-[48px] border border-white/10 h-full flex flex-col">
                           <div className="flex justify-between items-start mb-12">
                              <div className="flex items-center gap-6">
                                 <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                                    <ShieldCheck size={32} />
                                 </div>
                                 <div>
                                    <h3 className="text-3xl font-black text-white">{selectedSiteForAnalysis}</h3>
                                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">Site Verified • Grounding Optimal</p>
                                 </div>
                              </div>
                              <button onClick={() => setSelectedSiteForAnalysis(null)} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white"><X size={20} /></button>
                           </div>

                           <div className="flex-1 space-y-8">
                              <div className="grid grid-cols-2 gap-6">
                                 <div className="p-8 bg-white/5 rounded-[32px] border border-white/5">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Anchoring Stability</p>
                                    <div className="flex items-end gap-3">
                                       <span className="text-4xl font-black text-white">98%</span>
                                       <span className="text-emerald-500 text-[10px] font-black mb-1.5 uppercase">Ultra High</span>
                                    </div>
                                 </div>
                                 <div className="p-8 bg-white/5 rounded-[32px] border border-white/5">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Light Fidelity</p>
                                    <div className="flex items-end gap-3">
                                       <span className="text-4xl font-black text-white">82%</span>
                                       <span className="text-amber-500 text-[10px] font-black mb-1.5 uppercase">Stable</span>
                                    </div>
                                 </div>
                              </div>

                              <div className="p-10 bg-indigo-600/5 rounded-[40px] border border-indigo-500/10">
                                 <div className="flex items-center gap-3 mb-6">
                                    <Sparkles className="text-indigo-400" size={20} />
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Suitability Report</h4>
                                 </div>
                                 {isAnalyzing ? (
                                    <div className="flex items-center gap-3 text-slate-500 py-4">
                                       <Loader2 className="animate-spin" size={20} />
                                       <span className="text-xs font-medium italic">Synthesizing spatial intelligence...</span>
                                    </div>
                                 ) : (
                                    <p className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-line">
                                       {suitabilityReport}
                                    </p>
                                 )}
                              </div>
                           </div>

                           <div className="mt-12 flex gap-4">
                              <button className="flex-1 py-5 bg-indigo-600 rounded-[24px] text-white text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20">Assign to Forge</button>
                              <button className="px-10 py-5 bg-white/5 rounded-[24px] text-slate-400 text-[11px] font-black uppercase tracking-widest border border-white/10">Save Anchor</button>
                           </div>
                        </div>
                     ) : (
                        <div className="dashboard-card p-12 rounded-[48px] border border-white/5 border-dashed h-full flex flex-col items-center justify-center text-center">
                           <div className="w-24 h-24 bg-white/5 rounded-[40px] flex items-center justify-center text-slate-700 mb-8">
                              <Navigation size={48} className="animate-pulse" />
                           </div>
                           <h3 className="text-2xl font-black text-slate-500 uppercase tracking-widest">No Active Analysis</h3>
                           <p className="text-slate-600 max-w-xs mt-4 text-sm font-medium">Select a location from the search results to initiate spatial fidelity verification.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'media' && (
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

              <form onSubmit={handleUpdateAsset} className="space-y-8">
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

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Exhibition Status</label>
                          <div className="grid grid-cols-2 gap-3">
                             {['live', 'optimizing', 'syncing', 'error'].map(status => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => setEditingAsset({...editingAsset, status: status as any})}
                                  className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${editingAsset.status === status ? 'bg-white text-indigo-900 border-white' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                                >
                                  {status}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="p-8 bg-white/5 rounded-[32px] border border-white/5 space-y-4">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Footprint</h4>
                          <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-400">Size:</span>
                             <span className="text-sm font-black text-white">{editingAsset.sizeInMb} MB</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-400">Created:</span>
                             <span className="text-sm font-black text-white">{editingAsset.createdAt}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-400">Integrity:</span>
                             <span className="flex items-center gap-2 text-sm font-black text-emerald-500">
                                <ShieldCheck size={14} /> Verified
                             </span>
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Class</label>
                          <select 
                            value={editingAsset.type}
                            onChange={e => setEditingAsset({...editingAsset, type: e.target.value as any})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-indigo-500"
                          >
                             <option value="photo">Photo (Still)</option>
                             <option value="video">Video (Motion)</option>
                             <option value="model">3D Model (Spatial)</option>
                             <option value="audio">Audio (Sonic)</option>
                             <option value="archive">Archive (Legacy)</option>
                          </select>
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
