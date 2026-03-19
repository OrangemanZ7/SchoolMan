'use client';

import { Settings, Save, Loader2, Database, Shield } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // In a real app, these would be fetched from an API
  const [settings, setSettings] = useState({
    systemName: 'EduSupply Chain',
    lowInventoryThreshold: 50,
    enableEmailNotifications: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setSuccess(true);
    
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8 flex items-center gap-3">
        <Settings className="h-8 w-8 text-slate-700" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="mt-2 text-slate-600">Manage application configuration and preferences.</p>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <nav className="space-y-1">
            <a href="#" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-700 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <Settings className="text-emerald-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              <span className="truncate">General</span>
            </a>
            <a href="#" className="text-slate-900 hover:bg-slate-50 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <Database className="text-slate-400 group-hover:text-slate-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              <span className="truncate">Database</span>
            </a>
            <a href="#" className="text-slate-900 hover:bg-slate-50 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
              <Shield className="text-slate-400 group-hover:text-slate-500 flex-shrink-0 -ml-1 mr-3 h-5 w-5" />
              <span className="truncate">Security</span>
            </a>
          </nav>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium leading-6 text-slate-900">General Settings</h2>
                <p className="mt-1 text-sm text-slate-500">Update your basic system configuration.</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="systemName" className="block text-sm font-medium text-slate-700">
                    System Name
                  </label>
                  <input
                    type="text"
                    name="systemName"
                    id="systemName"
                    value={settings.systemName}
                    onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="lowInventoryThreshold" className="block text-sm font-medium text-slate-700">
                    Low Inventory Alert Threshold
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      name="lowInventoryThreshold"
                      id="lowInventoryThreshold"
                      value={settings.lowInventoryThreshold}
                      onChange={(e) => setSettings({ ...settings, lowInventoryThreshold: parseInt(e.target.value) || 0 })}
                      className="block w-full rounded-none rounded-l-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    />
                    <span className="inline-flex items-center rounded-r-md border border-l-0 border-slate-300 bg-slate-50 px-3 text-slate-500 sm:text-sm">
                      units
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Alerts will be shown when inventory falls below this number.</p>
                </div>

                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="enableEmailNotifications"
                      name="enableEmailNotifications"
                      type="checkbox"
                      checked={settings.enableEmailNotifications}
                      onChange={(e) => setSettings({ ...settings, enableEmailNotifications: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="enableEmailNotifications" className="font-medium text-slate-700">
                      Email Notifications
                    </label>
                    <p className="text-slate-500">Receive alerts for low inventory and new orders.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-4 border-t border-slate-200">
              {success && (
                <span className="text-sm text-emerald-600 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Settings saved
                </span>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center rounded-md border border-transparent bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Helper component for the success icon since it's not imported at the top
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
