import { LucideIcon, Truck, Users, UserCog, MapPin, Activity, FlaskConical, LayoutGrid, LayoutDashboard } from 'lucide-react';

export const APP_NAME = "SMART CALDA - CONTROLE DE O.S E CALDA";

// URL da planilha na nuvem (Supabase Storage)
export const EXCEL_URL = "https://dkozrkzoghhylgvddkze.supabase.co/storage/v1/object/public/SMART%20CALDA/ATLOS.xlsx"; 

// URL do Logotipo
export const LOGO_URL = "https://dkozrkzoghhylgvddkze.supabase.co/storage/v1/object/public/SMART%20CALDA/LOGO.png";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  group: 'main' | 'cadastros';
}

export const NAV_ITEMS: NavItem[] = [
  // Grupo Principal
  { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard, group: 'main' },
  { id: 'operations', label: 'Operações (OS)', icon: Activity, group: 'main' },
  
  // Grupo Cadastros
  { id: 'resources', label: 'Recursos', icon: FlaskConical, group: 'cadastros' },
  { id: 'sections', label: 'Seções', icon: LayoutGrid, group: 'cadastros' },
  { id: 'locations', label: 'Setores', icon: MapPin, group: 'cadastros' },
  { id: 'supervisors', label: 'Encarregados', icon: UserCog, group: 'cadastros' },
  { id: 'drivers', label: 'Motoristas', icon: Users, group: 'cadastros' },
  { id: 'fleet', label: 'Frota', icon: Truck, group: 'cadastros' },
];