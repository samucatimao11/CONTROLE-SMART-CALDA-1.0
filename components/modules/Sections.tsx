import React, { useState, useEffect } from 'react';
import { Section } from '../../types';
import { DataService } from '../../services/dataService';
import { Input } from '../ui/Input';
import { Edit2, LayoutGrid, Search } from 'lucide-react';

export const SectionsModule: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  useEffect(() => {
    setSections(DataService.getSections());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name) {
      setMessage({ type: 'error', text: 'Preencha ID e Nome.' });
      return;
    }

    DataService.saveSection({ id, name });
    setSections(DataService.getSections());
    setId('');
    setName('');
    setIsEditing(false);
    setMessage({ type: 'success', text: 'Seção salva!' });
  };

  const handleEdit = (s: Section) => {
    setId(s.id);
    setName(s.name);
    setIsEditing(true);
    setMessage(null);
  };

  const filtered = sections.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Seções</h2>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-9 pr-4 py-2 bg-white text-black border border-gray-300 rounded text-sm" 
                  placeholder="Buscar..." 
                />
            </div>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase">Número da Seção</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase">Nome da Seção</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map(s => (
              <tr key={s.id}>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{s.id}</td>
                <td className="px-6 py-4 text-sm text-gray-700 flex items-center gap-2">
                    <LayoutGrid size={14} className="text-orange-500"/>
                    {s.name}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(s)}><Edit2 size={16} className="text-gray-500 hover:text-orange-600" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white shadow-md rounded-lg p-6 h-fit">
        <h2 className="text-lg font-bold mb-4">{isEditing ? 'Editar Seção' : 'Nova Seção'}</h2>
        {message && <div className="mb-4 text-sm text-green-700 bg-green-50 p-2 rounded">{message.text}</div>}
        <form onSubmit={handleSave}>
            <Input label="Número (ID)" value={id} onChange={e => setId(e.target.value)} disabled={isEditing} />
            <Input label="Nome da Seção" value={name} onChange={e => setName(e.target.value)} />
            <button className="w-full bg-sugar-green-600 text-white font-bold py-2 rounded hover:bg-sugar-green-700">Salvar</button>
            {isEditing && <button type="button" onClick={() => { setIsEditing(false); setId(''); setName(''); }} className="w-full mt-2 bg-gray-200 py-2 rounded">Cancelar</button>}
        </form>
      </div>
    </div>
  );
};