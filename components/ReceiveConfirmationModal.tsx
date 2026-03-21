import { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, Package } from 'lucide-react';

interface Item {
  _id: string;
  product: { _id: string; name: string; unit: string; brand?: string };
  quantity: number;
}

interface ReceiveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (receivedItems: { itemId: string; receivedQuantity: number }[]) => Promise<void>;
  items: Item[];
  title: string;
}

export default function ReceiveConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  title
}: ReceiveConfirmationModalProps) {
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, number> = {};
      items.forEach(item => {
        initial[item._id] = item.quantity;
      });
      setReceivedQuantities(initial);
    }
  }, [isOpen, items]);

  if (!isOpen) return null;

  const handleQuantityChange = (id: string, value: string) => {
    const num = parseInt(value, 10);
    setReceivedQuantities(prev => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num
    }));
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const payload = items.map(item => ({
        itemId: item._id,
        receivedQuantity: receivedQuantities[item._id]
      }));
      await onConfirm(payload);
      onClose();
    } catch (error) {
      console.error('Failed to confirm receipt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasDiscrepancy = items.some(item => receivedQuantities[item._id] !== item.quantity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            <Package className="w-5 h-5 mr-2 text-slate-500" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-slate-600 mb-4">
            Por favor, verifique os produtos e as quantidades recebidas antes de confirmar.
            Se a quantidade recebida for diferente da esperada, você pode ajustá-la abaixo.
          </p>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 font-medium text-center">Esperado</th>
                  <th className="px-4 py-3 font-medium text-center">Recebido</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const expected = item.quantity;
                  const received = receivedQuantities[item._id] ?? 0;
                  const isMatch = expected === received;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {item.product?.name || 'Desconhecido'}
                      </td>
                      <td className="px-4 py-3">{item.product?.brand || '-'}</td>
                      <td className="px-4 py-3 text-center font-medium">
                        {expected} {item.product?.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="number"
                            min="0"
                            value={receivedQuantities[item._id] ?? ''}
                            onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                            className="w-20 px-2 py-1 text-center border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isMatch ? (
                          <span className="inline-flex items-center justify-center text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-medium">
                            <Check className="w-3 h-3 mr-1" />
                            Correto
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center text-amber-600 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Divergente
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasDiscrepancy && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800">Atenção: Divergência de Quantidade</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Existem itens com quantidade recebida diferente da quantidade esperada. 
                  O estoque será atualizado com as quantidades informadas na coluna &quot;Recebido&quot;.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar Recebimento'}
          </button>
        </div>
      </div>
    </div>
  );
}
