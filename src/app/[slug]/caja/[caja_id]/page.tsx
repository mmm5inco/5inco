'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import PoweredByFooter from '@/components/PoweredByFooter';

export default function LoginCajero() {
  const params = useParams();
  const slug = params.slug as string;
  const caja_id = params.caja_id as string;
  const supabase = createClient();

  const [clave, setClave] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [cajaInfo, setCajaInfo] = useState<any>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Tema Dinámico
  const [theme, setTheme] = useState<'oscuro' | 'claro'>('oscuro');
  const [brandColor, setBrandColor] = useState('#38bdf8');
  
  // Turnos State
  const [turnoActual, setTurnoActual] = useState<any>(null);
  const [esperandoGeneral, setEsperandoGeneral] = useState(0);
  const [esperandoEspecial, setEsperandoEspecial] = useState(0);
  const prevGeneral = useRef(0);
  const prevEspecial = useRef(0);
  const initialLoad = useRef(true);

  // Funciones de Audio y Alertas con Web Audio API (Más rápido y confiable)
  const playBeep = (type: 'avanzaste' | 'llamado' | 'nuevo' | 'en_camino') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'nuevo') {
        // Campana suave para nueva persona en fila (tono alto, rápido)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'en_camino') {
        // Sonido de confirmación o "llegada" (dos notas rápidas)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch(e) {
      console.log('Audio autoplay blocked', e);
    }
    
    if (type === 'nuevo') {
      setNotificacion('🔔 ¡Nueva persona en la fila!');
      const originalTitle = document.title;
      let isFlashing = false;
      const flashInterval = setInterval(() => {
        document.title = isFlashing ? '🔔 ¡NUEVO TURNO!' : originalTitle;
        isFlashing = !isFlashing;
      }, 1000);

      setTimeout(() => {
        setNotificacion(null);
        clearInterval(flashInterval);
        document.title = originalTitle;
      }, 5000);
    } else if (type === 'en_camino') {
      setNotificacion('🏃‍♂️ ¡El cliente está yendo a la caja!');
      setTimeout(() => setNotificacion(null), 5000);
    }
  };

  // Referencia para trackear cambios en turnoActual y reproducir sonido de "Estoy Yendo"
  const prevTurnoActual = useRef<any>(null);

  useEffect(() => {
    if (turnoActual) {
      if (prevTurnoActual.current && !prevTurnoActual.current.en_camino && turnoActual.en_camino) {
        // El cliente acaba de presionar "Estoy Yendo"
        playBeep('en_camino');
      }
    }
    prevTurnoActual.current = turnoActual;
  }, [turnoActual]);

  useEffect(() => {
    // Cargar Tema
    const loadTheme = async () => {
      const { data } = await supabase.from('locales').select('configuracion, estado_suscripcion').eq('slug', slug).single();
      if (data) {
        if (data.estado_suscripcion === 'vencida') {
          setIsExpired(true);
        }
        if (data.configuracion?.theme) {setTheme(data.configuracion.theme);}
        if (data.configuracion?.brandColor) setBrandColor(data.configuracion.brandColor);
      }
    };
    loadTheme();
  }, [slug, supabase]);

  useEffect(() => {
    // Restaurar sesión de LocalStorage si existe
    const savedSession = localStorage.getItem(`5inco_caja_${slug}_${caja_id}`);
    if (savedSession) {
      try {
        const parsedInfo = JSON.parse(savedSession);
        setCajaInfo(parsedInfo);
        setAutenticado(true);
        loadTurnos(parsedInfo);
      } catch(e) {}
    }
  }, [slug, caja_id]);

  useEffect(() => {
    if (!autenticado || !cajaInfo) return;

    // Supabase Realtime Subscription para actualizaciones instantáneas de la fila
    const channel = supabase
      .channel(`caja_turnos_${slug}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'turnos' },
        () => {
          loadTurnos(cajaInfo);
        }
      )
      .subscribe();

    // POLING DE RESPALDO: Cada 3 segundos, vital si Realtime no está habilitado o falla el socket
    const fallbackInterval = setInterval(() => {
      loadTurnos(cajaInfo);
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackInterval);
    };
  }, [autenticado, cajaInfo, slug, supabase]);

  const loadTurnos = async (info_caja: any) => {
    // Fila General
    const { count: cGeneral } = await supabase.from('turnos')
      .select('id', { count: 'exact' })
      .eq('local_slug', slug)
      .is('caja_id', null)
      .eq('estado', 'esperando');
    
    if (!initialLoad.current) {
      if ((cGeneral || 0) > prevGeneral.current) playBeep('nuevo');
    }
    prevGeneral.current = cGeneral || 0;
    setEsperandoGeneral(cGeneral || 0);

    // Fila Especial (Si aplica)
    if (info_caja?.es_especial) {
      const { count: cEspecial } = await supabase.from('turnos')
        .select('id', { count: 'exact' })
        .eq('local_slug', slug)
        .eq('caja_id', caja_id)
        .eq('estado', 'esperando');
      
      if (!initialLoad.current) {
        if ((cEspecial || 0) > prevEspecial.current) playBeep('nuevo');
      }
      prevEspecial.current = cEspecial || 0;
      setEsperandoEspecial(cEspecial || 0);
    }
    
    initialLoad.current = false;

    // Verificar si ya tengo a alguien llamado
    const { data: actuales } = await supabase.from('turnos')
      .select('*')
      .eq('caja_id', caja_id)
      .eq('estado', 'llamado')
      .limit(1);
    
    if (actuales && actuales.length > 0) {
      setTurnoActual(actuales[0]);
    } else {
      setTurnoActual(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('cajas')
      .select('*')
      .eq('id', caja_id)
      .eq('clave_acceso', clave)
      .single();

    setLoading(false);

    if (data) {
      // Marcar caja como activa
      await supabase.from('cajas').update({ activa: true }).eq('id', caja_id);
      
      setCajaInfo(data);
      setAutenticado(true);
      localStorage.setItem(`5inco_caja_${slug}_${caja_id}`, JSON.stringify(data));
      loadTurnos(data);
    } else {
      setError('Clave incorrecta. Inténtalo de nuevo.');
    }
  };

  const llamarSiguiente = async (tipo: 'general' | 'especial') => {
    // AUTO-COMPLETAR: Si ya estoy atendiendo a alguien, lo marco como atendido
    if (turnoActual) {
      await supabase.from('turnos')
        .update({ estado: 'atendido', atendido_en: new Date().toISOString() })
        .eq('id', turnoActual.id);
    }

    let query = supabase.from('turnos')
      .select('*')
      .eq('local_slug', slug)
      .eq('estado', 'esperando')
      .order('creado_en', { ascending: true })
      .limit(1);

    if (tipo === 'general') {
      query = query.is('caja_id', null);
    } else {
      query = query.eq('caja_id', caja_id);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      const siguiente = data[0];
      
      // CASTIGO POR ESTAR CEDIENDO CUANDO TE LLAMAN
      if (siguiente.cediendo) {
        await supabase.from('turnos').update({ estado: 'cancelado' }).eq('id', siguiente.id);
        // Llamamos al siguiente (Recursión)
        return llamarSiguiente(tipo);
      }
      
      // Lo marcamos como llamado y le asignamos esta caja
      const { data: actualizado } = await supabase.from('turnos')
        .update({ estado: 'llamado', caja_id: caja_id, llamado_en: new Date().toISOString() })
        .eq('id', siguiente.id)
        .select()
        .single();
      
      if (actualizado) {
        setTurnoActual(actualizado);
        loadTurnos(cajaInfo);

        // Disparar WhatsApp en segundo plano
        if (actualizado.telefono) {
          const urlLocal = `${window.location.origin}/${slug}`;
          fetch(`http://${window.location.hostname}:3333/api/whatsapp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              slug,
              number: actualizado.telefono,
              message: `👋 Hola ${actualizado.nombre_cliente},\n\n¡Tu turno ya está listo y el cajero de la *${cajaInfo?.nombre || 'caja'}* te está llamando!\n\nIngresa al siguiente enlace (desde donde sacaste el turno) y avísale al cajero que estás en camino dándole click al botón "🏃‍♂️ Estoy Yendo":\n\n👉 ${urlLocal}`
            })
          }).catch(err => console.error('Error enviando WP:', err));
        }
      }
    }
  };

  const finalizarTurno = async () => {
    if (!turnoActual) return;
    await supabase.from('turnos')
      .update({ estado: 'atendido', atendido_en: new Date().toISOString() })
      .eq('id', turnoActual.id);
    
    setTurnoActual(null);
    loadTurnos(cajaInfo);
  };

  const volverALlamar = async () => {
    if (!turnoActual) return;
    const currentCount = turnoActual.llamados_count || 1;
    const { data: actualizado } = await supabase.from('turnos')
      .update({ llamados_count: currentCount + 1, llamado_en: new Date().toISOString() })
      .eq('id', turnoActual.id)
      .select()
      .single();
    
    if (actualizado) {
      setTurnoActual(actualizado);
      // Disparar WhatsApp en segundo plano
      if (actualizado.telefono) {
        const urlLocal = `${window.location.origin}/${slug}`;
        fetch(`http://${window.location.hostname}:3333/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            number: actualizado.telefono,
            message: `⚠️ Hola ${actualizado.nombre_cliente}, la *${cajaInfo?.nombre || 'caja'}* te sigue esperando.\n\nPor favor, ingresa al enlace y avísanos si estás en camino presionando el botón "🏃‍♂️ Estoy Yendo":\n\n👉 ${urlLocal}`
          })
        }).catch(err => console.error('Error enviando WP:', err));
      }
    }
  };

  // ESTILOS DINÁMICOS
  const getContrast = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff'; 
  };

  const brandTextColor = getContrast(brandColor);

  const dynamicStyles = {
    '--bg-primary': theme === 'oscuro' ? '#0a0a0a' : '#f9fafb',
    '--bg-secondary': theme === 'oscuro' ? '#121212' : '#ffffff',
    '--text-primary': theme === 'oscuro' ? '#ffffff' : '#111827',
    '--text-muted': theme === 'oscuro' ? '#a3a3a3' : '#6b7280',
    '--border-glass': theme === 'oscuro' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    '--accent-primary': brandColor,
    '--accent-contrast': brandTextColor,
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    minHeight: '100vh',
    transition: 'background-color 0.3s ease, color 0.3s ease'
  } as React.CSSProperties;

  const handleLogout = async () => {
    setAutenticado(false);
    setCajaInfo(null);
    localStorage.removeItem(`5inco_caja_${slug}_${caja_id}`);
    await supabase.from('cajas').update({ activa: false }).eq('id', caja_id);
  };

  // Efecto para marcar como inactiva si se cierra la pestaña
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (autenticado) {
        // Fallback rápido por si cierra la pestaña (Best effort)
        const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cajas?id=eq.${caja_id}`;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        };
        navigator.sendBeacon(url, JSON.stringify({ activa: false }));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [autenticado, caja_id]);

  if (isExpired) {
    return (
      <div className="flex-col gap-md flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', textAlign: 'center', padding: '24px' }}>
        <span style={{ fontSize: '4rem' }}>🛑</span>
        <h1>Servicio No Disponible</h1>
        <p style={{ color: 'var(--text-muted)' }}>El sistema se encuentra suspendido temporalmente por falta de pago o fin del período de prueba. Por favor contacta al administrador del local.</p>
      </div>
    );
  }

  if (autenticado && cajaInfo) {
    return (
      <div style={dynamicStyles} className="flex-col gap-lg">
        
        {/* Notificación flotante de nuevos turnos */}
        {notificacion && (
          <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#22c55e',
            color: '#fff',
            padding: '16px 32px',
            borderRadius: '50px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 9999,
            fontSize: '1.2rem',
            fontWeight: 'bold',
            animation: 'fadeInDown 0.3s ease-out'
          }}>
            {notificacion}
          </div>
        )}

        <header style={{ padding: '16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--accent-primary)' }}>Panel de {cajaInfo.nombre}</h2>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {cajaInfo.nombre_cajero && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cajero: {cajaInfo.nombre_cajero}</span>}
              {cajaInfo.es_especial && <span style={{ fontSize: '0.7rem', background: '#eab308', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>CAJA ESPECIAL</span>}
            </div>
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer' }}>Cerrar Sesión</button>
        </header>

        <section style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          
          <div style={{ position: 'relative', minHeight: '550px', display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
            
            {/* CARTAS TRASERAS (MAZO) */}
            {Array.from({ length: Math.min(3, Math.max(esperandoGeneral, esperandoEspecial)) }).map((_, index) => {
              const totalCards = Math.min(3, Math.max(esperandoGeneral, esperandoEspecial));
              const reverseIndex = totalCards - index - 1;
              return (
                <div key={index} style={{
                  position: 'absolute',
                  top: `${reverseIndex * -20}px`,
                  transform: `scale(${1 - (reverseIndex * 0.05)})`,
                  width: '100%',
                  maxWidth: '480px',
                  height: '200px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '16px',
                  zIndex: 10 - reverseIndex,
                  opacity: turnoActual ? 0.8 : 0.4,
                  filter: turnoActual ? 'none' : 'grayscale(100%)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }} />
              )
            })}

            {/* CARTA PRINCIPAL (ATENDIENDO) */}
            <div style={{
              position: 'absolute',
              top: '30px',
              width: '100%',
              maxWidth: '520px',
              background: turnoActual ? 'var(--bg-secondary)' : 'var(--bg-primary)',
              border: turnoActual ? '2px solid var(--accent-primary)' : '2px dashed var(--border-glass)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center',
              zIndex: 20,
              filter: turnoActual ? 'none' : 'grayscale(100%)',
              boxShadow: turnoActual ? '0 20px 40px rgba(0,0,0,0.5)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {turnoActual ? (
                <div className="flex-col gap-md">
                  <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Atendiendo a:</h2>
                  <h1 style={{ fontSize: '3rem', margin: 0, color: 'var(--accent-primary)' }}>{turnoActual.nombre_cliente}</h1>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1.2rem' }}>WhatsApp: {turnoActual.telefono}</p>
                  </div>
                  <div style={{ padding: '8px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'inline-block' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Turno ID: {turnoActual.id.substring(0, 4).toUpperCase()}</span>
                  </div>
                  
                  {turnoActual.en_camino ? (
                    <div style={{ margin: '16px 0', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', border: '2px solid #22c55e', borderRadius: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🏃‍♂️</span>
                      <strong style={{ color: '#22c55e', marginLeft: '8px' }}>El cliente ya vio el mensaje y se está acercando.</strong>
                    </div>
                  ) : (
                    <div style={{ margin: '16px 0', padding: '16px', background: 'rgba(234, 179, 8, 0.1)', border: '2px dashed #eab308', borderRadius: '12px' }}>
                      <p style={{ color: '#eab308', margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 'bold' }}>El cliente aún no ha presionado "Estoy Yendo".</p>
                      <button 
                        onClick={volverALlamar}
                        className="animate-blink"
                        style={{ width: '100%', padding: '16px', background: '#eab308', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)' }}
                      >
                        🔔 VOLVER A LLAMAR AL CLIENTE
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', padding: '40px 0' }}>
                  <span style={{ fontSize: '3rem' }}>🎴</span>
                  <h2>Caja Libre</h2>
                  <p>Mazo inactivo. Llama al siguiente para comenzar.</p>
                </div>
              )}
            </div>
          </div>
            
          {/* ZONA DE BOTONES (posicionamiento normal para evitar que se corten) */}
          <div style={{ 
            width: '100%', 
            maxWidth: '520px', 
            margin: '0 auto',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                👥 <strong>{esperandoGeneral + esperandoEspecial}</strong> personas esperando detrás.
              </p>
            </div>

            {cajaInfo.es_especial && (
              <button 
                onClick={() => llamarSiguiente('especial')}
                disabled={esperandoEspecial === 0}
                style={{ width: '100%', padding: '20px', background: 'var(--accent-primary)', color: 'var(--accent-contrast)', border: 'none', borderRadius: '12px', fontSize: '1.3rem', fontWeight: 'bold', cursor: esperandoEspecial === 0 ? 'not-allowed' : 'pointer', opacity: esperandoEspecial === 0 ? 0.5 : 1, boxShadow: esperandoEspecial > 0 ? '0 8px 24px rgba(0,0,0,0.3)' : 'none' }}
              >
                LLAMAR SIGUIENTE ESPECIAL ({esperandoEspecial})
              </button>
            )}
            
            <button 
              onClick={() => llamarSiguiente('general')}
              disabled={esperandoGeneral === 0}
              style={{ width: '100%', padding: '20px', background: cajaInfo.es_especial ? 'var(--bg-secondary)' : 'var(--accent-primary)', color: cajaInfo.es_especial ? 'var(--accent-primary)' : 'var(--accent-contrast)', border: cajaInfo.es_especial ? '2px solid var(--accent-primary)' : 'none', borderRadius: '12px', fontSize: '1.3rem', fontWeight: 'bold', cursor: esperandoGeneral === 0 ? 'not-allowed' : 'pointer', opacity: esperandoGeneral === 0 ? 0.5 : 1, boxShadow: esperandoGeneral > 0 ? '0 8px 24px rgba(0,0,0,0.3)' : 'none' }}
            >
              LLAMAR SIGUIENTE GENERAL ({esperandoGeneral})
            </button>

            <p style={{ margin: '4px 0 0 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              💡 Utiliza estos botones para llamar al siguiente cliente mientras terminas de cobrar al actual y así ahorrar tiempo de caminata.
            </p>

            {turnoActual && (
              <button 
                onClick={finalizarTurno}
                style={{ marginTop: '16px', padding: '12px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                🛑 FINALIZAR TURNO Y QUEDAR LIBRE
              </button>
            )}
          </div>
        </section>

        <PoweredByFooter />
      </div>
    );
  }

  return (
    <div style={dynamicStyles} className="flex-col gap-xl" >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="flex-col gap-sm" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>Acceso a <span style={{ color: 'var(--accent-primary)' }}>Caja</span></h1>
        </div>

        <div style={{ background: 'var(--bg-secondary)', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-glass)', width: '100%', maxWidth: '400px' }}>
          <form onSubmit={handleLogin} className="flex-col gap-md">
            {error && <div style={{ color: '#ef4444', padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', textAlign: 'center' }}>{error}</div>}
            
            <div className="flex-col gap-sm text-center">
              <label htmlFor="clave" style={{ color: 'var(--text-primary)' }}>Ingresa la clave de esta caja</label>
              <input 
                id="clave"
                type="password" 
                style={{ textAlign: 'center', fontSize: '2rem', letterSpacing: '0.5rem', padding: '16px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}
                placeholder="••••"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                autoFocus
                required
              />
            </div>

            <button type="submit" disabled={loading} style={{ marginTop: '24px', padding: '16px', background: 'var(--accent-primary)', color: 'var(--accent-contrast)', border: 'none', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verificando...' : 'Entrar a la Caja'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
