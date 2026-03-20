'use client';

import Link from 'next/link';
import { 
  LayoutDashboard, 
  Package, 
  FileSignature, 
  ShoppingCart, 
  Truck, 
  MapPin,
  Building2,
  Users,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from './AuthProvider';

const navItems = [
  { name: 'Painel', href: '/', icon: LayoutDashboard },
  { name: 'Estoque', href: '/inventory', icon: Package },
  { name: 'Contratos (Alimentação)', href: '/contracts', icon: FileSignature },
  { name: 'Pedidos de Compra', href: '/orders', icon: ShoppingCart },
  { name: 'Remessas', href: '/shipments', icon: Truck },
  { name: 'Locais', href: '/locations', icon: MapPin },
  { name: 'Fornecedores', href: '/suppliers', icon: Building2 },
  { name: 'Usuários', href: '/users', icon: Users },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-slate-800 px-4">
        <h1 className="text-xl font-bold tracking-tight text-emerald-400">EduSupply Chain</h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-emerald-400" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-slate-800 p-4">
        <Link
          href="/settings"
          className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white mb-2"
        >
          <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-emerald-400" />
          Configurações
        </Link>
        <button
          onClick={logout}
          className="w-full group flex items-center rounded-md px-2 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-red-400" />
          Sair
        </button>
        {user && (
          <div className="mt-4 px-2 text-xs text-slate-500 truncate">
            Conectado como:<br/>
            <span className="text-slate-300 font-medium">{user.email}</span>
          </div>
        )}
      </div>
    </div>
  );
}
