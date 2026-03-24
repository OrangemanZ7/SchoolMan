'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, Save, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

const consumptionItemSchema = z.object({
  product: z.string().min(1, 'Produto é obrigatório'),
  quantity: z.number().min(0.01, 'A quantidade deve ser maior que zero'),
});

const consumptionSchema = z.object({
  location: z.string().optional(),
  items: z.array(consumptionItemSchema).min(1, 'Adicione pelo menos um item'),
  notes: z.string().optional(),
});

type ConsumptionFormValues = z.infer<typeof consumptionSchema>;

export default function NewConsumptionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [locations, setLocations] = useState<any[]>([]);
  const isRestrictedUser = user?.role === 'staff';

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ConsumptionFormValues>({
    resolver: zodResolver(consumptionSchema),
    defaultValues: {
      location: user?.location || '',
      items: [{ product: '', quantity: 1 }],
      notes: '',
    },
  });

  const selectedLocation = watch('location') || user?.location;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');

  useEffect(() => {
    if (!isRestrictedUser) {
      fetch('/api/locations')
        .then(res => res.json())
        .then(data => setLocations(data))
        .catch(err => console.error('Failed to fetch locations', err));
    }
  }, [isRestrictedUser]);

  useEffect(() => {
    if (selectedLocation) {
      const fetchInventory = async () => {
        setIsLoadingInventory(true);
        try {
          const res = await fetch(`/api/inventory?location=${selectedLocation}`);
          if (res.ok) {
            const data = await res.json();
            // Only show items with quantity > 0 and valid product
            setInventory(data.filter((item: any) => item.quantity > 0 && item.product));
          }
        } catch (err) {
          console.error('Failed to fetch inventory', err);
        } finally {
          setIsLoadingInventory(false);
        }
      };
      fetchInventory();
    } else {
      setInventory([]);
      setIsLoadingInventory(false);
    }
  }, [selectedLocation]);

  const onSubmit = async (data: ConsumptionFormValues) => {
    const finalLocation = data.location || user?.location;
    
    if (!finalLocation || !user?.id) {
      setError('Informações de usuário ou local não encontradas. Por favor, selecione um local.');
      return;
    }

    // Validate quantities against inventory
    for (const item of data.items) {
      const inventoryItem = inventory.find(inv => inv.product._id === item.product);
      if (inventoryItem && item.quantity > inventoryItem.quantity) {
        setError(`Quantidade excede o estoque disponível para o produto ${inventoryItem.product.name} (${inventoryItem.quantity} disponíveis)`);
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: finalLocation,
          consumedBy: user.id,
          items: data.items,
          notes: data.notes
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao registrar consumo');
      }

      router.push('/consumption');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-2 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <Link href="/consumption">Voltar para Consumo</Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Registrar Consumo</h1>
          <p className="mt-2 text-slate-600">Dê baixa em produtos do seu estoque.</p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {!isRestrictedUser && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Local de Consumo</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Selecione o Local
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select
                  {...register('location')}
                  className="w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Selecione um local...</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name} ({loc.type === 'central' ? 'central' : 'dependência'})
                    </option>
                  ))}
                </select>
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Itens Consumidos</h2>
            <button
              type="button"
              onClick={() => append({ product: '', quantity: 1 })}
              className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Item
            </button>
          </div>

          {errors.items?.root && (
            <p className="mb-4 text-sm text-red-600">{errors.items.root.message}</p>
          )}

          {isLoadingInventory ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              Carregando estoque...
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => {
                const selectedProductId = watchItems?.[index]?.product;
                const selectedInventoryItem = inventory.find(item => item.product._id === selectedProductId);

                return (
                  <div key={field.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative group">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pr-10">
                      <div className="md:col-span-8">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Produto
                        </label>
                        <select
                          {...register(`items.${index}.product` as const)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="">Selecione um produto</option>
                          {inventory.map((item) => (
                            <option key={item.product._id} value={item.product._id}>
                              {item.product.name} ({item.quantity} {item.product.unit} disponíveis)
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.product && (
                          <p className="mt-1 text-sm text-red-600">{errors.items[index]?.product?.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Quantidade
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Ex: 5"
                          />
                          {selectedInventoryItem && (
                            <span className="text-sm text-slate-500 whitespace-nowrap">
                              / Máx: {selectedInventoryItem.quantity} {selectedInventoryItem.product.unit}
                            </span>
                          )}
                        </div>
                        {errors.items?.[index]?.quantity && (
                          <p className="mt-1 text-sm text-red-600">{errors.items[index]?.quantity?.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Global Notes */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Observações</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Observações (Opcional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Motivo ou destino do consumo..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/consumption"
            className="px-6 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isLoadingInventory || inventory.length === 0}
            className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Registrar Consumo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
