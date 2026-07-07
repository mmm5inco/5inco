import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // Descomentar para habilitar protección de ruta real
  // if (!session) {
  //   redirect('/login-negocio');
  // }

  return (
    <div style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <header className="flex-between glass-panel" style={{ padding: '16px', marginBottom: '24px' }}>
        <div>
          <h2 className="text-gradient" style={{ margin: 0 }}>Panel Admin</h2>
          <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>Gestión de 5inco</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="/" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Salir</a>
        </div>
      </header>
      {children}
    </div>
  );
}
