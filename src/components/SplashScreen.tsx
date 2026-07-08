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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <img 
          src="/logo-mmm.png" 
          alt="Todo lo que quiero Logo" 
          style={{ 
            width: '240px', 
            height: 'auto',
            borderRadius: '16px',
            boxShadow: '0 0 35px rgba(214, 171, 85, 0.25)',
            border: '2px solid rgba(214, 171, 85, 0.3)',
            animation: 'logoPulse 2s infinite ease-in-out'
          }} 
        />
        
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#d6ab55', 
          margin: 0,
          fontWeight: '600',
          textAlign: 'center',
          maxWidth: '80%',
          letterSpacing: '1px',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)'
        }}>
          Creamos soluciones tecnológicas para los negocios
        </p>
      </div>

      <style jsx global>{`
        body {
          overflow: ${isVisible ? 'hidden' : 'auto'};
        }
        @keyframes logoPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 35px rgba(214, 171, 85, 0.25);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 0 50px rgba(214, 171, 85, 0.45);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 35px rgba(214, 171, 85, 0.25);
          }
        }
      `}</style>
    </div>
  );
}
