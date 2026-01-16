import React, { useState, useEffect } from 'react';
import { Supervisor } from '../../types';
import { DataService } from '../../services/dataService';
import { Input } from '../ui/Input';
import { Edit2, Briefcase } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const SupervisorsModule: React.FC = () => {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [name, setName] = useState('');
  const [workFront, setWorkFront] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'error'|'success', text: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSupervisors(DataService.getSupervisors());
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workFront.trim()) {
      setMessage({ type: 'error', text: 'Nome e Frente de Trabalho são obrigatórios.' });
      return;
    }

    // Check duplicates by name
    const existing = supervisors.find(s => s.name.toLowerCase() === name.trim().toLowerCase() && s.id !== editingId);
    if (existing) {
       if (window.confirm(`O encarregado "${name}" já existe. Deseja editar o registro existente?`)) {
         setName(existing.name);
         setWorkFront(existing.workFront);
         setEditingId(existing.id);
       }
       return;
    }

    const supervisor: Supervisor = {
      id: editingId || generateId(),
      name: name.trim(),
      workFront: workFront.trim()
    };

    DataService.saveSupervisor(supervisor);
    loadData();
    setName('');
    setWorkFront('');
    setEditingId(null);
    setMessage({ type: 'success', text: 'Encarregado salvo com sucesso!' });
  };

  const handleEdit = (sup: Supervisor) => {
    setName(sup.name);
    setWorkFront(sup.workFront);
    setEditingId(sup.id);
    setMessage(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Encarregados Cadastrados</h2>
        <ul className="divide-y divide-gray-200">
          {supervisors.map(sup => (
            <li key={sup.id} className="py-4 flex justify-between items-center hover:bg-gray-50 px-2 rounded">
              <div>
                <span className="block text-gray-900 font-medium">{sup.name}</span>
                <span className="flex items-center gap-1 text-sm text-gray-500">
                  <Briefcase size={12} />
                  {sup.workFront}
                </span>
              </div>
              <button onClick={() => handleEdit(sup)} className="text-sugar-green-600 hover:text-sugar-green-900">
                <Edit2 size={18} />
              </button>
            </li>
          ))}
          {supervisors.length === 0 && <li className="py-4 text-gray-500">Nenhum encarregado cadastrado.</li>}
        </ul>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 h-fit">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {editingId ? 'Editar Encarregado' : 'Novo Encarregado'}
        </h2>
        {message && (
          <div className={`p-3 rounded mb-4 text-sm ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSave}>
          <Input 
            label="Nome do Encarregado" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="Digite o nome..."
          />
          <Input 
            label="Frente de Trabalho" 
            value={workFront} 
            onChange={e => setWorkFront(e.target.value)} 
            placeholder="Ex: Frente 05, Colheita Mecanizada..."
          />
          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-sugar-green-600 text-white font-bold py-2 rounded hover:bg-sugar-green-700">
              {editingId ? 'Atualizar' : 'Salvar'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setName(''); setWorkFront(''); setEditingId(null); setMessage(null); }}
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
