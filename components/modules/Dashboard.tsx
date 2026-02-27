import React, { useState, useEffect, useMemo } from 'react';
import { Operation, Supervisor, Location, Resource, Section, OperationStatus } from '../../types';
import { DataService } from '../../services/dataService';
import { Search, ArrowLeft, FileText, UserCog, Cog, MapPin, BarChart3, PieChart as PieIcon, TrendingUp, RefreshCw, Loader2, Droplet, Clock, CheckCircle2, FlaskConical, ClipboardList, LayoutDashboard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import { ExcelParser } from '../../utils/excelParser';
import { EXCEL_URL } from '../../constants';

type ViewState = 'overview' | 'list_view';

// Updated Palette based on user request (Metallic / Futuristic)
const COLORS = {
  completed: '#22c55e', // Neon Green
  inProgress: '#fbbf24', // Metallic Gold
  pending: '#64748b',   // Metallic Slate
  barPrimary: '#0ea5e9', // Electric Blue
  barSecondary: '#22c55e', // Neon Green
  background: '#ffffff',
  text: '#1e293b',
  grid: '#e2e8f0'
};

// Custom Chart Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-metal-900/90 backdrop-blur-md p-4 border border-white/10 shadow-glow rounded-xl text-white">
        <p className="text-xs font-bold text-brand-slate-400 mb-2 uppercase tracking-wider border-b border-white/10 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
            <p key={index} className="font-bold text-sm flex items-center gap-2 mb-1 last:mb-0">
                <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: entry.fill, color: entry.fill }}></span>
                <span className="text-gray-200">{entry.name}:</span>
                <span className="text-white font-mono">{entry.value} O.S.</span>
            </p>
        ))}
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
      // Adicionando timestamp para evitar cache do navegador e garantir download fresco
      const response = await fetch(`${EXCEL_URL}?t=${new Date().getTime()}`);
      
      if (!response.ok) {
        throw new Error(`Falha ao baixar planilha (${response.status} ${response.statusText})`);
      }
      
      const blob = await response.blob();
      const file = new File([blob], "ATLOS.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      
      // Allow UI to update loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const resultMsg = await ExcelParser.readOperations(file);
      refreshData();
      alert(resultMsg);
    } catch (error: any) {
      console.error("Erro de Sincronização:", error);
      alert(`Erro ao sincronizar dados: ${error.message || 'Verifique sua conexão.'}`);
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
    const activeStats: Record<string, number> = {};
    const closedStats: Record<string, number> = {};
    const allSupervisorIds = new Set<string>();

    // Count Active
    activeOSKeys.forEach(key => {
        const group = groupedOperations[key];
        const primaryOp = group[0];
        const supId = primaryOp.supervisorId ? String(primaryOp.supervisorId).trim() : 'N/A';
        activeStats[supId] = (activeStats[supId] || 0) + 1;
        allSupervisorIds.add(supId);
    });

    // Count Closed
    classifiedGroups.completed.forEach(key => {
        const group = groupedOperations[key];
        const primaryOp = group[0];
        const supId = primaryOp.supervisorId ? String(primaryOp.supervisorId).trim() : 'N/A';
        closedStats[supId] = (closedStats[supId] || 0) + 1;
        allSupervisorIds.add(supId);
    });

    return Array.from(allSupervisorIds)
        .map(id => {
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
                active: activeStats[id] || 0,
                closed: closedStats[id] || 0,
                total: (activeStats[id] || 0) + (closedStats[id] || 0)
            };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 30);
  }, [groupedOperations, supervisors, activeOSKeys, classifiedGroups.completed]);


  // --- RENDER ---
  if (viewState === 'overview') {
      return (
        <div className="space-y-8 pb-10 animate-fade-in-up">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-metal-900 flex items-center gap-2">
                         <div className="bg-gradient-to-br from-brand-blue-500 to-brand-blue-900 p-2 rounded-lg text-white shadow-glow">
                             <FlaskConical size={24} />
                         </div>
                         Status caldas O.S no periodo
                    </h3>
                    <p className="text-brand-slate-500 font-medium mt-1 text-sm">Monitoramento em tempo real de volumes e entregas.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleSyncData}
                        disabled={isLoading}
                        className={`flex items-center gap-2 bg-white/50 backdrop-blur-sm text-metal-700 border border-metal-200 hover:border-brand-blue-500 hover:text-brand-blue-500 hover:shadow-glow font-semibold py-2.5 px-4 rounded-xl shadow-sm transition-all duration-200 ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        <span className="hidden md:inline text-sm">Sincronizar</span>
                    </button>
                    <button 
                         onClick={() => setViewState('list_view')}
                         className="flex items-center gap-2 bg-gradient-to-r from-brand-blue-500 to-brand-blue-900 hover:to-brand-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg hover:shadow-glow transition-all duration-200"
                    >
                        <FileText size={18} /> 
                        <span className="text-sm">Ver Lista</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Total Programmed */}
                <div className="relative group overflow-hidden bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 hover:border-brand-blue-500/50 hover:shadow-glow transition-all duration-300">
                    <div className="absolute -right-6 -top-6 text-brand-blue-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
                        <ClipboardList size={140} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-brand-blue-50 rounded-xl text-brand-blue-900">
                                <ClipboardList size={24} />
                            </div>
                            <span className="text-xs font-bold text-brand-slate-500 uppercase tracking-wider">Total Programado</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                             <h4 className="text-3xl font-extrabold text-metal-900">
                                {volumeMetrics.totalProgrammed.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </h4>
                            <span className="text-sm font-bold text-brand-slate-400">L</span>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-blue-500 to-brand-blue-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>

                {/* Card 2: Total Delivered */}
                <div className="relative group overflow-hidden bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 hover:border-sugar-green-500/50 hover:shadow-glow-green transition-all duration-300">
                    <div className="absolute -right-6 -top-6 text-sugar-green-50 opacity-50 group-hover:scale-110 transition-transform duration-500">
                         <CheckCircle2 size={140} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-sugar-green-50 rounded-xl text-sugar-green-600">
                                <CheckCircle2 size={24} />
                            </div>
                            <span className="text-xs font-bold text-brand-slate-500 uppercase tracking-wider">Total Entregue</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                             <h4 className="text-3xl font-extrabold text-metal-900">
                                {volumeMetrics.totalDelivered.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </h4>
                            <span className="text-sm font-bold text-brand-slate-400">L</span>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sugar-green-500 to-sugar-green-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>

                {/* Card 3: Total Available */}
                <div className="relative group overflow-hidden bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 hover:border-brand-yellow-500/50 transition-all duration-300">
                    <div className="absolute -right-6 -top-6 text-brand-yellow-100 opacity-50 group-hover:scale-110 transition-transform duration-500">
                         <Clock size={140} strokeWidth={1.5} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-brand-yellow-100 rounded-xl text-brand-yellow-500">
                                <Clock size={24} />
                            </div>
                            <span className="text-xs font-bold text-brand-slate-500 uppercase tracking-wider">Disponível à Entregar</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                             <h4 className="text-3xl font-extrabold text-metal-900">
                                {volumeMetrics.totalAvailable.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </h4>
                            <span className="text-sm font-bold text-brand-slate-400">L</span>
                        </div>
                    </div>
                     <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-yellow-500 to-yellow-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Donut Chart */}
                <div className="lg:col-span-1 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 flex flex-col h-[420px]">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-metal-900 flex items-center gap-2">
                            <PieIcon className="text-brand-slate-500" size={20} />
                            Status das O.S.
                        </h3>
                        <p className="text-xs text-brand-slate-500 mt-1 font-medium">Progresso das ordens ativas vs entregues</p>
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
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle" 
                                        iconSize={8}
                                        wrapperStyle={{fontSize: '12px', fontWeight: 600, color: '#64748b'}} 
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
                                     <span className="text-5xl font-bold text-metal-800 tracking-tight">
                                         {statusChartData.reduce((acc, curr) => acc + curr.value, 0)}
                                     </span>
                                     <span className="block text-xs font-bold text-brand-slate-400 uppercase tracking-widest mt-1">Total</span>
                                 </div>
                             </div>
                         )}
                    </div>
                </div>

                {/* Operations Bar Chart */}
                <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 flex flex-col h-[420px]">
                     <div className="mb-4">
                        <h3 className="text-lg font-bold text-metal-900 flex items-center gap-2">
                            <Cog className="text-brand-slate-500" size={20} />
                            O.S. Ativas por Operação
                        </h3>
                        <p className="text-xs text-brand-slate-500 mt-1 font-medium">Volume por tipo de atividade</p>
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
                                    tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    dy={10}
                                />
                                <YAxis 
                                    allowDecimals={false} 
                                    width={30} 
                                    tick={{fontSize: 11, fill: '#64748b'}} 
                                    axisLine={false} 
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9', radius: 4}} />
                                <Bar dataKey="count" fill={COLORS.barPrimary} radius={[4, 4, 0, 0]}>
                                    <LabelList dataKey="count" position="top" fill="#64748b" fontSize={11} fontWeight={600} offset={5} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Supervisors Bar Chart */}
            <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20 flex flex-col h-[500px]">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-metal-900 flex items-center gap-2">
                        <UserCog className="text-brand-slate-500" size={20} />
                        O.S. Ativas vs Encerradas por Encarregado
                    </h3>
                    <p className="text-xs text-brand-slate-500 mt-1 font-medium">Comparativo de volume de trabalho por equipe</p>
                </div>

                <div className="w-full flex-1">
                    {supervisorChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={supervisorChartData}
                                margin={{ top: 20, right: 10, left: 0, bottom: 60 }}
                                barSize={20}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{fontSize: 10, angle: -45, textAnchor: 'end', fill: '#64748b', fontWeight: 500}} 
                                    interval={0} 
                                    height={60}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis 
                                    allowDecimals={false} 
                                    width={30} 
                                    tick={{fontSize: 11, fill: '#64748b'}} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9', radius: 4}} />
                                <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#64748b' }} />
                                <Bar dataKey="active" name="Ativas" fill={COLORS.inProgress} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="closed" name="Encerradas" fill={COLORS.completed} radius={[4, 4, 0, 0]} />
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