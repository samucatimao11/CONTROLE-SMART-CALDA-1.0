import React, { useState, useEffect } from 'react';
import { Operation, Supervisor, Location, Resource, Section, OperationStatus, OperationVolume, Shift } from '../../types';
import { DataService } from '../../services/dataService';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Search, Plus, FileText, Droplet, Upload, Sprout, FlaskConical, LayoutGrid, UserCog, TrendingUp, Cog, MapPin, Loader2, Edit2, Zap } from 'lucide-react';
import { ExcelParser } from '../../utils/excelParser';
import { EXCEL_URL } from '../../constants';

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

  const [isLoading, setIsLoading] = useState(false);
  
  // --- Form State ---
  
  // General Info
  const [osCode, setOsCode] = useState('');
  const [osDate, setOsDate] = useState(''); // Nova Data da OS
  const [opNumber, setOpNumber] = useState('');
  const [opDesc, setOpDesc] = useState('');
  
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
        alert("O 'Total de Calda' deve ser calculado antes de gerar as viagens.");
        return;
    }
    if (isNaN(cap) || cap <= 0) {
        alert("Informe a 'Capacidade do Tanque' para calcular as frações.");
        return;
    }
    // Using osDate instead of specific trip date
    if (!osDate || !currentTripShift) {
        alert("A Data da OS e o Turno são necessários para gerar viagens.");
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
            deliveryDate: osDate, // Using OS Date
            deliveryShift: currentTripShift as Shift
        });
        
        remaining -= roundedVol;
    }

    setVolumes(newVolumes);
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
        const currentStatus = !!op.volumes[volIndex].isDelivered;
        op.volumes[volIndex].isDelivered = !currentStatus;
        
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

  const handleFetchRemoteExcel = async () => {
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
      alert('Erro ao importar planilha. Verifique sua conexão ou a URL configurada.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (s: OperationStatus) => {
    switch (s) {
      case OperationStatus.MISTURA: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OperationStatus.CAMINHO: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OperationStatus.CONCLUIDA: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
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

    return matchOS && matchSector && matchOp && matchSup;
  });

  const currentOsResources = React.useMemo(() => {
    if (!osCode) return [];
    return operations.filter(op => (op.osCode === osCode || op.id.startsWith(osCode)) && op.resourceId);
  }, [operations, osCode]);

  if (viewMode === 'form') {
    return (
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-sugar-green-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {editingOp ? `Editando OS: ${editingOp.osCode || editingOp.id}` : 'Nova Ordem de Serviço'}
          </h2>
          <button onClick={() => setViewMode('list')} className="text-white hover:text-green-100 text-sm font-semibold">
            Voltar
          </button>
        </div>
        
        <form onSubmit={handleSave} className="p-6">
          {message && (
            <div className={`p-4 rounded mb-6 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
             {/* Row 1: OS and Date */}
             <div className="md:col-span-1">
                <Input label="Ordem de Serviço (OS)" value={osCode} onChange={e => setOsCode(e.target.value)} disabled={!!editingOp} placeholder="Ex: 294038" />
             </div>
             <div className="md:col-span-1">
                <Input type="date" label="Data da OS" value={osDate} onChange={e => setOsDate(e.target.value)} />
             </div>
             <div className="md:col-span-1">
                {/* Spacer */}
             </div>

             {/* Row 2: Operation details */}
             <div className="md:col-span-1">
                 <Input label="Nº Operação" value={opNumber} onChange={e => setOpNumber(e.target.value)} placeholder="Ex: 200" />
             </div>
             <div className="md:col-span-2">
                 <Input label="Descrição da Operação" value={opDesc} onChange={e => setOpDesc(e.target.value)} placeholder="Ex: Manu Reflorestamento" />
             </div>
            
            {/* Resources List & Edit */}
            <div className="md:col-span-3 bg-gray-50 p-4 rounded-lg border border-gray-200 mb-2">
                <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                   <FlaskConical size={16} className="text-sugar-green-600"/>
                   Composição da Calda (Recursos desta OS)
                </h4>
                
                {/* List of other resources in this OS */}
                {currentOsResources.length > 0 && (
                   <div className="mb-4 overflow-x-auto bg-white rounded border border-gray-100">
                     <table className="min-w-full text-xs">
                        <thead className="bg-gray-100">
                           <tr>
                              <th className="px-3 py-2 text-left">Produto</th>
                              <th className="px-3 py-2 text-center">Produção (ha)</th>
                              <th className="px-3 py-2 text-center">Dose (L/ha)</th>
                              <th className="px-3 py-2 text-right">Total (L)</th>
                           </tr>
                        </thead>
                        <tbody>
                           {currentOsResources.map(res => {
                             const isCurrent = res.id === editingOp?.id;
                             return (
                               <tr key={res.id} className={`cursor-pointer transition-colors ${isCurrent ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50"}`} onClick={() => handleEdit(res)} title="Clique para editar este produto">
                                 <td className="px-3 py-2 font-medium">{res.resourceName}</td>
                                 <td className="px-3 py-2 text-center">{res.productionArea}</td>
                                 <td className="px-3 py-2 text-center">{res.flowRate || '-'}</td>
                                 <td className="px-3 py-2 text-right">{res.targetVolume}</td>
                               </tr>
                             );
                           })}
                        </tbody>
                     </table>
                   </div>
                )}

                {/* Resource Specific Form */}
                <div className="border-t pt-3 border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
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
                            <Input label="Total Prod (L)" type="number" value={resTotal} onChange={e => setResTotal(e.target.value)} className="mb-0 text-sm bg-gray-50" />
                        </div>
                    </div>
                </div>
            </div>

            <Select label="Seção" value={sectionId} onChange={e => setSectionId(e.target.value)} options={sections.map(s => ({ value: s.id, label: `${s.id} - ${s.name}` }))} />
            <Select label="Setor" value={locationId} onChange={e => setLocationId(e.target.value)} options={locations.map(l => ({ value: l.id, label: `${l.id} - ${l.sectorName}` }))} />
            <Select label="Encarregado (Responsável)" value={supervisorId} onChange={e => setSupervisorId(e.target.value)} options={supervisors.map(s => ({ value: s.id, label: `${s.id} - ${s.name}` }))} />
            
            {/* Converted to Text Inputs for fluidity - ALIGNED TO FULL ROW - Added Capacity */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
               <Input 
                 label="Caminhão / Operação" 
                 value={truckId} 
                 onChange={e => setTruckId(e.target.value)} 
                 placeholder="Placa ou Nº"
               />
               <Input 
                 label="Capacidade do Tanque (L)" 
                 type="number"
                 value={truckCapacity} 
                 onChange={e => setTruckCapacity(e.target.value)} 
                 placeholder="Ex: 5000"
               />
               <Input 
                 label="Motorista" 
                 value={driverId} 
                 onChange={e => setDriverId(e.target.value)} 
                 placeholder="Nome do motorista..."
               />
            </div>

            {/* APPLICATION Technical Data (Independent Blue Box) */}
            <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100 mt-2">
                 <h4 className="md:col-span-3 font-bold text-blue-900 text-sm uppercase mb-2 flex items-center gap-2">
                    <Cog size={16}/> Dados Técnicos da Aplicação
                 </h4>
                 <Input 
                   label="Área Solicitada (ha)"
                   type="number" 
                   value={appArea} 
                   onChange={e => setAppArea(e.target.value)} 
                   placeholder="Ex: 20"
                   className="border-blue-200 focus:ring-blue-500"
                 />
                 <Input 
                   label="Vazão (L/ha)"
                   type="number" 
                   value={appFlow} 
                   onChange={e => setAppFlow(e.target.value)} 
                   placeholder="Digite a vazão..."
                   className="border-blue-200 focus:ring-blue-500"
                 />
                  <Input 
                   label="Total de Calda (L)"
                   type="number" 
                   value={appTotal} 
                   onChange={e => setAppTotal(e.target.value)} 
                   placeholder="Calculado automaticamente"
                   className="border-blue-200 focus:ring-blue-500 bg-gray-50"
                 />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Droplet size={20} className="text-sugar-green-600"/>
              Registro de Viagens
            </h3>
            
            <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
              {/* Removed Base Date Input, using osDate */}
              
              <div className="flex-1">
                 <Select 
                    label="Turno"
                    value={currentTripShift}
                    onChange={e => setCurrentTripShift(e.target.value as Shift)}
                    className="mb-0"
                    options={[
                        {value: 'Turno A', label: 'Turno A'},
                        {value: 'Turno B', label: 'Turno B'},
                        {value: 'Turno C', label: 'Turno C'},
                    ]}
                 />
              </div>
              
              <div className="flex-none pb-0.5 w-full md:w-auto">
                   <button type="button" onClick={handleGenerateTrips} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded transition flex items-center justify-center gap-2">
                     <Zap size={18} className="text-yellow-300" /> Gerar Viagens (Auto)
                   </button>
              </div>
            </div>

            <div className="bg-white rounded border border-gray-200 overflow-hidden">
               <table className="min-w-full text-sm">
                 <thead className="bg-gray-100">
                   <tr>
                     <th className="px-4 py-2 text-left">#</th>
                     <th className="px-4 py-2 text-left">Data/Turno</th>
                     <th className="px-4 py-2 text-left">Volume</th>
                     <th className="px-4 py-2 text-right">Horário Registro</th>
                     <th className="px-4 py-2"></th>
                   </tr>
                 </thead>
                 <tbody>
                   {volumes.map((vol, idx) => (
                     <tr key={vol.id} className="border-t">
                       <td className="px-4 py-2 font-bold">{idx + 1}ª</td>
                       <td className="px-4 py-2 text-gray-700">
                         {/* Form View - Edit Date for each volume if needed */}
                         <input 
                           type="date" 
                           value={vol.deliveryDate || ''} 
                           onChange={(e) => {
                             const newDate = e.target.value;
                             const updatedVols = volumes.map(v => v.id === vol.id ? {...v, deliveryDate: newDate} : v);
                             setVolumes(updatedVols);
                           }}
                           className="text-sm border border-gray-300 rounded px-1 py-0.5"
                         />
                         <div className="text-xs text-gray-500 mt-1">{vol.deliveryShift || '-'}</div>
                       </td>
                       <td className="px-4 py-2 text-sugar-green-700 font-bold">{vol.liters} L</td>
                       <td className="px-4 py-2 text-right text-gray-500">{new Date(vol.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                       <td className="px-4 py-2 text-right">
                         <button type="button" onClick={() => handleRemoveVolume(vol.id)} className="text-red-500 hover:text-red-700">&times;</button>
                       </td>
                     </tr>
                   ))}
                   {volumes.length === 0 && <tr><td colSpan={5} className="px-4 py-3 text-center text-gray-500">Nenhuma viagem registrada. Preencha os dados técnicos e clique em "Gerar Viagens".</td></tr>}
                 </tbody>
                 <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-200">
                   <tr>
                     <td className="px-4 py-3" colSpan={2}>TOTAL REALIZADO</td>
                     <td className="px-4 py-3 text-lg text-sugar-green-800" colSpan={3}>
                       {volumes.reduce((acc, curr) => acc + curr.liters, 0).toLocaleString()} L
                       {appTotal && <span className="text-xs text-gray-400 font-normal ml-2">(Meta: {Number(appTotal).toLocaleString()} L)</span>}
                     </td>
                   </tr>
                 </tfoot>
               </table>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="submit" className="flex-1 bg-sugar-green-600 text-white font-bold py-3 rounded-lg hover:bg-sugar-green-700 shadow transition">Salvar Operação</button>
          </div>
        </form>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col gap-4">
        {/* Search Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar OS..." 
                    className="w-full pl-9 pr-3 py-2 bg-white text-black border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sugar-green-500 focus:border-transparent outline-none"
                    value={searchOS}
                    onChange={(e) => setSearchOS(e.target.value)}
                />
            </div>
            <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar Setor..." 
                    className="w-full pl-9 pr-3 py-2 bg-white text-black border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sugar-green-500 focus:border-transparent outline-none"
                    value={searchSector}
                    onChange={(e) => setSearchSector(e.target.value)}
                />
            </div>
            <div className="relative">
                <Cog className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar Operação..." 
                    className="w-full pl-9 pr-3 py-2 bg-white text-black border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sugar-green-500 focus:border-transparent outline-none"
                    value={searchOp}
                    onChange={(e) => setSearchOp(e.target.value)}
                />
            </div>
            <div className="relative">
                <UserCog className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Buscar Encarregado..." 
                    className="w-full pl-9 pr-3 py-2 bg-white text-black border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-sugar-green-500 focus:border-transparent outline-none"
                    value={searchSup}
                    onChange={(e) => setSearchSup(e.target.value)}
                />
            </div>
        </div>
        
        {/* Buttons Row */}
        <div className="flex justify-end gap-2 w-full">
           <button 
             onClick={handleFetchRemoteExcel}
             className={`flex items-center justify-center gap-2 bg-green-50 text-sugar-green-700 border border-green-200 font-semibold py-2 px-4 rounded-md transition ${isLoading ? 'opacity-70 cursor-wait' : 'hover:bg-green-100'}`}
             disabled={isLoading}
           >
             {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
             <span className="hidden sm:inline">{isLoading ? 'Baixando...' : 'Importar Planilha OS'}</span>
           </button>

           <button onClick={handleCreateNew} disabled={isLoading} className="flex items-center justify-center gap-2 bg-sugar-green-600 hover:bg-sugar-green-700 text-white font-bold py-2 px-6 rounded-md shadow transition">
            <Plus size={20} /> <span className="hidden sm:inline">Nova Operação</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
            <div className="text-center py-20 text-gray-500">
                <Loader2 size={48} className="animate-spin mx-auto mb-4 text-sugar-green-600" />
                <p className="text-lg">Processando dados da planilha...</p>
            </div>
        ) : filteredGroupKeys.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
                <p>Nenhuma operação encontrada.</p>
            </div>
        ) : (
            filteredGroupKeys.map(osKey => {
            const group = groupedOperations[osKey];
            const primaryOp = group[0]; 
            
            const supervisor = supervisors.find(s => s.id === primaryOp.supervisorId);
            const location = locations.find(l => l.id === primaryOp.locationId);
            const section = sections.find(s => s.id === primaryOp.sectionId);
            
            // Priority: Manual Application Total > Sum of Products
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
                <div key={osKey} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition duration-200 overflow-hidden">
                <div className="p-5">
                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-lg"><FileText className="text-gray-600" size={24} /></div>
                        <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-gray-900">OS: {primaryOp.osCode || primaryOp.id}</h3>
                            {/* Removed Date from Header */}
                        </div>
                        </div>
                    </div>
                    {primaryOp.status !== OperationStatus.MISTURA && (
                        <div className={`mt-2 md:mt-0 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${getStatusColor(primaryOp.status)}`}>{primaryOp.status}</div>
                    )}
                    </div>

                    {/* Main Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-4 pb-4 border-b border-gray-100">
                        {/* Supervisor (Col 2) */}
                        <div className="md:col-span-2 flex items-center gap-2">
                            <div className="bg-blue-50 p-2 rounded-full text-blue-600 flex-shrink-0"><UserCog size={16} /></div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">Encarregado</p>
                                <p className="text-xs font-bold text-gray-800 truncate" title={supervisor?.name}>{supervisor?.name || 'Não atribuído'}</p>
                            </div>
                        </div>
                        
                        {/* Operation (Col 3) */}
                        <div className="md:col-span-3 flex items-center gap-2">
                            <div className="bg-orange-50 p-2 rounded-full text-orange-600 flex-shrink-0"><Cog size={16} /></div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">Operação</p>
                                <div className="flex items-center gap-1">
                                    <p className="text-sm font-bold text-gray-800">{primaryOp.operationNumber || 'N/A'}</p>
                                    <p className="text-xs text-gray-600 truncate" title={primaryOp.operationDescription}>{primaryOp.operationDescription}</p>
                                </div>
                            </div>
                        </div>

                        {/* Section (Col 2) */}
                        <div className="md:col-span-2 flex items-center gap-2">
                            <div className="bg-indigo-50 p-2 rounded-full text-indigo-600 flex-shrink-0"><LayoutGrid size={16} /></div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">Seção</p>
                                <p className="text-sm font-bold text-gray-800">{section ? section.id : '-'}</p>
                                <p className="text-xs text-gray-600 truncate" title={section?.name}>{section?.name}</p>
                            </div>
                        </div>

                        {/* Sector (Col 3) */}
                        <div className="md:col-span-3 flex items-center gap-2">
                            <div className="bg-purple-50 p-2 rounded-full text-purple-600 flex-shrink-0"><MapPin size={16} /></div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">Setor</p>
                                <p className="text-sm font-bold text-gray-800">{location ? location.id : '-'}</p>
                                <p className="text-xs text-gray-600 truncate" title={location?.sectorName}>{location?.sectorName}</p>
                            </div>
                        </div>

                        {/* Production / Area (Col 2) */}
                        <div className="md:col-span-2 flex items-center gap-2 justify-end">
                            <div className="text-right min-w-0">
                                <p className="text-[10px] text-gray-500 uppercase font-semibold">Produção (Área)</p>
                                <p className="text-sm font-bold text-gray-800 truncate">{productionValue ? productionValue.toLocaleString() : '-'} ha</p>
                            </div>
                            <div className="bg-green-50 p-2 rounded-full text-green-600 flex-shrink-0"><Sprout size={16} /></div>
                        </div>
                    </div>

                    {/* Products Table (Grouped Items) */}
                    <div className="mb-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                        <FlaskConical size={14}/> Produtos & Recomendações (Meta Importada)
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border border-gray-100 rounded-md">
                        <thead className="bg-gray-50">
                            <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-700">Recurso / Produto</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-700">Produção (ha)</th>
                            <th className="px-3 py-2 text-center font-semibold text-gray-700">Dose (L/ha)</th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-700">Total (L)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {group.map((item) => {
                            const res = resources.find(r => r.id === item.resourceId);
                            return (
                                <tr key={item.id}>
                                <td className="px-3 py-2 text-gray-900 font-medium">{res?.name || item.resourceName || '-'}</td>
                                <td className="px-3 py-2 text-center text-gray-600">{item.productionArea || '-'}</td>
                                <td className="px-3 py-2 text-center text-gray-600">{item.flowRate > 0 ? item.flowRate : '-'}</td>
                                <td className="px-3 py-2 text-right font-bold text-gray-800">{item.targetVolume}</td>
                                </tr>
                            );
                            })}
                        </tbody>
                        </table>
                    </div>
                    </div>

                    {/* Progress / Footer */}
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-3">
                            <div className="flex-1 w-full">
                                <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1">
                                    <TrendingUp size={14} /> Controle de Calda Entregue
                                </p>
                                
                                <div className="flex flex-wrap gap-2 mb-2">
                                {allVolumes.map((vol, index) => {
                                    const isDelivered = !!vol.isDelivered;
                                    return (
                                        <div 
                                            key={vol.id} 
                                            className={`flex flex-col items-center justify-between border p-2 rounded transition shadow-sm hover:shadow-md ${isDelivered ? 'bg-green-50 border-green-400' : 'bg-yellow-50 border-yellow-400'}`}
                                            title={`Entregue em: ${vol.deliveryDate || '-'} (${vol.deliveryShift || '-'})`}
                                            style={{ minWidth: '100px' }}
                                        >
                                            <div className="text-center mb-1">
                                                <span className={`font-bold text-sm block ${isDelivered ? 'text-green-900' : 'text-yellow-900'}`}>{index + 1}ª Carga</span>
                                                <span className={`text-xs font-semibold ${isDelivered ? 'text-green-800' : 'text-yellow-800'}`}>{vol.liters} L</span>
                                            </div>
                                            
                                            {/* Date Input inside the card */}
                                            <div className="mb-2 w-full">
                                                <input 
                                                    type="date"
                                                    value={vol.deliveryDate || ''}
                                                    onChange={(e) => handleUpdateVolumeDate(vol.opId, vol.id, e.target.value)}
                                                    className={`w-full text-[10px] font-medium bg-transparent border-b border-gray-300 focus:border-sugar-green-500 focus:outline-none text-center ${isDelivered ? 'text-green-900' : 'text-yellow-900'}`}
                                                />
                                            </div>

                                            <button 
                                                onClick={() => handleToggleTripStatus(vol.opId, vol.id)}
                                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded w-full transition-colors ${isDelivered ? 'bg-green-200 text-green-800 hover:bg-green-300' : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'}`}
                                            >
                                                {isDelivered ? 'ENTREGUE' : 'DISPONÍVEL'}
                                            </button>
                                        </div>
                                    );
                                })}
                                {allVolumes.length === 0 && <span className="text-xs text-gray-400 italic">Nenhuma viagem registrada.</span>}
                                </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-800">
                                    {totalRealizedVolume.toLocaleString('pt-BR')}
                                    <span className="text-xs text-gray-500"> / {totalTargetVolume.toLocaleString('pt-BR')} L</span>
                                </div>
                                <span className={`text-2xl font-bold ${progress >= 100 ? 'text-green-600' : 'text-gray-700'}`}>{progress.toFixed(0)}%</span>
                            </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div className={`h-2.5 rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-green-600' : 'bg-sugar-green-600'}`} style={{ width: `${progress}%` }}></div>
                        </div>
                        
                        {/* New Edit Button Location */}
                        <div className="mt-3 flex justify-end">
                            <button onClick={() => handleEdit(primaryOp)} className="flex items-center gap-2 text-sugar-green-700 hover:text-sugar-green-800 font-bold text-sm bg-green-50 hover:bg-green-100 px-4 py-2 rounded-lg transition border border-green-200">
                                <Edit2 size={16} /> Editar Operação
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