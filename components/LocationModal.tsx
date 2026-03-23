'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, MapPin } from 'lucide-react';

const locationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['central', 'dependency']),
  city: z.string().min(1, 'Cidade é obrigatória'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  studentsCount: z.number().min(0).optional(),
  teachersCount: z.number().min(0).optional(),
  staffCount: z.number().min(0).optional(),
});

type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  location?: any; // If provided, we are in edit mode
}

export default function LocationModal({ isOpen, onClose, onSuccess, location }: LocationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || '',
      type: location?.type || 'dependency',
      city: location?.city || '',
      email: location?.email || '',
      phone: location?.phone || '',
      studentsCount: location?.studentsCount || 0,
      teachersCount: location?.teachersCount || 0,
      staffCount: location?.staffCount || 0,
    },
  });

  const locationType = watch('type');

  // Reset form when location changes or modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        name: location?.name || '',
        type: location?.type || 'dependency',
        city: location?.city || '',
        email: location?.email || '',
        phone: location?.phone || '',
        studentsCount: location?.studentsCount || 0,
        teachersCount: location?.teachersCount || 0,
        staffCount: location?.staffCount || 0,
      });
      setError('');
    }
  }, [isOpen, location, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: LocationFormValues) => {
    setIsSubmitting(true);
    setError('');
    try {
      const url = location ? `/api/locations/${location._id}` : '/api/locations';
      const method = location ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Falha ao ${location ? 'atualizar' : 'criar'} local`);
      }

      reset();
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-emerald-600" />
            {location ? 'Editar Local' : 'Novo Local'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
            <input
              {...register('name')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="ex: Escola A"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select
              {...register('type')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="dependency">Dependência (Escola/Unidade)</option>
              <option value="central">Armazém Central</option>
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
            <input
              {...register('city')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="ex: São Paulo"
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail (Opcional)</label>
            <input
              {...register('email')}
              type="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="ex: contato@escola.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone (Opcional)</label>
            <input
              {...register('phone')}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="ex: (11) 99999-9999"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          {locationType === 'dependency' && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alunos</label>
                <input
                  type="number"
                  {...register('studentsCount', { valueAsNumber: true })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
                {errors.studentsCount && <p className="mt-1 text-sm text-red-600">{errors.studentsCount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Professores</label>
                <input
                  type="number"
                  {...register('teachersCount', { valueAsNumber: true })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
                {errors.teachersCount && <p className="mt-1 text-sm text-red-600">{errors.teachersCount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Funcionários</label>
                <input
                  type="number"
                  {...register('staffCount', { valueAsNumber: true })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0"
                />
                {errors.staffCount && <p className="mt-1 text-sm text-red-600">{errors.staffCount.message}</p>}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {location ? 'Salvar Alterações' : 'Criar Local'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
