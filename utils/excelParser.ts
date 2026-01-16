import * as XLSX from 'xlsx';
import { Driver, Supervisor, Truck, Location, Shift, Operation, OperationStatus, Resource, Section, OperationVolume } from '../types';
import { DataService } from '../services/dataService';

export const ExcelParser = {
  readFileSystem: async (file: File): Promise<string> => {
    // Keeps legacy support for specific Master Data sheets if user uploads separate file
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
            
            driversToSave.forEach(d => DataService.saveDriver(d)); // Driver list is usually small, loop is fine
            log += `Processado ${driversToSave.length} novos motoristas.\n`;
          }
          resolve(log || 'Arquivo processado (Verifique se abas específicas existem para carga de legado).');
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
          
          // --- 1. PRE-PARSE SHEET 2 (Planilha 2) for Metadata (Vazão/Capacidade) ---
          const extraDataMap = new Map<string, { flow: number, capacity: number }>();
          
          if (workbook.SheetNames.length > 1) {
             const sheet2Name = workbook.SheetNames[1]; // Planilha 2
             const sheet2 = workbook.Sheets[sheet2Name];
             const rows2 = XLSX.utils.sheet_to_json<any>(sheet2);
             
             rows2.forEach(row => {
                let osVal = '';
                let flowVal = 0;
                let capVal = 0;

                for (const [key, val] of Object.entries(row)) {
                    const k = key.toLowerCase();
                    const v = String(val).trim();
                    
                    if (k.includes('os') || k.includes('ordem') || k.includes('serviço')) {
                        osVal = v;
                    } else if (k.includes('vaz') || k.includes('flow')) {
                        flowVal = parseFloat(v.replace(',', '.'));
                    } else if (k.includes('cap') || k.includes('tanque')) {
                        capVal = parseFloat(v.replace(',', '.'));
                    }
                }

                if (osVal) {
                    extraDataMap.set(osVal, { flow: isNaN(flowVal) ? 0 : flowVal, capacity: isNaN(capVal) ? 0 : capVal });
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
          
          // Control Set to prevent duplicate trip generation for the same OS
          const processedOsForTrips = new Set<string>();

          rows.forEach((row, index) => {
             const opNum = String(row['A'] || '');
             const osCode = String(row['C'] || ''); 
             
             if (osCode && opNum) {
                // 1. Process Resource
                const resId = String(row['D'] || '');
                const resName = String(row['E'] || '');
                if (resId && !seenResourceIds.has(resId)) {
                  resourcesToSave.push({ id: resId, name: resName });
                  seenResourceIds.add(resId);
                }

                // 2. Process Section
                const secId = String(row['F'] || '');
                const secName = String(row['G'] || '');
                if (secId && !seenSectionIds.has(secId)) {
                  sectionsToSave.push({ id: secId, name: secName });
                  seenSectionIds.add(secId);
                }

                // 3. Process Sector
                const setId = String(row['H'] || '');
                const setName = String(row['I'] || '');
                if (setId && !seenLocationIds.has(setId)) {
                   locationsToSave.push({ 
                     id: setId, 
                     sectorName: setName, 
                     sectionId: secId, 
                     farmDescription: secName 
                   });
                   seenLocationIds.add(setId);
                }

                // 4. Process Supervisor
                const supId = String(row['J'] || '');
                const supName = String(row['K'] || '');
                if (supId && !seenSupervisorIds.has(supId)) {
                   supervisorsToSave.push({ 
                     id: supId, 
                     name: supName, 
                     workFront: '' 
                   });
                   seenSupervisorIds.add(supId);
                }

                // 5. Build Operation
                const prod = parseFloat(String(row['L']).replace(',', '.')) || 0; // Produção (Area)
                const dose = parseFloat(String(row['M']).replace(',', '.')) || 0; // Dose (Flow Rate)
                const total = parseFloat(String(row['N']).replace(',', '.')) || 0; // Total (Target Volume)

                const uniqueId = `${osCode}-${resId || index}`; 

                // --- NEW LOGIC: Lookup Extra Data (Planilha 2) ---
                const extra = extraDataMap.get(osCode);
                const appFlow = extra?.flow || 0; 
                const truckCap = extra?.capacity || 0;
                
                let appTotal = 0;
                if (prod > 0 && appFlow > 0) {
                    appTotal = prod * appFlow;
                }

                // --- NEW LOGIC: Auto Generate Trips ---
                const generatedVolumes: OperationVolume[] = [];
                
                // CRITICAL FIX: Only generate trips if we haven't processed this OS yet.
                // An OS usually has multiple rows (one for each product/ingredient), 
                // but they all share the SAME tank/syrup volume.
                if (appTotal > 0 && truckCap > 0 && !processedOsForTrips.has(osCode)) {
                    let remaining = appTotal;
                    const todayStr = new Date().toISOString().split('T')[0];
                    const nowStr = new Date().toISOString();

                    // Loop to create full loads + one partial load
                    while (remaining > 0.1) {
                        const vol = Math.min(remaining, truckCap);
                        const roundedVol = Math.round(vol * 10) / 10;
                        
                        generatedVolumes.push({
                            id: Math.random().toString(36).substr(2, 9),
                            liters: roundedVol,
                            timestamp: nowStr,
                            isDelivered: false,
                            deliveryDate: todayStr,
                            deliveryShift: 'Turno A'
                        });
                        remaining -= roundedVol;
                    }
                    
                    // Mark this OS as having its trips generated
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
                  
                  // Independent App Data
                  applicationArea: prod,
                  applicationFlowRate: appFlow, 
                  applicationTotalVolume: parseFloat(appTotal.toFixed(2)),
                  
                  volumes: generatedVolumes, // Will be populated only for the FIRST row of the OS
                  status: OperationStatus.MISTURA,
                  createdAt: new Date().toISOString()
                };

                opsToSave.push(newOp);
             }
          });

          // Perform Batch Saves
          if (resourcesToSave.length > 0) DataService.saveResourcesBatch(resourcesToSave);
          if (sectionsToSave.length > 0) DataService.saveSectionsBatch(sectionsToSave);
          if (locationsToSave.length > 0) DataService.saveLocationsBatch(locationsToSave);
          supervisorsToSave.forEach(s => DataService.saveSupervisor(s));

          if (opsToSave.length > 0) {
             DataService.saveOperationsBatch(opsToSave);
          }

          resolve(`Importação Concluída com Sucesso!\n\n- ${opsToSave.length} linhas processadas\n- Viagens geradas (unificadas por OS).`);
        } catch (err) {
          console.error(err);
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
};