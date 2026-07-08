'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import AgencyFooter from '@/components/AgencyFooter';

export default function CEODashboard() {
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [locales, setLocales] = useState<any[]>([]);
  const [metricas, setMetricas] = useState({
    totalLocales: 0,
    enPrueba: 0,
    activos: 0,
    vencidos: 0,
    mrr: 0,
    totalTurnos: 0
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    
    if (res.ok) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      setError('Clave incorrecta');
    }
  };

  const fetchData = async () => {
    const res = await fetch('/api/admin/locales');
    if (!res.ok) {
      if (res.status === 401) setIsAuthenticated(false);
      return;
    }
    const data = await res.json();
    
    if (data.locales) {
      setLocales(data.locales);
      
      let activos = 0;
      let enPrueba = 0;
      let vencidos = 0;

      data.locales.forEach((l: any) => {
        if (l.estado_suscripcion === 'activa') activos++;
        else if (l.estado_suscripcion === 'prueba') enPrueba++;
        else if (l.estado_suscripcion === 'vencida') vencidos++;
      });

      setMetricas({
        totalLocales: data.locales.length,
        activos,
        enPrueba,
        vencidos,
        mrr: activos * 45000,
        totalTurnos: data.turnos || 0
      });
    }
  };

  const toggleEstado = async (id: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === 'vencida' ? 'activa' : 'vencida';
    await fetch('/api/admin/locales', {
      method: 'POST',
      body: JSON.stringify({ id, estado_suscripcion: nuevoEstado })
    });
    fetchData(); // Refrescar
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <form onSubmit={handleLogin} className="flex-col gap-md" style={{ background: '#1e293b', padding: '32px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h2 style={{ color: '#fff', margin: 0, textAlign: 'center' }}>Acceso CEO - 5inco</h2>
          {error && <p style={{ color: '#ef4444', margin: 0, fontSize: '0.9rem' }}>{error}</p>}
          <input 
            type="password" 
            placeholder="Clave Maestra" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #475569', background: '#0f172a', color: '#fff' }}
          />
          <button type="submit" style={{ padding: '12px', background: 'var(--accent-primary)', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }}>
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-md" style={{ background: '#0f172a', color: '#fff' }}>
      <header className="flex-between" style={{ marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid #334155' }}>
        <h1 style={{ margin: 0 }}>Panel CEO 👑</h1>
        <button onClick={async () => {
          await fetch('/api/admin/logout', { method: 'POST' });
          setIsAuthenticated(false);
        }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Salir</button>
      </header>

      {/* MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <p style={{ margin: 0, color: '#94a3b8' }}>Ingreso Mensual (MRR)</p>
          <h2 style={{ margin: 0, color: '#10b981', fontSize: '2.5rem' }}>${metricas.mrr.toLocaleString()}</h2>
        </div>
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <p style={{ margin: 0, color: '#94a3b8' }}>Locales Totales</p>
          <h2 style={{ margin: 0, fontSize: '2.5rem' }}>{metricas.totalLocales}</h2>
        </div>
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <p style={{ margin: 0, color: '#94a3b8' }}>En Prueba Gratuita</p>
          <h2 style={{ margin: 0, color: '#f59e0b', fontSize: '2.5rem' }}>{metricas.enPrueba}</h2>
        </div>
        <div style={{ background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <p style={{ margin: 0, color: '#94a3b8' }}>Turnos Procesados</p>
          <h2 style={{ margin: 0, color: '#3b82f6', fontSize: '2.5rem' }}>{metricas.totalTurnos}</h2>
        </div>
      </div>

      {/* LISTA DE LOCALES */}
      <h2 style={{ marginBottom: '16px' }}>Directorio de Locales</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          <thead style={{ background: '#334155', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: '16px' }}>Slug / Link</th>
              <th style={{ padding: '16px' }}>Estado</th>
              <th style={{ padding: '16px' }}>Fin Prueba</th>
              <th style={{ padding: '16px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {locales.map(local => (
              <tr key={local.id} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '16px' }}>
                  <a href={`/${local.slug}`} target="_blank" style={{ color: '#38bdf8' }}>/{local.slug}</a>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    background: local.estado_suscripcion === 'activa' ? '#10b98120' : local.estado_suscripcion === 'vencida' ? '#ef444420' : '#f59e0b20',
                    color: local.estado_suscripcion === 'activa' ? '#10b981' : local.estado_suscripcion === 'vencida' ? '#ef4444' : '#f59e0b'
                  }}>
                    {local.estado_suscripcion?.toUpperCase() || 'PRUEBA'}
                  </span>
                </td>
                <td style={{ padding: '16px', color: '#94a3b8' }}>
                  {local.fin_prueba_en ? new Date(local.fin_prueba_en).toLocaleDateString() : (local.creado_en ? new Date(new Date(local.creado_en).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A')}
                </td>
                <td style={{ padding: '16px' }}>
                  <button 
                    onClick={() => toggleEstado(local.id, local.estado_suscripcion)}
                    style={{ 
                      padding: '8px 16px', 
                      borderRadius: '8px', 
                      border: 'none', 
                      cursor: 'pointer',
                      background: local.estado_suscripcion === 'vencida' ? '#10b981' : '#ef4444',
                      color: '#fff'
                    }}
                  >
                    {local.estado_suscripcion === 'vencida' ? 'Habilitar' : 'Bloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AgencyFooter />
    </div>
  );
}
