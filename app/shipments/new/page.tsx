'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const shipmentSchema = z.object({
  fromLocation: z.string().min(1, 'Origin is required'),
  toLocation: z.string().min(1, 'Destination is required'),
  items: z.array(
    z.object({
      product: z.string().min(1, 'Product is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
    })
  ).min(1, 'At least one item is required'),
}).refine((data) => data.fromLocation !== data.toLocation, {
  message: "Origin and destination cannot be the same",
  path: ["toLocation"],
});

type ShipmentFormValues = z.infer<typeof shipmentSchema>;

export default function NewShipmentPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ShipmentFormValues>({
    resolver: zodResolver(shipmentSchema),
    defaultValues: {
      fromLocation: '',
      toLocation: '',
      items: [{ product: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const selectedFromLocation = watch('fromLocation');

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch('/api/locations');
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
        }
      } catch (err) {
        console.error('Failed to fetch locations', err);
      } finally {
        setIsLoadingLocations(false);
      }
    }
    fetchLocations();
  }, []);

  useEffect(() => {
    async function fetchInventory() {
      if (!selectedFromLocation) {
        setInventory([]);
        return;
      }
      setIsLoadingInventory(true);
      try {
        const res = await fetch(`/api/inventory?location=${selectedFromLocation}`);
        if (res.ok) {
          const data = await res.json();
          setInventory(data);
        }
      } catch (err) {
        console.error('Failed to fetch inventory', err);
      } finally {
        setIsLoadingInventory(false);
      }
    }
    fetchInventory();
  }, [selectedFromLocation]);

  const onSubmit = async (data: ShipmentFormValues) => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create shipment');
      }

      router.push('/shipments');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const getAvailableQuantity = (productId: string) => {
    const item = inventory.find(i => i.product?._id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-2 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <Link href="/shipments">Back to Shipments</Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">New Shipment</h1>
          <p className="mt-2 text-slate-600">Transfer inventory from one location to another.</p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Shipment Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Shipment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">From Location</label>
              <select
                {...register('fromLocation')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                disabled={isLoadingLocations}
              >
                <option value="">Select origin...</option>
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
              {errors.fromLocation && <p className="mt-1 text-sm text-red-600">{errors.fromLocation.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To Location</label>
              <select
                {...register('toLocation')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                disabled={isLoadingLocations}
              >
                <option value="">Select destination...</option>
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
              {errors.toLocation && <p className="mt-1 text-sm text-red-600">{errors.toLocation.message}</p>}
            </div>
          </div>
        </div>

        {/* Shipment Items */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Items to Ship</h2>
            <button
              type="button"
              onClick={() => append({ product: '', quantity: 1 })}
              disabled={!selectedFromLocation}
              className="flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-emerald-50 disabled:hover:text-emerald-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </button>
          </div>

          {!selectedFromLocation && (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-sm mb-4">
              Please select an origin location first to view available inventory.
            </div>
          )}

          {errors.items?.root && (
            <p className="mb-4 text-sm text-red-600">{errors.items.root.message}</p>
          )}

          {isLoadingInventory ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading inventory...
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => {
                const selectedProductId = watch(`items.${index}.product`);
                const availableQty = selectedProductId ? getAvailableQuantity(selectedProductId) : 0;
                
                return (
                  <div key={field.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Product</label>
                        <select
                          {...register(`items.${index}.product`)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          disabled={!selectedFromLocation}
                        >
                          <option value="">Select a product...</option>
                          {inventory.map((inv: any) => (
                            <option key={inv.product._id} value={inv.product._id} disabled={inv.quantity <= 0}>
                              {inv.product.name} ({inv.quantity} {inv.product.unit} available)
                            </option>
                          ))}
                        </select>
                        {errors.items?.[index]?.product && (
                          <p className="mt-1 text-xs text-red-600">{errors.items[index]?.product?.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wider">Quantity</label>
                        <div className="relative">
                          <input
                            type="number"
                            {...register(`items.${index}.quantity`, { 
                              valueAsNumber: true,
                              max: { value: availableQty, message: `Max available is ${availableQty}` }
                            })}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            disabled={!selectedFromLocation || !selectedProductId}
                          />
                          {selectedProductId && (
                            <div className="absolute right-3 top-2.5 text-xs text-slate-400">
                              / {availableQty}
                            </div>
                          )}
                        </div>
                        {errors.items?.[index]?.quantity && (
                          <p className="mt-1 text-xs text-red-600">{errors.items[index]?.quantity?.message}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="mt-6 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      title="Remove item"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/shipments"
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !selectedFromLocation}
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
                Create Shipment
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
