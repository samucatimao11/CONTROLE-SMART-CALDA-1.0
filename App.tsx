import React, { useState, useEffect } from 'react';
import { NAV_ITEMS, APP_NAME, LOGO_URL } from './constants';
import { DashboardModule } from './components/modules/Dashboard';
import { OperationsModule } from './components/modules/Operations';
import { Menu, X, MoreHorizontal } from 'lucide-react';

interface NavButtonProps {
  item: typeof NAV_ITEMS[0];
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, isActive, onClick }) => {
   const Icon = item.icon;
   return (
      <button
          onClick={onClick}
          className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 mb-1
            ${isActive 
              ? 'bg-brand-blue-500/10 text-brand-blue-500 border-l-4 border-brand-blue-500 shadow-glow' 
              : 'text-brand-slate hover:bg-white/5 hover:text-brand-blue-500'
            }`}
      >
          <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-blue-500' : 'text-gray-400'}`} />
          {item.label}
      </button>
   );
};

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [showNames, setShowNames] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Show names after 1s
    const nameTimer = setTimeout(() => {
      setShowNames(true);
    }, 1000);

    // Start fade out after 2s (total duration)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500);

    // Finish after fade out completes
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(nameTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-[100] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-900 via-green-950 to-black flex flex-col items-center justify-center transition-opacity duration-500 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      
      <div className="animate-zoom-in flex flex-col items-center relative z-10">
        <img src={LOGO_URL} alt="Smart Calda Logo" className="h-24 w-auto mb-6 object-contain drop-shadow-[0_0_25px_rgba(34,197,94,0.4)]" />
        <h1 className="text-3xl font-bold text-white tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-green-200 drop-shadow-sm">Smart Calda</h1>
      </div>
      
      <div className={`mt-8 transition-opacity duration-700 ${showNames ? 'opacity-100' : 'opacity-0'} relative z-10`}>
        <p className="text-green-100/80 text-[10px] uppercase tracking-[0.3em] mb-3 text-center font-medium drop-shadow-sm">
          Desenvolvido por
        </p>
        <div className="flex flex-col items-center gap-1">
           <span className="text-white font-bold tracking-wide text-lg bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-200 drop-shadow-md">
             Samuel Franco
           </span>
           <span className="text-green-400/80 text-xs font-bold">&</span>
           <span className="text-white font-bold tracking-wide text-lg bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-200 drop-shadow-md">
             Pedro Arce
           </span>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardModule />;
      case 'operations': return <OperationsModule />;
      default: return <DashboardModule />;
    }
  };

  const activeNavItem = NAV_ITEMS.find(item => item.id === activeTab);

  // Mobile Bottom Nav Logic
  const PRIMARY_MOBILE_ITEMS = ['dashboard', 'operations'];

  // Categorize items
  const mainItems = NAV_ITEMS.filter(i => i.group === 'main');

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-metal-50 font-sans text-metal-900 pb-20 md:pb-0 selection:bg-brand-blue-500 selection:text-white">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="fixed inset-y-0 left-0 bg-white/80 backdrop-blur-xl border-r border-white/20 w-64 hidden md:flex flex-col z-20 shadow-xl">
        <div className="h-20 flex items-center px-6 border-b border-gray-100/50">
          <img src={LOGO_URL} alt="Smart Calda Logo" className="h-10 w-auto mr-3 object-contain" />
          <div>
            <h1 className="font-bold text-xl tracking-tight text-metal-900 leading-none">SMART CALDA</h1>
            <span className="text-[10px] font-bold text-brand-blue-500 uppercase tracking-wide block mt-0.5">CONTROLE DE O.S E CALDA</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Main Group */}
          <div className="mb-2">
              <div className="px-4 mb-2 text-xs font-bold text-brand-slate-400 uppercase tracking-wider">Geral</div>
              {mainItems.map((item) => (
                <NavButton 
                    key={item.id} 
                    item={item} 
                    isActive={activeTab === item.id} 
                    onClick={() => setActiveTab(item.id)} 
                />
              ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100/50 bg-gradient-to-b from-transparent to-white/50">
            <div className="mt-4 text-[10px] text-brand-slate-400 text-center font-medium">
              <p>v1.5 &copy; Usina Smart</p>
              <p className="mt-1 opacity-75">Dev: Samuel Franco & Pedro Arce</p>
            </div>
        </div>
      </aside>

      {/* --- MOBILE TOP HEADER --- */}
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
             <img src={LOGO_URL} alt="Logo" className="h-9 w-auto mr-2.5" />
             <div className="flex flex-col">
                <span className="font-bold text-metal-900 tracking-tight text-sm leading-none">SMART CALDA</span>
                <span className="text-[9px] font-bold text-brand-blue-500 uppercase tracking-wide mt-0.5">CONTROLE DE O.S E CALDA</span>
             </div>
          </div>
      </header>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 pb-safe z-40 px-6 py-2 flex justify-between items-center shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
         {/* Main Items */}
         {NAV_ITEMS.filter(i => PRIMARY_MOBILE_ITEMS.includes(i.id)).map(item => {
             const Icon = item.icon;
             const isActive = activeTab === item.id;
             return (
                 <button 
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-brand-blue-500 drop-shadow-sm' : 'text-brand-slate-400'}`}
                 >
                     <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                     <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                 </button>
             )
         })}
         
         {/* Menu Trigger */}
         <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-brand-slate-400 ${isMobileMenuOpen ? 'text-brand-blue-900' : ''}`}
         >
             <MoreHorizontal size={24} />
             <span className="text-[10px] font-medium">Menu</span>
         </button>
      </nav>

      {/* --- MOBILE FULL MENU DRAWER --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-metal-950/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            
            {/* Drawer Content */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-24 shadow-2xl animate-fade-in-up max-h-[85vh] overflow-y-auto ring-1 ring-white/20">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-transparent">
                    <h3 className="text-lg font-bold text-metal-900">Menu Principal</h3>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-metal-100 rounded-full text-metal-600">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Main Items Grid */}
                <div className="mb-6">
                    <h4 className="text-xs font-bold text-brand-slate-400 uppercase tracking-wider mb-3">Geral</h4>
                    <div className="grid grid-cols-4 gap-3">
                        {mainItems.map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 ${isActive ? 'bg-brand-blue-50 border-brand-blue-200 text-brand-blue-900 shadow-glow' : 'bg-metal-50 border-metal-100 text-metal-600'}`}
                                >
                                    <Icon size={24} />
                                    <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6 text-center">
                    <p className="text-[10px] text-brand-slate-400">Desenvolvido por</p>
                    <p className="text-xs font-bold text-green-700">Samuel Franco & Pedro Arce</p>
                </div>
            </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Title Header */}
          <div className="hidden md:flex flex-row justify-between items-center mb-8 pb-4 border-b border-gray-200/60">
             <div>
               <h2 className="text-2xl font-bold text-metal-900 tracking-tight">{activeNavItem?.label}</h2>
               <p className="text-sm text-brand-slate-500 mt-1">Visão geral e gestão operacional</p>
             </div>
          </div>

          {/* Mobile Title (Smaller) */}
          <div className="md:hidden mb-6 mt-2">
               <h2 className="text-xl font-bold text-metal-900">{activeNavItem?.label}</h2>
          </div>
          
          <div className="animate-fade-in-up">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;