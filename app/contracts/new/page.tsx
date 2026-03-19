'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, Save, Loader2, Calculator } from 'lucide-react';
import Link from 'next/link';

const contractSchema = z.object({
  contractNumber: z.string().min(1, 'Contract number is required'),
  supplier: z.string().min(1, 'Supplier is required'),
  validFrom: z.string().min(1, 'Start date is required'),
  validUntil: z.string().min(1, 'End date is required'),
  items: z.array(
    z.object({
      name: z.string().min(1, 'Product name is required'),
      brand: z.string().optional(),
      category: z.enum(['meal', 'office']),
      unit: z.string().min(1, 'Unit is required'),
      pricePerUnit: z.number().min(0.01, 'Price must be greater than 0'),
      maxQuantity: z.number().min(1, 'Quantity must be at least 1'),
    })
  ).min(1, 'At least one item is required'),
}).refine((data) => new Date(data.validFrom) <= new Date(data.validUntil), {
  message: "End date cannot be before start date",
  path: ["validUntil"],
});

type ContractFormValues = z.infer<typeof contractSchema>;

export default function NewContractPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      contractNumber: '',
      supplier: '',
      validFrom: '',
      validUntil: '',
      items: [{ name: '', brand: '', category: 'meal', unit: '', pricePerUnit: 0, maxQuantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const grandTotal = watchItems.reduce((sum, item) => {
    return sum + ((item.pricePerUnit || 0) * (item.maxQuantity || 0));
  }, 0);

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
        setIsLoadingSuppliers(false);
      }
    }
    fetchSuppliers();
  }, []);

  const onSubmit = async (data: ContractFormValues) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create contract');
      }

      router.push('/contracts');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-2 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <Link href="/contracts">Back to Contracts</Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">New Meal Contract</h1>
          <p className="mt-2 text-slate-600">Create a new public contract for meal ingredients.</p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Contract Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Contract Details</h2>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
              <Calculator className="h-5 w-5" />
              <span className="font-medium">Total Value:</span>
              <span className="text-lg font-bold">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contract Number</label>
              <input
                {...register('contractNumber')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. CTR-2026-001"
              />
              {errors.contractNumber && <p className="mt-1 text-sm text-red-600">{errors.contractNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
              <select
                {...register('supplier')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                disabled={isLoadingSuppliers}
              >
                <option value="">Select a supplier...</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.alias} ({s.document})
                  </option>
                ))}
              </select>
              {errors.supplier && <p className="mt-1 text-sm text-red-600">{errors.supplier.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valid From</label>
              <input
                type="date"
                {...register('validFrom')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.validFrom && <p className="mt-1 text-sm text-red-600">{errors.validFrom.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valid Until</label>
              <input
                type="date"
                {...register('validUntil')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {errors.validUntil && <p className="mt-1 text-sm text-red-600">{errors.validUntil.message}</p>}
            </div>
          </div>
        </div>

        {/* Contract Items */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Contracted Items</h2>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  append({ name: '', brand: '', category: 'meal', unit: '', pricePerUnit: 0, maxQuantity: 1 });
                }}
                className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item Row
              </button>
            </div>
          </div>

          {errors.items?.root && (
            <p className="mb-4 text-sm text-red-600">{errors.items.root.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => {
              const itemPrice = watchItems[index]?.pricePerUnit || 0;
              const itemQty = watchItems[index]?.maxQuantity || 0;
              const subTotal = itemPrice * itemQty;

              return (
                <div key={field.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Product Name</label>
                      <input
                        type="text"
                        {...register(`items.${index}.name`)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        placeholder="e.g. Rice"
                      />
                      {errors.items?.[index]?.name && (
                        <p className="mt-1 text-xs text-red-600">{errors.items[index]?.name?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Brand</label>
                      <input
                        type="text"
                        {...register(`items.${index}.brand`)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        placeholder="e.g. Uncle Ben's"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Category</label>
                      <select
                        {...register(`items.${index}.category`)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="meal">Meal</option>
                        <option value="office">Office</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Unit</label>
                      <input
                        type="text"
                        {...register(`items.${index}.unit`)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                        placeholder="e.g. kg, box"
                      />
                      {errors.items?.[index]?.unit && (
                        <p className="mt-1 text-xs text-red-600">{errors.items[index]?.unit?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.pricePerUnit`, { valueAsNumber: true })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {errors.items?.[index]?.pricePerUnit && (
                        <p className="mt-1 text-xs text-red-600">{errors.items[index]?.pricePerUnit?.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Quantity</label>
                      <input
                        type="number"
                        {...register(`items.${index}.maxQuantity`, { valueAsNumber: true })}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {errors.items?.[index]?.maxQuantity && (
                        <p className="mt-1 text-xs text-red-600">{errors.items[index]?.maxQuantity?.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch pt-6">
                    <div className="text-right mb-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sub-total</p>
                      <p className="text-sm font-semibold text-slate-900">${subTotal.toFixed(2)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      title="Remove item"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/contracts"
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Contract
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
