'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';

const thresholdSchema = z.object({
  lowInventoryThreshold: z.number().min(0, 'O limite deve ser maior ou igual a 0').optional(),
});

type ThresholdFormValues = z.infer<typeof thresholdSchema>;

interface EditThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: any;
  globalThreshold: number;
}

export default function EditThresholdModal({ isOpen, onClose, onSuccess, product, globalThreshold }: EditThresholdModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ThresholdFormValues>({
    resolver: zodResolver(thresholdSchema),
    defaultValues: {
      lowInventoryThreshold: product?.lowInventoryThreshold,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        lowInventoryThreshold: product.lowInventoryThreshold,
      });
    }
  }, [product, reset]);

  if (!isOpen || !product) return null;

  const onSubmit = async (data: ThresholdFormValues) => {
    setIsSubmitting(true);
    setError('');

    try {
      // We need an API route to update the product
      const res = await fetch(`/api/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lowInventoryThreshold: data.lowInventoryThreshold !== undefined && !isNaN(data.lowInventoryThreshold) 
            ? data.lowInventoryThreshold 
            : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao atualizar limite');
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
          <h2 className="text-lg font-semibold text-slate-900">Editar Alerta de Estoque</h2>
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
            <p className="text-sm text-slate-600 mb-4">
              Defina o limite de alerta de estoque baixo para o produto <strong>{product.name}</strong>.
            </p>
            
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Alerta de Estoque Baixo
            </label>
            <input
              type="number"
              {...register('lowInventoryThreshold', { valueAsNumber: true })}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder={`Ex: ${globalThreshold} (Usa o padrão se vazio)`}
            />
            {errors.lowInventoryThreshold && (
              <p className="mt-1 text-sm text-red-600">{errors.lowInventoryThreshold.message}</p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Se deixado em branco, o sistema usará o limite global de {globalThreshold}.
            </p>
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
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
