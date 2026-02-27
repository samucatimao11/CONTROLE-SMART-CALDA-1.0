import { LucideIcon, Activity, LayoutDashboard } from 'lucide-react';

export const APP_NAME = "SMART CALDA - CONTROLE DE O.S E CALDA";

// URL da planilha na nuvem (Supabase Storage) - Atualizada/Verificada
export const EXCEL_URL = "https://dkozrkzoghhylgvddkze.supabase.co/storage/v1/object/public/SMART%20CALDA/ATLOS.xlsx"; 

// URL do Logotipo
export const LOGO_URL = "https://dkozrkzoghhylgvddkze.supabase.co/storage/v1/object/public/SMART%20CALDA/logo%20(2).png";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  group: 'main';
}

export const NAV_ITEMS: NavItem[] = [
  // Grupo Principal
  { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard, group: 'main' },
  { id: 'operations', label: 'Operações (OS)', icon: Activity, group: 'main' },
];