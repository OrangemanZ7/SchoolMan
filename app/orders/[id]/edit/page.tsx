'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

const orderSchema = z.object({
  type: z.enum(['contract', 'inquiry']),
  contract: z.string().optional(),
  supplierName: z.string().optional(),
  expectedDelivery: z.string().optional(),
  items: z.array(
    z.object({
      product: z.string().min(1, 'Produto é obrigatório'),
      quantity: z.number().min(1, 'A quantidade deve ser pelo menos 1'),
      pricePerUnit: z.number().min(0.01, 'O preço deve ser maior que 0'),
    })
  ).min(1, 'Pelo menos um item é obrigatório'),
}).superRefine((data, ctx) => {
  if (data.type === 'contract' && !data.contract) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Contrato é obrigatório para pedidos de contrato',
      path: ['contract'],
    });
  }
  if (data.type === 'inquiry' && !data.supplierName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Nome do fornecedor é obrigatório para pedidos avulsos',
      path: ['supplierName'],
    });
  }
});

type OrderFormValues = z.infer<typeof orderSchema>;

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [contracts, setContracts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<any>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      type: 'contract',
      contract: '',
      supplierName: '',
      expectedDelivery: '',
      items: [{ product: '', quantity: 1, pricePerUnit: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedType = watch('type');
  const selectedContractId = watch('contract');

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders`);
        if (res.ok) {
          const data = await res.json();
          const order = data.find((o: any) => o._id === orderId);
          if (order) {
            if (order.status !== 'pending') {
              router.push('/orders');
              return;
            }
            setOrderData(order);
            reset({
              type: order.type,
              contract: order.contract?._id || '',
              supplierName: order.supplierName || '',
              expectedDelivery: order.expectedDelivery ? new Date(order.expectedDelivery).toISOString().split('T')[0] : '',
              items: order.items.map((item: any) => ({
                product: item.product._id || item.product,
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
              })),
            });
          } else {
            setError('Pedido não encontrado');
          }
        }
      } catch (err) {
        console.error('Failed to fetch order', err);
        setError('Falha ao carregar o pedido');
      } finally {
        setIsLoadingOrder(false);
      }
    }
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, reset, router]);

  useEffect(() => {
    async function fetchContracts() {
      try {
        const res = await fetch('/api/contracts');
        if (res.ok) {
          const data = await res.json();
          setContracts(data);
        }
      } catch (err) {
        console.error('Failed to fetch contracts', err);
      } finally {
        setIsLoadingContracts(false);
      }
    }
    fetchContracts();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoadingProducts(true);
      try {
        const category = selectedType === 'contract' ? 'meal' : 'office';
        const res = await fetch(`/api/products?category=${category}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [selectedType]);

  const selectedContract = contracts.find(c => c._id === selectedContractId);
  const availableProducts = selectedType === 'contract' && selectedContract
    ? selectedContract.items.map((item: any) => ({
        ...item.product,
        contractPrice: item.pricePerUnit,
        maxQuantity: item.maxQuantity,
        purchasedQuantity: item.purchasedQuantity
      }))
    : products;

  const handleProductChange = (index: number, productId: string) => {
    if (selectedType === 'contract' && selectedContract) {
      const contractItem = availableProducts.find((p: any) => p._id === productId);
      if (contractItem) {
        setValue(`items.${index}.pricePerUnit`, contractItem.contractPrice);
      }
    }
  };

  const onSubmit = async (data: OrderFormValues) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: data.items }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao atualizar pedido');
      }

      router.push('/orders');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (isLoadingOrder) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        Carregando pedido...
      </div>
    );
  }

  if (error && !orderData) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
        <Link href="/orders" className="text-emerald-600 hover:underline">Voltar para Pedidos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-2 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <Link href="/orders">Voltar para Pedidos</Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Editar Pedido de Compra</h1>
          <p className="mt-2 text-slate-600">Altere os itens do pedido {orderData?.orderNumber}.</p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Order Details (Read-only for edit, except maybe expected delivery, but let's keep it simple and only allow items edit) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Detalhes do Pedido</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Pedido</label>
              <input
                type="text"
                value={orderData?.type === 'contract' ? 'Contrato de Alimentação' : 'Pedido Avulso de Escritório'}
                className="w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50 text-slate-500"
                readOnly
              />
            </div>

            {orderData?.type === 'contract' ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contrato</label>
                <input
                  type="text"
                  value={orderData?.contract?.contractNumber || 'N/A'}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50 text-slate-500"
                  readOnly
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Fornecedor</label>
                <input
                  type="text"
                  value={orderData?.supplierName || 'N/A'}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 bg-slate-50 text-slate-500"
                  readOnly
                />
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Itens do Pedido</h2>
            <button
              type="button"
              onClick={() => append({ product: '', quantity: 1, pricePerUnit: 0 })}
              className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Item
            </button>
          </div>

          {errors.items?.root && (
            <p className="mb-4 text-sm text-red-600">{errors.items.root.message}</p>
          )}

          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Carregando produtos...
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Produto</label>
                      <select
                        {...register(`items.${index}.product`)}
                        onChange={(e) => {
                          register(`items.${index}.product`).onChange(e);
                          handleProductChange(index, e.target.value);
                        }}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">Selecione um produto...</option>
                        {availableProducts.map((p: any) => (
                          <option key={p._id} value={p._id}>
                            {p.name} {p.brand ? `(${p.brand})` : ''} - {p.unit}
                          </option>
                        ))}
                      </select>
                      {errors.items?.[index]?.product && (
                        <p className="mt-1 text-xs text-red-600">{errors.items[index]?.product?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Quantidade</label>
                      <input
                        type="number"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="mt-1 text-xs text-red-600">{errors.items[index]?.quantity?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Preço por Unidade (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.pricePerUnit`, { valueAsNumber: true })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        readOnly={selectedType === 'contract'}
                      />
                      {errors.items?.[index]?.pricePerUnit && (
                        <p className="mt-1 text-xs text-red-600">{errors.items[index]?.pricePerUnit?.message}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="mt-6 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                    title="Remover item"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/orders"
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
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
