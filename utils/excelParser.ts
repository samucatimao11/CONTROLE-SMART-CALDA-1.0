import * as XLSX from 'xlsx';
import { Driver, Supervisor, Truck, Location, Shift, Operation, OperationStatus, Resource, Section, OperationVolume } from '../types';
import { DataService } from '../services/dataService';

// Helper to convert Excel Serial Date to JS Date String (DD/MM/YYYY)
const formatExcelDate = (serial: any): string => {
  if (!serial) return '';
  
  // Se já for string com barras, retorna como está
  if (typeof serial === 'string' && serial.includes('/')) return serial;

  // Se for número serial (ex: 46024)
  const serialNum = parseFloat(serial);
  if (!isNaN(serialNum)) {
    // 25569 é o offset de dias entre 1/1/1900 (Excel) e 1/1/1970 (JS)
    const date = new Date(Math.round((serialNum - 25569) * 86400 * 1000));
    // Ajuste de fuso horário/data para garantir dia correto
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  return String(serial);
};

export const ExcelParser = {
  readFileSystem: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          let log = '';

          // 1. Motoristas
          if (workbook.Sheets['Motoristas']) {
            const driversRaw = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Motoristas']);
            const currentDrivers = DataService.getDrivers();
            const driversToSave: Driver[] = [];

            driversRaw.forEach(row => {
              if (row.Nome) {
                const existing = currentDrivers.find(d => d.name === row.Nome);
                if (!existing) {
                  driversToSave.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: row.Nome,
                    shift: (row.Turno as Shift) || 'Turno A'
                  });
                }
              }
            });
            
            driversToSave.forEach(d => DataService.saveDriver(d)); 
            log += `Processado ${driversToSave.length} novos motoristas.\n`;
          }
          resolve(log || 'Arquivo processado.');
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  },

  readOperations: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // --- Data Maps ---
          const extraDataMap = new Map<string, { flow: number, capacity: number }>();
          
          // Map to store specific trip status: Key = "OSCODE-TRIPINDEX" (e.g. "308710-1"), Value = Label ("ENTREGUE", etc)
          const tripStatusMap = new Map<string, string>();
          
          // --- 1. PRE-PARSE SHEET 2 (Planilha 2 - Horizontal Structure) ---
          if (workbook.SheetNames.length > 1) {
             const sheet2Name = workbook.SheetNames[1]; // Planilha 2
             const sheet2 = workbook.Sheets[sheet2Name];
             const rows2 = XLSX.utils.sheet_to_json<any>(sheet2);
             
             rows2.forEach(row => {
                let osVal = '';
                let flowVal = 0;
                let capVal = 0;

                // 1. First Pass: Identify OS and Metadata
                for (const [key, val] of Object.entries(row)) {
                    const k = key.toLowerCase().trim();
                    const v = String(val).trim();
                    
                    if (k.includes('ordem') || (k.includes('os') && !k.includes('prop'))) {
                        osVal = v;
                    } else if (k.includes('vaz') || k.includes('flow')) {
                        flowVal = parseFloat(v.replace(',', '.'));
                    } else if (k.includes('cap') || k.includes('tanque')) {
                        capVal = parseFloat(v.replace(',', '.'));
                    }
                }

                if (osVal) {
                    // Update Metadata
                    const existingMeta = extraDataMap.get(osVal) || { flow: 0, capacity: 0 };
                    extraDataMap.set(osVal, { 
                        flow: flowVal > 0 ? flowVal : existingMeta.flow, 
                        capacity: capVal > 0 ? capVal : existingMeta.capacity 
                    });

                    // 2. Second Pass: Identify Horizontal Trip Columns
                    for (const [key, val] of Object.entries(row)) {
                        const k = key.toLowerCase().trim(); // e.g. "1º carga"
                        const v = String(val).trim(); // e.g. "ENTREGUE"

                        const match = k.match(/(\d+)[ºªo]?\s*carga/);
                        
                        if (match) {
                            const tripIndex = parseInt(match[1]);
                            
                            let statusLabel = "SEM INFO.";
                            const statusLower = v.toLowerCase();

                            if (statusLower.includes('entregue') || statusLower.includes('ok')) {
                                statusLabel = "ENTREGUE";
                            } else if (statusLower.includes('disponivel') || statusLower.includes('pendente')) {
                                statusLabel = "DISPONIVEL";
                            } else if (v === '' || v === '-' || v === 'undefined') {
                                statusLabel = "SEM INFO.";
                            }
                            
                            tripStatusMap.set(`${osVal}-${tripIndex}`, statusLabel);
                        }
                    }
                }
             });
          }

          // --- 2. PARSE SHEET 1 (Main Operations) ---
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 'A', range: 2 });
          
          const opsToSave: Operation[] = [];
          const resourcesToSave: Resource[] = [];
          const sectionsToSave: Section[] = [];
          const locationsToSave: Location[] = [];
          const supervisorsToSave: Supervisor[] = [];

          const seenResourceIds = new Set<string>();
          const seenSectionIds = new Set<string>();
          const seenLocationIds = new Set<string>();
          const seenSupervisorIds = new Set<string>();
          
          const processedOsForTrips = new Set<string>();

          rows.forEach((row, index) => {
             const opNum = String(row['A'] || '');
             const osCode = String(row['C'] || ''); 
             
             if (osCode && opNum) {
                const resId = String(row['D'] || '');
                const resName = String(row['E'] || '');
                if (resId && !seenResourceIds.has(resId)) {
                  resourcesToSave.push({ id: resId, name: resName });
                  seenResourceIds.add(resId);
                }

                const secId = String(row['F'] || '');
                const secName = String(row['G'] || '');
                if (secId && !seenSectionIds.has(secId)) {
                  sectionsToSave.push({ id: secId, name: secName });
                  seenSectionIds.add(secId);
                }

                const setId = String(row['H'] || '');
                const setName = String(row['I'] || '');
                if (setId && !seenLocationIds.has(setId)) {
                   locationsToSave.push({ id: setId, sectorName: setName, sectionId: secId });
                   seenLocationIds.add(setId);
                }

                const supId = String(row['J'] || '');
                const supName = String(row['K'] || '');
                if (supId && !seenSupervisorIds.has(supId)) {
                   supervisorsToSave.push({ id: supId, name: supName, workFront: '' });
                   seenSupervisorIds.add(supId);
                }

                const prod = parseFloat(String(row['L']).replace(',', '.')) || 0; 
                const dose = parseFloat(String(row['M']).replace(',', '.')) || 0; 
                const total = parseFloat(String(row['N']).replace(',', '.')) || 0; 
                
                // New Fields Parsing (Cols Q, R, S)
                // Q = Data emissão (Convertendo Serial)
                const issueDateRaw = row['Q'];
                const issueDate = formatExcelDate(issueDateRaw);
                
                // R = Dias O.S
                const osAgeRaw = String(row['R'] || '');
                const osAge = osAgeRaw.includes(',') ? osAgeRaw.split(',')[0] : osAgeRaw;
                
                // S = Situação
                const osSituation = String(row['S'] || '').trim();

                const uniqueId = `${osCode}-${resId || index}`; 

                const extra = extraDataMap.get(osCode);
                const appFlow = extra?.flow || 0; 
                const truckCap = extra?.capacity || 0;
                
                let appTotal = 0;
                if (prod > 0 && appFlow > 0) {
                    appTotal = prod * appFlow;
                }

                // --- Auto Generate Trips ---
                const generatedVolumes: OperationVolume[] = [];
                if (appTotal > 0 && truckCap > 0 && !processedOsForTrips.has(osCode)) {
                    let remaining = appTotal;
                    const todayStr = new Date().toISOString().split('T')[0];
                    const nowStr = new Date().toISOString();
                    let tripCounter = 1;

                    while (remaining > 0.1) {
                        const vol = Math.min(remaining, truckCap);
                        const roundedVol = Math.round(vol * 10) / 10;
                        const mapKey = `${osCode}-${tripCounter}`;
                        
                        let statusLabel = "SEM INFO.";
                        if (tripStatusMap.has(mapKey)) {
                             statusLabel = tripStatusMap.get(mapKey)!;
                        }

                        const isDelivered = statusLabel === "ENTREGUE";

                        generatedVolumes.push({
                            id: Math.random().toString(36).substr(2, 9),
                            liters: roundedVol,
                            timestamp: nowStr,
                            isDelivered: isDelivered, 
                            statusLabel: statusLabel, 
                            deliveryDate: todayStr,
                            deliveryShift: 'Turno A'
                        });
                        remaining -= roundedVol;
                        tripCounter++;
                    }
                    processedOsForTrips.add(osCode);
                }

                const newOp: Operation = {
                  id: uniqueId,
                  osCode: osCode,
                  operationNumber: opNum,
                  operationDescription: String(row['B'] || ''),
                  truckId: '',
                  truckCapacity: truckCap, 
                  driverId: '',
                  resourceId: resId,
                  resourceName: resName,
                  supervisorId: supId,
                  sectionId: secId,
                  locationId: setId,
                  productionArea: prod,
                  flowRate: dose,
                  targetVolume: total,
                  
                  issueDate: issueDate,
                  osAge: osAge,
                  osSituation: osSituation,

                  applicationArea: prod,
                  applicationFlowRate: appFlow, 
                  applicationTotalVolume: parseFloat(appTotal.toFixed(2)),
                  volumes: generatedVolumes, 
                  status: OperationStatus.MISTURA,
                  createdAt: new Date().toISOString()
                };

                opsToSave.push(newOp);
             }
          });

          // Batch Saves
          if (resourcesToSave.length > 0) DataService.saveResourcesBatch(resourcesToSave);
          if (sectionsToSave.length > 0) DataService.saveSectionsBatch(sectionsToSave);
          if (locationsToSave.length > 0) DataService.saveLocationsBatch(locationsToSave);
          supervisorsToSave.forEach(s => DataService.saveSupervisor(s));
          if (opsToSave.length > 0) DataService.saveOperationsBatch(opsToSave);

          resolve(`Importação Atualizada!\n- ${opsToSave.length} linhas processadas\n- Datas formatadas.`);
        } catch (err) {
          console.error(err);
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
};