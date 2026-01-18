import React, { useState, useEffect, useMemo } from 'react';
import { Operation, Supervisor, Location, Resource, Section, OperationStatus } from '../../types';
import { DataService } from '../../services/dataService';
import { Search, ArrowLeft, FileText, UserCog, Cog, MapPin, BarChart3, PieChart as PieIcon, TrendingUp, RefreshCw, Loader2, Droplet, Clock, CheckCircle2, FlaskConical, ClipboardList, LayoutDashboard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { ExcelParser } from '../../utils/excelParser';
import { EXCEL_URL } from '../../constants';

type ViewState = 'overview' | 'list_view';

// Updated Palette based on user request
const COLORS = {
  completed: '#76B72A', // Green
  inProgress: '#EABA00', // Yellow/Amber
  pending: '#4B5F73',   // Slate Blue
  barPrimary: '#052D51', // Dark Blue (Brand)
  barSecondary: '#76B72A', // Green (Brand)
  background: '#ffffff',
  text: '#1e293b',
  grid: '#f1f5f9'
};

// Custom Chart Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-xl">
        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-brand-blue-900 font-bold text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }}></span>
          {payload[0].value} O.S.
        </p>
      </div>
    );
  }
  return null;
};

export const DashboardModule: React.FC = () => {
  // Data
  const [operations, setOperations] = useState<Operation[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  
  // UI State
  const [viewState, setViewState] = useState<ViewState>('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // Search state
  const [searchOS, setSearchOS] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setOperations(DataService.getOperations());
    setSupervisors(DataService.getSupervisors());
    setLocations(DataService.getLocations());
    setSections(DataService.getSections());
    setResources(DataService.getResources());
  };

  const handleSyncData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(EXCEL_URL);
      if (!response.ok) {
        throw new Error('Falha ao baixar planilha da nuvem.');
      }
      
      const blob = await response.blob();
      const file = new File([blob], "ATLOS.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      // Allow UI to update loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const resultMsg = await ExcelParser.readOperations(file);
      refreshData();
      alert(resultMsg);
    } catch (error) {
      console.error(error);
      alert('Erro ao sincronizar dados. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Group Operations by OS
  const groupedOperations = useMemo<Record<string, Operation[]>>(() => {
    return operations.reduce((acc, op) => {
      const key = op.osCode || op.id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(op);
      return acc;
    }, {} as Record<string, Operation[]>);
  }, [operations]);

  // 2. Classify Groups
  const classifiedGroups = useMemo(() => {
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

        if (totalTargetVolume > 0 && totalRealizedVolume >= (totalTargetVolume * 0.99)) {
            completed.push(key);
        } else {
            inProgress.push(key);
        }
    });

    return { inProgress, noSyrup, completed };
  }, [groupedOperations]);

  // 3. Calculate Volume Metrics
  const volumeMetrics = useMemo(() => {
    let totalDelivered = 0;
    let totalAvailable = 0;
    let totalProgrammed = 0;

    (Object.values(groupedOperations) as Operation[][]).forEach(group => {
        const primaryOp = group[0];
        const appTotal = primaryOp.applicationTotalVolume || group.reduce((acc, item) => acc + (item.targetVolume || 0), 0);
        totalProgrammed += appTotal;

        const uniqueVolumeIds = new Set<string>();
        group.forEach(op => {
            if (op.volumes) {
                op.volumes.forEach(vol => {
                    if (!uniqueVolumeIds.has(vol.id)) {
                        uniqueVolumeIds.add(vol.id);
                        if (vol.isDelivered) {
                            totalDelivered += vol.liters;
                        } else if (vol.statusLabel === 'DISPONIVEL') {
                            totalAvailable += vol.liters;
                        }
                    }
                });
            }
        });
    });

    return { totalDelivered, totalAvailable, totalProgrammed };
  }, [groupedOperations]);


  // --- CHART DATA ---

  const statusChartData = useMemo(() => [
    { name: '100% Entregue', value: classifiedGroups.completed.length, color: COLORS.completed },
    { name: 'Em Andamento', value: classifiedGroups.inProgress.length, color: COLORS.inProgress },
  ].filter(d => d.value > 0), [classifiedGroups]);

  const activeOSKeys = useMemo(() => {
    return [...classifiedGroups.inProgress, ...classifiedGroups.noSyrup];
  }, [classifiedGroups]);

  const operationChartData = useMemo(() => {
    const stats: Record<string, number> = {};
    activeOSKeys.forEach(key => {
        const group = groupedOperations[key];
        const primaryOp = group[0];
        const opLabel = primaryOp.operationNumber || 'N/A';
        stats[opLabel] = (stats[opLabel] || 0) + 1;
    });
    return Object.entries(stats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15); 
  }, [groupedOperations, activeOSKeys]);

  const supervisorChartData = useMemo(() => {
    const stats: Record<string, number> = {};
    activeOSKeys.forEach(key => {
        const group = groupedOperations[key];
        const primaryOp = group[0];
        const supId = primaryOp.supervisorId;
        const safeKey = supId ? String(supId).trim() : 'N/A';
        stats[safeKey] = (stats[safeKey] || 0) + 1;
    });

    return Object.entries(stats)
        .map(([id, count]) => {
            const sup = supervisors.find(s => String(s.id).trim() === id);
            let displayName = id;
            if (sup) {
                const nameParts = sup.name.trim().split(/\s+/);
                if (nameParts.length > 2) {
                   displayName = `${nameParts[0]} ${nameParts[1].charAt(0)}.`;
                } else if (nameParts.length > 1) {
                    displayName = `${nameParts[0]} ${nameParts[nameParts.length - 1].charAt(0)}.`;
                } else {
                    displayName = nameParts[0];
                }
            } else if (id === 'N/A') {
                displayName = 'Sem Enc.';
            }
            return {
                name: displayName,
                fullName: sup ? sup.name : (id !== 'N/A' ? id : 'Não Atribuído'),
                count
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 30);
  }, [groupedOperations, supervisors, activeOSKeys]);


  // --- RENDER ---
  if (viewState === 'overview') {
      return (
        <div className="space-y-8 pb-10 animate-fade-in-up">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-brand-blue-900 flex items-center gap-2">
                         <div className="bg-brand-blue-500 p-2 rounded-lg text-white shadow-lg shadow-brand-blue-100">
                             <FlaskConical size={24} />
                         </div>
                         Status caldas O.S no periodo
                    </h3>
                    <p className="text-brand-slate font-medium mt-1 text-sm">Monitoramento em tempo real de volumes e entregas.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleSyncData}
                        disabled={isLoading}
                        className={`flex items-center gap-2 bg-white text-brand-slate border border-gray-200 hover:border-brand-blue-500 hover:text-brand-blue-500 font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all duration-200 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        <span className="hidden md:inline text-sm">Sincronizar</span>
                    </button>
                    <button 
                         onClick={() => setViewState('list_view')}
                         className="flex items-center gap-2 bg-brand-blue-500 hover:bg-brand-blue-900 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all duration-200"
                    >
                        <FileText size={18} /> 
                        <span className="text-sm">Ver Lista</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Total Programmed */}
                <div className="relative group overflow-hidden bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 hover:border-brand-blue-500 transition-all duration-300">
                    <div className="absolute -right-6 -top-6 text-brand-blue-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
                        <ClipboardList size={140} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-brand-blue-50 rounded-xl text-brand-blue-900">
                                <ClipboardList size={24} />
                            </div>
                            <span className="text-xs font-bold text-brand-slate uppercase tracking-wider">Total Programado</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                             <h4 className="text-3xl font-extrabold text-gray-900">
                                {volumeMetrics.totalProgrammed.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </h4>
                            <span className="text-sm font-bold text-gray-400">L</span>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue-500 to-brand-blue-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>

                {/* Card 2: Total Delivered */}
                <div className="relative group overflow-hidden bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 hover:border-sugar-green-600 transition-all duration-300">
                    <div className="absolute -right-6 -top-6 text-sugar-green-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
                         <CheckCircle2 size={140} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-sugar-green-50 rounded-xl text-sugar-green-600">
                                <CheckCircle2 size={24} />
                            </div>
                            <span className="text-xs font-bold text-brand-slate uppercase tracking-wider">Total Entregue</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                             <h4 className="text-3xl font-extrabold text-gray-900">
                                {volumeMetrics.totalDelivered.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </h4>
                            <span className="text-sm font-bold text-gray-400">L</span>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sugar-green-500 to-sugar-green-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>

                {/* Card 3: Total Available */}
                <div className="relative group overflow-hidden bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 hover:border-brand-yellow-500 transition-all duration-300">
                    <div className="absolute -right-6 -top-6 text-brand-yellow-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
                         <Clock size={140} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-brand-yellow-100 rounded-xl text-brand-yellow-500">
                                <Clock size={24} />
                            </div>
                            <span className="text-xs font-bold text-brand-slate uppercase tracking-wider">Disponível à Entregar</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                             <h4 className="text-3xl font-extrabold text-gray-900">
                                {volumeMetrics.totalAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </h4>
                            <span className="text-sm font-bold text-gray-400">L</span>
                        </div>
                    </div>
                     <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-yellow-500 to-yellow-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Donut Chart */}
                <div className="lg:col-span-1 bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-[420px]">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-brand-blue-900 flex items-center gap-2">
                            <PieIcon className="text-brand-slate" size={20} />
                            Status das O.S.
                        </h3>
                        <p className="text-xs text-brand-slate mt-1 font-medium">Progresso das ordens ativas vs entregues</p>
                    </div>
                    
                    <div className="w-full flex-1 relative">
                         {statusChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={6}
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle" 
                                        iconSize={8}
                                        wrapperStyle={{fontSize: '12px', fontWeight: 600, color: '#4B5F73'}} 
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                         ) : (
                             <div className="flex h-full items-center justify-center text-gray-300 text-sm">Sem dados disponíveis</div>
                         )}
                         {/* Center Text */}
                         {statusChartData.length > 0 && (
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-10">
                                 <div className="text-center">
                                     <span className="text-5xl font-bold text-gray-800 tracking-tight">
                                         {statusChartData.reduce((acc, curr) => acc + curr.value, 0)}
                                     </span>
                                     <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total</span>
                                 </div>
                             </div>
                         )}
                    </div>
                </div>

                {/* Operations Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-[420px]">
                     <div className="mb-4">
                        <h3 className="text-lg font-bold text-brand-blue-900 flex items-center gap-2">
                            <Cog className="text-brand-slate" size={20} />
                            O.S. Ativas por Operação
                        </h3>
                        <p className="text-xs text-brand-slate mt-1 font-medium">Volume por tipo de atividade</p>
                    </div>
                    
                    <div className="w-full flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={operationChartData}
                                margin={{ top: 20, right: 10, left: 0, bottom: 0 }}
                                barSize={40}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{fontSize: 11, fill: '#4B5F73', fontWeight: 500}} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    dy={10}
                                />
                                <YAxis 
                                    allowDecimals={false} 
                                    width={30} 
                                    tick={{fontSize: 11, fill: '#4B5F73'}} 
                                    axisLine={false} 
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', radius: 4}} />
                                <Bar dataKey="count" fill={COLORS.barPrimary} radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="count" position="top" fill="#4B5F73" fontSize={11} fontWeight={600} offset={5} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Supervisors Bar Chart */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col h-[500px]">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-brand-blue-900 flex items-center gap-2">
                        <UserCog className="text-brand-slate" size={20} />
                        O.S. Ativas por Encarregado
                    </h3>
                    <p className="text-xs text-brand-slate mt-1 font-medium">Volume de trabalho pendente por equipe</p>
                </div>

                <div className="w-full flex-1">
                    {supervisorChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={supervisorChartData}
                                margin={{ top: 20, right: 10, left: 0, bottom: 60 }}
                                barSize={24}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{fontSize: 10, angle: -45, textAnchor: 'end', fill: '#4B5F73', fontWeight: 500}} 
                                    interval={0} 
                                    height={60}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    allowDecimals={false} 
                                    width={30} 
                                    tick={{fontSize: 11, fill: '#4B5F73'}} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc', radius: 4}} />
                                <Bar dataKey="count" fill={COLORS.barSecondary} radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="count" position="top" fill="#4B5F73" fontSize={10} fontWeight={600} offset={5} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-300 italic">
                            Sem dados de encarregados para exibir
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  }

  // --- RENDER DETAIL LIST ---
  return (
    <div className="space-y-6 animate-fade-in-up">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center gap-4 mb-4">
                <button onClick={() => { setViewState('overview'); setSearchOS(''); }} className="flex items-center gap-2 text-brand-slate hover:text-brand-blue-900 font-bold bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl transition">
                    <ArrowLeft size={20} /> Voltar ao Painel
                </button>
                <h2 className="text-xl font-bold text-brand-blue-900">Lista Detalhada</h2>
            </div>
            <div className="relative group">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400 group-focus-within:text-sugar-green-600 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Buscar OS ou Encarregado..." 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 text-black border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-sugar-green-500 focus:border-transparent outline-none transition-all shadow-sm"
                    value={searchOS}
                    onChange={(e) => setSearchOS(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {Object.keys(groupedOperations)
                .filter(key => !searchOS || key.toLowerCase().includes(searchOS.toLowerCase()))
                .map(osKey => {
                    const group = groupedOperations[osKey];
                    const primaryOp = group[0];
                    const supervisor = supervisors.find(s => s.id === primaryOp.supervisorId);
                    
                    const appTotal = primaryOp.applicationTotalVolume || group.reduce((acc, item) => acc + (item.targetVolume || 0), 0);
                    const totalRealizedVolume = group.flatMap(g => g.volumes || []).filter(v => v.isDelivered).reduce((acc, v) => acc + v.liters, 0);
                    const progress = appTotal > 0 ? Math.min((totalRealizedVolume / appTotal) * 100, 100) : 0;

                    return (
                        <div key={osKey} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="bg-brand-blue-50 p-1.5 rounded-lg text-brand-blue-900">
                                            <LayoutDashboard size={16}/>
                                        </div>
                                        <h3 className="font-bold text-lg text-gray-900 tracking-tight">{primaryOp.osCode}</h3>
                                    </div>
                                    <p className="text-xs font-semibold text-brand-slate flex items-center gap-1.5 mt-2">
                                        <UserCog size={14} className="text-gray-400" />
                                        {supervisor?.name || 'Sem Encarregado'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-extrabold ${progress >= 100 ? 'text-sugar-green-600' : 'text-gray-900'}`}>{progress.toFixed(0)}%</div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Concluído</span>
                                </div>
                             </div>
                             
                             <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
                                <div className={`h-2 rounded-full transition-all duration-700 ${progress >= 100 ? 'bg-sugar-green-600' : 'bg-gradient-to-r from-sugar-green-500 to-sugar-green-400'}`} style={{width: `${progress}%`}}></div>
                             </div>
                             
                             <div className="flex justify-between items-center text-xs text-brand-slate font-medium bg-gray-50 p-2 rounded-lg">
                                 <span className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 uppercase">Realizado</span>
                                    <span className="font-bold text-gray-700">{totalRealizedVolume.toLocaleString()} L</span>
                                 </span>
                                 <span className="h-6 w-px bg-gray-200"></span>
                                 <span className="flex flex-col text-right">
                                    <span className="text-[10px] text-gray-400 uppercase">Meta</span>
                                    <span className="font-bold text-gray-700">{appTotal.toLocaleString()} L</span>
                                 </span>
                             </div>
                        </div>
                    );
                })}
        </div>
    </div>
  );
};