import React, { useState, useEffect } from 'react';
import { Truck } from '../../types';
import { DataService } from '../../services/dataService';
import { Input } from '../ui/Input';
import { Edit2, Building2 } from 'lucide-react';

export const FleetModule: React.FC = () => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [id, setId] = useState('');
  const [capacity, setCapacity] = useState('');
  const [company, setCompany] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTrucks(DataService.getTrucks());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !capacity || !company) {
      setMessage({ type: 'error', text: 'Todos os campos são obrigatórios.' });
      return;
    }

    const existing = trucks.find(t => t.id === id);
    if (existing && !isEditing) {
       if (window.confirm(`O caminhão "${id}" já existe. Deseja editar?`)) {
         setId(existing.id);
         setCapacity(existing.maxCapacity.toString());
         setCompany(existing.company);
         setIsEditing(true);
       }
       return;
    }

    DataService.saveTruck({
      id,
      maxCapacity: Number(capacity),
      company
    });

    loadData();
    setId('');
    setCapacity('');
    setCompany('');
    setIsEditing(false);
    setMessage({ type: 'success', text: 'Caminhão salvo com sucesso!' });
  };

  const handleEdit = (t: Truck) => {
    setId(t.id);
    setCapacity(t.maxCapacity.toString());
    setCompany(t.company);
    setIsEditing(true);
    setMessage(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Frota de Caminhões</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Número/Placa</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Capacidade (L)</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trucks.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-bold">{t.id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex items-center gap-1">
                    <Building2 size={14} className="text-gray-400" />
                    {t.company}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{t.maxCapacity} L</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(t)} className="text-sugar-green-600 hover:text-sugar-green-900">
                    <Edit2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {trucks.length === 0 && (
              <tr><td colSpan={4} className="text-center py-4 text-gray-500">Nenhum caminhão cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 h-fit">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isEditing ? 'Editar Caminhão' : 'Novo Caminhão'}
        </h2>
        {message && (
          <div className={`p-3 rounded mb-4 text-sm ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSave}>
          <Input 
            label="Número ou Placa" 
            value={id} 
            onChange={e => setId(e.target.value)} 
            placeholder="Ex: CAM-001"
            disabled={isEditing}
          />
          <Input 
            label="Empresa Proprietária" 
            value={company} 
            onChange={e => setCompany(e.target.value)} 
            placeholder="Ex: Usina Smart, Terceirizada X"
          />
          <Input 
            label="Capacidade Máxima (L)" 
            type="number"
            value={capacity} 
            onChange={e => setCapacity(e.target.value)} 
            placeholder="Ex: 5000"
          />
          <div className="flex gap-2 mt-4">
             <button className="flex-1 bg-sugar-green-600 text-white font-bold py-2 rounded hover:bg-sugar-green-700">
              {isEditing ? 'Atualizar' : 'Salvar'}
            </button>
            {isEditing && (
              <button 
                type="button" 
                onClick={() => { setId(''); setCapacity(''); setCompany(''); setIsEditing(false); setMessage(null); }}
                className="bg-gray-300 text-black font-bold py-2 px-4 rounded hover:bg-gray-400"
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
