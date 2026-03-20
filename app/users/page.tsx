'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, Loader2, Shield, MapPin, Mail, Edit, Trash2, Phone, Hash } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setIsDeleting(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Failed to delete user', err);
      alert('An error occurred while deleting the user');
    } finally {
      setIsDeleting(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'purchaser': return 'bg-emerald-100 text-emerald-800';
      case 'warehouse': return 'bg-amber-100 text-amber-800';
      case 'dependency': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Users & Roles</h1>
          <p className="mt-2 text-slate-600">Manage system access, roles, and location assignments.</p>
        </div>
        <Link
          href="/users/new"
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add User
        </Link>
      </header>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Users className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-900">No users found</p>
            <p className="mt-1">Get started by adding a new user to the system.</p>
            <Link
              href="/users/new"
              className="mt-6 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 font-medium transition-colors"
            >
              Add User
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Employee #</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Location</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                    <td className="px-6 py-4">
                      {user.employeeNumber ? (
                        <div className="flex items-center text-slate-500">
                          <Hash className="h-4 w-4 mr-2" />
                          {user.employeeNumber}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1 text-slate-500">
                        <a 
                          href={`mailto:${user.email}`}
                          className="flex items-center hover:text-emerald-600 transition-colors"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {user.email}
                        </a>
                        {user.cellPhone && (
                          <a 
                            href={`https://wa.me/55${user.cellPhone.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center hover:text-emerald-600 transition-colors"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            {formatPhoneNumber(user.cellPhone)}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.location ? (
                        <div className="flex items-center text-slate-600">
                          <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                          {user.location.name}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Global Access</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/users/${user._id}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(user._id)}
                          disabled={isDeleting === user._id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          title="Delete User"
                        >
                          {isDeleting === user._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
