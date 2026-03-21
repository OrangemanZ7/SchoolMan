'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { Plus, Truck, Loader2, CheckCircle2, Clock, MapPin, ChevronDown, ChevronUp, Package } from 'lucide-react';
import ReceiveConfirmationModal from '@/components/ReceiveConfirmationModal';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedShipmentId, setExpandedShipmentId] = useState<string | null>(null);

  // State for Receive Modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedShipmentForReceive, setSelectedShipmentForReceive] = useState<any | null>(null);

  useEffect(() => {
    async function fetchShipments() {
      try {
        const res = await fetch('/api/shipments');
        if (res.ok) {
          const data = await res.json();
          setShipments(data);
        }
      } catch (err) {
        console.error('Failed to fetch shipments', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchShipments();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedShipmentId(prev => prev === id ? null : id);
  };

  const handleUpdateStatus = async (shipmentId: string, newStatus: string, receivedItems?: any[]) => {
    try {
      const payload: any = { status: newStatus };
      if (receivedItems) {
        payload.receivedItems = receivedItems;
      }

      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updatedShipment = await res.json();
        setShipments((prev) =>
          prev.map((s) => (s._id === updatedShipment._id ? updatedShipment : s))
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

  const handleOpenReceiveModal = (shipment: any) => {
    setSelectedShipmentForReceive(shipment);
    setIsReceiveModalOpen(true);
  };

  const handleConfirmReceive = async (receivedItems: any[]) => {
    if (selectedShipmentForReceive) {
      await handleUpdateStatus(selectedShipmentForReceive._id, 'delivered', receivedItems);
      setIsReceiveModalOpen(false);
      setSelectedShipmentForReceive(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Entregue
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Truck className="w-3 h-3 mr-1" />
            Enviado
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 mr-1" />
            Preparando
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
          <h1 className="text-3xl font-bold text-slate-900">Remessas</h1>
          <p className="mt-2 text-slate-600">Gerencie transferências do Armazém Central para as Dependências.</p>
        </div>
        <Link
          href="/shipments/new"
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors w-fit"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Remessa
        </Link>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            Carregando remessas...
          </div>
        ) : shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Truck className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">Nenhuma remessa encontrada</p>
            <p className="mt-1">Crie sua primeira remessa para distribuir o estoque.</p>
            <Link
              href="/shipments/new"
              className="mt-6 flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Remessa
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium w-10"></th>
                  <th className="px-6 py-4 font-medium">Número da Remessa</th>
                  <th className="px-6 py-4 font-medium">Origem</th>
                  <th className="px-6 py-4 font-medium">Destino</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Itens</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {shipments.map((shipment) => (
                  <Fragment key={shipment._id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleExpand(shipment._id)}
                          className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                          {expandedShipmentId === shipment._id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {shipment.shipmentNumber}
                      </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                        {shipment.fromLocation?.name || 'Desconhecido'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                        {shipment.toLocation?.name || 'Desconhecido'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(shipment.status)}
                    </td>
                    <td className="px-6 py-4">
                      {shipment.items?.length || 0} itens
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {shipment.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(shipment._id, 'shipped')}
                            className="text-blue-600 hover:text-blue-900 font-medium text-xs bg-blue-50 px-2 py-1 rounded"
                          >
                            Marcar Enviado
                          </button>
                        )}
                        {shipment.status === 'shipped' && (
                          <button
                            onClick={() => handleOpenReceiveModal(shipment)}
                            className="text-emerald-600 hover:text-emerald-900 font-medium text-xs bg-emerald-50 px-2 py-1 rounded"
                          >
                            Marcar Entregue
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedShipmentId === shipment._id && (
                    <tr className="bg-slate-50">
                      <td colSpan={7} className="px-6 py-4 border-b border-slate-200">
                        <div className="pl-12 pr-4 py-2">
                          <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                            <Package className="h-4 w-4 mr-2 text-slate-500" />
                            Produtos da Remessa
                          </h4>
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-sm text-slate-600">
                              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                <tr>
                                  <th className="px-4 py-3 font-medium">Produto</th>
                                  <th className="px-4 py-3 font-medium">Marca</th>
                                  <th className="px-4 py-3 font-medium">Categoria</th>
                                  <th className="px-4 py-3 font-medium">Qtd. Enviada</th>
                                  {shipment.status === 'delivered' && (
                                    <th className="px-4 py-3 font-medium">Qtd. Recebida</th>
                                  )}
                                  <th className="px-4 py-3 font-medium">Unidade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {shipment.items?.map((item: any, index: number) => (
                                  <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{item.product?.name || 'Desconhecido'}</td>
                                    <td className="px-4 py-3">{item.product?.brand || '-'}</td>
                                    <td className="px-4 py-3 capitalize">{item.product?.category === 'meal' ? 'Alimentação' : item.product?.category === 'office' ? 'Escritório' : '-'}</td>
                                    <td className="px-4 py-3">{item.quantity || 0}</td>
                                    {shipment.status === 'delivered' && (
                                      <td className="px-4 py-3 font-medium text-emerald-600">{item.receivedQuantity ?? item.quantity}</td>
                                    )}
                                    <td className="px-4 py-3">{item.product?.unit || '-'}</td>
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

      {selectedShipmentForReceive && (
        <ReceiveConfirmationModal
          isOpen={isReceiveModalOpen}
          onClose={() => {
            setIsReceiveModalOpen(false);
            setSelectedShipmentForReceive(null);
          }}
          onConfirm={handleConfirmReceive}
          items={selectedShipmentForReceive.items}
          title={`Receber Remessa: ${selectedShipmentForReceive.shipmentNumber}`}
        />
      )}
    </div>
  );
}
