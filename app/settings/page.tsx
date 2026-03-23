'use client';

import { Settings, Save, Loader2, Database, Shield, Plus, Trash2, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettings } from '@/components/SettingsProvider';

interface Role {
  id: string;
  name: string;
}

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const { refreshSettings } = useSettings();

  const pages = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inventory', label: 'Estoque' },
    { id: 'orders', label: 'Pedidos' },
    { id: 'shipments', label: 'Remessas' },
    { id: 'suppliers', label: 'Fornecedores' },
    { id: 'users', label: 'Usuários' },
    { id: 'settings', label: 'Configurações' },
    { id: 'contracts', label: 'Contratos' },
    { id: 'locations', label: 'Locais' },
  ];

  const [settings, setSettings] = useState({
    systemName: 'Prof. João Florentino',
    lowInventoryThreshold: 50,
    enableEmailNotifications: true,
    rolePermissions: {} as Record<string, Record<string, { access: boolean; create: boolean; read: boolean; update: boolean; delete: boolean }>>,
    roles: [] as Role[],
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings({
            systemName: data.systemName || 'Prof. João Florentino',
            lowInventoryThreshold: data.lowInventoryThreshold || 50,
            enableEmailNotifications: data.enableEmailNotifications ?? true,
            rolePermissions: data.rolePermissions || {},
            roles: data.roles || [
              { id: 'admin', name: 'Administrador' },
              { id: 'manager', name: 'Gerente' },
              { id: 'purchaser', name: 'Comprador' },
              { id: 'warehouse', name: 'Almoxarifado' },
              { id: 'dependency', name: 'Dependência' }
            ],
          });
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handlePermissionChange = (role: string, pageId: string, field: string, value: boolean) => {
    setSettings(prev => {
      const newPermissions = { ...prev.rolePermissions };
      if (!newPermissions[role]) newPermissions[role] = {};
      if (!newPermissions[role][pageId]) {
        newPermissions[role][pageId] = { access: false, create: false, read: false, update: false, delete: false };
      }
      
      newPermissions[role][pageId] = {
        ...newPermissions[role][pageId],
        [field]: value
      };
      
      return { ...prev, rolePermissions: newPermissions };
    });
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    
    const newId = newRoleName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Check if role already exists
    if (settings.roles.some(r => r.id === newId)) {
      alert('Uma função com nome similar já existe.');
      return;
    }

    setSettings(prev => ({
      ...prev,
      roles: [...prev.roles, { id: newId, name: newRoleName.trim() }]
    }));
    setNewRoleName('');
    setSelectedRole(newId);
  };

  const handleUpdateRole = () => {
    if (!editingRole || !editingRole.name.trim()) return;
    
    setSettings(prev => ({
      ...prev,
      roles: prev.roles.map(r => r.id === editingRole.id ? { ...r, name: editingRole.name.trim() } : r)
    }));
    setEditingRole(null);
  };

  const handleDeleteRole = (roleId: string) => {
    if (roleId === 'admin') {
      alert('A função de Administrador não pode ser excluída.');
      return;
    }
    
    if (confirm('Tem certeza que deseja excluir esta função? As permissões associadas também serão removidas.')) {
      setSettings(prev => {
        const newRoles = prev.roles.filter(r => r.id !== roleId);
        const newPermissions = { ...prev.rolePermissions };
        delete newPermissions[roleId];
        
        return {
          ...prev,
          roles: newRoles,
          rolePermissions: newPermissions
        };
      });
      
      if (selectedRole === roleId) {
        setSelectedRole('admin');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSuccess(true);
        refreshSettings();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Falha ao salvar configurações');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Falha ao salvar configurações');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8 flex items-center gap-3">
        <Settings className="h-8 w-8 text-slate-700" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="mt-2 text-slate-600">Gerencie a configuração e preferências do aplicativo.</p>
        </div>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`${activeTab === 'general' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-900 hover:bg-slate-50 hover:text-slate-900'} w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
            >
              <Settings className={`${activeTab === 'general' ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-500'} flex-shrink-0 -ml-1 mr-3 h-5 w-5`} />
              <span className="truncate">Geral</span>
            </button>
            <button 
              onClick={() => setActiveTab('database')}
              className={`${activeTab === 'database' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-900 hover:bg-slate-50 hover:text-slate-900'} w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
            >
              <Database className={`${activeTab === 'database' ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-500'} flex-shrink-0 -ml-1 mr-3 h-5 w-5`} />
              <span className="truncate">Banco de Dados</span>
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`${activeTab === 'security' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-900 hover:bg-slate-50 hover:text-slate-900'} w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
            >
              <Shield className={`${activeTab === 'security' ? 'text-emerald-500' : 'text-slate-400 group-hover:text-slate-500'} flex-shrink-0 -ml-1 mr-3 h-5 w-5`} />
              <span className="truncate">Segurança</span>
            </button>
          </nav>
        </div>

        <div className="md:col-span-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-500 bg-white shadow-sm rounded-xl border border-slate-200">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              Carregando configurações...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-6 space-y-6">
              {activeTab === 'general' && (
                <>
                  <div>
                    <h2 className="text-lg font-medium leading-6 text-slate-900">Configurações Gerais</h2>
                    <p className="mt-1 text-sm text-slate-500">Atualize a configuração básica do sistema.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label htmlFor="systemName" className="block text-sm font-medium text-slate-700">
                        Nome do Sistema
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
                        Limite de Alerta de Estoque Baixo
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
                          unidades
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">Alertas serão mostrados quando o estoque cair abaixo deste número.</p>
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
                          Notificações por E-mail
                        </label>
                        <p className="text-slate-500">Receba alertas de estoque baixo e novos pedidos.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'database' && (
                <div>
                  <h2 className="text-lg font-medium leading-6 text-slate-900">Banco de Dados</h2>
                  <p className="mt-1 text-sm text-slate-500">Configurações de banco de dados não estão disponíveis nesta visualização.</p>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-medium leading-6 text-slate-900">Segurança e Permissões</h2>
                    <p className="mt-1 text-sm text-slate-500">Gerencie o acesso às páginas e operações CRUD por função.</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-medium text-slate-900 mb-4">Gerenciar Funções</h3>
                    
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        placeholder="Nome da nova função"
                        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddRole}
                        disabled={!newRoleName.trim()}
                        className="inline-flex items-center rounded-md border border-transparent bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </button>
                    </div>

                    <div className="space-y-2">
                      {settings.roles.map(role => (
                        <div key={role.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
                          {editingRole?.id === role.id ? (
                            <div className="flex flex-1 gap-2 mr-2">
                              <input
                                type="text"
                                value={editingRole.name}
                                onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                                className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={handleUpdateRole}
                                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium px-2"
                              >
                                Salvar
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingRole(null)}
                                className="text-slate-500 hover:text-slate-700 text-sm font-medium px-2"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-medium text-slate-700">{role.name}</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingRole(role)}
                                  className="p-1 text-slate-400 hover:text-emerald-600 rounded"
                                  title="Editar"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                {role.id !== 'admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRole(role.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200">
                    <label htmlFor="role-select" className="block text-sm font-medium text-slate-700 mb-2">Configurar Permissões para:</label>
                    <select
                      id="role-select"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="block w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    >
                      {settings.roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Página</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Acesso</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Criar</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Ler</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Atualizar</th>
                          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Deletar</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {pages.map((page) => {
                          const perms = settings.rolePermissions?.[selectedRole]?.[page.id] || { access: false, create: false, read: false, update: false, delete: false };
                          return (
                            <tr key={page.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{page.label}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.access}
                                  onChange={(e) => handlePermissionChange(selectedRole, page.id, 'access', e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.create}
                                  onChange={(e) => handlePermissionChange(selectedRole, page.id, 'create', e.target.checked)}
                                  disabled={!perms.access}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.read}
                                  onChange={(e) => handlePermissionChange(selectedRole, page.id, 'read', e.target.checked)}
                                  disabled={!perms.access}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.update}
                                  onChange={(e) => handlePermissionChange(selectedRole, page.id, 'update', e.target.checked)}
                                  disabled={!perms.access}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.delete}
                                  onChange={(e) => handlePermissionChange(selectedRole, page.id, 'delete', e.target.checked)}
                                  disabled={!perms.access}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-4 border-t border-slate-200">
              {success && (
                <span className="text-sm text-emerald-600 flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Configurações salvas
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
          )}
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
