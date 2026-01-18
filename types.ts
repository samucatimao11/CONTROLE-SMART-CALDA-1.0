
export type Shift = 'Turno A' | 'Turno B' | 'Turno C';

export enum OperationStatus {
  MISTURA = 'Em processo de mistura',
  CAMINHO = 'A caminho da área',
  CONCLUIDA = 'Operação concluída',
}

export interface Driver {
  id: string; // Unique ID
  name: string;
  shift: Shift;
}

export interface Supervisor {
  id: string; // ID from Excel (Col J)
  name: string; // Name from Excel (Col K)
  workFront: string; // Frente de Trabalho
}

export interface Truck {
  id: string; // Plate
  maxCapacity: number;
  company: string;
}

// New Entity: Seção
export interface Section {
  id: string; // Code from Excel (Col F)
  name: string; // Name from Excel (Col G)
}

// New Entity: Recurso (Defensivo)
export interface Resource {
  id: string; // Code from Excel (Col D)
  name: string; // Product Name (Col E)
}

// Location now represents "Setor" more specifically
export interface Location {
  id: string; // Code from Excel (Col H)
  sectorName: string; // Name from Excel (Col I)
  sectionId?: string; // Link to Section
  farmDescription?: string; // Legacy field, optional now
}

export interface OperationVolume {
  id: string;
  liters: number;
  timestamp: string;
  isDelivered?: boolean; // Controls calculation
  statusLabel?: string; // "ENTREGUE", "DISPONIVEL", "SEM INFO."
  deliveryDate?: string; // Data da entrega da carga
  deliveryShift?: Shift; // Turno da entrega
}

export interface Operation {
  id: string; // Unique Entry ID (Composite or UUID)
  osCode: string; // The actual visible Service Order Number (Col C) - New Field for Grouping
  date?: string; // Data da OS
  
  operationNumber: string; // Número da Operação (Col A)
  operationDescription: string; // Descrição da Operação (Col B)
  
  truckId: string;
  truckCapacity?: number; // New field for automation
  
  resourceId: string; // Link to Resource (Col D)
  resourceName?: string; // Denormalized name for easy display
  
  driverId: string;
  supervisorId: string; // Link to Supervisor (Col J)
  
  sectionId: string; // Link to Section (Col F)
  locationId: string; // Link to Sector (Col H)
  
  // Resource/Product Specific Data (The Ingredient)
  productionArea: number; // Produção (Col L) - Area referenced for the product
  flowRate: number; // Dose do Produto (Col M) - Renamed concept in UI, keeps key for legacy
  targetVolume: number; // Total do Produto (Col N) - Renamed concept in UI
  
  // Application/Syrup Specific Data (The Tank/Mix) - INDEPENDENT FIELDS
  applicationArea?: number; // Area real da aplicação
  applicationFlowRate?: number; // Vazão da Calda (L/ha)
  applicationTotalVolume?: number; // Volume Total da Calda (Tanque)

  volumes: OperationVolume[];
  
  status: OperationStatus;
  kpiFile?: string; 
  createdAt: string;
}

export interface AlertState {
  type: 'success' | 'error' | 'info';
  message: string;
}