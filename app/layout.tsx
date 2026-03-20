import type {Metadata} from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'EduSupply Chain',
  description: 'Public school supply chain management for meal ingredients and office supplies.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-slate-50 text-slate-900" suppressHydrationWarning>
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
