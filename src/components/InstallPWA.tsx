"use client";

import { useEffect, useState } from 'react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Registrar el Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('SW registration failed: ', err);
      });
    }

    // Detectar iOS para el mensaje manual (iOS no soporta beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Si ya está instalado, no hacer nada
    if (isStandalone) return;

    // Escuchar el evento de instalación nativo (Android / Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para iOS, mostrar siempre el botón si no está en modo standalone
    if (isIosDevice && !isStandalone) {
      setShowInstallBtn(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      alert('Para instalar en iPhone/iPad:\n1. Toca el botón de Compartir en Safari (cuadrado con flecha hacia arriba).\n2. Selecciona "Agregar a la pantalla de inicio".');
      return;
    }

    if (!deferredPrompt) return;

    // Mostrar el prompt nativo
    deferredPrompt.prompt();
    
    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallBtn(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstallBtn) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'var(--accent-primary)',
      color: '#fff',
      padding: '12px 24px',
      borderRadius: '50px',
      boxShadow: '0 4px 15px rgba(0,255,136,0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      fontWeight: 'bold',
      border: '2px solid rgba(255,255,255,0.2)',
      animation: 'pulse 2s infinite'
    }} onClick={handleInstallClick}>
      <span style={{ fontSize: '1.2rem' }}>📲</span>
      Instalar 5inco
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(0,255,136,0.6); }
          70% { box-shadow: 0 0 0 10px rgba(0,255,136,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,255,136,0); }
        }
      `}</style>
    </div>
  );
}
