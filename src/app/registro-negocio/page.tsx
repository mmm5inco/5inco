'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import AgencyFooter from '@/components/AgencyFooter';

export default function RegistroNegocio() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email || !password || !nombre) {
      setError('Por favor completa todos los campos.');
      setLoading(false);
      return;
    }
    if (!acceptedTerms) {
      setError('Debes aceptar los Términos y Condiciones para registrarte.');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const slug = (nombre + '-' + ubicacion)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita tildes
      .replace(/[^a-z0-9]+/g, '-') // reemplaza espacios/símbolos por guiones
      .replace(/^-+|-+$/g, ''); // quita guiones en los extremos

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          ubicacion,
          slug,
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('¡Registro exitoso! Por favor revisa tu correo electrónico para verificar tu cuenta (o inicia sesión si tienes desactivada la confirmación por email en Supabase).');
      // Redirigir al panel de administración o inicio de sesión después de unos segundos
      setTimeout(() => {
        router.push('/login-negocio');
      }, 4000);
    }
    setLoading(false);
  };

  return (
    <div className="flex-col gap-xl" style={{ minHeight: 'calc(100vh - 48px)', justifyContent: 'center' }}>
      <div className="flex-col gap-sm" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Registro de <span className="text-gradient">Negocio</span></h1>
        <p className="text-muted">Da de alta tu local y elimina las filas hoy mismo.</p>
      </div>

      <div className="glass-card flex-col gap-md">
        <form onSubmit={handleRegister} className="flex-col gap-md">
          {error && <div style={{ color: 'var(--error)', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--border-radius-sm)' }}>{error}</div>}
          {success && <div style={{ color: 'var(--success)', padding: '10px', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--border-radius-sm)' }}>{success}</div>}
          
          <div className="flex-col gap-sm">
            <label htmlFor="nombre">Nombre del Local</label>
            <input 
              id="nombre"
              type="text" 
              className="input-glass" 
              placeholder="Ej: La Anónima"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="flex-col gap-sm">
            <label htmlFor="ubicacion">Sucursal / Ubicación</label>
            <input 
              id="ubicacion"
              type="text" 
              className="input-glass" 
              placeholder="Ej: Olascoaga 205"
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              required
            />
          </div>

          <div className="flex-col gap-sm">
            <label htmlFor="email">Correo Electrónico Administrador</label>
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
            <label htmlFor="password">Contraseña (Mínimo 6 caracteres)</label>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <input 
              type="checkbox" 
              id="terms" 
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
            />
            <label htmlFor="terms" style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              Acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-accent">Términos y Condiciones</a>
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '16px' }}>
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <p className="text-muted">
          ¿Ya tienes cuenta? <a href="/login-negocio" className="text-accent">Inicia Sesión</a>
        </p>
      </div>
      <AgencyFooter />
    </div>
  );
}
