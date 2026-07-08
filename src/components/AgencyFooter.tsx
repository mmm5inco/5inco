'use client';

export default function AgencyFooter() {
  return (
    <footer style={{
      marginTop: '60px',
      padding: '40px 20px',
      borderTop: '1px solid rgba(214, 171, 85, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(214, 171, 85, 0.03) 100%)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Potenciado por
        </p>
        
        <a 
          href="https://mmmtodoloquequiero.com.ar" 
          target="_blank" 
          rel="noopener noreferrer"
          className="agency-logo-container"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            padding: '20px 24px',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(214, 171, 85, 0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <img 
            src="/logo-mmm.png" 
            alt="Todo lo que quiero Logo" 
            style={{ 
              width: '140px', 
              height: 'auto',
              borderRadius: '8px',
              border: '1px solid rgba(214, 171, 85, 0.15)',
              marginBottom: '12px',
              transition: 'all 0.3s ease'
            }} 
          />
          
          <p style={{ 
            fontSize: '0.85rem', 
            color: '#d6ab55', 
            margin: 0,
            fontWeight: '600',
            textAlign: 'center',
            letterSpacing: '0.5px'
          }}>
            Creamos soluciones tecnológicas para los negocios
          </p>
        </a>
      </div>

      <style jsx>{`
        .agency-logo-container:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 25px rgba(214, 171, 85, 0.3), 0 0 50px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(214, 171, 85, 0.4) !important;
          background: rgba(15, 15, 15, 0.8) !important;
        }
        .agency-logo-container:hover img {
          border-color: rgba(214, 171, 85, 0.4);
          transform: scale(1.02);
        }
      `}</style>
    </footer>
  );
}
