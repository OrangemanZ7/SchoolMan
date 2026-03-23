'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Loader2, Building2, Edit2, Trash2, Mail, Phone } from 'lucide-react';
import LocationModal from '@/components/LocationModal';
import { useAuth } from '@/components/AuthProvider';
import { formatPhoneNumber } from '@/lib/utils';

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (err) {
      console.error('Failed to fetch locations', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleEdit = (location: any) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este local?')) return;
    
    try {
      const res = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchLocations();
      } else {
        const data = await res.json();
        alert(data.error || 'Falha ao excluir local');
      }
    } catch (err) {
      console.error('Failed to delete location', err);
      alert('Falha ao excluir local');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Locais</h1>
          <p className="mt-2 text-slate-600">Gerencie armazéns centrais e dependências.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setSelectedLocation(null);
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Local
          </button>
        )}
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            Carregando locais...
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <MapPin className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">Nenhum local encontrado</p>
            <p className="mt-1">Comece criando um novo local.</p>
            {isAdmin && (
              <button
                onClick={() => {
                  setSelectedLocation(null);
                  setIsModalOpen(true);
                }}
                className="mt-6 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 font-medium transition-colors"
              >
                Criar Local
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Nome</th>
                  <th className="px-6 py-4 font-medium">Tipo</th>
                  <th className="px-6 py-4 font-medium">Cidade</th>
                  <th className="px-6 py-4 font-medium">Informações de Contato</th>
                  <th className="px-6 py-4 font-medium text-center">Alunos</th>
                  <th className="px-6 py-4 font-medium text-center">Professores</th>
                  <th className="px-6 py-4 font-medium text-center">Funcionários</th>
                  {isAdmin && <th className="px-6 py-4 font-medium text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {locations.map((location) => (
                  <tr key={location._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                      {location.type === 'central' ? (
                        <Building2 className="h-4 w-4 mr-2 text-emerald-500" />
                      ) : (
                        <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                      )}
                      {location.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${location.type === 'central' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                        {location.type === 'central' ? 'central' : 'dependência'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{location.city}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        {location.email && (
                          <a 
                            href={`mailto:${location.email}`}
                            className="flex items-center text-slate-500 hover:text-emerald-600 transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                            {location.email}
                          </a>
                        )}
                        {location.phone && (
                          <a 
                            href={`https://wa.me/55${location.phone.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-slate-500 hover:text-emerald-600 transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5 mr-1.5" />
                            {formatPhoneNumber(location.phone)}
                          </a>
                        )}
                        {!location.email && !location.phone && (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">
                      {location.studentsCount || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">
                      {location.teachersCount || 0}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">
                      {location.staffCount || 0}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(location)}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(location._id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LocationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLocation(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setSelectedLocation(null);
          fetchLocations();
        }}
        location={selectedLocation}
      />
    </div>
  );
}
