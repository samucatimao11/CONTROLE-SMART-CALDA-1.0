import React, { useState, useRef } from 'react';
import { NAV_ITEMS, APP_NAME } from './constants';
import { DashboardModule } from './components/modules/Dashboard';
import { OperationsModule } from './components/modules/Operations';
import { SupervisorsModule } from './components/modules/Supervisors';
import { LocationsModule } from './components/modules/Locations';
import { ResourcesModule } from './components/modules/Resources';
import { SectionsModule } from './components/modules/Sections';
import { DriversModule } from './components/modules/Drivers';
import { FleetModule } from './components/modules/Fleet';
import { Menu, X, Leaf, Database, Upload, Loader2 } from 'lucide-react';
import { ExcelParser } from './utils/excelParser';

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

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar for Desktop */}
      <aside className="fixed inset-y-0 left-0 bg-black text-white w-64 hidden md:flex flex-col z-20 shadow-xl">
        <div className="h-20 flex items-center px-6 border-b border-gray-800 bg-sugar-green-800">
          <Leaf className="text-sugar-green-500 mr-2" />
          <h1 className="font-bold text-lg tracking-wider text-sugar-green-50">SMART CALDA</h1>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors duration-200 
                  ${isActive 
                    ? 'bg-sugar-green-600 text-white shadow-md' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 bg-gray-900">
            <div className="relative group">
                <button 
                    disabled={isImporting}
                    className={`w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 rounded transition border border-gray-700 ${isImporting ? 'opacity-50 cursor-wait' : ''}`}
                >
                    {isImporting ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
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
            <div className="mt-3 text-[10px] text-gray-600 text-center">
              &copy; 2024 Usina Smart v1.2
            </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-sugar-green-800 text-white shadow-md sticky top-0 z-30">
        <div className="px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
             <Leaf className="text-sugar-green-500 mr-2 h-6 w-6" />
             <span className="font-bold text-lg">SMART CALDA</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="bg-black border-t border-gray-800 px-2 pt-2 pb-4 space-y-1 shadow-xl">
             {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-3 rounded-md text-base font-medium
                    ${activeTab === item.id 
                      ? 'bg-sugar-green-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 pb-4 border-b border-gray-200">
             <div>
               <h2 className="text-2xl font-bold text-gray-900">{activeNavItem?.label}</h2>
               <p className="text-sm text-gray-500 mt-1">Gestão operacional da usina</p>
             </div>
             
             {/* Desktop Header Action Area */}
             <div className="hidden md:flex items-center gap-4">
                 <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Sistema Online
                 </div>
             </div>
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