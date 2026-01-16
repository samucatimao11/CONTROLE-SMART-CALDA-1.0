import React, { useState, useEffect } from 'react';
import { Location } from '../../types';
import { DataService } from '../../services/dataService';
import { Input } from '../ui/Input';
import { Edit2, Search, MapPin, Hash } from 'lucide-react';

export const LocationsModule: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [id, setId] = useState('');
  const [sectorName, setSectorName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLocations(DataService.getLocations());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !sectorName) {
      setMessage({ type: 'error', text: 'Preencha N° do Setor e Nome.' });
      return;
    }

    const existing = locations.find(l => l.id === id);
    if (existing && !isEditing) {
       setMessage({ type: 'error', text: 'Já existe um setor com este número.' });
       return;
    }

    DataService.saveLocation({
      id: id,
      sectorName,
      farmDescription: '' // Optional/Legacy
    });

    loadData();
    setId('');
    setSectorName('');
    setIsEditing(false);
    setMessage({ type: 'success', text: 'Setor salvo com sucesso!' });
  };

  const handleEdit = (loc: Location) => {
    setId(loc.id);
    setSectorName(loc.sectorName);
    setIsEditing(true);
    setMessage(null);
  };

  const filteredLocations = locations.filter(l => 
    l.sectorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.id.includes(searchTerm)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List */}
      <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Cadastros de Setores</h2>
          <div className="relative">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Buscar setor..." 
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
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">N° Setor</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Nome do Setor</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLocations.map(loc => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                     <div className="flex items-center gap-2">
                      <Hash size={14} className="text-gray-400" />
                      {loc.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-sugar-green-600" />
                      {loc.sectorName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(loc)} className="text-sugar-green-600 hover:text-sugar-green-900">
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLocations.length === 0 && (
                <tr><td colSpan={3} className="text-center py-4 text-gray-500">Nenhum setor encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow-md rounded-lg p-6 h-fit sticky top-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isEditing ? 'Editar Setor' : 'Novo Setor'}
        </h2>
        {message && (
          <div className={`p-3 rounded mb-4 text-sm ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSave}>
          <Input 
            label="N° Setor" 
            value={id} 
            onChange={e => setId(e.target.value)} 
            placeholder="Ex: 12"
            disabled={isEditing}
          />
          <Input 
            label="Nome do Setor" 
            value={sectorName} 
            onChange={e => setSectorName(e.target.value)} 
            placeholder="Ex: Setor Santa Maria"
          />
          <div className="flex gap-2 mt-4">
             <button className="flex-1 bg-sugar-green-600 text-white font-bold py-2 rounded hover:bg-sugar-green-700 transition">
              {isEditing ? 'Atualizar' : 'Salvar'}
            </button>
            {isEditing && (
              <button 
                type="button" 
                onClick={() => { setId(''); setSectorName(''); setIsEditing(false); setMessage(null); }}
                className="bg-gray-300 text-black font-bold py-2 px-4 rounded hover:bg-gray-400 transition"
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