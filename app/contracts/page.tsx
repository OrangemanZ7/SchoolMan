'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { Plus, FileSignature, Loader2, Calendar, ChevronDown, ChevronUp, Package } from 'lucide-react';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);

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
        setIsLoading(false);
      }
    }
    fetchContracts();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedContractId(prev => prev === id ? null : id);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meal Contracts</h1>
          <p className="mt-2 text-slate-600">Manage public contracts, values, and purchase limits for meal ingredients.</p>
        </div>
        <Link
          href="/contracts/new"
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Contract
        </Link>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            Loading contracts...
          </div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <FileSignature className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">No contracts found</p>
            <p className="mt-1">Get started by creating a new meal contract.</p>
            <Link
              href="/contracts/new"
              className="mt-6 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 font-medium transition-colors"
            >
              Create Contract
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium w-10"></th>
                  <th className="px-6 py-4 font-medium">Contract Number</th>
                  <th className="px-6 py-4 font-medium">Supplier</th>
                  <th className="px-6 py-4 font-medium">Validity</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {contracts.map((contract) => (
                  <Fragment key={contract._id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleExpand(contract._id)}
                          className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                        >
                          {expandedContractId === contract._id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{contract.contractNumber}</td>
                      <td className="px-6 py-4">{contract.supplier?.alias || contract.supplierName || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          Until {new Date(contract.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${contract.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 
                            contract.status === 'expired' ? 'bg-red-100 text-red-800' : 
                            'bg-amber-100 text-amber-800'}`}>
                          {contract.status}
                        </span>
                      </td>
                    </tr>
                    {expandedContractId === contract._id && (
                      <tr className="bg-slate-50">
                        <td colSpan={5} className="px-6 py-4 border-b border-slate-200">
                          <div className="pl-12 pr-4 py-2">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                              <Package className="h-4 w-4 mr-2 text-slate-500" />
                              Contracted Products
                            </h4>
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                              <table className="w-full text-left text-sm text-slate-600">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                                  <tr>
                                    <th className="px-4 py-3 font-medium">Product</th>
                                    <th className="px-4 py-3 font-medium">Brand</th>
                                    <th className="px-4 py-3 font-medium">Unit</th>
                                    <th className="px-4 py-3 font-medium">Price/Unit</th>
                                    <th className="px-4 py-3 font-medium">Max Qty</th>
                                    <th className="px-4 py-3 font-medium">Purchased</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {contract.items.map((item: any, index: number) => (
                                    <tr key={index} className="hover:bg-slate-50">
                                      <td className="px-4 py-3 font-medium text-slate-900">{item.product?.name || 'Unknown'}</td>
                                      <td className="px-4 py-3">{item.product?.brand || '-'}</td>
                                      <td className="px-4 py-3">{item.product?.unit || '-'}</td>
                                      <td className="px-4 py-3">${item.pricePerUnit?.toFixed(2) || '0.00'}</td>
                                      <td className="px-4 py-3">{item.maxQuantity || 0}</td>
                                      <td className="px-4 py-3">{item.purchasedQuantity || 0}</td>
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
    </div>
  );
}
