import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import SplashScreen from '@/components/SplashScreen';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: '5inco - Adiós a las colas',
  description: 'Pide tu turno digital, gana puntos y no esperes nunca más en la fila.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable}`}>
        <SplashScreen />
        <main className="container fade-in">
          {children}
        </main>
      </body>
    </html>
  );
}
