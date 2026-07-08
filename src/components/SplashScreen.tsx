'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Mantener la pantalla visible por 1.5 segundos
    const timer = setTimeout(() => {
      setIsFading(true);
      
      // Esperar a que termine la animación de fade-out antes de desmontar (500ms)
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
        color: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        {/* Usamos un texto grande como placeholder hasta que se suba el logo real */}
        <h1 
          style={{ 
            fontSize: '3rem', 
            fontWeight: '900', 
            margin: 0,
            background: 'linear-gradient(45deg, #38bdf8, #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            lineHeight: 1.1
          }}
        >
          Todo lo que quiero
        </h1>
        
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#a1a1aa', 
          margin: 0,
          fontWeight: '500',
          textAlign: 'center',
          maxWidth: '80%'
        }}>
          Creamos soluciones tecnológicas para los negocios
        </p>
      </div>

      <style jsx global>{`
        body {
          overflow: ${isVisible ? 'hidden' : 'auto'};
        }
      `}</style>
    </div>
  );
}
