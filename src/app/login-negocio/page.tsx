'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginNegocio() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
    } else if (authData.user) {
      // Buscar el slug del local asociado a este usuario
      const { data: localData, error: localError } = await supabase
        .from('locales')
        .select('slug')
        .eq('auth_id', authData.user.id)
        .single();

      if (localData?.slug) {
        router.push(`/${localData.slug}/admin`);
      } else {
        // En caso de que el local todavía no se haya creado (demora del trigger)
        // Se puede hacer un fallback
        router.push(`/pendiente/admin`); 
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex-col gap-xl" style={{ minHeight: 'calc(100vh - 48px)', justifyContent: 'center' }}>
      <div className="flex-col gap-sm" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Iniciar <span className="text-gradient">Sesión</span></h1>
        <p className="text-muted">Accede al panel de administración de tu local.</p>
      </div>

      <div className="glass-card flex-col gap-md">
        <form onSubmit={handleLogin} className="flex-col gap-md">
          {error && <div style={{ color: 'var(--error)', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--border-radius-sm)' }}>{error}</div>}
          
          <div className="flex-col gap-sm">
            <label htmlFor="email">Correo Electrónico</label>
            <input 
              id="email"
              type="email" 
              className="input-glass" 
              placeholder="admin@local.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex-col gap-sm">
            <label htmlFor="password">Contraseña</label>
            <input 
              id="password"
              type="password" 
              className="input-glass" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '16px' }}>
            {loading ? 'Entrando...' : 'Ingresar al Panel'}
          </button>
        </form>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <p className="text-muted">
          ¿No tienes cuenta? <a href="/registro-negocio" className="text-accent">Regístrate como Negocio</a>
        </p>
      </div>
    </div>
  );
}
