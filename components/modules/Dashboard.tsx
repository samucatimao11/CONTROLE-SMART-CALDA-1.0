import React, { useState, useEffect } from 'react';
import { Operation, Supervisor, Location, Resource, Section, OperationStatus } from '../../types';
import { DataService } from '../../services/dataService';
import { PdfGenerator } from '../../utils/pdfGenerator';
import { AlertCircle, CheckCircle2, Search, ArrowLeft, FileText, UserCog, Cog, LayoutGrid, MapPin, Sprout, TrendingUp, Download, Inbox, Activity } from 'lucide-react';

type ViewState = 'overview' | 'in_progress_list' | 'no_syrup_list' | 'completed_list';

export const DashboardModule: React.FC = () => {
  // Data
  const [operations, setOperations] = useState<Operation[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  
  // UI State
  const [viewState, setViewState] = useState<ViewState>('overview');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Search
  const [searchOS, setSearchOS] = useState('');
  const [searchSector, setSearchSector] = useState('');
  const [searchOp, setSearchOp] = useState('');
  const [searchSup, setSearchSup] = useState('');

  useEffect(() => {
    setOperations(DataService.getOperations());
    setSupervisors(DataService.getSupervisors());
    setLocations(DataService.getLocations());
    setSections(DataService.getSections());
    setResources(DataService.getResources());
  }, []);

  // 1. Group Operations by OS
  const groupedOperations = operations.reduce((acc, op) => {
    const key = op.osCode || op.id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(op);
    return acc;
  }, {} as Record<string, Operation[]>);

  // 2. Classify Groups into Categories
  const classifiedGroups = React.useMemo(() => {
    const inProgress: string[] = [];
    const noSyrup: string[] = [];
    const completed: string[] = [];

    Object.keys(groupedOperations).forEach(key => {
        const group = groupedOperations[key];
        const primaryOp = group[0];
        
        const allVolumes = group.flatMap(g => g.volumes || []);
        
        if (allVolumes.length === 0) {
            noSyrup.push(key);
            return;
        }

        const appTotal = primaryOp.applicationTotalVolume || 0;
        const sumProductTotal = group.reduce((acc, item) => acc + (item.targetVolume || 0), 0);
        const totalTargetVolume = appTotal > 0 ? appTotal : sumProductTotal;

        const totalRealizedVolume = allVolumes
            .filter(v => v.isDelivered)
            .reduce((acc, v) => acc + v.liters, 0);

        if (totalTargetVolume > 0 && totalRealizedVolume >= totalTargetVolume) {
            completed.push(key);
        } else {
            inProgress.push(key);
        }
    });

    return { inProgress, noSyrup, completed };
  }, [groupedOperations]);

  // 3. Filter displayed groups
  const displayGroupsKeys = React.useMemo(() => {
     let keys: string[] = [];
     if (viewState === 'in_progress_list') keys = classifiedGroups.inProgress;
     else if (viewState === 'no_syrup_list') keys = classifiedGroups.noSyrup;
     else if (viewState === 'completed_list') keys = classifiedGroups.completed;
     else return [];

     if (!searchOS && !searchSector && !searchOp && !searchSup) return keys;

     return keys.filter(key => {
        const primaryOp = groupedOperations[key][0];
        const matchOS = !searchOS || (primaryOp.osCode || primaryOp.id).toLowerCase().includes(searchOS.toLowerCase());
        const location = locations.find(l => l.id === primaryOp.locationId);
        const locName = location ? location.sectorName.toLowerCase() : '';
        const matchSector = !searchSector || locName.includes(searchSector.toLowerCase());
        const matchOp = !searchOp || primaryOp.operationNumber.toLowerCase().includes(searchOp.toLowerCase());
        const supervisor = supervisors.find(s => s.id === primaryOp.supervisorId);
        const supName = supervisor ? supervisor.name.toLowerCase() : '';
        const matchSup = !searchSup || supName.includes(searchSup.toLowerCase());
        return matchOS && matchSector && matchOp && matchSup;
     });
  }, [viewState, classifiedGroups, groupedOperations, searchOS, searchSector, searchOp, searchSup, locations, supervisors]);

  const handleDownloadPdf = () => {
    PdfGenerator.generateDailyReport(
      groupedOperations, 
      supervisors, 
      locations, 
      resources,
      reportDate
    );
  };

  const getStatusColor = (s: OperationStatus) => {
    switch (s) {
      case OperationStatus.MISTURA: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OperationStatus.CAMINHO: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OperationStatus.CONCLUIDA: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClearSearch = () => {
    setSearchOS(''); setSearchSector(''); setSearchOp(''); setSearchSup('');
  };

  // --- RENDER OVERVIEW ---
  if (viewState === 'overview') {
      return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col md:flex-row items-center justify-between gap-4">
                <h3 className="text-md font-bold text-gray-800">Relatório Diário de Operações</h3>
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={reportDate}
                        onChange={e => setReportDate(e.target.value)}
                        className="px-3 py-2 bg-white text-black border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sugar-green-500"
                    />
                    <button 
                        onClick={handleDownloadPdf}
                        className="flex items-center gap-2 bg-sugar-green-600 hover:bg-sugar-green-700 text-white font-bold py-2 px-4 rounded-md shadow transition"
                    >
                        <Download size={16} /> Baixar PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                    onClick={() => setViewState('in_progress_list')}
                    className="bg-white p-6 rounded-xl shadow-md border-l-8 border-orange-500 flex items-start justify-between hover:shadow-lg hover:scale-[1.01] transition-all text-left"
                >
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Em Andamento</p>
                        <h3 className="text-5xl font-extrabold text-gray-800 mt-2">{classifiedGroups.inProgress.length}</h3>
                        <span className="text-xs text-orange-600 font-semibold mt-2 inline-block">OS com calda registrada</span>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-full text-orange-600"><Activity size={24} /></div>
                </button>
                <button 
                    onClick={() => setViewState('no_syrup_list')}
                    className="bg-white p-6 rounded-xl shadow-md border-l-8 border-blue-500 flex items-start justify-between hover:shadow-lg hover:scale-[1.01] transition-all text-left"
                >
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Sem Caldas</p>
                        <h3 className="text-5xl font-extrabold text-gray-800 mt-2">{classifiedGroups.noSyrup.length}</h3>
                         <span className="text-xs text-blue-600 font-semibold mt-2 inline-block">Aguardando registro de viagens</span>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Inbox size={24} /></div>
                </button>
                <button 
                    onClick={() => setViewState('completed_list')}
                    className="bg-white p-6 rounded-xl shadow-md border-l-8 border-green-500 flex items-start justify-between hover:shadow-lg hover:scale-[1.01] transition-all text-left"
                >
                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">Completas</p>
                        <h3 className="text-5xl font-extrabold text-gray-800 mt-2">{classifiedGroups.completed.length}</h3>
                         <span className="text-xs text-green-600 font-semibold mt-2 inline-block">100% das cargas entregues</span>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full text-green-600"><CheckCircle2 size={24} /></div>
                </button>
            </div>
        </div>
      );
  }

  const listTitles: Record<ViewState, string> = {
    overview: '',
    in_progress_list: 'OS em Andamento',
    no_syrup_list: 'OS Sem Caldas Registradas',
    completed_list: 'OS Completas'
  };

  // --- RENDER DETAIL LIST ---
  return (
    <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between items-center gap-4 mb-4">
                <button onClick={() => { setViewState('overview'); handleClearSearch(); }} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold bg-gray-100 px-4 py-2 rounded-lg">
                    <ArrowLeft size={20} /> Voltar
                </button>
                <h2 className="text-xl font-bold text-gray-900">{listTitles[viewState]}</h2>
            </div>
            {/* Search Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search inputs here */}
            </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {displayGroupsKeys.length === 0 ? (
                 <div className="text-center py-20 text-gray-500 bg-white rounded-lg shadow">
                    <p>Nenhuma operação encontrada nesta categoria.</p>
                </div>
            ) : (
                displayGroupsKeys.map(osKey => {
                    const group = groupedOperations[osKey];
                    const primaryOp = group[0]; 
                    const supervisor = supervisors.find(s => s.id === primaryOp.supervisorId);
                    const location = locations.find(l => l.id === primaryOp.locationId);
                    const section = sections.find(s => s.id === primaryOp.sectionId);
                    const appTotal = primaryOp.applicationTotalVolume || group.reduce((acc, item) => acc + (item.targetVolume || 0), 0);
                    const totalRealizedVolume = group.flatMap(g => g.volumes || []).filter(v => v.isDelivered).reduce((acc, v) => acc + v.liters, 0);
                    const progress = appTotal > 0 ? Math.min((totalRealizedVolume / appTotal) * 100, 100) : 0;
                    return (
                        <div key={osKey} className="bg-white border rounded-lg shadow-sm">
                             <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-gray-600" size={24} />
                                        <h3 className="text-xl font-bold text-gray-900">OS: {primaryOp.osCode}</h3>
                                    </div>
                                </div>
                                {/* Details */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                                    <div><p className="text-xs text-gray-500">Encarregado</p><p className="font-bold">{supervisor?.name || '-'}</p></div>
                                    <div><p className="text-xs text-gray-500">Operação</p><p className="font-bold">{primaryOp.operationNumber}</p></div>
                                    <div><p className="text-xs text-gray-500">Seção</p><p className="font-bold">{section?.name || '-'}</p></div>
                                    <div><p className="text-xs text-gray-500">Setor</p><p className="font-bold">{location?.sectorName || '-'}</p></div>
                                </div>
                                {/* Progress Bar */}
                                {viewState !== 'no_syrup_list' && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-bold text-gray-700">Progresso</span>
                                            <span className={`text-lg font-bold ${progress >= 100 ? 'text-green-600' : 'text-gray-800'}`}>{progress.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${progress >= 100 ? 'bg-green-600' : 'bg-sugar-green-600'}`} style={{ width: `${progress}%` }}></div></div>
                                        <div className="text-right text-xs text-gray-500 mt-1">{totalRealizedVolume.toLocaleString()} / {appTotal.toLocaleString()} L</div>
                                    </div>
                                )}
                             </div>
                        </div>
                    );
                })
            )}
        </div>
    </div>
  );
};