'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';

const consumptionSchema = z.object({
  product: z.string().min(1, 'Produto é obrigatório'),
  quantity: z.number().min(0.01, 'A quantidade deve ser maior que zero'),
  notes: z.string().optional(),
});

type ConsumptionFormValues = z.infer<typeof consumptionSchema>;

interface NewConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  locationId: string;
  userId: string;
}

export default function NewConsumptionModal({ isOpen, onClose, onSuccess, locationId, userId }: NewConsumptionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ConsumptionFormValues>({
    resolver: zodResolver(consumptionSchema),
    defaultValues: {
      product: '',
      quantity: 1,
      notes: '',
    },
  });

  const selectedProductId = watch('product');
  const selectedInventoryItem = inventory.find(item => item.product._id === selectedProductId);

  useEffect(() => {
    if (isOpen && locationId) {
      const fetchInventory = async () => {
        setIsLoadingInventory(true);
        try {
          const res = await fetch(`/api/inventory?location=${locationId}`);
          if (res.ok) {
            const data = await res.json();
            // Only show items with quantity > 0
            setInventory(data.filter((item: any) => item.quantity > 0));
          }
        } catch (err) {
          console.error('Failed to fetch inventory', err);
        } finally {
          setIsLoadingInventory(false);
        }
      };
      fetchInventory();
    }
  }, [isOpen, locationId]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      setError('');
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: ConsumptionFormValues) => {
    if (selectedInventoryItem && data.quantity > selectedInventoryItem.quantity) {
      setError(`Quantidade excede o estoque disponível (${selectedInventoryItem.quantity})`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/consumption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: locationId,
          product: data.product,
          quantity: data.quantity,
          consumedBy: userId,
          notes: data.notes
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao registrar consumo');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Registrar Consumo</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Produto
            </label>
            {isLoadingInventory ? (
              <div className="flex items-center text-sm text-slate-500 py-2">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Carregando produtos em estoque...
              </div>
            ) : (
              <select
                {...register('product')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Selecione um produto</option>
                {inventory.map((item) => (
                  <option key={item.product._id} value={item.product._id}>
                    {item.product.name} ({item.quantity} {item.product.unit} disponíveis)
                  </option>
                ))}
              </select>
            )}
            {errors.product && (
              <p className="mt-1 text-sm text-red-600">{errors.product.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Quantidade a Consumir
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                {...register('quantity', { valueAsNumber: true })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: 5"
              />
              {selectedInventoryItem && (
                <span className="text-sm text-slate-500 whitespace-nowrap">
                  / {selectedInventoryItem.quantity} {selectedInventoryItem.product.unit}
                </span>
              )}
            </div>
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
            )}
          </div>

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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingInventory || inventory.length === 0}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Registrar Consumo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
