'use client';

import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const WhatsAppConnection = ({ slug }: { slug: string }) => {
  const [status, setStatus] = useState('disconnected');
  const [qr, setQr] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`http://${window.location.hostname}:3333/api/whatsapp/status?slug=${slug}`);
        const data = await res.json();
        setStatus(data.status);
        setQr(data.qr);
      } catch (err) {
        setStatus('error');
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'error') {
    return (
      <div className="flex-col gap-sm flex-center text-center">
        <span style={{ fontSize: '2rem' }}>⚠️</span>
        <p style={{ color: 'var(--text-primary)' }}>No se pudo conectar al servidor local.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Asegúrate de ejecutar <code>node whatsapp-server.js</code> en otra terminal.</p>
      </div>
    );
  }

  if (status === 'connected') {
    return (
      <div className="flex-col gap-sm flex-center text-center">
        <span style={{ fontSize: '3rem' }}>✅</span>
        <h4 style={{ color: '#25D366', margin: 0 }}>¡WhatsApp Conectado Exitosamente!</h4>
        <p style={{ color: 'var(--text-muted)' }}>El sistema enviará notificaciones instantáneas.</p>
      </div>
    );
  }

  if (status === 'qr' && qr) {
    return (
      <div className="flex-col gap-sm flex-center text-center">
        <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Escanea este código con WhatsApp</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Abre WhatsApp {'>'} Dispositivos Vinculados {'>'} Vincular Dispositivo</p>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', marginTop: '8px' }}>
          <img src={qr} alt="WhatsApp QR Code" style={{ width: '250px', height: '250px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col gap-sm flex-center text-center">
      <span style={{ fontSize: '2rem' }}>⏳</span>
      <p style={{ color: 'var(--text-muted)' }}>Iniciando Motor de WhatsApp... Por favor espera.</p>
    </div>
  );
};

export default function AdminDashboard() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();
  
  const [cajas, setCajas] = useState<any[]>([]);
  const [nuevaCaja, setNuevaCaja] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');
  const [nuevoNombreCajero, setNuevoNombreCajero] = useState('');
  const [esEspecial, setEsEspecial] = useState(false);
  const [mensajeEspecial, setMensajeEspecial] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  
  const [origin, setOrigin] = useState('');
  const [localId, setLocalId] = useState('');

  // Estados de Personalización (Defaults, se sobreescriben desde DB)
  const [banner, setBanner] = useState('/banner.png');
  const [logo, setLogo] = useState('/logo.png');
  const [brandColor, setBrandColor] = useState('#38bdf8');
  const [theme, setTheme] = useState('oscuro');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  
  const [estadoSuscripcion, setEstadoSuscripcion] = useState('');
  const [finPrueba, setFinPrueba] = useState<Date | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Estados de Carrusel
  const [anuncios, setAnuncios] = useState([
    { id: 1, image: '/offer1.png', title: 'Oferta en Manzanas', desc: 'Lleva 2kg al precio de 1...' },
    { id: 2, image: '/policy1.png', title: 'Espacios limpios', desc: 'Nos esforzamos por mantener...' }
  ]);

  // Estados de Horarios (Lunes a Domingo)
  const defaultHorarios = {
    lunes: { m1: '08:00', m2: '13:00', t1: '17:00', t2: '21:00' },
    martes: { m1: '08:00', m2: '13:00', t1: '17:00', t2: '21:00' },
    miercoles: { m1: '08:00', m2: '13:00', t1: '17:00', t2: '21:00' },
    jueves: { m1: '08:00', m2: '13:00', t1: '17:00', t2: '21:00' },
    viernes: { m1: '08:00', m2: '13:00', t1: '17:00', t2: '21:00' },
    sabado: { m1: '08:00', m2: '14:00', t1: '', t2: '' },
    domingo: { m1: '', m2: '', t1: '', t2: '' },
  };
  const [horarios, setHorarios] = useState<any>(defaultHorarios);

  // CARGAR CONFIGURACIÓN DESDE SUPABASE AL INICIAR
  useEffect(() => {
    setOrigin(window.location.origin);

    const loadConfigAndCajas = async () => {
      // Obtener configuracion y ID del local
      const { data: localData } = await supabase
        .from('locales')
        .select('id, configuracion, estado_suscripcion, fin_prueba_en')
        .eq('slug', slug)
        .single();
      
      if (localData) {
        setLocalId(localData.id);
        
        if (localData.estado_suscripcion === 'vencida') {
           setIsExpired(true);
        }
        setEstadoSuscripcion(localData.estado_suscripcion);
        if (localData.fin_prueba_en) {
          setFinPrueba(new Date(localData.fin_prueba_en));
        } else {
          const defaultFinPrueba = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          setFinPrueba(defaultFinPrueba);
        }

        if (localData.configuracion) {
          const conf = localData.configuracion;
          if (conf.theme) setTheme(conf.theme);
          if (conf.brandColor) setBrandColor(conf.brandColor);
          if (conf.banner) setBanner(conf.banner);
          if (conf.logo) setLogo(conf.logo);
          if (conf.anuncios) setAnuncios(conf.anuncios);
          if (conf.horarios) setHorarios(conf.horarios);
        }

        // Cargar cajas de este local
        const { data: cajasData } = await supabase
          .from('cajas')
          .select('*')
          .eq('local_id', localData.id)
          .order('creado_en', { ascending: true });
        
        if (cajasData) setCajas(cajasData);
      }
    };
    loadConfigAndCajas();
  }, [slug, supabase]);

  // GUARDAR CONFIGURACIÓN EN SUPABASE
  const saveConfig = async () => {
    setIsSaving(true);
    const newConfig = {
      theme,
      brandColor,
      banner,
      logo,
      anuncios,
      horarios
    };

    const { error } = await supabase
      .from('locales')
      .update({ configuracion: newConfig })
      .eq('slug', slug);

    setIsSaving(false);
    if (!error) {
      setSaveMessage('✅ Diseño guardado exitosamente');
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setSaveMessage('❌ Error al guardar');
    }
  };

  const getContrast = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substr(0, 2), 16);
    const g = parseInt(cleanHex.substr(2, 2), 16);
    const b = parseInt(cleanHex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff'; 
  };

  const brandTextColor = getContrast(brandColor);

  const handlePayment = async () => {
    if (!acceptedTerms) {
      alert("Debes aceptar los Términos y Condiciones para continuar.");
      return;
    }
    setIsProcessingPayment(true);
    try {
      const res = await fetch('/api/mercadopago/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ localId, slug })
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        alert('Error al conectar con MercadoPago.');
      }
    } catch (e) {
      alert('Error de red.');
    }
    setIsProcessingPayment(false);
  };

  const handleCancelSubscription = async () => {
    // Aquí iría la lógica para cancelar la suscripción real en MercadoPago
    // Por ahora, lo simularemos cambiando el estado en Supabase
    await supabase.from('locales').update({ estado_suscripcion: 'cancelada' }).eq('id', localId);
    alert("Tu suscripción ha sido cancelada.");
    setShowCancelModal(false);
    window.location.reload();
  };

  // ESTILOS DINÁMICOS PARA PREVISUALIZAR EN EL MISMO PANEL
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


  const agregarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaCaja || !nuevaClave || !localId) return;
    
    if (editandoId) {
      // MODO EDICIÓN
      const { data, error } = await supabase
        .from('cajas')
        .update({
          nombre: nuevaCaja,
          clave_acceso: nuevaClave,
          nombre_cajero: nuevoNombreCajero,
          es_especial: esEspecial,
          mensaje_especial: esEspecial ? mensajeEspecial : null
        })
        .eq('id', editandoId)
        .select()
        .single();
        
      if (data) {
        setCajas(cajas.map(c => c.id === editandoId ? data : c));
        setEditandoId(null);
        setNuevaCaja('');
        setNuevaClave('');
        setNuevoNombreCajero('');
        setEsEspecial(false);
        setMensajeEspecial('');
      } else if (error) {
        alert("Error al actualizar la caja: " + error.message);
      }
    } else {
      // MODO CREACIÓN
      const { data, error } = await supabase
        .from('cajas')
        .insert({
          local_id: localId,
          nombre: nuevaCaja,
          clave_acceso: nuevaClave,
          nombre_cajero: nuevoNombreCajero,
          es_especial: esEspecial,
          mensaje_especial: esEspecial ? mensajeEspecial : null
        })
        .select()
        .single();

      if (data) {
        setCajas([...cajas, data]);
        setNuevaCaja('');
        setNuevaClave('');
        setNuevoNombreCajero('');
        setEsEspecial(false);
        setMensajeEspecial('');
      } else if (error) {
        alert("Error de Supabase al crear la caja: " + error.message + " | Details: " + error.details);
      }
    }
  };

  const iniciarEdicion = (caja: any) => {
    setEditandoId(caja.id);
    setNuevaCaja(caja.nombre);
    setNuevaClave(caja.clave_acceso);
    setNuevoNombreCajero(caja.nombre_cajero || '');
    setEsEspecial(caja.es_especial);
    setMensajeEspecial(caja.mensaje_especial || '');
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setNuevaCaja('');
    setNuevaClave('');
    setNuevoNombreCajero('');
    setEsEspecial(false);
    setMensajeEspecial('');
  };

  const eliminarCaja = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta caja? Todos sus datos y fila asociada se perderán.')) return;
    
    const { error } = await supabase
      .from('cajas')
      .delete()
      .eq('id', id);
      
    if (!error) {
      setCajas(cajas.filter(c => c.id !== id));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'logo' | 'anuncio') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'anuncio' && anuncios.length >= 10) {
        alert('Has alcanzado el límite máximo de 10 banners.');
        return;
      }

      setIsSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${slug}_${type}_${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('banners')
        .upload(fileName, file);

      if (error) {
        alert('Error subiendo imagen: ' + error.message);
        setIsSaving(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      if (type === 'banner') setBanner(publicUrl);
      if (type === 'logo') setLogo(publicUrl);
      if (type === 'anuncio') {
        setAnuncios([...anuncios, { id: Date.now(), image: publicUrl, title: '', desc: '' }]);
      }
      setIsSaving(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-local') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_${slug}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Enlace copiado al portapapeles!');
  };

  const urlLocal = `${origin}/${slug}`;

  if (isExpired) {
    return (
      <div className="flex-col gap-md flex-center" style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', textAlign: 'center', padding: '24px' }}>
        <span style={{ fontSize: '4rem' }}>💳</span>
        <h1>Suscripción Vencida</h1>
        <p style={{ maxWidth: '400px', color: 'var(--text-muted)' }}>
          Tu período de prueba o suscripción ha finalizado. Para seguir utilizando 5inco y no interrumpir el servicio a tus clientes, por favor renueva tu suscripción.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
          <label style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} style={{ marginRight: '8px' }}/>
            Acepto los <a href="#" style={{ color: '#009ee3' }}>Términos y Condiciones</a> del servicio SaaS.
          </label>
          <button onClick={handlePayment} disabled={isProcessingPayment} style={{ background: '#009ee3', color: '#fff', padding: '16px 32px', borderRadius: '8px', border: 'none', fontSize: '1.1rem', fontWeight: 'bold', cursor: isProcessingPayment ? 'not-allowed' : 'pointer', opacity: isProcessingPayment ? 0.7 : 1 }}>
            {isProcessingPayment ? 'Conectando...' : 'Pagar Suscripción ($45.000 ARS/mes)'}
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Procesado de forma segura por MercadoPago</p>
      </div>
    );
  }

  const diasRestantesPrueba = finPrueba ? Math.ceil((finPrueba.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="flex-col gap-lg" style={dynamicStyles}>
      
      {/* Sección: Estado de la Suscripción */}
      <section className="flex-col gap-sm" style={{ padding: '24px', background: estadoSuscripcion === 'activa' ? 'rgba(37, 211, 102, 0.1)' : 'rgba(234, 179, 8, 0.1)', borderRadius: 'var(--border-radius-md)', border: estadoSuscripcion === 'activa' ? '2px solid #25D366' : '2px solid #eab308' }}>
        <div className="flex-between">
          <h3 style={{ margin: 0, color: estadoSuscripcion === 'activa' ? '#25D366' : '#eab308' }}>
            {estadoSuscripcion === 'activa' ? 'Suscripción Activa' : 'Período de Prueba Gratis'}
          </h3>
          <span style={{ fontSize: '2rem' }}>💳</span>
        </div>
        
        {estadoSuscripcion !== 'activa' ? (
          <>
            <p style={{ color: 'var(--text-primary)' }}>
              Te quedan <strong>{diasRestantesPrueba > 0 ? diasRestantesPrueba : 0} días</strong> de prueba gratuita. Ingresa una tarjeta para asegurar que tus cajeros no pierdan acceso.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} style={{ marginRight: '8px' }}/>
                Acepto los <a href="#" style={{ color: '#009ee3' }}>Términos y Condiciones</a>
              </label>
              <button onClick={handlePayment} disabled={isProcessingPayment} style={{ background: '#009ee3', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: isProcessingPayment ? 'not-allowed' : 'pointer', width: 'fit-content', opacity: isProcessingPayment ? 0.7 : 1 }}>
                {isProcessingPayment ? 'Conectando...' : 'Suscribirse ($45.000 ARS/mes)'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)' }}>Tu supermercado está protegido y con acceso total al sistema 5inco. El cobro se realiza mensualmente.</p>
            <button onClick={() => setShowCancelModal(true)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', width: 'fit-content', fontSize: '0.9rem' }}>
              Dar de baja suscripción
            </button>
            
            {showCancelModal && (
              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px dashed #ef4444' }}>
                <h4 style={{ color: '#ef4444', margin: '0 0 8px 0' }}>¿Estás absolutamente seguro?</h4>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', margin: '0 0 16px 0' }}>Al dar de baja la suscripción, tus cajeros no podrán llamar clientes y las pantallas dejarán de funcionar al final de tu ciclo de facturación.</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowCancelModal(false)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-glass)', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={handleCancelSubscription} style={{ background: '#ef4444', color: '#fff', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Sí, Dar de Baja</button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Sección: Generar QR del Local (General) */}
      <section className="flex-col gap-sm" style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-glass)' }}>
        <div className="flex-between">
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Código QR General (Entrada)</h3>
          <span style={{ fontSize: '2rem' }}>📱</span>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Imprime este código y colócalo en la entrada del local para que los clientes se unan a la fila digital.</p>
        
        {origin && (
          <div className="flex-center" style={{ padding: '24px', background: '#fff', borderRadius: '12px', width: 'fit-content', margin: '0 auto' }}>
            <QRCodeCanvas id="qr-local" value={urlLocal} size={200} />
          </div>
        )}
        <p className="flex-center" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{urlLocal}</p>
        <button onClick={downloadQR} style={{ margin: '0 auto', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', background: 'var(--accent-primary)', color: 'var(--accent-contrast)', border: 'none', fontWeight: 'bold' }}>
          📥 Descargar QR del Local
        </button>
      </section>

      {/* Sección: Servidor de Notificaciones WhatsApp */}
      <section className="flex-col gap-sm" style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-md)', border: '2px solid #25D366' }}>
        <div className="flex-between">
          <h3 style={{ margin: 0, color: '#25D366' }}>Motor de Notificaciones WhatsApp Local</h3>
          <span style={{ fontSize: '2rem' }}>💬</span>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Conecta el número oficial de este supermercado asegurándote de tener corriendo el servidor de WhatsApp (`node whatsapp-server.js`).</p>
        
        <div className="flex-center" style={{ margin: '16px 0', padding: '24px', background: 'var(--bg-primary)', border: '1px dashed #25D366', borderRadius: '12px' }}>
          <WhatsAppConnection slug={slug} />
        </div>
      </section>

      {/* Sección: Gestión de Cajas */}
      <section className="flex-col gap-md" style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-glass)' }}>
        <div className="flex-between">
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Gestión de Cajas y Accesos</h3>
          <span style={{ fontSize: '2rem' }}>🛒</span>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Crea las cajas. Pásale el enlace o el QR al cajero para que ingrese su clave.</p>
        
        <form onSubmit={agregarCaja} className="flex-col gap-sm" style={{ background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{editandoId ? 'Editar Caja' : 'Abrir nueva caja'}</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Nombre (Ej: Caja 2)" 
              value={nuevaCaja}
              onChange={(e) => setNuevaCaja(e.target.value)}
              style={{ flex: '1 1 200px', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
            <input 
              type="text" 
              placeholder="Clave numérica" 
              value={nuevaClave}
              onChange={(e) => setNuevaClave(e.target.value)}
              style={{ flex: '1 1 150px', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
            <input 
              type="text" 
              placeholder="Nombre Cajero (Para métricas)" 
              value={nuevoNombreCajero}
              onChange={(e) => setNuevoNombreCajero(e.target.value)}
              style={{ flex: '1 1 200px', padding: '12px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={esEspecial} onChange={(e) => setEsEspecial(e.target.checked)} />
              Es Caja Especial (Rápida, Prioridad, etc.)
            </label>
            {esEspecial && (
              <input 
                type="text" 
                placeholder="Cartel (Ej: Solo menos de 10 artículos)" 
                value={mensajeEspecial}
                onChange={(e) => setMensajeEspecial(e.target.value)}
                style={{ flex: '1 1 200px', padding: '8px', background: 'var(--bg-primary)', border: '1px dashed var(--accent-primary)', borderRadius: '6px', color: 'var(--text-primary)' }}
              />
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              {editandoId && (
                <button type="button" onClick={cancelarEdicion} style={{ padding: '12px 16px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer' }}>
                  Cancelar
                </button>
              )}
              <button type="submit" style={{ padding: '12px 24px', background: 'var(--accent-primary)', color: 'var(--accent-contrast)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editandoId ? 'Guardar Cambios' : 'Añadir Caja'}
              </button>
            </div>
          </div>
        </form>

        <div className="flex-col gap-lg" style={{ marginTop: '16px' }}>
          {cajas.map(caja => {
            const urlCajero = `${origin}/${slug}/caja/${caja.id}`;
            return (
              <div key={caja.id} className="flex-col gap-md" style={{ padding: '16px', border: '1px solid var(--border-glass)', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-primary)' }}>
                <div className="flex-between">
                  <div className="flex-col gap-sm">
                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-primary)' }}>
                      {caja.nombre} {caja.es_especial && <span style={{ fontSize: '0.7rem', background: '#eab308', color: '#000', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle' }}>ESPECIAL</span>}
                    </h4>
                    {caja.es_especial && caja.mensaje_especial && (
                      <span style={{ fontSize: '0.8rem', color: '#eab308' }}>⚠️ {caja.mensaje_especial}</span>
                    )}
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Clave de Acceso: <strong style={{ color: 'var(--text-primary)' }}>{caja.clave_acceso}</strong></span>
                    {caja.nombre_cajero && (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cajero Asignado: <strong style={{ color: 'var(--text-primary)' }}>{caja.nombre_cajero}</strong></span>
                    )}
                    <span style={{ color: caja.activa ? '#22c55e' : '#ef4444', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      Estado: {caja.activa ? '🟢 Operativa (Logueada)' : '🔴 Cerrada (Sin Sesión)'}
                    </span>
                  </div>
                  {origin && (
                    <div className="flex-col gap-sm" style={{ alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => iniciarEdicion(caja)} style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '6px', cursor: 'pointer' }}>✏️ Editar</button>
                        <button onClick={() => eliminarCaja(caja.id)} style={{ padding: '8px 12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px', cursor: 'pointer' }}>🗑️ Eliminar</button>
                      </div>
                      <div style={{ padding: '8px', background: '#fff', borderRadius: '8px' }}>
                        <QRCodeCanvas value={urlCajero} size={80} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-col gap-sm" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Enlace directo para el cajero:</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="text" readOnly value={urlCajero} style={{ flex: 1, fontSize: '0.8rem', padding: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)', borderRadius: '6px' }} />
                    <button onClick={() => copyToClipboard(urlCajero)} style={{ padding: '8px 12px', fontSize: '0.8rem', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)', borderRadius: '6px', cursor: 'pointer' }}>Copiar</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sección: Personalización VISUAL */}
      <section className="flex-col gap-sm" style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-md)', border: `2px solid var(--accent-primary)` }}>
        <div className="flex-between">
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Personalización de la Landing Page</h3>
          <span style={{ fontSize: '2rem' }}>🎨</span>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Los cambios que hagas aquí afectarán los colores y formas de tu página pública (lo que ve el cliente).</p>
        
        <div className="flex-col gap-sm" style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-glass)' }}>
          <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Banner Superior y Logo</h4>
          <div className="flex-between" style={{ marginTop: '8px' }}>
            <label style={{ position: 'relative', width: '100%', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px dashed var(--accent-primary)', cursor: 'pointer', backgroundImage: `url(${banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }} className="flex-center">
              <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Cambiar Portada</span>
              <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
            </label>
            <label style={{ position: 'absolute', width: '60px', height: '60px', borderRadius: '50%', background: '#fff', border: '2px solid var(--accent-primary)', marginLeft: '16px', marginTop: '40px', zIndex: 10, cursor: 'pointer', backgroundImage: `url(${logo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} className="flex-center">
               <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px', borderRadius: '50%', fontSize: '1.2rem' }}>📷</span>
               <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
            </label>
          </div>
        </div>

        <div className="flex-col gap-sm" style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-glass)', marginTop: '24px' }}>
          <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Identidad de Marca</h4>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
            <div className="flex-col gap-sm" style={{ flex: '1 1 150px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Color Principal (Auto-Contraste)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{brandColor.toUpperCase()}</span>
              </div>
            </div>
            
            <div className="flex-col gap-sm" style={{ flex: '1 1 150px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tema del Panel</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setTheme('claro')} 
                  style={{ flex: 1, minWidth: '80px', padding: '8px', borderRadius: '6px', cursor: 'pointer', background: theme === 'claro' ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: theme === 'claro' ? 'var(--accent-contrast)' : 'var(--text-primary)', border: '1px solid var(--border-glass)' }}
                >
                  ☀️ Claro
                </button>
                <button 
                  onClick={() => setTheme('oscuro')} 
                  style={{ flex: 1, minWidth: '80px', padding: '8px', borderRadius: '6px', cursor: 'pointer', background: theme === 'oscuro' ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: theme === 'oscuro' ? 'var(--accent-contrast)' : 'var(--text-primary)', border: '1px solid var(--border-glass)' }}
                >
                  🌙 Oscuro
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Horarios de Atención */}
        <div className="flex-col gap-sm" style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-glass)', marginTop: '24px' }}>
          <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Horarios de Atención</h4>
          <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-muted)' }}>Define cuándo está abierto tu local. Fuera de este horario, los clientes no podrán sacar turnos.</p>
          <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--accent-primary)' }}>
              <strong>Instrucciones:</strong> Puedes definir dos turnos por día (Ej: 08:00 a 13:00 y 17:00 a 21:00). 
              Si trabajas de corrido, llena solo el Turno Mañana (Ej: 08:00 a 22:00) y deja el Turno Tarde vacío. 
              Si un día cierras, deja todos los campos de ese día vacíos.
            </p>
          </div>
          
          <div className="flex-col gap-sm" style={{ marginTop: '8px' }}>
            {Object.keys(defaultHorarios).map((dia) => (
              <div key={dia} style={{ display: 'flex', flexDirection: 'column', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize', marginBottom: '8px' }}>{dia}</strong>
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flex: 1, gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '60px' }}>Mañana:</span>
                    <input type="time" value={horarios[dia]?.m1 || ''} onChange={(e) => setHorarios({ ...horarios, [dia]: { ...horarios[dia], m1: e.target.value } })} style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '4px', borderRadius: '4px' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>a</span>
                    <input type="time" value={horarios[dia]?.m2 || ''} onChange={(e) => setHorarios({ ...horarios, [dia]: { ...horarios[dia], m2: e.target.value } })} style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '4px', borderRadius: '4px' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flex: 1, gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '60px' }}>Tarde:</span>
                    <input type="time" value={horarios[dia]?.t1 || ''} onChange={(e) => setHorarios({ ...horarios, [dia]: { ...horarios[dia], t1: e.target.value } })} style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '4px', borderRadius: '4px' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>a</span>
                    <input type="time" value={horarios[dia]?.t2 || ''} onChange={(e) => setHorarios({ ...horarios, [dia]: { ...horarios[dia], t2: e.target.value } })} style={{ flex: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '4px', borderRadius: '4px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-col gap-sm" style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-glass)', marginTop: '24px' }}>
          <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Gestor de Carrusel (Anuncios)</h4>
          <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-muted)' }}>Añade fotos de ofertas y políticas que aparecerán en la pantalla de inicio del cliente.</p>
          
          <div className="flex-col gap-sm" style={{ marginTop: '8px' }}>
            {anuncios.map(anuncio => (
              <div key={anuncio.id} className="flex-col gap-md" style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-glass)', position: 'relative' }}>
                <button 
                  onClick={() => setAnuncios(anuncios.filter(a => a.id !== anuncio.id))} 
                  style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px 12px', fontSize: '0.8rem', color: '#fff', background: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Eliminar Banner
                </button>
                
                <div style={{ width: '100%', height: '150px', backgroundImage: `url(${anuncio.image})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px', border: '1px solid var(--border-glass)' }}></div>
                
                <div className="flex-col gap-sm" style={{ width: '100%' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Título de la Oferta / Promoción</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Descuento en frutas..." 
                    value={anuncio.title}
                    onChange={(e) => setAnuncios(anuncios.map(a => a.id === anuncio.id ? { ...a, title: e.target.value } : a))}
                    style={{ width: '100%', fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '10px' }}
                  />
                  
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Descripción Corta (Condiciones o detalles)</label>
                  <textarea 
                    placeholder="Ej: 20% de descuento todos los jueves pagando con efectivo..." 
                    value={anuncio.desc}
                    onChange={(e) => setAnuncios(anuncios.map(a => a.id === anuncio.id ? { ...a, desc: e.target.value } : a))}
                    style={{ width: '100%', fontSize: '0.9rem', color: 'var(--text-primary)', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '10px', minHeight: '80px', resize: 'vertical' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <label style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-secondary)', border: '1px dashed var(--accent-primary)', color: 'var(--accent-primary)', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Agregar Oferta o Imagen
            <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, 'anuncio')} />
          </label>
        </div>

        {/* Botón Flotante/Fijo de Guardado */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          {saveMessage && <span style={{ color: saveMessage.includes('✅') ? '#22c55e' : '#ef4444' }}>{saveMessage}</span>}
          <button 
            onClick={saveConfig} 
            disabled={isSaving}
            style={{ padding: '16px 32px', borderRadius: '8px', background: 'var(--accent-primary)', color: 'var(--accent-contrast)', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: isSaving ? 0.7 : 1 }}
          >
            {isSaving ? 'Guardando...' : '💾 Guardar Diseño Público'}
          </button>
        </div>

      </section>
      
    </div>
  );
}
