import React, { useState, useEffect } from 'react';
import { Resource } from '../../types';
import { DataService } from '../../services/dataService';
import { Input } from '../ui/Input';
import { Edit2, FlaskConical, Search } from 'lucide-react';

export const ResourcesModule: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  useEffect(() => {
    setResources(DataService.getResources());
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name) {
      setMessage({ type: 'error', text: 'Preencha ID e Nome.' });
      return;
    }

    DataService.saveResource({ id, name });
    setResources(DataService.getResources());
    setId('');
    setName('');
    setIsEditing(false);
    setMessage({ type: 'success', text: 'Recurso salvo!' });
  };

  const handleEdit = (r: Resource) => {
    setId(r.id);
    setName(r.name);
    setIsEditing(true);
    setMessage(null);
  };

  const filtered = resources.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recursos (Defensivos)</h2>
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
              <th className="px-6 py-3 text-left text-xs font-bold uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase">Nome do Produto</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.map(r => (
              <tr key={r.id}>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{r.id}</td>
                <td className="px-6 py-4 text-sm text-gray-700 flex items-center gap-2">
                    <FlaskConical size={14} className="text-sugar-green-500"/>
                    {r.name}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(r)}><Edit2 size={16} className="text-gray-500 hover:text-sugar-green-600" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white shadow-md rounded-lg p-6 h-fit">
        <h2 className="text-lg font-bold mb-4">{isEditing ? 'Editar Recurso' : 'Novo Recurso'}</h2>
        {message && <div className="mb-4 text-sm text-green-700 bg-green-50 p-2 rounded">{message.text}</div>}
        <form onSubmit={handleSave}>
            <Input label="Código (ID)" value={id} onChange={e => setId(e.target.value)} disabled={isEditing} />
            <Input label="Nome do Produto" value={name} onChange={e => setName(e.target.value)} />
            <button className="w-full bg-sugar-green-600 text-white font-bold py-2 rounded hover:bg-sugar-green-700">Salvar</button>
            {isEditing && <button type="button" onClick={() => { setIsEditing(false); setId(''); setName(''); }} className="w-full mt-2 bg-gray-200 py-2 rounded">Cancelar</button>}
        </form>
      </div>
    </div>
  );
};