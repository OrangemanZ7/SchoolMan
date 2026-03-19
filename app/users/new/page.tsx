'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'purchaser', 'warehouse', 'dependency']),
  location: z.string().optional(),
}).refine((data) => {
  if ((data.role === 'warehouse' || data.role === 'dependency') && !data.location) {
    return false;
  }
  return true;
}, {
  message: "Location is required for warehouse and dependency roles",
  path: ["location"],
});

type UserFormValues = z.infer<typeof userSchema>;

export default function NewUserPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'dependency',
      location: '',
    },
  });

  const selectedRole = watch('role');
  const needsLocation = selectedRole === 'warehouse' || selectedRole === 'dependency';

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

  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    setError('');
    
    // Clean up location if not needed
    const payload = { ...data };
    if (!needsLocation || !payload.location) {
      delete payload.location;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      router.push('/users');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center text-sm text-slate-500 mb-2 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <Link href="/users">Back to Users</Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Add New User</h1>
          <p className="mt-2 text-slate-600">Create a new user and assign roles and permissions.</p>
        </div>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                {...register('name')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Jane Doe"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="jane.doe@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                {...register('role')}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="admin">Administrator (Full Access)</option>
                <option value="manager">Manager (Approve Orders)</option>
                <option value="purchaser">Purchaser (Create Contracts/Orders)</option>
                <option value="warehouse">Warehouse Staff (Manage Inventory)</option>
                <option value="dependency">Dependency Staff (Request Items)</option>
              </select>
              {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location Assignment</label>
              <select
                {...register('location')}
                disabled={!needsLocation || isLoadingLocations}
                className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">{needsLocation ? 'Select a location...' : 'Global Access (Not Required)'}</option>
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name} ({loc.type})
                  </option>
                ))}
              </select>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
              
              {locations.length === 0 && !isLoadingLocations && needsLocation && (
                <div className="mt-2">
                  <p className="text-xs text-amber-600 mb-2">No locations found. Please seed locations first.</p>
                  <button 
                    type="button" 
                    onClick={async () => {
                      setIsLoadingLocations(true);
                      await fetch('/api/locations/seed', { method: 'POST' });
                      const res = await fetch('/api/locations');
                      if (res.ok) {
                        setLocations(await res.json());
                      }
                      setIsLoadingLocations(false);
                    }}
                    className="px-3 py-1 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded text-xs font-medium transition-colors"
                  >
                    Seed Demo Locations
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/users"
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
                Save User
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
