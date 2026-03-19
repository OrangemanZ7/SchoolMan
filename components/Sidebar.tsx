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
  Settings
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Contracts (Meals)', href: '/contracts', icon: FileSignature },
  { name: 'Purchase Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Shipments', href: '/shipments', icon: Truck },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Suppliers', href: '/suppliers', icon: Building2 },
  { name: 'Users', href: '/users', icon: Users },
];

export default function Sidebar() {
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
          className="group flex items-center rounded-md px-2 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-emerald-400" />
          Settings
        </Link>
      </div>
    </div>
  );
}
