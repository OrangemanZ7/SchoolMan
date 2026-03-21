import type {Metadata} from 'next';
import './globals.css';
import AppLayout from '@/components/AppLayout';
import { AuthProvider } from '@/components/AuthProvider';
import { SettingsProvider } from '@/components/SettingsProvider';

export const metadata: Metadata = {
  title: 'EduSupply Chain',
  description: 'Public school supply chain management for meal ingredients and office supplies.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EduSupply',
  },
};

export const viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900" suppressHydrationWarning>
        <AuthProvider>
          <SettingsProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
