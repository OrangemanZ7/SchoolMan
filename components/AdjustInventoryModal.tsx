import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';

interface AdjustInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  inventoryItem: any;
}

export default function AdjustInventoryModal({ isOpen, onClose, onSuccess, inventoryItem }: AdjustInventoryModalProps) {
  const [newQuantity, setNewQuantity] = useState<number | ''>('');
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && inventoryItem) {
      setNewQuantity(inventoryItem.quantity);
      setJustification('');
      setError('');
    }
  }, [isOpen, inventoryItem]);

  if (!isOpen || !inventoryItem) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuantity === '' || newQuantity < 0) {
      setError('A quantidade deve ser um número válido e maior ou igual a zero.');
      return;
    }
    if (!justification.trim()) {
      setError('A justificativa é obrigatória.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inventoryId: inventoryItem._id,
          newQuantity: Number(newQuantity),
          justification: justification.trim(),
        }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || 'Falha ao ajustar o estoque.');
      }
    } catch (err) {
      setError('Ocorreu um erro inesperado.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">Ajustar Estoque (Auditoria)</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700 text-sm">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Produto</p>
              <p className="font-medium text-slate-900">{inventoryItem.product?.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-slate-500 mb-1">Local</p>
              <p className="font-medium text-slate-900">{inventoryItem.location?.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Qtd. Atual
                </label>
                <input
                  type="number"
                  disabled
                  value={inventoryItem.quantity}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50 text-slate-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nova Qtd. Real <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Justificativa da Diferença <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: Diferença encontrada durante auditoria física..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar Ajuste'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
