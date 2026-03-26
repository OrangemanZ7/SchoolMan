'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
  LogOut,
  X,
  ClipboardList,
  Utensils
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useSettings } from './SettingsProvider';

const navItems = [
  { name: 'Painel', href: '/', icon: LayoutDashboard },
  { name: 'Cardápios', href: '/recipes', icon: Utensils },
  { name: 'Estoque', href: '/inventory', icon: Package },
  { name: 'Consumo', href: '/consumption', icon: ClipboardList },
  { name: 'Contratos (Alimentação)', href: '/contracts', icon: FileSignature },
  { name: 'Pedidos de Compra', href: '/orders', icon: ShoppingCart },
  { name: 'Remessas', href: '/shipments', icon: Truck },
  { name: 'Locais', href: '/locations', icon: MapPin },
  { name: 'Fornecedores', href: '/suppliers', icon: Building2 },
  { name: 'Usuários', href: '/users', icon: Users },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white shadow-xl">
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white">
            <Image 
              src="/logo.png" 
              alt="Logo" 
              fill 
              sizes="32px"
              className="object-cover"
              onError={(e) => {
                // Fallback if image is not uploaded yet
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-sm font-bold tracking-tight text-emerald-400 leading-tight">
            {settings.systemName || 'Prof. João Florentino'}
          </h1>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md transition-colors">
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                }`} />
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
