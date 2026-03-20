'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ShoppingCart, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Failed to fetch orders', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
        );
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Falha ao atualizar o status');
      }
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Falha ao atualizar o status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Recebido
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendente
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pedidos de Compra</h1>
          <p className="mt-2 text-slate-600">Gerencie pedidos de fornecedores para o Armazém Central.</p>
        </div>
        <Link
          href="/orders/new"
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors w-fit"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </Link>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            Carregando pedidos...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <ShoppingCart className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">Nenhum pedido encontrado</p>
            <p className="mt-1">Crie seu primeiro pedido de compra para reabastecer o estoque.</p>
            <Link
              href="/orders/new"
              className="mt-6 flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Pedido
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Número do Pedido</th>
                  <th className="px-6 py-4 font-medium">Tipo</th>
                  <th className="px-6 py-4 font-medium">Fornecedor / Contrato</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Itens</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {order.type === 'contract' ? 'contrato' : 'avulso'}
                    </td>
                    <td className="px-6 py-4">
                      {order.type === 'contract' 
                        ? (order.contract?.contractNumber || 'Contrato Desconhecido')
                        : (order.supplierName || 'Fornecedor Desconhecido')
                      }
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4">
                      {order.items?.length || 0} itens
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'received')}
                            className="text-emerald-600 hover:text-emerald-900 font-medium text-xs bg-emerald-50 px-2 py-1 rounded"
                          >
                            Marcar Recebido
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 font-medium text-xs bg-red-50 px-2 py-1 rounded"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </td>
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
