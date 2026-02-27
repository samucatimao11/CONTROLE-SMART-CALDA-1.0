import React, { useState, useEffect } from 'react';
import { Driver, Shift } from '../../types';
import { DataService } from '../../services/dataService';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Edit2, Search, User } from 'lucide-react';

// Helper for internal ID generation
const generateId = () => Math.random().toString(36).substr(2, 9);

export const DriversModule: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [currentId, setCurrentId] = useState(''); // Internal ID tracking
  const [name, setName] = useState('');
  const [shift, setShift] = useState<Shift | ''>('');
  
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDrivers(DataService.getDrivers());
  };

  const resetForm = () => {
    setCurrentId('');
    setName('');
    setShift('');
    setIsEditing(false);
    setMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!name || !shift) {
      setMessage({ type: 'error', text: 'Nome e Turno são obrigatórios.' });
      return;
    }

    const existing = drivers.find(d => d.name.toLowerCase() === name.trim().toLowerCase() && d.id !== currentId);
    if (existing) {
      if (window.confirm(`Já existe um motorista com o nome "${name}". Deseja editar o registro existente?`)) {
        setCurrentId(existing.id);
        setName(existing.name);
        setShift(existing.shift);
        setIsEditing(true);
      }
      return;
    }

    const driverId = isEditing ? currentId : generateId();
    const newDriver: Driver = { id: driverId, name: name.trim(), shift: shift as Shift };
    DataService.saveDriver(newDriver);
    
    loadData();
    resetForm();
    setMessage({ type: 'success', text: 'Motorista salvo com sucesso!' });
  };

  const handleEdit = (driver: Driver) => {
    setCurrentId(driver.id);
    setName(driver.name);
    setShift(driver.shift);
    setIsEditing(true);
    setMessage(null);
  };

  const getShiftBadge = (s: Shift) => {
    switch(s) {
      case 'Turno A': return 'bg-sugar-green-100 text-sugar-green-800 border-sugar-green-200';
      case 'Turno B': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Turno C': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List Section */}
      <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Lista de Motoristas</h2>
          <div className="relative">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Buscar por nome..." 
               className="pl-9 pr-4 py-2 bg-white text-black border border-gray-300 rounded-md text-sm"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Turno</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDrivers.map(driver => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    <div className="flex items-center gap-2">
                       <User size={16} className="text-gray-400" />
                       {driver.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getShiftBadge(driver.shift)}`}>
                      {driver.shift}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(driver)} className="text-sugar-green-600 hover:text-sugar-green-900">
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">Nenhum motorista encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Section */}
      <div className="bg-white shadow-md rounded-lg p-6 h-fit sticky top-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isEditing ? 'Editar Motorista' : 'Novo Motorista'}
        </h2>
        
        {message && (
          <div className={`p-3 rounded mb-4 text-sm ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave}>
          <Input 
            label="Nome Completo" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Nome do motorista"
          />
          <Select
            label="Turno"
            value={shift}
            onChange={e => setShift(e.target.value as Shift)}
            options={[
              { value: 'Turno A', label: 'Turno A' },
              { value: 'Turno B', label: 'Turno B' },
              { value: 'Turno C', label: 'Turno C' },
            ]}
          />

          <div className="flex gap-2 mt-6">
            <button 
              type="submit"
              className="flex-1 bg-sugar-green-600 hover:bg-sugar-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition"
            >
              {isEditing ? 'Atualizar' : 'Cadastrar'}
            </button>
            {isEditing && (
              <button 
                type="button"
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};