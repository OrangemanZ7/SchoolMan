'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Loader2, Building2, Phone, Mail } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/utils';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const res = await fetch('/api/suppliers');
        if (res.ok) {
          const data = await res.json();
          setSuppliers(data);
        }
      } catch (err) {
        console.error('Failed to fetch suppliers', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSuppliers();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fornecedores</h1>
          <p className="mt-2 text-slate-600">Gerencie fornecedores para contratos públicos e compras avulsas.</p>
        </div>
        <Link
          href="/suppliers/new"
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Fornecedor
        </Link>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            Carregando fornecedores...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Building2 className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">Nenhum fornecedor encontrado</p>
            <p className="mt-1">Comece adicionando um novo fornecedor ao sistema.</p>
            <Link
              href="/suppliers/new"
              className="mt-6 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 font-medium transition-colors"
            >
              Adicionar Fornecedor
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Nome Fantasia / Razão Social</th>
                  <th className="px-6 py-4 font-medium">Documento (CNPJ/CPF)</th>
                  <th className="px-6 py-4 font-medium">Informações de Contato</th>
                  <th className="px-6 py-4 font-medium">Atendente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{supplier.alias}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{supplier.name}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{supplier.document}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        {supplier.email && (
                          <a 
                            href={`mailto:${supplier.email}`}
                            className="flex items-center text-slate-500 hover:text-emerald-600 transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                            {supplier.email}
                          </a>
                        )}
                        {supplier.phone && (
                          <a 
                            href={`https://wa.me/55${supplier.phone.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-slate-500 hover:text-emerald-600 transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5 mr-1.5" />
                            {formatPhoneNumber(supplier.phone)}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{supplier.attendantName || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
