'use client';

import { useState, useEffect } from 'react';
import { Package, Loader2, MapPin, PackagePlus } from 'lucide-react';
import NewProductModal from '@/components/NewProductModal';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
        }
      } catch (err) {
        console.error('Failed to fetch locations', err);
      }
    }
    fetchLocations();
  }, []);

  useEffect(() => {
    async function fetchInventory() {
      setIsLoading(true);
      try {
        const url = selectedLocation 
          ? `/api/inventory?location=${selectedLocation}` 
          : '/api/inventory';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setInventory(data);
        }
      } catch (err) {
        console.error('Failed to fetch inventory', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInventory();
  }, [selectedLocation]);

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gerenciamento de Estoque</h1>
          <p className="mt-2 text-slate-600">Acompanhe os níveis de estoque em todos os locais.</p>
        </div>
        
        <div className="flex items-center gap-4">
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
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors text-sm"
          >
            <PackagePlus className="h-4 w-4 mr-2" />
            Novo Produto
          </button>
        </div>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            Carregando estoque...
          </div>
        ) : inventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Package className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">Nenhum estoque encontrado</p>
            <p className="mt-1">O estoque é inicializado automaticamente quando contratos são criados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Produto</th>
                  <th className="px-6 py-4 font-medium">Marca</th>
                  <th className="px-6 py-4 font-medium">Fornecedor</th>
                  <th className="px-6 py-4 font-medium">Categoria</th>
                  <th className="px-6 py-4 font-medium">Unidade</th>
                  <th className="px-6 py-4 font-medium">Local</th>
                  <th className="px-6 py-4 font-medium">Em Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inventory.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {item.product?.name || 'Produto Desconhecido'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.product?.brand || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.product?.supplier?.alias || item.product?.supplier?.name || '-'}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {item.product?.category === 'meal' ? 'alimentação' : item.product?.category === 'office' ? 'escritório' : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.product?.unit || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {item.location?.name || 'Local Desconhecido'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.quantity > 100 ? 'bg-emerald-100 text-emerald-800' :
                        item.quantity > 0 ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={() => {
          // Creating a product doesn't directly add it to inventory (quantity is 0),
          // but we can refresh the inventory just in case, or show a toast.
          // For now, we just close the modal.
        }}
      />
    </div>
  );
}
