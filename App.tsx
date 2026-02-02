
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MapExplorer from './components/MapExplorer';
import ARViewer from './components/ARViewer';
import GalleryView from './components/GalleryView';
import LandingView from './components/LandingView';
import Dashboard from './components/Dashboard';
import PortalToggle from './components/PortalToggle';
import UrbanPlay from './components/UrbanPlay';
import JourneyLanding from './components/JourneyLanding';
import ExhibitionsCatalogue from './components/ExhibitionsCatalogue';
import { ViewState, Artwork, PortalMode, Language, ExperienceJourney } from './types';
import { translations } from './translations';
import { ARTWORKS } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [portalMode, setPortalMode] = useState<PortalMode>('visitor');
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | undefined>();
  const [isNightMode, setIsNightMode] = useState(false);
  const [lang, setLang] = useState<Language>('ar');
  const [activeJourney, setActiveJourney] = useState<ExperienceJourney | null>(null);
  const [publishedExhibitions, setPublishedExhibitions] = useState<ExperienceJourney[]>([]);

  const t = translations[lang];

  // Logic to handle navigation to AR view more robustly
  const enterARView = () => {
    if (!selectedArtwork) {
      // Default to the first artwork if none selected
      setSelectedArtwork(ARTWORKS[0]);
    }
    setView('ar-view');
  };

  const handlePortalChange = (mode: PortalMode) => {
    setPortalMode(mode);
    if (mode === 'creator' || mode === 'curator') {
      setView('dashboard');
    } else {
      setView('landing');
    }
  };

  useEffect(() => {
    if (view === 'dashboard' && portalMode === 'visitor') {
      setPortalMode('creator');
    } else if (view !== 'dashboard' && view !== 'ar-view' && view !== 'journey-landing' && portalMode !== 'visitor') {
      setPortalMode('visitor');
    }
  }, [view]);

  const handleArtworkSelection = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    const savedItems = localStorage.getItem('awasser_recently_viewed');
    let recentIds: string[] = savedItems ? JSON.parse(savedItems) : [];
    recentIds = [artwork.id, ...recentIds.filter(id => id !== artwork.id)].slice(0, 3);
    localStorage.setItem('awasser_recently_viewed', JSON.stringify(recentIds));
    setView('ar-view');
  };

  const handlePublishJourney = (journey: ExperienceJourney) => {
    setPublishedExhibitions(prev => [journey, ...prev]);
    setActiveJourney(journey);
    setView('journey-landing');
  };

  const handleExhibitionSelect = (ex: ExperienceJourney) => {
    setActiveJourney(ex);
    setView('journey-landing');
  };

  const isFullWidthView = view === 'dashboard';

  const renderView = () => {
    // Adding a wrapping div with a key to force re-mounting and ensure animations trigger
    return (
      <div key={view} className="h-full w-full view-transition">
        {(() => {
          switch (view) {
            case 'landing':
              return (
                <LandingView 
                  isNightMode={isNightMode} 
                  onToggleNightMode={() => setIsNightMode(!isNightMode)} 
                  setView={setView}
                  lang={lang}
                />
              );
            case 'dashboard':
              return (
                <Dashboard 
                  onPublishJourney={handlePublishJourney} 
                  onExit={() => handlePortalChange('visitor')}
                  lang={lang} 
                  portalMode={portalMode} 
                />
              );
            case 'exhibitions':
              return (
                <ExhibitionsCatalogue 
                  exhibitions={publishedExhibitions} 
                  onSelect={handleExhibitionSelect} 
                  lang={lang} 
                />
              );
            case 'explore':
              return <MapExplorer onSelectArtwork={handleArtworkSelection} lang={lang} />;
            case 'gallery':
              return <GalleryView onSelectArtwork={handleArtworkSelection} lang={lang} />;
            case 'play':
              return <UrbanPlay lang={lang} />;
            case 'journey-landing':
              return activeJourney ? <JourneyLanding journey={activeJourney} onBack={() => setView('exhibitions')} lang={lang} /> : null;
            case 'ar-view':
              return (
                <ARViewer 
                  artwork={selectedArtwork} 
                  onClose={() => setView('explore')} 
                />
              );
            default:
              return <LandingView lang={lang} isNightMode={isNightMode} onToggleNightMode={() => setIsNightMode(!isNightMode)} setView={setView} />;
          }
        })()}
      </div>
    );
  };

  return (
    <div className={`relative h-screen w-full transition-all duration-500 overflow-hidden flex flex-col mx-auto ${isFullWidthView ? 'max-w-none bg-slate-950' : 'max-w-md shadow-2xl bg-slate-950'} ${isNightMode ? 'night-mode' : ''} ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Global Controls Overlay */}
      {view !== 'ar-view' && view !== 'journey-landing' && view !== 'dashboard' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none">
          <div className="pointer-events-auto">
            <PortalToggle mode={portalMode} setMode={handlePortalChange} lang={lang} />
          </div>
          <button 
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="self-center px-4 py-1.5 glass-morphism rounded-full text-[9px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/30 backdrop-blur-md pointer-events-auto active:scale-95 transition-transform"
          >
            {t.switchLang}
          </button>
        </div>
      )}
      
      <main className="flex-1 relative overflow-hidden">
        {renderView()}
      </main>
      
      {view !== 'ar-view' && view !== 'journey-landing' && view !== 'dashboard' && portalMode === 'visitor' && (
        <Header currentView={view} setView={setView} lang={lang} onARClick={enterARView} />
      )}
    </div>
  );
};

export default App;
