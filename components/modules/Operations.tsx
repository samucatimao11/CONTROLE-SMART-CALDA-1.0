import React, { useState, useEffect } from 'react';
import { Operation, Supervisor, Location, Resource, Section, OperationStatus, OperationVolume, Shift } from '../../types';
import { DataService } from '../../services/dataService';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Search, Plus, FileText, Droplet, Upload, Sprout, FlaskConical, LayoutGrid, UserCog, TrendingUp, Cog, MapPin, Loader2, Edit2, Zap, X, Calendar, AlertCircle, ListFilter, Clock, Filter, Trash2, CheckCircle2 } from 'lucide-react';

export const OperationsModule: React.FC = () => {
  // Data State
  const [operations, setOperations] = useState<Operation[]>([]);
  // Removed Driver and Truck arrays to streamline
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [locations, setLocations] = useState<Location[]>([]); // Setores
  const [resources, setResources] = useState<Resource[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // UI State
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingOp, setEditingOp] = useState<Operation | null>(null);
  
  // --- New Search States ---
  const [searchOS, setSearchOS] = useState('');
  const [searchSector, setSearchSector] = useState('');
  const [searchOp, setSearchOp] = useState('');
  const [searchSup, setSearchSup] = useState('');
  const [searchSituation, setSearchSituation] = useState(''); // Filtro de Situação
  const [searchAgeRange, setSearchAgeRange] = useState(''); // Filtro de Faixa de Dias
  
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Form State ---
  
  // General Info
  const [osCode, setOsCode] = useState('');
  const [osDate, setOsDate] = useState(''); // Nova Data da OS
  const [opNumber, setOpNumber] = useState('');
  const [opDesc, setOpDesc] = useState('');
  
  // New Fields Form State (ReadOnly mostly, but kept for persistence)
  const [issueDate, setIssueDate] = useState('');
  const [osAge, setOsAge] = useState('');
  const [osSituation, setOsSituation] = useState('');

  // Converted to free text for fluidity
  const [truckId, setTruckId] = useState(''); 
  const [truckCapacity, setTruckCapacity] = useState(''); // New State for Automation
  const [driverId, setDriverId] = useState('');
  
  const [supervisorId, setSupervisorId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [status, setStatus] = useState<OperationStatus>(OperationStatus.MISTURA);
  
  // 1. Resource Specific State (Ingredient)
  const [resourceId, setResourceId] = useState('');
  const [resArea, setResArea] = useState(''); // Production Area for this product
  const [resDose, setResDose] = useState(''); // Dose (L/ha) for this product
  const [resTotal, setResTotal] = useState(''); // Total (L) for this product

  // 2. Application Technical Data State (The Mix/Tank) - INDEPENDENT
  const [appArea, setAppArea] = useState('');
  const [appFlow, setAppFlow] = useState(''); // Vazão de Calda
  const [appTotal, setAppTotal] = useState(''); // Total de Calda

  // Volume/Trip State
  const [volumes, setVolumes] = useState<OperationVolume[]>([]);
  // Removed manual volume and date input states
  const [currentTripShift, setCurrentTripShift] = useState<Shift | ''>(''); // Turno da Viagem Manual

  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setOperations(DataService.getOperations());
    // Removed Fetching Drivers/Trucks
    setSupervisors(DataService.getSupervisors());
    setLocations(DataService.getLocations());
    setResources(DataService.getResources());
    setSections(DataService.getSections());
  };

  const handleCreateNew = () => {
    setEditingOp(null);
    resetForm();
    setViewMode('form');
  };

  const handleEdit = (op: Operation) => {
    setEditingOp(op);
    setOsCode(op.osCode || op.id);
    setOsDate(op.date || new Date().toISOString().split('T')[0]);
    setOpNumber(op.operationNumber || '');
    setOpDesc(op.operationDescription || '');
    
    // Load new fields
    setIssueDate(op.issueDate || '');
    setOsAge(op.osAge || '');
    setOsSituation(op.osSituation || '');

    setTruckId(op.truckId || '');
    setTruckCapacity(op.truckCapacity ? String(op.truckCapacity) : ''); // Load capacity
    setDriverId(op.driverId || '');
    setSupervisorId(op.supervisorId);
    setSectionId(op.sectionId || '');
    setLocationId(op.locationId || '');
    setStatus(op.status);
    setVolumes(op.volumes || []);

    // 1. Load Resource Data
    setResourceId(op.resourceId || '');
    setResArea(op.productionArea ? String(op.productionArea) : '');
    setResDose(op.flowRate ? String(op.flowRate) : '');
    setResTotal(op.targetVolume ? String(op.targetVolume) : '');

    // 2. Load Application Data (Independent)
    // If application data is missing (legacy records), fallback to resource data or empty
    setAppArea(op.applicationArea ? String(op.applicationArea) : (op.productionArea ? String(op.productionArea) : ''));
    setAppFlow(op.applicationFlowRate ? String(op.applicationFlowRate) : '');
    setAppTotal(op.applicationTotalVolume ? String(op.applicationTotalVolume) : '');
    
    setViewMode('form');
    setMessage(null);
  };

  const resetForm = () => {
    setOsCode('');
    setOsDate(new Date().toISOString().split('T')[0]); // Default Today
    setOpNumber('');
    setOpDesc('');
    setIssueDate('');
    setOsAge('');
    setOsSituation('');
    setTruckId('');
    setTruckCapacity('');
    setDriverId('');
    setSupervisorId('');
    setSectionId('');
    setLocationId('');
    setStatus(OperationStatus.MISTURA);
    setVolumes([]);
    
    setCurrentTripShift('');
    
    // Reset Resource
    setResourceId('');
    setResArea('');
    setResDose('');
    setResTotal('');

    // Reset Application
    setAppArea('');
    setAppFlow('');
    setAppTotal('');

    setMessage(null);
  };

  const clearFilters = () => {
    setSearchOS('');
    setSearchSector('');
    setSearchOp('');
    setSearchSup('');
    setSearchSituation('');
    setSearchAgeRange('');
  };

  // Effect: Independent Calculation for APPLICATION (Blue Box)
  useEffect(() => {
    const area = parseFloat(appArea);
    const flow = parseFloat(appFlow);
    if (!isNaN(area) && !isNaN(flow)) {
       const calcTotal = area * flow;
       setAppTotal(calcTotal.toFixed(2));
    }
  }, [appArea, appFlow]);

  // Effect: Independent Calculation for RESOURCE (Product)
  // Only auto-calc if user enters area/dose input.
  useEffect(() => {
     const area = parseFloat(resArea);
     const dose = parseFloat(resDose);
     if (!isNaN(area) && !isNaN(dose)) {
        const calcTotal = area * dose;
        setResTotal(calcTotal.toFixed(4)); // Higher precision for products
     }
  }, [resArea, resDose]);

  // AUTOMATION: Generate Trips based on Capacity and Total
  const handleGenerateTrips = () => {
    const totalVol = parseFloat(appTotal);
    const cap = parseFloat(truckCapacity);

    if (isNaN(totalVol) || totalVol <= 0) {
        setMessage({ type: 'error', text: "O 'Total de Calda' deve ser calculado antes de gerar as viagens." });
        return;
    }
    if (isNaN(cap) || cap <= 0) {
        setMessage({ type: 'error', text: "Informe a 'Capacidade do Tanque' para calcular as frações." });
        return;
    }
    // Using osDate instead of specific trip date
    if (!osDate || !currentTripShift) {
        setMessage({ type: 'error', text: "A Data da OS e o Turno são necessários para gerar viagens." });
        return;
    }

    if (volumes.length > 0) {
        if (!window.confirm("Já existem viagens registradas. Deseja substituir pela geração automática?")) {
            return;
        }
    }

    const newVolumes: OperationVolume[] = [];
    let remaining = totalVol;
    
    while (remaining > 0) {
        // If remaining is very close to 0 (floating point error), stop
        if (remaining < 0.1) break;

        const vol = remaining > cap ? cap : remaining;
        
        // Round to 1 decimal place to avoid 3333.33333
        const roundedVol = Math.round(vol * 10) / 10;

        newVolumes.push({
            id: Math.random().toString(36).substr(2, 9),
            liters: roundedVol,
            timestamp: new Date().toISOString(),
            isDelivered: false,
            statusLabel: "DISPONIVEL", // Default for manual gen
            deliveryDate: osDate, // Using OS Date
            deliveryShift: currentTripShift as Shift
        });
        
        remaining -= roundedVol;
    }

    setVolumes(newVolumes);
    setMessage({ type: 'success', text: `${newVolumes.length} viagens geradas com sucesso!` });
  };

  const handleRemoveVolume = (volId: string) => {
    setVolumes(volumes.filter(v => v.id !== volId));
  };

  const handleToggleTripStatus = (opId: string, volId: string) => {
    const opIndex = operations.findIndex(o => o.id === opId);
    if (opIndex === -1) return;

    const updatedOps = [...operations];
    const op = { ...updatedOps[opIndex] };
    const volIndex = op.volumes.findIndex(v => v.id === volId);

    if (volIndex !== -1) {
        const currentLabel = op.volumes[volIndex].statusLabel || (op.volumes[volIndex].isDelivered ? "ENTREGUE" : "DISPONIVEL");
        
        let newLabel = "DISPONIVEL";
        let isDelivered = false;

        // Toggle logic: If "ENTREGUE" -> "DISPONIVEL", else -> "ENTREGUE"
        // Also resets "SEM INFO." to "ENTREGUE" if clicked (assuming manual action)
        if (currentLabel === "ENTREGUE") {
            newLabel = "DISPONIVEL";
            isDelivered = false;
        } else {
            newLabel = "ENTREGUE";
            isDelivered = true;
        }
        
        op.volumes[volIndex].statusLabel = newLabel;
        op.volumes[volIndex].isDelivered = isDelivered;
        
        updatedOps[opIndex] = op;
        setOperations(updatedOps);
        DataService.saveOperation(op);
    }
  };

  const handleUpdateVolumeDate = (opId: string, volId: string, newDate: string) => {
    const opIndex = operations.findIndex(o => o.id === opId);
    if (opIndex === -1) return;

    const updatedOps = [...operations];
    const op = { ...updatedOps[opIndex] };
    const volIndex = op.volumes.findIndex(v => v.id === volId);

    if (volIndex !== -1) {
        op.volumes[volIndex].deliveryDate = newDate;
        
        updatedOps[opIndex] = op;
        setOperations(updatedOps);
        DataService.saveOperation(op);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!osCode || !opNumber) {
      setMessage({ type: 'error', text: 'Preencha os campos obrigatórios (OS, Núm Operação).' });
      return;
    }

    const resName = resources.find(r => r.id === resourceId)?.name;
    const uniqueId = editingOp ? editingOp.id : `${osCode}-${resourceId || Math.random().toString(36).substr(2,5)}`;

    const op: Operation = {
      id: uniqueId,
      osCode: osCode,
      date: osDate,
      operationNumber: opNumber,
      operationDescription: opDesc,
      
      issueDate,
      osAge,
      osSituation,

      truckId,
      truckCapacity: truckCapacity ? parseFloat(truckCapacity) : undefined, // SAVE CAPACITY
      driverId,
      supervisorId,
      sectionId,
      locationId,
      
      // Resource Data
      resourceId,
      resourceName: resName,
      productionArea: Number(resArea),
      flowRate: Number(resDose),
      targetVolume: Number(resTotal),
      
      // Application Data (Independent)
      applicationArea: Number(appArea),
      applicationFlowRate: Number(appFlow),
      applicationTotalVolume: Number(appTotal),
      
      volumes,
      status,
      createdAt: editingOp ? editingOp.createdAt : new Date().toISOString()
    };

    DataService.saveOperation(op);
    refreshData();
    setViewMode('list');
    setMessage(null);
  };

  const getStatusColor = (s: OperationStatus) => {
    switch (s) {
      case OperationStatus.MISTURA: return 'bg-brand-yellow-100 text-brand-yellow-500 border-brand-yellow-500';
      case OperationStatus.CAMINHO: return 'bg-brand-blue-50 text-brand-blue-900 border-brand-blue-200';
      case OperationStatus.CONCLUIDA: return 'bg-sugar-green-50 text-sugar-green-700 border-sugar-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Style for the "Situation" badge
  const getSituationBadgeStyles = (situation: string) => {
      if (!situation) return 'bg-gray-100 text-gray-600 border-gray-200';
      const s = situation.toLowerCase();
      
      if (s.includes('aberta')) {
          return 'bg-sugar-green-100 text-sugar-green-700 border-sugar-green-200';
      }
      if (s.includes('fechada')) {
          return 'bg-red-50 text-red-700 border-red-200';
      }
      return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  // Refined Card Styles matching screenshot
  const getTripCardStyles = (label: string) => {
    const l = label ? label.toUpperCase() : "SEM INFO.";
    if (l === "ENTREGUE") {
        return {
            container: 'bg-sugar-green-50 border-sugar-green-200',
            text: 'text-sugar-green-700',
            button: 'bg-white text-black font-extrabold tracking-wide border border-transparent shadow-sm'
        };
    }
    if (l === "SEM INFO.") {
        return {
            container: 'bg-gray-50 border-gray-200',
            text: 'text-gray-900',
            button: 'bg-white text-black font-extrabold tracking-wide border border-transparent shadow-sm'
        };
    }
    // Disponivel
    return {
        container: 'bg-white border-gray-300',
        text: 'text-gray-900',
        button: 'bg-gray-100 text-gray-500 font-bold border border-transparent'
    };
  };

  // Grouping Logic
  const groupedOperations = operations.reduce((acc, op) => {
    const key = op.osCode || op.id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(op);
    return acc;
  }, {} as Record<string, Operation[]>);

  const filteredGroupKeys = Object.keys(groupedOperations).filter(key => {
    const group = groupedOperations[key];
    const primaryOp = group[0];
    
    // 1. Filter by OS
    const matchOS = !searchOS || (primaryOp.osCode || primaryOp.id).toLowerCase().includes(searchOS.toLowerCase());

    // 2. Filter by Sector
    const location = locations.find(l => l.id === primaryOp.locationId);
    const locName = location ? location.sectorName.toLowerCase() : '';
    const locId = location ? location.id.toLowerCase() : '';
    const matchSector = !searchSector || locName.includes(searchSector.toLowerCase()) || locId.includes(searchSector.toLowerCase());

    // 3. Filter by Operation
    const opNum = primaryOp.operationNumber.toLowerCase();
    const opDesc = primaryOp.operationDescription.toLowerCase();
    const matchOp = !searchOp || opNum.includes(searchOp.toLowerCase()) || opDesc.includes(searchOp.toLowerCase());

    // 4. Filter by Supervisor
    const supervisor = supervisors.find(s => s.id === primaryOp.supervisorId);
    const supName = supervisor ? supervisor.name.toLowerCase() : '';
    const matchSup = !searchSup || supName.includes(searchSup.toLowerCase());

    // 5. Filter by Situation (Aberta/Fechada)
    const sit = (primaryOp.osSituation || '').toLowerCase();
    const matchSituation = !searchSituation || sit === searchSituation.toLowerCase();

    // 6. Filter by Age Range (Dias O.S)
    let matchAge = true;
    if (searchAgeRange) {
        const age = parseInt(primaryOp.osAge || '-1', 10);
        // If data is invalid/missing, we exclude it if a range is selected
        if (isNaN(age) || age < 0) {
             matchAge = false;
        } else {
             if (searchAgeRange === '0-10') matchAge = age >= 0 && age <= 10;
             else if (searchAgeRange === '11-20') matchAge = age >= 11 && age <= 20;
             else if (searchAgeRange === '21-30') matchAge = age >= 21 && age <= 30;
             else if (searchAgeRange === '30+') matchAge = age > 30;
        }
    }

    return matchOS && matchSector && matchOp && matchSup && matchSituation && matchAge;
  });

  const currentOsResources = React.useMemo(() => {
    if (!osCode) return [];
    return operations.filter(op => (op.osCode === osCode || op.id.startsWith(osCode)) && op.resourceId);
  }, [operations, osCode]);

  if (viewMode === 'form') {
    return (
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden mb-20 border border-white/20 animate-fade-in-up">
        <div className="bg-gradient-to-r from-brand-blue-900 to-brand-blue-500 px-8 py-6 flex justify-between items-center shadow-lg">
          <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Edit2 size={20} className="text-brand-blue-100" />
            {editingOp ? `Editando OS: ${editingOp.osCode || editingOp.id}` : 'Nova Ordem de Serviço'}
          </h2>
          <button onClick={() => setViewMode('list')} className="text-white hover:text-brand-blue-100 text-sm font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/10 backdrop-blur-sm">
            Voltar
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-8">
           {message && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-sugar-green-50 text-sugar-green-700 border-sugar-green-200'}`}>
              {message.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              <span className="font-medium">{message.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="md:col-span-1">
                <Input label="Ordem de Serviço (OS)" value={osCode} onChange={e => setOsCode(e.target.value)} disabled={!!editingOp} placeholder="Ex: 294038" />
             </div>
             <div className="md:col-span-1">
                <Input type="date" label="Data da OS" value={osDate} onChange={e => setOsDate(e.target.value)} />
             </div>
             <div className="md:col-span-1">
                 {/* Optional: ReadOnly Fields for context */}
                 <Input label="Situação (ERP)" value={osSituation} onChange={e => setOsSituation(e.target.value)} disabled className="bg-metal-50/50" />
             </div>

             <div className="md:col-span-1">
                 <Input label="Nº Operação" value={opNumber} onChange={e => setOpNumber(e.target.value)} placeholder="Ex: 200" />
             </div>
             <div className="md:col-span-2">
                 <Input label="Descrição da Operação" value={opDesc} onChange={e => setOpDesc(e.target.value)} placeholder="Ex: Manu Reflorestamento" />
             </div>
            
            <div className="md:col-span-3 bg-metal-50/50 p-6 rounded-2xl border border-metal-100 mb-2 shadow-inner">
                <h4 className="text-sm font-bold text-metal-700 mb-4 flex items-center gap-2 uppercase tracking-wide">
                   <div className="p-1.5 bg-brand-blue-100 rounded-lg text-brand-blue-600">
                      <FlaskConical size={16} />
                   </div>
                   Composição da Calda (Recursos desta OS)
                </h4>
                {currentOsResources.length > 0 && (
                   <div className="mb-6 overflow-x-auto bg-white/60 backdrop-blur-sm rounded-xl border border-metal-200 shadow-sm">
                     <table className="min-w-full text-xs">
                        <thead className="bg-metal-50/80 border-b border-metal-200">
                           <tr>
                              <th className="px-4 py-3 text-left font-bold text-metal-500 uppercase tracking-wider">Produto</th>
                              <th className="px-4 py-3 text-center font-bold text-metal-500 uppercase tracking-wider">Produção (ha)</th>
                              <th className="px-4 py-3 text-center font-bold text-metal-500 uppercase tracking-wider">Dose (L/ha)</th>
                              <th className="px-4 py-3 text-right font-bold text-metal-500 uppercase tracking-wider">Total (L)</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-metal-100">
                           {currentOsResources.map(res => {
                             const isCurrent = res.id === editingOp?.id;
                             return (
                               <tr key={res.id} className={`cursor-pointer transition-colors ${isCurrent ? "bg-brand-blue-50/50 border-l-4 border-brand-blue-500" : "hover:bg-metal-50"}`} onClick={() => handleEdit(res)} title="Clique para editar este produto">
                                 <td className="px-4 py-3 font-medium text-metal-900">{res.resourceName}</td>
                                 <td className="px-4 py-3 text-center text-metal-600">{res.productionArea}</td>
                                 <td className="px-4 py-3 text-center text-metal-600">{res.flowRate || '-'}</td>
                                 <td className="px-4 py-3 text-right font-bold text-metal-900">{res.targetVolume}</td>
                               </tr>
                             );
                           })}
                        </tbody>
                     </table>
                   </div>
                )}
                <div className="border-t pt-4 border-metal-200">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-6">
                            <Select 
                              label={editingOp ? "Alterar Recurso Atual" : "Adicionar Recurso"}
                              value={resourceId}
                              onChange={e => setResourceId(e.target.value)}
                              options={resources.map(r => ({ value: r.id, label: `${r.id} - ${r.name}` }))}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Input label="Area Prod (ha)" type="number" value={resArea} onChange={e => setResArea(e.target.value)} className="mb-0 text-sm" />
                        </div>
                        <div className="md:col-span-2">
                            <Input label="Dose (L/ha)" type="number" value={resDose} onChange={e => setResDose(e.target.value)} className="mb-0 text-sm" />
                        </div>
                         <div className="md:col-span-2">
                            <Input label="Total Prod (L)" type="number" value={resTotal} onChange={e => setResTotal(e.target.value)} className="mb-0 text-sm bg-metal-100/50" />
                        </div>
                    </div>
                </div>
            </div>

            <Select label="Seção" value={sectionId} onChange={e => setSectionId(e.target.value)} options={sections.map(s => ({ value: s.id, label: `${s.id} - ${s.name}` }))} />
            <Select label="Setor" value={locationId} onChange={e => setLocationId(e.target.value)} options={locations.map(l => ({ value: l.id, label: `${l.id} - ${l.sectorName}` }))} />
            <Select label="Encarregado (Responsável)" value={supervisorId} onChange={e => setSupervisorId(e.target.value)} options={supervisors.map(s => ({ value: s.id, label: `${s.id} - ${s.name}` }))} />
            
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
               <Input label="Caminhão / Operação" value={truckId} onChange={e => setTruckId(e.target.value)} placeholder="Placa ou Nº" />
               <Input label="Capacidade do Tanque (L)" type="number" value={truckCapacity} onChange={e => setTruckCapacity(e.target.value)} placeholder="Ex: 5000" />
               <Input label="Motorista" value={driverId} onChange={e => setDriverId(e.target.value)} placeholder="Nome do motorista..." />
            </div>

            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-br from-brand-blue-50 to-white p-6 rounded-2xl border border-brand-blue-100 mt-2 shadow-sm">
                 <h4 className="md:col-span-3 font-bold text-brand-blue-900 text-sm uppercase mb-2 flex items-center gap-2 tracking-wide">
                    <div className="p-1.5 bg-brand-blue-200 rounded-lg text-brand-blue-700">
                       <Cog size={16}/> 
                    </div>
                    Dados Técnicos da Aplicação
                 </h4>
                 <Input label="Área Solicitada (ha)" type="number" value={appArea} onChange={e => setAppArea(e.target.value)} placeholder="Ex: 20" className="border-brand-blue-200 focus:ring-brand-blue-500 bg-white" />
                 <Input label="Vazão (L/ha)" type="number" value={appFlow} onChange={e => setAppFlow(e.target.value)} placeholder="Digite a vazão..." className="border-brand-blue-200 focus:ring-brand-blue-500 bg-white" />
                 <Input label="Total de Calda (L)" type="number" value={appTotal} onChange={e => setAppTotal(e.target.value)} placeholder="Calculado automaticamente" className="border-brand-blue-200 focus:ring-brand-blue-500 bg-brand-blue-50/50" />
            </div>
          </div>

          <div className="bg-metal-50/30 p-6 rounded-2xl border border-metal-200 mb-8">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-metal-900">
               <div className="p-1.5 bg-sugar-green-100 rounded-lg text-sugar-green-600">
                 <Droplet size={20} />
               </div>
               Registro de Viagens
            </h3>
            <div className="flex flex-col md:flex-row gap-6 mb-6 items-end">
              <div className="flex-1 w-full">
                 <Select label="Turno" value={currentTripShift} onChange={e => setCurrentTripShift(e.target.value as Shift)} className="mb-0" options={[{value: 'Turno A', label: 'Turno A'}, {value: 'Turno B', label: 'Turno B'}, {value: 'Turno C', label: 'Turno C'}]} />
              </div>
              <div className="flex-none pb-0.5 w-full md:w-auto">
                   <button type="button" onClick={handleGenerateTrips} className="w-full md:w-auto bg-brand-blue-500 hover:bg-brand-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-glow flex items-center justify-center gap-2 border border-transparent">
                     <Zap size={18} className="text-brand-yellow-400 fill-current" /> Gerar Viagens (Auto)
                   </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-metal-200 overflow-hidden shadow-sm">
               <table className="min-w-full text-sm">
                 <thead className="bg-metal-50 border-b border-metal-200">
                   <tr>
                     <th className="px-5 py-3 text-left font-bold text-metal-500 uppercase tracking-wider text-xs">#</th>
                     <th className="px-5 py-3 text-left font-bold text-metal-500 uppercase tracking-wider text-xs">Data/Turno</th>
                     <th className="px-5 py-3 text-left font-bold text-metal-500 uppercase tracking-wider text-xs">Volume</th>
                     <th className="px-5 py-3 text-right font-bold text-metal-500 uppercase tracking-wider text-xs">Horário Registro</th>
                     <th className="px-5 py-3"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-metal-100">
                   {volumes.map((vol, idx) => (
                     <tr key={vol.id} className="hover:bg-metal-50/50 transition-colors">
                       <td className="px-5 py-3 font-bold text-metal-900">{idx + 1}ª</td>
                       <td className="px-5 py-3 text-metal-700">
                         <input type="date" value={vol.deliveryDate || ''} onChange={(e) => { const newDate = e.target.value; const updatedVols = volumes.map(v => v.id === vol.id ? {...v, deliveryDate: newDate} : v); setVolumes(updatedVols); }} className="text-sm border border-metal-200 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-brand-blue-500/20 outline-none" />
                         <div className="text-xs text-metal-400 mt-1 font-medium">{vol.deliveryShift || '-'}</div>
                       </td>
                       <td className="px-5 py-3 text-sugar-green-600 font-bold">{vol.liters} L</td>
                       <td className="px-5 py-3 text-right text-metal-500 font-mono">{new Date(vol.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                       <td className="px-5 py-3 text-right">
                         <button type="button" onClick={() => handleRemoveVolume(vol.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors">
                            <X size={16} />
                         </button>
                       </td>
                     </tr>
                   ))}
                   {volumes.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-metal-400 italic">Nenhuma viagem registrada.</td></tr>}
                 </tbody>
               </table>
            </div>
          </div>
          <div className="flex gap-4 pt-4 border-t border-metal-100">
            <button type="submit" className="flex-1 bg-sugar-green-600 text-white font-bold py-4 rounded-xl hover:bg-sugar-green-500 shadow-lg hover:shadow-glow-green transition-all uppercase tracking-wide text-sm">Salvar Operação</button>
          </div>
        </form>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/20">
        <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-metal-900 flex items-center gap-2">
                <div className="p-2 bg-brand-blue-50 rounded-xl text-brand-blue-500">
                    <Filter size={20} />
                </div>
                Filtros Avançados
            </h2>
             <button 
                onClick={clearFilters}
                className="text-sm text-brand-slate-500 hover:text-red-500 font-medium flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
                <X size={16} /> Limpar Filtros
            </button>
        </div>

        {/* Search Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative group">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-metal-400 group-focus-within:text-brand-blue-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Buscar OS..." 
                    className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm text-metal-900 border border-metal-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue-500/50 focus:border-brand-blue-500 outline-none transition-all shadow-sm focus:shadow-md hover:border-metal-300"
                    value={searchOS}
                    onChange={(e) => setSearchOS(e.target.value)}
                />
            </div>

            <div className="relative group">
                <ListFilter className="absolute left-4 top-3.5 h-5 w-5 text-metal-400 group-focus-within:text-brand-blue-500 transition-colors" />
                <select 
                    className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm text-metal-900 border border-metal-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue-500/50 focus:border-brand-blue-500 outline-none appearance-none transition-all shadow-sm focus:shadow-md cursor-pointer hover:border-metal-300"
                    value={searchSituation}
                    onChange={(e) => setSearchSituation(e.target.value)}
                >
                    <option value="">Todas Situações</option>
                    <option value="Aberta">Aberta</option>
                    <option value="fechada">Fechada</option>
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none">
                     <svg className="w-5 h-5 text-metal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

             <div className="relative group">
                <Clock className="absolute left-4 top-3.5 h-5 w-5 text-metal-400 group-focus-within:text-brand-blue-500 transition-colors" />
                <select 
                    className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm text-metal-900 border border-metal-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue-500/50 focus:border-brand-blue-500 outline-none appearance-none transition-all shadow-sm focus:shadow-md cursor-pointer hover:border-metal-300"
                    value={searchAgeRange}
                    onChange={(e) => setSearchAgeRange(e.target.value)}
                >
                    <option value="">Todos os Períodos</option>
                    <option value="0-10">00 à 10 dias</option>
                    <option value="11-20">11 à 20 dias</option>
                    <option value="21-30">21 à 30 dias</option>
                    <option value="30+">Acima de 30 dias</option>
                </select>
                 <div className="absolute right-3 top-3.5 pointer-events-none">
                     <svg className="w-5 h-5 text-metal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            <div className="relative group">
                <MapPin className="absolute left-4 top-3.5 h-5 w-5 text-metal-400 group-focus-within:text-brand-blue-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Buscar Setor..." 
                    className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm text-metal-900 border border-metal-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue-500/50 focus:border-brand-blue-500 outline-none transition-all shadow-sm focus:shadow-md hover:border-metal-300"
                    value={searchSector}
                    onChange={(e) => setSearchSector(e.target.value)}
                />
            </div>

            <div className="relative group">
                <Cog className="absolute left-4 top-3.5 h-5 w-5 text-metal-400 group-focus-within:text-brand-blue-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Buscar Operação..." 
                    className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm text-metal-900 border border-metal-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue-500/50 focus:border-brand-blue-500 outline-none transition-all shadow-sm focus:shadow-md hover:border-metal-300"
                    value={searchOp}
                    onChange={(e) => setSearchOp(e.target.value)}
                />
            </div>

            <div className="relative group">
                <UserCog className="absolute left-4 top-3.5 h-5 w-5 text-metal-400 group-focus-within:text-brand-blue-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Buscar Encarregado..." 
                    className="w-full pl-11 pr-4 py-3 bg-white/50 backdrop-blur-sm text-metal-900 border border-metal-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-blue-500/50 focus:border-brand-blue-500 outline-none transition-all shadow-sm focus:shadow-md hover:border-metal-300"
                    value={searchSup}
                    onChange={(e) => setSearchSup(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
            <div className="text-center py-20 text-metal-500">
                <Loader2 size={48} className="animate-spin mx-auto mb-4 text-brand-blue-500" />
                <p className="text-lg font-medium">Processando dados da planilha...</p>
            </div>
        ) : filteredGroupKeys.length === 0 ? (
            <div className="text-center py-20 text-metal-500 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-sm">
                <div className="mb-4 bg-metal-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <FileText size={32} className="text-metal-300" />
                </div>
                <p className="font-bold text-lg text-metal-700">Nenhuma operação encontrada.</p>
                <p className="text-sm text-metal-400">Tente ajustar os filtros ou importar novos dados.</p>
            </div>
        ) : (
            filteredGroupKeys.map(osKey => {
            const group = groupedOperations[osKey];
            const primaryOp = group[0]; 
            
            const supervisor = supervisors.find(s => s.id === primaryOp.supervisorId);
            const location = locations.find(l => l.id === primaryOp.locationId);
            const section = sections.find(s => s.id === primaryOp.sectionId);
            
            const appTotal = primaryOp.applicationTotalVolume || 0;
            const sumProductTotal = group.reduce((acc, item) => acc + (item.targetVolume || 0), 0);
            const totalTargetVolume = appTotal > 0 ? appTotal : sumProductTotal;

            const productionValue = primaryOp.applicationArea || primaryOp.productionArea; 
            
            const allVolumes = group.flatMap(g => (g.volumes || []).map(v => ({...v, opId: g.id})));
            const totalRealizedVolume = allVolumes
                .filter(v => v.isDelivered)
                .reduce((acc, v) => acc + v.liters, 0);
            
            const progress = totalTargetVolume > 0 ? Math.min((totalRealizedVolume / totalTargetVolume) * 100, 100) : 0;
            
            return (
                <div key={osKey} className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-sm hover:shadow-lg hover:border-brand-blue-500/30 transition duration-300 overflow-hidden group">
                <div className="p-6">
                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6 gap-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-gradient-to-br from-brand-blue-500 to-brand-blue-700 p-3.5 rounded-2xl shadow-lg shadow-brand-blue-500/20 text-white">
                                <FileText size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="text-2xl font-bold text-metal-900 leading-none">OS {primaryOp.osCode || primaryOp.id}</h3>
                                    {primaryOp.osSituation && (
                                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border uppercase tracking-wider shadow-sm ${getSituationBadgeStyles(primaryOp.osSituation)}`}>
                                            {primaryOp.osSituation}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs font-medium text-brand-slate-500 mt-1.5 flex items-center gap-1.5">
                                    <span className="bg-metal-100 px-1.5 py-0.5 rounded text-metal-600 border border-metal-200">OP: {primaryOp.operationNumber || 'N/A'}</span>
                                    <span>{primaryOp.operationDescription}</span>
                                </div>
                            </div>
                        </div>
                        {primaryOp.status !== OperationStatus.MISTURA && (
                            <div className={`self-start px-3 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-wide shadow-sm ${getStatusColor(primaryOp.status)}`}>{primaryOp.status}</div>
                        )}
                    </div>

                    {/* Main Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-6 pb-6 border-b border-metal-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-brand-slate-400 uppercase font-bold mb-1.5 tracking-wider">Encarregado</span>
                            <div className="flex items-center gap-2">
                                <UserCog size={16} className="text-brand-blue-500" />
                                <span className="text-sm font-bold text-metal-700 truncate">{supervisor?.name || 'Não atribuído'}</span>
                            </div>
                        </div>

                        <div className="flex flex-col">
                             <span className="text-[10px] text-brand-slate-400 uppercase font-bold mb-1.5 tracking-wider">Localização</span>
                             <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-neon-purple" />
                                <span className="text-sm font-bold text-metal-700 truncate">{location ? `Setor ${location.id}` : '-'}</span>
                             </div>
                        </div>

                        <div className="flex flex-col">
                             <span className="text-[10px] text-brand-slate-400 uppercase font-bold mb-1.5 tracking-wider">Seção</span>
                             <div className="flex items-center gap-2">
                                <LayoutGrid size={16} className="text-indigo-500" />
                                <span className="text-sm font-bold text-metal-700 truncate">{section ? section.name : '-'}</span>
                             </div>
                        </div>

                        <div className="flex flex-col">
                             <span className="text-[10px] text-brand-slate-400 uppercase font-bold mb-1.5 tracking-wider">Produção</span>
                             <div className="flex items-center gap-2">
                                <Sprout size={16} className="text-sugar-green-600" />
                                <span className="text-sm font-bold text-metal-700">{productionValue ? productionValue.toLocaleString() : '-'} ha</span>
                             </div>
                        </div>

                        <div className="flex flex-col">
                             <span className="text-[10px] text-brand-slate-400 uppercase font-bold mb-1.5 tracking-wider">Emissão</span>
                             <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-orange-500" />
                                <span className="text-sm font-bold text-metal-700">{primaryOp.issueDate || '-'}</span>
                             </div>
                        </div>

                        <div className="flex flex-col">
                             <span className="text-[10px] text-brand-slate-400 uppercase font-bold mb-1.5 tracking-wider">Dias em Aberto</span>
                             <div className="flex items-center gap-2">
                                <AlertCircle size={16} className="text-red-400" />
                                <span className="text-sm font-bold text-metal-700">{primaryOp.osAge ? `${primaryOp.osAge} dias` : '-'}</span>
                             </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="mb-6 bg-metal-50/50 rounded-2xl p-4 border border-metal-100 shadow-inner">
                        <h4 className="text-xs font-bold text-brand-slate-500 uppercase mb-3 flex items-center gap-2 tracking-wider">
                            <FlaskConical size={16} className="text-brand-blue-500"/> Produtos
                        </h4>
                        <div className="space-y-2">
                             {group.map((item) => {
                                const res = resources.find(r => r.id === item.resourceId);
                                return (
                                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-metal-200 last:border-0 pb-2 last:pb-0">
                                        <span className="font-medium text-metal-800">{res?.name || item.resourceName || '-'}</span>
                                        <div className="flex gap-4 text-metal-600">
                                            <span className="bg-white px-2 py-0.5 rounded border border-metal-200 text-xs font-mono">{item.flowRate > 0 ? `${item.flowRate} L/ha` : '-'}</span>
                                            <span className="font-bold text-metal-900">{item.targetVolume} L</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Progress / Footer */}
                    <div className="bg-transparent">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-end">
                                 <p className="text-xs font-bold text-brand-slate-400 uppercase flex items-center gap-1.5 tracking-wider">
                                    <TrendingUp size={16} className="text-brand-blue-500" /> Entregas ({allVolumes.filter(v => v.isDelivered).length}/{allVolumes.length})
                                </p>
                                <div className="text-right flex items-baseline gap-2">
                                    <span className="text-xs font-medium text-metal-500">{totalRealizedVolume.toLocaleString()} / {totalTargetVolume.toLocaleString()} L</span>
                                    <span className={`text-2xl font-black ${progress >= 100 ? 'text-sugar-green-600 drop-shadow-sm' : 'text-metal-900'}`}>{progress.toFixed(0)}%</span>
                                </div>
                            </div>
                        
                            <div className="w-full bg-metal-100 rounded-full h-3 overflow-hidden shadow-inner border border-metal-200">
                                <div className={`h-full rounded-full transition-all duration-700 ease-out shadow-lg ${progress >= 100 ? 'bg-gradient-to-r from-sugar-green-400 to-sugar-green-600' : 'bg-gradient-to-r from-brand-blue-400 to-brand-blue-600'}`} style={{ width: `${progress}%` }}>
                                    <div className="w-full h-full bg-white/20 animate-pulse-slow"></div>
                                </div>
                            </div>

                            {/* Trip Cards Horizontal Scroll */}
                            <div className="flex overflow-x-auto gap-4 py-4 no-scrollbar pb-2">
                                {allVolumes.map((vol, index) => {
                                    const isDelivered = !!vol.isDelivered;
                                    const displayLabel = vol.statusLabel || (isDelivered ? "ENTREGUE" : "DISPONIVEL");
                                    const styles = getTripCardStyles(displayLabel);
                                    
                                    return (
                                        <div 
                                            key={vol.id} 
                                            className={`flex-none w-40 flex flex-col items-center justify-between border p-4 rounded-2xl transition-all duration-300 ${styles.container} shadow-sm hover:shadow-md hover:-translate-y-1`}
                                        >
                                            <span className="text-[10px] font-bold text-metal-500 uppercase tracking-wider">{index + 1}ª Carga</span>
                                            <span className={`text-xl font-black my-2 tracking-tight ${styles.text}`}>
                                                {vol.liters.toLocaleString('pt-BR')}L
                                            </span>
                                            
                                            <button 
                                                onClick={() => handleToggleTripStatus(vol.opId, vol.id)}
                                                className={`text-[10px] font-bold uppercase tracking-wide px-3 py-2 rounded-xl w-full transition-all shadow-sm hover:shadow-md active:scale-95 ${styles.button}`}
                                            >
                                                {displayLabel}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-metal-100 flex justify-end gap-3">
                            <button 
                                onClick={() => handleEditOp(primaryOp)}
                                className="text-brand-blue-600 hover:text-brand-blue-800 hover:bg-brand-blue-50 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                            >
                                <Edit2 size={16} /> Editar
                            </button>
                             <button 
                                onClick={() => handleDeleteGroup(osKey)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Excluir
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            );
            })
        )}
      </div>
    </div>
  );
};