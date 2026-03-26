'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, Loader2, MapPin, Plus, Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function ConsumptionPage() {
  const [consumptions, setConsumptions] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  // If user is dependency or warehouse, they can only see/consume from their location
  const isRestrictedUser = user?.role === 'dependency' || user?.role === 'warehouse';
  const canDelete = user?.role === 'admin' || user?.role === 'manager';

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

  const groupedConsumptions = consumptions.reduce((acc, current) => {
    // Group by batchId if available, otherwise fallback to grouping by exact createdAt timestamp + location + user
    const groupId = current.batchId || `${current.createdAt}_${current.location?._id}_${current.consumedBy?._id}`;
    
    if (!acc[groupId]) {
      acc[groupId] = {
        id: groupId,
        batchId: current.batchId,
        code: current.code,
        createdAt: current.createdAt,
        location: current.location,
        consumedBy: current.consumedBy,
        notes: current.notes,
        items: []
      };
    } else if (!acc[groupId].notes && current.notes) {
      acc[groupId].notes = current.notes;
    }
    
    acc[groupId].items.push(current);
    return acc;
  }, {} as Record<string, any>);

  const sortedGroups = Object.values(groupedConsumptions).sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro de consumo? A quantidade será devolvida ao estoque.')) {
      return;
    }

    setIsDeleting(id);
    try {
      const res = await fetch(`/api/consumption/batch/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchConsumptions();
      } else {
        const data = await res.json();
        alert(data.error || 'Falha ao excluir o registro de consumo');
      }
    } catch (err) {
      console.error('Failed to delete consumption', err);
      alert('Erro ao excluir o registro de consumo');
    } finally {
      setIsDeleting(null);
    }
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
          
          <Link
            href="/consumption/new"
            className={`flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors text-sm ${(!selectedLocation && isRestrictedUser) ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Plus className="h-4 w-4 mr-2" />
            Registrar Consumo
          </Link>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            Carregando registros...
          </div>
        ) : sortedGroups.length === 0 ? (
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
                  <th className="px-6 py-4 font-medium">Código</th>
                  <th className="px-6 py-4 font-medium">Local</th>
                  <th className="px-6 py-4 font-medium">Registrado por</th>
                  <th className="px-6 py-4 font-medium">Total de Itens</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedGroups.map((group: any) => (
                  <React.Fragment key={group.id}>
                    <tr className={`hover:bg-slate-50 transition-colors ${expandedGroups[group.id] ? 'bg-slate-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-emerald-700 font-medium">
                        {group.code || `CS-${new Date(group.createdAt).toISOString().split('T')[0]}-${group.location?.alias || group.location?.name?.substring(0, 2).toUpperCase() || 'XX'}`}
                      </td>
                      <td className="px-6 py-4">
                        {group.location?.name || 'Local Desconhecido'}
                      </td>
                      <td className="px-6 py-4">
                        {group.consumedBy?.name || 'Usuário Desconhecido'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleGroup(group.id)}
                            className="text-slate-400 hover:text-emerald-600 transition-colors p-1"
                            title={expandedGroups[group.id] ? "Recolher detalhes" : "Ver detalhes"}
                          >
                            {expandedGroups[group.id] ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                          {canDelete && (
                            <>
                              <Link
                                href={`/consumption/${group.id}/edit`}
                                className={`text-slate-400 hover:text-emerald-600 transition-colors p-1 ${isDeleting === group.id ? 'opacity-50 pointer-events-none' : ''}`}
                                title="Editar registro"
                              >
                                <Pencil className="h-5 w-5" />
                              </Link>
                              <button
                                onClick={() => handleDelete(group.id)}
                                disabled={isDeleting === group.id}
                                className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50 p-1"
                                title="Excluir registro e devolver ao estoque"
                              >
                                {isDeleting === group.id ? (
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-5 w-5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedGroups[group.id] && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                            <table className="w-full text-left text-sm text-slate-600">
                              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3 font-medium">Produto</th>
                                  <th className="px-4 py-3 font-medium">Quantidade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {group.items.map((item: any) => (
                                  <tr key={item._id} className="hover:bg-slate-50/50">
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                      {item.product?.name || 'Produto Desconhecido'}
                                      {item.notes && item.notes !== group.notes && (
                                        <div className="text-xs text-slate-500 mt-1 font-normal">{item.notes}</div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-emerald-600">
                                      -{item.quantity} {item.product?.unit || ''}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {group.notes && (
                              <div className="p-4 border-t border-slate-200 bg-slate-50">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Observações</h4>
                                <p className="text-sm text-slate-700">{group.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
