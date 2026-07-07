import React from 'react';
import Image from 'next/image';

export default function PoweredByFooter() {
  return (
    <footer style={{
      marginTop: 'auto',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      opacity: 0.8,
      transition: 'opacity 0.3s ease',
    }}
    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
    >
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Desarrollado por</span>
      <a 
        href="https://www.mmmtodoloquequiero.com.ar" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ display: 'inline-block', transition: 'transform 0.2s ease' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <img 
          src="/logo-mmm.png" 
          alt="MMM Todo Lo Que Quiero" 
          style={{ height: '40px', width: 'auto', borderRadius: '8px' }} 
        />
      </a>
    </footer>
  );
}
