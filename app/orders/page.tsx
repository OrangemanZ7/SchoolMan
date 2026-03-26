'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { Plus, ShoppingCart, Loader2, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, Package, Edit, Printer } from 'lucide-react';
import ReceiveConfirmationModal from '@/components/ReceiveConfirmationModal';
import { useSettings } from '@/components/SettingsProvider';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function OrdersPage() {
  const { settings } = useSettings();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // State for Receive Modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedOrderForReceive, setSelectedOrderForReceive] = useState<any | null>(null);

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

  const toggleExpand = (id: string) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string, receivedItems?: any[]) => {
    try {
      const payload: any = { status: newStatus };
      if (receivedItems) {
        payload.receivedItems = receivedItems;
      }

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const handleOpenReceiveModal = (order: any) => {
    setSelectedOrderForReceive(order);
    setIsReceiveModalOpen(true);
  };

  const handleConfirmReceive = async (receivedItems: any[]) => {
    if (selectedOrderForReceive) {
      await handleUpdateStatus(selectedOrderForReceive._id, 'received', receivedItems);
      setIsReceiveModalOpen(false);
      setSelectedOrderForReceive(null);
    }
  };

  const handlePrintOrder = (order: any) => {
    const doc = new jsPDF();
    
    if (settings.logoUrl) {
      try {
        doc.addImage(settings.logoUrl, 'PNG', 14, 10, 30, 30, undefined, 'FAST');
      } catch (e) {
        console.error('Failed to add logo to PDF', e);
      }
    }

    doc.setFontSize(18);
    const titleY = settings.logoUrl ? 25 : 20;
    const titleX = settings.logoUrl ? 50 : 14;
    
    doc.text(`Pedido de Compra: ${order.orderNumber}`, titleX, titleY);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Escola: ${settings.systemName}`, titleX, titleY + 6);
    doc.text(`Data do Pedido: ${new Date(order.createdAt).toLocaleDateString('pt-BR')}`, titleX, titleY + 11);
    doc.text(`Fornecedor: ${order.type === 'contract' ? (order.contract?.supplier?.name || 'Contrato') : (order.supplierName || 'Avulso')}`, titleX, titleY + 16);
    doc.text(`Status: ${order.status === 'received' ? 'Recebido' : order.status === 'pending' ? 'Pendente' : 'Cancelado'}`, titleX, titleY + 21);

    const headers = ['Produto', 'Marca', 'Qtd.', 'Unidade', 'Preço Unit.', 'Total'];
    const rows = order.items.map((item: any) => [
      item.product?.name || 'Desconhecido',
      item.product?.brand || '-',
      item.quantity || 0,
      item.product?.unit || '-',
      `R$ ${(item.pricePerUnit || 0).toFixed(2).replace('.', ',')}`,
      `R$ ${((item.quantity || 0) * (item.pricePerUnit || 0)).toFixed(2).replace('.', ',')}`
    ]);

    const totalOrderValue = order.items.reduce((acc: number, item: any) => acc + ((item.quantity || 0) * (item.pricePerUnit || 0)), 0);
    
    rows.push(['', '', '', '', 'Total Geral', `R$ ${totalOrderValue.toFixed(2).replace('.', ',')}`]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: settings.logoUrl ? 45 : 40,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      didParseCell: function (data) {
        if (data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      }
    });

    doc.save(`pedido_${order.orderNumber}.pdf`);
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
    <div className="max-w-7xl mx-auto">
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
                  <th className="px-6 py-4 font-medium w-10"></th>
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
                  <Fragment key={order._id}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleExpand(order._id)}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                      >
                        {expandedOrderId === order._id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </td>
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePrintOrder(order)}
                          className="text-slate-600 hover:text-slate-900 font-medium text-xs bg-slate-100 px-2 py-1 rounded flex items-center"
                          title="Imprimir PDF"
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          PDF
                        </button>
                        {order.status === 'pending' && (
                          <>
                            <Link
                              href={`/orders/${order._id}/edit`}
                              className="text-blue-600 hover:text-blue-900 font-medium text-xs bg-blue-50 px-2 py-1 rounded flex items-center"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Link>
                            <button
                              onClick={() => handleOpenReceiveModal(order)}
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedOrderId === order._id && (
                    <tr className="bg-slate-50">
                      <td colSpan={7} className="px-6 py-4 border-b border-slate-200">
                        <div className="pl-12 pr-4 py-2">
                          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                            <Package className="h-4 w-4 mr-2 text-slate-500" />
                            Produtos do Pedido
                          </h4>
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-sm text-slate-600">
                              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3 font-medium">Produto</th>
                                  <th className="px-4 py-3 font-medium">Marca</th>
                                  <th className="px-4 py-3 font-medium">Categoria</th>
                                  <th className="px-4 py-3 font-medium">Qtd. Solicitada</th>
                                  {order.status === 'received' && (
                                    <th className="px-4 py-3 font-medium">Qtd. Recebida</th>
                                  )}
                                  <th className="px-4 py-3 font-medium">Unidade</th>
                                  <th className="px-4 py-3 font-medium">Preço/Unid</th>
                                  <th className="px-4 py-3 font-medium">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {order.items?.map((item: any, index: number) => (
                                  <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{item.product?.name || 'Desconhecido'}</td>
                                    <td className="px-4 py-3">{item.product?.brand || '-'}</td>
                                    <td className="px-4 py-3 capitalize">{item.product?.category === 'meal' ? 'Alimentação' : item.product?.category === 'office' ? 'Escritório' : '-'}</td>
                                    <td className="px-4 py-3">{item.quantity || 0}</td>
                                    {order.status === 'received' && (
                                      <td className="px-4 py-3 font-medium text-emerald-600">{item.receivedQuantity ?? item.quantity}</td>
                                    )}
                                    <td className="px-4 py-3">{item.product?.unit || '-'}</td>
                                    <td className="px-4 py-3">R$ {item.pricePerUnit?.toFixed(2).replace('.', ',') || '0,00'}</td>
                                    <td className="px-4 py-3 font-medium">R$ {((item.quantity || 0) * (item.pricePerUnit || 0)).toFixed(2).replace('.', ',')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrderForReceive && (
        <ReceiveConfirmationModal
          isOpen={isReceiveModalOpen}
          onClose={() => {
            setIsReceiveModalOpen(false);
            setSelectedOrderForReceive(null);
          }}
          onConfirm={handleConfirmReceive}
          items={selectedOrderForReceive.items}
          title={`Receber Pedido: ${selectedOrderForReceive.orderNumber}`}
        />
      )}
    </div>
  );
}
