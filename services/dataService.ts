import { Driver, Supervisor, Truck, Location, Operation, Resource, Section } from '../types';

const STORAGE_KEYS = {
  DRIVERS: 'smart_calda_drivers',
  SUPERVISORS: 'smart_calda_supervisors',
  FLEET: 'smart_calda_fleet',
  LOCATIONS: 'smart_calda_locations',
  RESOURCES: 'smart_calda_resources', // New
  SECTIONS: 'smart_calda_sections',   // New
  OPERATIONS: 'smart_calda_operations',
};

// Generic getter
const getItems = <T,>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Generic setter
const setItems = <T,>(key: string, items: T[]) => {
  localStorage.setItem(key, JSON.stringify(items));
};

export const DataService = {
  // Drivers
  getDrivers: () => getItems<Driver>(STORAGE_KEYS.DRIVERS),
  saveDriver: (driver: Driver) => {
    const items = getItems<Driver>(STORAGE_KEYS.DRIVERS);
    const index = items.findIndex(i => i.id === driver.id);
    if (index >= 0) items[index] = driver;
    else items.push(driver);
    setItems(STORAGE_KEYS.DRIVERS, items);
  },
  
  // Supervisors
  getSupervisors: () => getItems<Supervisor>(STORAGE_KEYS.SUPERVISORS),
  saveSupervisor: (supervisor: Supervisor) => {
    const items = getItems<Supervisor>(STORAGE_KEYS.SUPERVISORS);
    const index = items.findIndex(i => i.id === supervisor.id);
    if (index >= 0) items[index] = supervisor;
    else items.push(supervisor);
    setItems(STORAGE_KEYS.SUPERVISORS, items);
  },

  // Fleet
  getTrucks: () => getItems<Truck>(STORAGE_KEYS.FLEET),
  saveTruck: (truck: Truck) => {
    const items = getItems<Truck>(STORAGE_KEYS.FLEET);
    const index = items.findIndex(i => i.id === truck.id);
    if (index >= 0) items[index] = truck;
    else items.push(truck);
    setItems(STORAGE_KEYS.FLEET, items);
  },

  // Sections (New)
  getSections: () => getItems<Section>(STORAGE_KEYS.SECTIONS),
  saveSection: (section: Section) => {
    const items = getItems<Section>(STORAGE_KEYS.SECTIONS);
    const index = items.findIndex(i => i.id === section.id);
    if (index >= 0) items[index] = section;
    else items.push(section);
    setItems(STORAGE_KEYS.SECTIONS, items);
  },
  // Batch Save Sections
  saveSectionsBatch: (newSections: Section[]) => {
    const items = getItems<Section>(STORAGE_KEYS.SECTIONS);
    const map = new Map(items.map(i => [i.id, i]));
    newSections.forEach(s => map.set(s.id, s));
    setItems(STORAGE_KEYS.SECTIONS, Array.from(map.values()));
  },

  // Resources (New)
  getResources: () => getItems<Resource>(STORAGE_KEYS.RESOURCES),
  saveResource: (resource: Resource) => {
    const items = getItems<Resource>(STORAGE_KEYS.RESOURCES);
    const index = items.findIndex(i => i.id === resource.id);
    if (index >= 0) items[index] = resource;
    else items.push(resource);
    setItems(STORAGE_KEYS.RESOURCES, items);
  },
  // Batch Save Resources
  saveResourcesBatch: (newResources: Resource[]) => {
    const items = getItems<Resource>(STORAGE_KEYS.RESOURCES);
    const map = new Map(items.map(i => [i.id, i]));
    newResources.forEach(r => map.set(r.id, r));
    setItems(STORAGE_KEYS.RESOURCES, Array.from(map.values()));
  },

  // Locations (Setores)
  getLocations: () => getItems<Location>(STORAGE_KEYS.LOCATIONS),
  saveLocation: (location: Location) => {
    const items = getItems<Location>(STORAGE_KEYS.LOCATIONS);
    const index = items.findIndex(i => i.id === location.id);
    if (index >= 0) items[index] = location;
    else items.push(location);
    setItems(STORAGE_KEYS.LOCATIONS, items);
  },
  // Batch Save Locations
  saveLocationsBatch: (newLocations: Location[]) => {
    const items = getItems<Location>(STORAGE_KEYS.LOCATIONS);
    const map = new Map(items.map(i => [i.id, i]));
    newLocations.forEach(l => map.set(l.id, l));
    setItems(STORAGE_KEYS.LOCATIONS, Array.from(map.values()));
  },

  // Operations
  getOperations: () => getItems<Operation>(STORAGE_KEYS.OPERATIONS),
  saveOperation: (operation: Operation) => {
    const items = getItems<Operation>(STORAGE_KEYS.OPERATIONS);
    const index = items.findIndex(i => i.id === operation.id);
    if (index >= 0) items[index] = operation;
    else items.push(operation);
    setItems(STORAGE_KEYS.OPERATIONS, items);
  },
  
  // Batch Save Operations (Optimized for Excel Import)
  saveOperationsBatch: (newOperations: Operation[]) => {
    const items = getItems<Operation>(STORAGE_KEYS.OPERATIONS);
    // Use a Map for O(1) lookups instead of O(N) inside loop
    const opMap = new Map(items.map(op => [op.id, op]));
    
    newOperations.forEach(op => {
      opMap.set(op.id, op);
    });
    
    setItems(STORAGE_KEYS.OPERATIONS, Array.from(opMap.values()));
  }
};