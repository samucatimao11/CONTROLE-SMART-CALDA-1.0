import { LucideIcon, Truck, Users, UserCog, MapPin, Activity, FlaskConical, LayoutGrid, LayoutDashboard } from 'lucide-react';

export const APP_NAME = "CONTROLE DE CALDA – SMART";

// URL da planilha na nuvem (Supabase Storage)
export const EXCEL_URL = "https://dkozrkzoghhylgvddkze.supabase.co/storage/v1/object/public/SMART%20CALDA/ATLOS.xlsx"; 

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard }, // New
  { id: 'operations', label: 'Operações (OS)', icon: Activity },
  { id: 'resources', label: 'Recursos', icon: FlaskConical },
  { id: 'sections', label: 'Seções', icon: LayoutGrid },
  { id: 'locations', label: 'Setores', icon: MapPin },
  { id: 'supervisors', label: 'Encarregados', icon: UserCog },
  { id: 'drivers', label: 'Motoristas', icon: Users },
  { id: 'fleet', label: 'Frota', icon: Truck },
];