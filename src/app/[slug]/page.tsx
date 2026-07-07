'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import PoweredByFooter from '@/components/PoweredByFooter';

export default function LandingLocal() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();
  
  const [unido, setUnido] = useState(false);
  const [turnoActivo, setTurnoActivo] = useState<any>(null);
  const [posicionTurno, setPosicionTurno] = useState<number | null>(null);
  const [turnoEstado, setTurnoEstado] = useState<string | null>(null);
  const [ultimoLlamadosCount, setUltimoLlamadosCount] = useState<number>(1);
  const [isCeding, setIsCeding] = useState(false);
  const [subastasActivas, setSubastasActivas] = useState<any[]>([]);

  const [theme, setTheme] = useState<'oscuro' | 'claro'>('oscuro');
  const [brandColor, setBrandColor] = useState('#38bdf8');
  const [banner, setBanner] = useState('/banner.png');
  const [logo, setLogo] = useState('/logo.png');
  
  const [banners, setBanners] = useState([
    { id: 1, image: '/offer1.png', title: '¡Oferta Especial en Manzanas Rojas!', description: 'Lleva 2kg al precio de 1 solo mostrando este banner en caja.' },
    { id: 2, title: 'Espacios siempre limpios', description: 'Nos esforzamos por mantener nuestras cajas higienizadas para tu seguridad.' }
  ]);

  const [isLoaded, setIsLoaded] = useState(false);
  const [horarios, setHorarios] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [showHorariosModal, setShowHorariosModal] = useState(false);

  // Estados de Registro
  const [cajasEspeciales, setCajasEspeciales] = useState<any[]>([]);
  const [esperandoGeneral, setEsperandoGeneral] = useState(0);
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [cajaDestino, setCajaDestino] = useState<string | null>(null);
  
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estimaciones
  const [isCajasLoading, setIsCajasLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [minutosPromedio, setMinutosPromedio] = useState(5);

  const checkIfOpen = (schedule: any) => {
    if (!schedule) return true;
    
    const now = new Date();
    const argTimeStr = now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires", hour12: false });
    const argDate = new Date(argTimeStr);
    
    const dayIndex = argDate.getDay();
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaHoy = dias[dayIndex];

    const horHoy = schedule[diaHoy];
    if (!horHoy) return false;

    const currentMinutes = argDate.getHours() * 60 + argDate.getMinutes();
    const parseTime = (timeStr: string) => {
      if (!timeStr) return null;
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const m1 = parseTime(horHoy.m1);
    const m2 = parseTime(horHoy.m2);
    const t1 = parseTime(horHoy.t1);
    const t2 = parseTime(horHoy.t2);

    const isMorningOpen = (m1 !== null && m2 !== null && currentMinutes >= m1 && currentMinutes <= m2);
    const isAfternoonOpen = (t1 !== null && t2 !== null && currentMinutes >= t1 && currentMinutes <= t2);

    return isMorningOpen || isAfternoonOpen;
  };

  const playSound = (type: 'avanzaste' | 'llamado') => {
    try {
      const audio = new Audio(type === 'llamado' ? 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' : 'https://actions.google.com/sounds/v1/water/water_drop.ogg');
      audio.play().catch(e => console.log('Audio autoplay blocked', e));
    } catch(e) {}
  };

  const showNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: logo });
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const turnoActivoRef = useRef(turnoActivo);
  const posicionTurnoRef = useRef(posicionTurno);
  const turnoEstadoRef = useRef(turnoEstado);
  const unidoRef = useRef(unido);

  useEffect(() => {
    turnoActivoRef.current = turnoActivo;
    posicionTurnoRef.current = posicionTurno;
    turnoEstadoRef.current = turnoEstado;
    unidoRef.current = unido;
  }, [turnoActivo, posicionTurno, turnoEstado, unido]);

  const fetchData = useCallback(async () => {
    if (!slug) return;
      // 1. Cargar configuración del local
      const { data: localData } = await supabase
        .from('locales')
        .select('id, configuracion, estado_suscripcion, fin_prueba_en')
        .eq('slug', slug)
        .single();
      
      if (localData) {
        if (localData.estado_suscripcion === 'vencida') {
          setIsExpired(true);
          setIsLoaded(true);
          return;
        }

        if (localData.configuracion) {
          const conf = localData.configuracion;
          if (conf.theme) setTheme(conf.theme);
          if (conf.brandColor) setBrandColor(conf.brandColor);
          if (conf.banner) setBanner(conf.banner);
          if (conf.logo) setLogo(conf.logo);
          
          if (conf.anuncios && conf.anuncios.length > 0) {
            setBanners(conf.anuncios.map((a: any) => ({
              id: a.id,
              image: a.image,
              title: a.title,
              description: a.desc
            })));
          }

          if (conf.horarios) {
            setHorarios(conf.horarios);
            setIsOpen(checkIfOpen(conf.horarios));
          }
        }

        // 2. Cargar cajas especiales (SOLO ACTIVAS)
        const { data: especiales } = await supabase
          .from('cajas')
          .select('*')
          .eq('local_id', localData.id)
          .eq('es_especial', true)
          .eq('activa', true);
        
        if (especiales) setCajasEspeciales(especiales);

        // 3. Contar personas en fila general (caja_id is null)
        const { count } = await supabase
          .from('turnos')
          .select('id', { count: 'exact' })
          .eq('local_slug', slug)
          .is('caja_id', null)
          .eq('estado', 'esperando');
          
        setEsperandoGeneral(count || 0);

        // 4. Calcular tiempo de despacho promedio del cajero (últimos 10 turnos)
        const { data: atendidos } = await supabase
          .from('turnos')
          .select('en_camino_en, atendido_en')
          .eq('local_slug', slug)
          .eq('estado', 'atendido')
          .not('atendido_en', 'is', null)
          .not('en_camino_en', 'is', null)
          .order('atendido_en', { ascending: false })
          .limit(10);
        
        if (atendidos && atendidos.length > 0) {
          let totalMinutes = 0;
          let validCount = 0;
          atendidos.forEach(t => {
            const start = new Date(t.en_camino_en).getTime();
            const end = new Date(t.atendido_en).getTime();
            const diffMin = (end - start) / 60000;
            // Ignorar < 30 segundos (fantasmas) y > 20 min (pausas)
            if (diffMin >= 0.5 && diffMin <= 20) {
              totalMinutes += diffMin;
              validCount++;
            }
          });
          if (validCount > 0) {
            setMinutosPromedio(Math.round(totalMinutes / validCount));
          } else {
            setMinutosPromedio(5); // Fallback
          }
        }
      }
      setIsLoaded(true);
      
      // 5. Si está unido, actualizar el estado de su turno específico y su posición
      if (turnoActivoRef.current?.id) {
        const { data: myTurn } = await supabase.from('turnos').select('*').eq('id', turnoActivoRef.current.id).single();
        if (myTurn) {
          if (myTurn.estado === 'atendido' || myTurn.estado === 'cancelado') {
            setUnido(false);
            setTurnoActivo(null);
            localStorage.removeItem(`5inco_turno_${slug}`);
            if (myTurn.estado === 'atendido') showNotification('¡Fuiste atendido!', 'Gracias por usar 5inco.');
          } else {
            setTurnoActivo(myTurn);
            setTurnoEstado(myTurn.estado);
            setIsCeding(myTurn.cediendo);
            
            if (myTurn.estado === 'llamado' && turnoEstadoRef.current !== 'llamado') {
              playSound('llamado');
              showNotification('¡ES TU TURNO!', 'Acércate a la caja, te están esperando.');
            }

            // Posición en fila general
            if (!myTurn.caja_id && myTurn.estado === 'esperando') {
              let posQuery = supabase.from('turnos')
                .select('id', { count: 'exact', head: true })
                .eq('local_slug', slug)
                .is('caja_id', null)
                .eq('estado', 'esperando')
                .lte('creado_en', myTurn.creado_en);
              
              const { count } = await posQuery;
              const pos = count || 1;
              
              if (posicionTurnoRef.current !== null && pos < posicionTurnoRef.current) {
                playSound('avanzaste');
              }
              setPosicionTurno(pos);
              
              // BUSCAR SUBASTAS (Turnos de alguien MÁS ADELANTE cediendo)
              const { data: subastas } = await supabase
                .from('turnos')
                .select('*')
                .eq('local_slug', slug)
                .is('caja_id', null)
                .eq('estado', 'esperando')
                .eq('cediendo', true)
                .lt('creado_en', myTurn.creado_en);
                
              if (subastas && subastas.length > 0) {
                if (subastasActivas.length === 0) playSound('avanzaste');
                setSubastasActivas(subastas);
              } else {
                setSubastasActivas([]);
              }
            }
          }
        }
    };
  }, [slug, supabase]); // useCallback dependencies

  useEffect(() => {
    if (!slug) return;
    
    const savedTurnoId = localStorage.getItem(`5inco_turno_${slug}`);
    if (savedTurnoId && !turnoActivoRef.current) {
      supabase.from('turnos').select('*').eq('id', savedTurnoId).single().then(({data}) => {
        if (data && (data.estado === 'esperando' || data.estado === 'llamado')) {
          setTurnoActivo(data);
          setTurnoEstado(data.estado);
          setUnido(true);
        } else {
          localStorage.removeItem(`5inco_turno_${slug}`);
        }
        fetchData();
      });
    } else {
      fetchData();
    }
    
    const channel = supabase
      .channel(`turnos_${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, () => { fetchData(); })
      .subscribe();

    const fallbackInterval = setInterval(() => { fetchData(); }, 15000);
    const statusInterval = setInterval(() => { fetchData(); }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(fallbackInterval);
      clearInterval(statusInterval);
    };
  }, [slug, supabase, fetchData]);

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
    '--warning': '#f59e0b',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    minHeight: '100vh',
    transition: 'background-color 0.3s ease, color 0.3s ease'
  } as React.CSSProperties;

  const [currentBanner, setCurrentBanner] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  useEffect(() => {
    if (isCarouselPaused) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, isCarouselPaused]);

  const handleNextBanner = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const handlePrevBanner = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleAbrirRegistro = (cajaId: string | null = null) => {
    if (!isOpen) return;
    setCajaDestino(cajaId);
    setShowRegistroModal(true);
  };

  const [errorTurno, setErrorTurno] = useState('');

  const handleObtenerTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !telefono) return;
    setIsSubmitting(true);
    setErrorTurno('');

    const { data, error } = await supabase
      .from('turnos')
      .insert({
        local_slug: slug,
        caja_id: cajaDestino,
        nombre_cliente: nombre,
        telefono: telefono,
        estado: 'esperando'
      })
      .select()
      .single();

    setIsSubmitting(false);
    
    if (data) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
      setTurnoActivo(data);
      setTurnoEstado(data.estado);
      setUnido(true);
      setShowRegistroModal(false);
      localStorage.setItem(`5inco_turno_${slug}`, data.id);
    } else if (error) {
      setErrorTurno('No se pudo crear el turno. Posible error de base de datos.');
      console.error(error);
    }
  };

  const handleCancelarTurno = async () => {
    if (!turnoActivo) return;
    await supabase.from('turnos').update({ estado: 'cancelado' }).eq('id', turnoActivo.id);
    setUnido(false);
    setTurnoActivo(null);
    localStorage.removeItem(`5inco_turno_${slug}`);
  };

  const handleLlegueACaja = async () => {
    const now = new Date().toISOString();
    await supabase.from('turnos').update({ en_camino: true, en_camino_en: now }).eq('id', turnoActivo.id);
  };

  const handleCederTurno = async () => {
    setIsCeding(true);
    await fetch('/api/turnos/ceder', {
      method: 'POST',
      body: JSON.stringify({ turnoId: turnoActivo.id })
    });
  };

  const handleReclamarSubasta = async (turnoCediendoId: string) => {
    const res = await fetch('/api/turnos/reclamar', {
      method: 'POST',
      body: JSON.stringify({ turnoCediendoId, turnoReclamandoId: turnoActivo.id })
    });
    if (res.ok) {
      alert('¡Has avanzado en la fila exitosamente!');
    } else {
      alert('Alguien más fue más rápido y ya tomó ese turno.');
    }
  };

  if (!isLoaded) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}><h2>Cargando...</h2></div>;

  if (isExpired) {
    return (
      <div style={{...dynamicStyles, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)'}}>
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <span style={{ fontSize: '4rem' }}>🛑</span>
          <h1 style={{ margin: '16px 0', color: 'var(--text-primary)' }}>Servicio No Disponible</h1>
          <p style={{ color: 'var(--text-muted)' }}>El sistema de turnos para este local se encuentra temporalmente suspendido.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={dynamicStyles}>
      
      <header style={{ position: 'relative', marginBottom: '40px', opacity: isLoaded ? 1 : 0, transition: 'opacity 0.3s' }}>
        <div style={{ height: '200px', width: '100%', position: 'relative', borderRadius: '0 0 24px 24px', overflow: 'hidden' }}>
          <Image src={banner} alt="Banner del local" fill sizes="100vw" style={{ objectFit: 'cover' }} priority />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, var(--bg-primary) 100%)' }} />
        </div>
        
        <div className="flex-between" style={{ padding: '0 24px', marginTop: '-50px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--bg-primary)', background: '#fff', position: 'relative' }}>
              <Image src={logo} alt="Logo del local" fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
            </div>
            <div style={{ paddingBottom: '8px' }}>
              <h1 style={{ fontSize: '1.8rem', textTransform: 'capitalize', margin: 0 }}>
                {slug?.replace(/-/g, ' ')}
              </h1>
              <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-muted)' }}>{isOpen ? 'Abierto ahora' : 'Cerrado'} • Supermercado</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container flex-col gap-lg" style={{ paddingTop: 0 }}>
        {/* Carrusel */}
        {banners.length > 0 && (
          <div 
            className="glass-card fade-in" 
            style={{ 
              padding: 0,
              overflow: 'hidden',
              border: `1px solid var(--accent-primary)`,
              background: 'var(--bg-secondary)',
              position: 'relative'
            }}
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
            onTouchStart={() => setIsCarouselPaused(true)}
            onTouchEnd={() => setTimeout(() => setIsCarouselPaused(false), 3000)}
          >
            <div style={{ position: 'relative', width: '100%', height: '200px' }}>
              <Image src={banners[currentBanner]?.image || '/banner.png'} alt={banners[currentBanner]?.title || ''} fill sizes="100vw" style={{ objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 16px 16px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0))' }}>
                <h3 style={{ margin: 0, color: '#fff' }}>{banners[currentBanner]?.title}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#ccc' }}>{banners[currentBanner]?.description}</p>
              </div>

              {/* Controles de Carrusel */}
              {banners.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevBanner}
                    style={{ position: 'absolute', top: '50%', left: '8px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                  >
                    ❮
                  </button>
                  <button 
                    onClick={handleNextBanner}
                    style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
                  >
                    ❯
                  </button>
                  
                  {/* Pausa Indicator */}
                  {isCarouselPaused && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>⏸</span> Pausado
                    </div>
                  )}

                  {/* Dots Indicator */}
                  <div style={{ position: 'absolute', bottom: '8px', right: '16px', display: 'flex', gap: '4px' }}>
                    {banners.map((_, idx) => (
                      <div 
                        key={idx} 
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: idx === currentBanner ? 'var(--accent-primary)' : 'rgba(255,255,255,0.5)', transition: 'background 0.3s ease' }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {unido && turnoActivo ? (
          <section className="flex-col gap-md text-center" style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', border: turnoActivo.estado === 'llamado' ? '4px solid #22c55e' : '1px solid var(--border-glass)' }}>
            {turnoActivo.estado === 'llamado' ? (
              <div style={{ padding: '24px', background: '#22c55e', borderRadius: '12px', marginBottom: '8px', animation: 'pulseGlow 1s infinite alternate' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '2.5rem', fontWeight: '900', animation: 'blinkWarning 0.5s infinite alternate' }}>¡ES TU TURNO!</h3>
                <p style={{ color: '#fff', fontSize: '1rem', marginTop: '12px', fontWeight: 'bold' }}>
                  Avísale al cajero que estás yendo para que te espere
                </p>
                <button 
                  onClick={handleLlegueACaja}
                  disabled={turnoActivo.en_camino}
                  style={{ width: '100%', padding: '16px', marginTop: '16px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: '900', border: 'none', background: '#ffffff', color: '#22c55e', animation: !turnoActivo.en_camino ? 'pulseGlow 1s infinite alternate' : 'none' }}
                >
                  {turnoActivo.en_camino ? '✅ ¡Avisado!' : '🏃‍♂️ ¡Estoy Yendo!'}
                </button>
              </div>
            ) : (
              <>
                <h2 style={{ color: 'var(--accent-primary)', marginBottom: '8px' }}>¡Ya estás en la fila!</h2>
                {posicionTurno !== null && (
                  <div style={{ marginTop: '24px' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-muted)' }}>Estás en el lugar</h4>
                    <div style={{ fontSize: '4rem', fontWeight: '900', color: 'var(--text-primary)' }}>#{posicionTurno}</div>
                    {posicionTurno > 1 && (
                      <p style={{ margin: 0, color: 'var(--text-muted)' }}>Faltan {posicionTurno - 1} personas antes que tú</p>
                    )}
                    {posicionTurno > 1 && (
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-accent)' }}>Tiempo est: ~{(posicionTurno - 1) * minutosPromedio} mins</p>
                    )}
                    
                    <div style={{ marginTop: '24px' }}>
                      {isCeding ? (
                        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)' }}>
                          <p style={{ margin: '0 0 8px 0', color: 'var(--warning)', fontWeight: 'bold' }}>📡 Subastando tu turno...</p>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Buscando a alguien detrás en la fila que quiera adelantarse.</p>
                        </div>
                      ) : (
                        <button 
                          onClick={handleCederTurno}
                          style={{ padding: '12px 24px', background: 'transparent', color: 'var(--warning)', border: '1px solid var(--warning)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          🔄 Ceder mi turno (Subastar)
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            
            <button style={{ width: '100%', padding: '16px', borderRadius: '12px', fontSize: '1rem', border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', marginTop: '8px' }} onClick={handleCancelarTurno}>
              Salir de la fila
            </button>
          </section>
        ) : (
          <section className="flex-col gap-md">
            {/* FILA GENERAL */}
            <div className="flex-col gap-sm" style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '2px solid var(--accent-primary)', textAlign: 'center' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Fila General</h3>
                <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'var(--accent-primary)', color: 'var(--accent-contrast)', borderRadius: '8px' }}>Auto Balanceo</span>
              </div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>El sistema te asignará automáticamente a la caja que se desocupe primero.</p>
              
              <div style={{ margin: '12px 0', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{esperandoGeneral}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>personas esperando</span>
                </div>
                {esperandoGeneral > 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    ⏱️ Promedio: <strong>{minutosPromedio} min/persona</strong>. 
                    Tiempo est: <strong style={{color: 'var(--accent-primary)'}}>{esperandoGeneral * minutosPromedio} min</strong>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.9rem', color: '#22c55e', fontWeight: 'bold', marginTop: '4px' }}>
                    ¡No hay nadie en fila! Acércate directamente y saca turno.
                  </div>
                )}
              </div>
              <button 
                onClick={() => handleAbrirRegistro(null)}
                disabled={!isOpen}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: 'var(--accent-primary)', color: 'var(--accent-contrast)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {!isOpen ? '🛑 Local Cerrado' : '🎫 Unirme a Fila General'}
              </button>
            </div>

            {/* CAJAS ESPECIALES */}
            {cajasEspeciales.length > 0 && (
              <div className="flex-col gap-sm" style={{ marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Cajas Especiales</h4>
                {cajasEspeciales.map(caja => (
                  <div key={caja.id} className="flex-between" style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {caja.nombre} <span style={{ fontSize: '0.7rem', background: '#eab308', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>ESPECIAL</span>
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#eab308' }}>⚠️ {caja.mensaje_especial}</p>
                    </div>
                    <button 
                      onClick={() => handleAbrirRegistro(caja.id)}
                      disabled={!isOpen}
                      style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: !isOpen ? 'var(--bg-primary)' : 'var(--accent-primary)', color: !isOpen ? 'var(--text-muted)' : 'var(--accent-contrast)', fontWeight: 'bold', cursor: !isOpen ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease' }}
                    >
                      Unirme
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex-col gap-sm" style={{ marginTop: '16px' }}>
              {!isOpen && (
                <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.9rem', margin: '4px 0', fontWeight: 'bold' }}>
                  Las cajas están cerradas. Revisa nuestros horarios.
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <button 
                  onClick={() => setShowHorariosModal(true)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', fontSize: '0.9rem', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  🕒 Ver Horarios
                </button>
              </div>
            </div>
          </section>
        )}

        {/* POPUP DE SUBASTAS ACTIVAS */}
        {unido && turnoActivo?.estado === 'esperando' && subastasActivas.length > 0 && (
          <div style={{ position: 'fixed', bottom: '24px', left: '24px', right: '24px', background: '#ef4444', padding: '24px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 1000, animation: 'fadeInUp 0.3s ease-out' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1.2rem' }}>⚡ ¡Alguien adelante tuyo quiere ceder su turno!</h3>
            <p style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 16px 0', fontSize: '0.9rem' }}>El primero en reclamarlo saltará más cerca de la caja.</p>
            <button 
              onClick={() => handleReclamarSubasta(subastasActivas[0].id)}
              style={{ width: '100%', padding: '16px', background: '#fff', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
            >
              ¡YO LO QUIERO! 🏃‍♂️
            </button>
          </div>
        )}

        <PoweredByFooter />
      </div>

      {/* MODAL DE REGISTRO (NOMBRE Y WHATSAPP) */}
      {showRegistroModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <form onSubmit={handleObtenerTurno} style={{ background: 'var(--bg-secondary)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid var(--accent-primary)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Completa tus datos</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>Te avisaremos por WhatsApp cuando sea tu turno.</p>
            
            <div className="flex-col gap-sm">
              {errorTurno && <div style={{ color: '#ef4444', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '0.9rem' }}>{errorTurno}</div>}
              <input 
                type="text" 
                placeholder="Tu Nombre" 
                required
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
              <input 
                type="tel" 
                placeholder="Número de WhatsApp" 
                required
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowRegistroModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '12px', background: 'var(--accent-primary)', border: 'none', color: 'var(--accent-contrast)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {isSubmitting ? 'Guardando...' : 'Confirmar Turno'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE HORARIOS */}
      {showHorariosModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid var(--border-glass)' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>🕒 Horarios de Atención</h3>
              <button onClick={() => setShowHorariosModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div className="flex-col gap-sm">
              {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia) => {
                const hor = horarios?.[dia];
                const isClosed = !hor || (!hor.m1 && !hor.t1);
                
                return (
                  <div key={dia} className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-glass)' }}>
                    <span style={{ textTransform: 'capitalize', color: 'var(--text-primary)', fontWeight: 'bold' }}>{dia}</span>
                    <div style={{ textAlign: 'right' }}>
                      {isClosed ? (
                        <span style={{ color: '#ef4444', fontSize: '0.9rem' }}>Cerrado</span>
                      ) : (
                        <div className="flex-col" style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          {hor.m1 && hor.m2 && <span>{hor.m1} a {hor.m2}</span>}
                          {hor.t1 && hor.t2 && <span>{hor.t1} a {hor.t2}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
