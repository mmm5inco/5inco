'use client';

export default function AgencyFooter() {
  return (
    <footer style={{
      marginTop: '60px',
      padding: '40px 20px',
      borderTop: '1px solid var(--border-glass)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      background: 'rgba(0,0,0,0.2)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Potenciado por
        </p>
        
        <a 
          href="https://mmmtodoloquequiero.com.ar" 
          target="_blank" 
          rel="noopener noreferrer"
          className="agency-logo-container"
          style={{
            display: 'inline-block',
            textDecoration: 'none',
            padding: '16px',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid transparent',
          }}
        >
          {/* Usamos un texto grande como placeholder hasta que se suba el logo real */}
          <h2 
            style={{ 
              fontSize: '1.8rem', 
              fontWeight: '900', 
              margin: '0 0 8px 0',
              background: 'linear-gradient(45deg, #38bdf8, #818cf8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              lineHeight: 1.2
            }}
          >
            Todo lo que quiero
          </h2>
          <p style={{ 
            fontSize: '0.85rem', 
            color: '#a1a1aa', 
            margin: 0,
            fontWeight: '500',
            textAlign: 'center'
          }}>
            Creamos soluciones tecnológicas para los negocios
          </p>
        </a>
      </div>

      <style jsx>{`
        .agency-logo-container:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.4), 0 0 40px rgba(129, 140, 248, 0.2);
          border: 1px solid rgba(56, 189, 248, 0.3) !important;
          background: rgba(255,255,255,0.05) !important;
        }
      `}</style>
    </footer>
  );
}
