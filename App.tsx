import React, { useState, useRef } from 'react';
import { NAV_ITEMS, APP_NAME, LOGO_URL } from './constants';
import { DashboardModule } from './components/modules/Dashboard';
import { OperationsModule } from './components/modules/Operations';
import { SupervisorsModule } from './components/modules/Supervisors';
import { LocationsModule } from './components/modules/Locations';
import { ResourcesModule } from './components/modules/Resources';
import { SectionsModule } from './components/modules/Sections';
import { DriversModule } from './components/modules/Drivers';
import { FleetModule } from './components/modules/Fleet';
import { Menu, X, Leaf, Database, Upload, Loader2, LayoutDashboard, Activity, MapPin, MoreHorizontal } from 'lucide-react';
import { ExcelParser } from './utils/excelParser';

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
              ? 'bg-brand-blue-50 text-brand-blue-900 border-l-4 border-brand-blue-500' 
              : 'text-brand-slate hover:bg-gray-50 hover:text-brand-blue-900'
            }`}
      >
          <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-brand-blue-500' : 'text-gray-400'}`} />
          {item.label}
      </button>
   );
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const masterFileInputRef = useRef<HTMLInputElement>(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardModule />;
      case 'operations': return <OperationsModule />;
      case 'resources': return <ResourcesModule />;
      case 'sections': return <SectionsModule />;
      case 'supervisors': return <SupervisorsModule />;
      case 'locations': return <LocationsModule />;
      case 'drivers': return <DriversModule />;
      case 'fleet': return <FleetModule />;
      default: return <DashboardModule />;
    }
  };

  const handleMasterDataImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    setTimeout(async () => {
        try {
            const resultLog = await ExcelParser.readFileSystem(file);
            alert('Importação Concluída:\n' + resultLog);
        } catch (error) {
            console.error(error);
            alert('Erro ao processar planilha. Verifique o formato do arquivo.');
        } finally {
            setIsImporting(false);
            if (masterFileInputRef.current) masterFileInputRef.current.value = '';
        }
    }, 100);
  };

  const activeNavItem = NAV_ITEMS.find(item => item.id === activeTab);

  // Mobile Bottom Nav Logic
  // We show 3 main items + a "Menu" item that opens the full drawer
  const PRIMARY_MOBILE_ITEMS = ['dashboard', 'operations', 'locations'];

  // Categorize items
  const mainItems = NAV_ITEMS.filter(i => i.group === 'main');
  const cadastroItems = NAV_ITEMS.filter(i => i.group === 'cadastros');

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="fixed inset-y-0 left-0 bg-white border-r border-gray-200 w-64 hidden md:flex flex-col z-20 shadow-sm">
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <img src={LOGO_URL} alt="Smart Calda Logo" className="h-10 w-auto mr-3 object-contain" />
          <div>
            <h1 className="font-bold text-xl tracking-tight text-brand-blue-900 leading-none">SMART CALDA</h1>
            <span className="text-[10px] font-bold text-brand-blue-500 uppercase tracking-wide block mt-0.5">CONTROLE DE O.S E CALDA</span>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Main Group */}
          <div className="mb-2">
              <div className="px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Geral</div>
              {mainItems.map((item) => (
                <NavButton 
                    key={item.id} 
                    item={item} 
                    isActive={activeTab === item.id} 
                    onClick={() => setActiveTab(item.id)} 
                />
              ))}
          </div>

          {/* Cadastros Group */}
          <div>
              <div className="px-4 mt-6 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Cadastros</div>
              {cadastroItems.map((item) => (
                <NavButton 
                    key={item.id} 
                    item={item} 
                    isActive={activeTab === item.id} 
                    onClick={() => setActiveTab(item.id)} 
                />
              ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
            <div className="relative group">
                <button 
                    disabled={isImporting}
                    className={`w-full flex items-center justify-center gap-2 bg-brand-blue-900 hover:bg-black text-white text-xs font-bold py-3 rounded-xl transition shadow-lg shadow-gray-200 ${isImporting ? 'opacity-70 cursor-wait' : ''}`}
                >
                    {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                    {isImporting ? 'Importando...' : 'Importar Cadastros'}
                </button>
                {!isImporting && (
                    <input 
                        type="file" 
                        ref={masterFileInputRef}
                        onChange={handleMasterDataImport}
                        accept=".xlsx, .xls"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        title="Importar planilha de cadastros"
                    />
                )}
            </div>
            <div className="mt-4 text-[10px] text-gray-400 text-center font-medium">
              v1.5 &copy; Usina Smart
            </div>
        </div>
      </aside>

      {/* --- MOBILE TOP HEADER --- */}
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
             <img src={LOGO_URL} alt="Logo" className="h-9 w-auto mr-2.5" />
             <div className="flex flex-col">
                <span className="font-bold text-brand-blue-900 tracking-tight text-sm leading-none">SMART CALDA</span>
                <span className="text-[9px] font-bold text-brand-blue-500 uppercase tracking-wide mt-0.5">CONTROLE DE O.S E CALDA</span>
             </div>
          </div>
          <div className="flex items-center gap-2">
             {/* Status Dot */}
             <div className="flex items-center gap-1.5 bg-sugar-green-50 px-2 py-1 rounded-full border border-sugar-green-100">
                <div className="w-2 h-2 rounded-full bg-sugar-green-600 animate-pulse"></div>
                <span className="text-[10px] font-bold text-sugar-green-700">ONLINE</span>
             </div>
          </div>
      </header>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40 px-6 py-2 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         {/* Main Items */}
         {NAV_ITEMS.filter(i => PRIMARY_MOBILE_ITEMS.includes(i.id)).map(item => {
             const Icon = item.icon;
             const isActive = activeTab === item.id;
             return (
                 <button 
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-brand-blue-900' : 'text-gray-400'}`}
                 >
                     <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                     <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
                 </button>
             )
         })}
         
         {/* Menu Trigger */}
         <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl text-gray-400 ${isMobileMenuOpen ? 'text-brand-blue-900' : ''}`}
         >
             <MoreHorizontal size={24} />
             <span className="text-[10px] font-medium">Menu</span>
         </button>
      </nav>

      {/* --- MOBILE FULL MENU DRAWER --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            
            {/* Drawer Content */}
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 pb-24 shadow-2xl animate-fade-in-up max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-transparent">
                    <h3 className="text-lg font-bold text-brand-blue-900">Menu Principal</h3>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Main Items Grid */}
                <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Geral</h4>
                    <div className="grid grid-cols-4 gap-3">
                        {mainItems.map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border ${isActive ? 'bg-brand-blue-50 border-brand-blue-200 text-brand-blue-900' : 'bg-gray-50 border-gray-100 text-gray-600'}`}
                                >
                                    <Icon size={24} />
                                    <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Cadastros Items Grid */}
                <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cadastros</h4>
                    <div className="grid grid-cols-4 gap-3">
                        {cadastroItems.map(item => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border ${isActive ? 'bg-brand-blue-50 border-brand-blue-200 text-brand-blue-900' : 'bg-gray-50 border-gray-100 text-gray-600'}`}
                                >
                                    <Icon size={24} />
                                    <span className="text-[10px] font-medium text-center leading-tight">{item.label.split(' ')[0]}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="border-t pt-6">
                    <div className="relative group">
                        <button 
                            disabled={isImporting}
                            className={`w-full flex items-center justify-center gap-2 bg-brand-blue-900 text-white font-bold py-3 rounded-xl ${isImporting ? 'opacity-70' : ''}`}
                        >
                            {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                            {isImporting ? 'Importando...' : 'Importar Cadastros (XLSX)'}
                        </button>
                         {!isImporting && (
                            <input 
                                type="file" 
                                onChange={handleMasterDataImport}
                                accept=".xlsx, .xls"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MAIN CONTENT --- */}
      <main className="md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Title Header */}
          <div className="hidden md:flex flex-row justify-between items-center mb-8 pb-4 border-b border-gray-200">
             <div>
               <h2 className="text-2xl font-bold text-brand-blue-900 tracking-tight">{activeNavItem?.label}</h2>
               <p className="text-sm text-brand-slate mt-1">Visão geral e gestão operacional</p>
             </div>
             
             <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-sm text-brand-slate bg-white px-3 py-1.5 rounded-full border shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-sugar-green-600 animate-pulse"></span>
                    Sistema Online
                 </div>
             </div>
          </div>

          {/* Mobile Title (Smaller) */}
          <div className="md:hidden mb-6 mt-2">
               <h2 className="text-xl font-bold text-gray-900">{activeNavItem?.label}</h2>
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