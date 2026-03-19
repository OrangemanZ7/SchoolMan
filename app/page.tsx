'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Database, Package, Truck, ShoppingCart, FileText, Loader2, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasMongoUri = true; // Assuming it's set if we are here, or we can check via an API

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Overview of the public school supply chain network.</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin mr-3" />
          Loading dashboard...
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center text-slate-500 mb-4">
                <FileText className="h-5 w-5 mr-2 text-indigo-500" />
                <h3 className="text-sm font-medium uppercase tracking-wider">Active Contracts</h3>
              </div>
              <div>
                <p className="text-3xl font-semibold text-slate-900">{stats?.activeContractsCount || 0}</p>
                <p className="mt-1 text-sm text-slate-500">Meal supplies</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center text-slate-500 mb-4">
                <ShoppingCart className="h-5 w-5 mr-2 text-amber-500" />
                <h3 className="text-sm font-medium uppercase tracking-wider">Pending Orders</h3>
              </div>
              <div>
                <p className="text-3xl font-semibold text-slate-900">{stats?.pendingOrdersCount || 0}</p>
                <p className="mt-1 text-sm text-slate-500">Awaiting delivery</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center text-slate-500 mb-4">
                <Truck className="h-5 w-5 mr-2 text-blue-500" />
                <h3 className="text-sm font-medium uppercase tracking-wider">Active Shipments</h3>
              </div>
              <div>
                <p className="text-3xl font-semibold text-slate-900">{stats?.activeShipmentsCount || 0}</p>
                <p className="mt-1 text-sm text-slate-500">In transit</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center text-slate-500 mb-4">
                <Database className="h-5 w-5 mr-2 text-emerald-500" />
                <h3 className="text-sm font-medium uppercase tracking-wider">Database Status</h3>
              </div>
              <div>
                <p className="text-2xl font-semibold text-emerald-600">Connected</p>
                <p className="mt-1 text-sm text-slate-500">MongoDB Atlas</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Recent Shipments</h2>
                <Link href="/shipments" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                  View all
                </Link>
              </div>
              
              {stats?.recentShipments?.length > 0 ? (
                <div className="space-y-4 flex-1">
                  {stats.recentShipments.map((shipment: any) => (
                    <div key={shipment._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-medium text-slate-900">{shipment.shipmentNumber}</p>
                        <div className="flex items-center text-xs text-slate-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {shipment.fromLocation?.name} → {shipment.toLocation?.name}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        shipment.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                        shipment.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {shipment.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <Truck className="h-8 w-8 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-900">No recent shipments</p>
                  <p className="text-xs text-slate-500 mt-1">Shipments will appear here once created.</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Low Inventory Alerts</h2>
                <Link href="/inventory" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                  Manage inventory
                </Link>
              </div>
              
              {stats?.lowInventory?.length > 0 ? (
                <div className="space-y-4 flex-1">
                  {stats.lowInventory.map((item: any) => (
                    <div key={item._id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">{item.product?.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{item.location?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-red-600">{item.quantity}</p>
                        <p className="text-xs text-slate-500">{item.product?.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <Package className="h-8 w-8 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-900">Inventory levels look good</p>
                  <p className="text-xs text-slate-500 mt-1">No items are currently running low.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
