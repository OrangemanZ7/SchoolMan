'use client';

import { useState, useEffect, use } from 'react';
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

const editConsumptionSchema = z.object({
  items: z.array(consumptionItemSchema).min(1, 'Adicione pelo menos um item'),
  notes: z.string().optional(),
});

type EditConsumptionFormValues = z.infer<typeof editConsumptionSchema>;

export default function EditConsumptionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInventoryLoading, setIsInventoryLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [originalConsumptions, setOriginalConsumptions] = useState<any[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditConsumptionFormValues>({
    resolver: zodResolver(editConsumptionSchema),
    defaultValues: {
      items: [{ product: '', quantity: 1 }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');

  useEffect(() => {
    const fetchConsumptionData = async () => {
      try {
        const res = await fetch(`/api/consumption`);
        if (!res.ok) throw new Error('Falha ao carregar consumo');
        const consumptions = await res.json();
        
        // Find all consumptions in this group
        const decodedId = decodeURIComponent(resolvedParams.id);
        const groupConsumptions = consumptions.filter((c: any) => {
          const locId = c.location?._id || c.location;
          const userId = c.consumedBy?._id || c.consumedBy;
          const groupId = c.batchId || `${c.createdAt}_${c.location?._id}_${c.consumedBy?._id}`;
          const fallbackGroupId = c.batchId || `${c.createdAt}_${locId}_${userId}`;
          
          return groupId === resolvedParams.id || 
                 groupId === decodedId ||
                 fallbackGroupId === resolvedParams.id ||
                 fallbackGroupId === decodedId ||
                 c._id === resolvedParams.id ||
                 c._id === decodedId;
        });
        
        if (groupConsumptions.length === 0) {
          setError('Registro não encontrado');
          setIsLoading(false);
          return;
        }

        setOriginalConsumptions(groupConsumptions);
        
        const firstItem = groupConsumptions[0];

        reset({
          notes: firstItem.notes || '',
          items: groupConsumptions.map((c: any) => ({
            product: c.product?._id || c.product,
            quantity: c.quantity
          }))
        });

      } catch (err: any) {
        console.error('Failed to fetch data', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsumptionData();
  }, [resolvedParams.id, reset]);

  useEffect(() => {
    if (originalConsumptions.length > 0) {
      setIsInventoryLoading(true);
      const locationId = originalConsumptions[0].location?._id || originalConsumptions[0].location;
      const fetchInventory = async () => {
        try {
          const res = await fetch(`/api/inventory?location=${locationId}`);
          if (res.ok) {
            const data = await res.json();
            // We need to include items that might have 0 quantity now but were consumed in this batch
            setInventory(data.filter((item: any) => item.product));
          }
        } catch (err) {
          console.error('Failed to fetch inventory', err);
        } finally {
          setIsInventoryLoading(false);
        }
      };
      fetchInventory();
    } else {
      setInventory([]);
      setIsInventoryLoading(false);
    }
  }, [originalConsumptions]);

  const onSubmit = async (data: EditConsumptionFormValues) => {
    const finalLocation = originalConsumptions[0]?.location?._id || originalConsumptions[0]?.location;
    
    if (!finalLocation || !user?.id) {
      setError('Informações de usuário ou local não encontradas.');
      return;
    }

    // Validate quantities against inventory + original consumption
    for (const item of data.items) {
      const inventoryItem = inventory.find(inv => inv.product._id === item.product);
      
      // Calculate how much was originally consumed for this product in this batch
      const originalConsumed = originalConsumptions
        .filter(c => (c.product?._id || c.product) === item.product)
        .reduce((sum, c) => sum + c.quantity, 0);

      const availableStock = (inventoryItem?.quantity || 0) + originalConsumed;

      if (item.quantity > availableStock) {
        setError(`Quantidade excede o estoque disponível para o produto ${inventoryItem?.product?.name || 'selecionado'} (${availableStock} disponíveis, incluindo o que já foi consumido)`);
        return;
      }
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/consumption/batch/${resolvedParams.id}`, {
        method: 'PUT',
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
        throw new Error(errorData.error || 'Falha ao atualizar consumo');
      }

      router.push('/consumption');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (isLoading || isInventoryLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        Carregando dados...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-2 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <Link href="/consumption">Voltar para Consumo</Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Editar Consumo</h1>
          <p className="mt-2 text-slate-600">Ajuste os itens, quantidades ou observações do registro.</p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Local de Consumo</h2>
          <div className="flex items-center text-slate-700 bg-slate-50 px-4 py-3 rounded-md border border-slate-200">
            <MapPin className="h-5 w-5 text-slate-400 mr-2" />
            <span className="font-medium">{originalConsumptions[0]?.location?.name || 'Local Desconhecido'}</span>
          </div>
        </div>

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

          <div className="space-y-4">
            {fields.map((field, index) => {
              const selectedProductId = watchItems?.[index]?.product;
              const selectedInventoryItem = inventory.find(item => item.product._id === selectedProductId);
              
              const originalConsumed = originalConsumptions
                .filter(c => (c.product?._id || c.product) === selectedProductId)
                .reduce((sum, c) => sum + c.quantity, 0);
                
              const availableStock = (selectedInventoryItem?.quantity || 0) + originalConsumed;

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
                        {inventory.map((item) => {
                          const itemOriginalConsumed = originalConsumptions
                            .filter(c => (c.product?._id || c.product) === item.product._id)
                            .reduce((sum, c) => sum + c.quantity, 0);
                          const itemAvailableStock = item.quantity + itemOriginalConsumed;
                          
                          return (
                            <option key={item.product._id} value={item.product._id}>
                              {item.product.name} ({itemAvailableStock} {item.product.unit} disponíveis)
                            </option>
                          );
                        })}
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
                        {selectedProductId && (
                          <span className="text-sm text-slate-500 whitespace-nowrap">
                            / Máx: {availableStock} {selectedInventoryItem?.product?.unit || ''}
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
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Informações Adicionais</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Observações (Opcional)
            </label>
            <textarea
              {...register('notes')}
              rows={4}
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
            disabled={isSubmitting}
            className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
