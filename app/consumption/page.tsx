'use client';

import { useState, useEffect } from 'react';
import { ClipboardList, Loader2, MapPin, Plus } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import NewConsumptionModal from '@/components/NewConsumptionModal';

export default function ConsumptionPage() {
  const [consumptions, setConsumptions] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  // If user is dependency or warehouse, they can only see/consume from their location
  const isRestrictedUser = user?.role === 'dependency' || user?.role === 'warehouse';

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
          
          // Auto-select location for restricted users
          if (isRestrictedUser && user?.location) {
            setSelectedLocation(user.location);
          } else if (data.length > 0 && !selectedLocation) {
            setSelectedLocation(data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch locations', err);
      }
    }
    fetchLocations();
  }, [user, isRestrictedUser, selectedLocation]);

  const fetchConsumptions = async () => {
    setIsLoading(true);
    try {
      const url = selectedLocation 
        ? `/api/consumption?location=${selectedLocation}` 
        : '/api/consumption';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConsumptions(data);
      }
    } catch (err) {
      console.error('Failed to fetch consumptions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedLocation || !isRestrictedUser) {
      fetchConsumptions();
    }
  }, [selectedLocation, isRestrictedUser]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Consumo de Estoque</h1>
          <p className="mt-2 text-slate-600">Registre e acompanhe o consumo de produtos no local.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {!isRestrictedUser && (
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-slate-400" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              >
                <option value="">Todos os Locais</option>
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name} ({loc.type === 'central' ? 'central' : 'dependência'})
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!selectedLocation && isRestrictedUser}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Consumo
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            Carregando registros...
          </div>
        ) : consumptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <ClipboardList className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">Nenhum consumo registrado</p>
            <p className="mt-1">Os registros de consumo aparecerão aqui.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Data/Hora</th>
                  <th className="px-6 py-4 font-medium">Produto</th>
                  <th className="px-6 py-4 font-medium">Quantidade</th>
                  <th className="px-6 py-4 font-medium">Local</th>
                  <th className="px-6 py-4 font-medium">Registrado por</th>
                  <th className="px-6 py-4 font-medium">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {consumptions.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {item.product?.name || 'Produto Desconhecido'}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-600">
                      -{item.quantity} {item.product?.unit || ''}
                    </td>
                    <td className="px-6 py-4">
                      {item.location?.name || 'Local Desconhecido'}
                    </td>
                    <td className="px-6 py-4">
                      {item.consumedBy?.name || 'Usuário Desconhecido'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={item.notes}>
                      {item.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && user && (
        <NewConsumptionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchConsumptions}
          locationId={selectedLocation || user.location || ''}
          userId={user.id}
        />
      )}
    </div>
  );
}
