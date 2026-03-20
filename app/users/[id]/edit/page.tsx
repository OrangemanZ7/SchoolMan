'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { formatPhoneNumber } from '@/lib/utils';

const userSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Endereço de e-mail inválido'),
  employeeNumber: z.string().optional(),
  cellPhone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'purchaser', 'warehouse', 'dependency']),
  location: z.string().optional(),
}).refine((data) => {
  if ((data.role === 'warehouse' || data.role === 'dependency') && !data.location) {
    return false;
  }
  return true;
}, {
  message: "Local é obrigatório para as funções de almoxarifado e dependência",
  path: ["location"],
});

type UserFormValues = z.infer<typeof userSchema>;

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      employeeNumber: '',
      cellPhone: '',
      role: 'dependency',
      location: '',
    },
  });

  const selectedRole = watch('role');
  const needsLocation = selectedRole === 'warehouse' || selectedRole === 'dependency';

  useEffect(() => {
    async function fetchData() {
      try {
        const [locationsRes, userRes] = await Promise.all([
          fetch('/api/locations'),
          fetch(`/api/users/${resolvedParams.id}`)
        ]);

        if (locationsRes.ok) {
          const data = await locationsRes.json();
          setLocations(data);
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          reset({
            name: userData.name,
            email: userData.email,
            employeeNumber: userData.employeeNumber || '',
            cellPhone: userData.cellPhone || '',
            role: userData.role,
            location: userData.location?._id || userData.location || '',
          });
        } else {
          setError('Falha ao buscar detalhes do usuário.');
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('Ocorreu um erro ao buscar os dados.');
      } finally {
        setIsLoadingLocations(false);
        setIsLoadingUser(false);
      }
    }
    fetchData();
  }, [resolvedParams.id, reset]);

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    setError('');
    
    // Clean up location if not needed
    const payload = { ...data };
    if (!needsLocation || !payload.location) {
      delete payload.location;
    }

    try {
      const res = await fetch(`/api/users/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao atualizar o usuário');
      }

      router.push('/users');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        Carregando detalhes do usuário...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-2 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <Link href="/users">Voltar para Usuários</Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Editar Usuário</h1>
          <p className="mt-2 text-slate-600">Atualize detalhes do usuário, funções e permissões.</p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
              <input
                {...register('name')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="ex: João Silva"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Endereço de E-mail</label>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="joao.silva@exemplo.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número do Funcionário</label>
              <input
                {...register('employeeNumber')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="ex: EMP-12345"
              />
              {errors.employeeNumber && <p className="mt-1 text-sm text-red-600">{errors.employeeNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Telefone Celular</label>
              <input
                {...register('cellPhone', {
                  onChange: (e) => {
                    e.target.value = formatPhoneNumber(e.target.value);
                  }
                })}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="(##) #####-####"
              />
              {errors.cellPhone && <p className="mt-1 text-sm text-red-600">{errors.cellPhone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Função</label>
              <select
                {...register('role')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="admin">Administrador (Acesso Total)</option>
                <option value="manager">Gerente (Aprova Pedidos)</option>
                <option value="purchaser">Comprador (Cria Contratos/Pedidos)</option>
                <option value="warehouse">Almoxarifado (Gerencia Estoque)</option>
                <option value="dependency">Dependência (Solicita Itens)</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Atribuição de Local</label>
              <select
                {...register('location')}
                disabled={!needsLocation || isLoadingLocations}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">{needsLocation ? 'Selecione um local...' : 'Acesso Global (Não Requerido)'}</option>
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name} ({loc.type === 'central' ? 'central' : 'dependência'})
                  </option>
                ))}
              </select>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/users"
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Atualizar Usuário
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
