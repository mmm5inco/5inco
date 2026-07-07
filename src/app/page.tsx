export default function Home() {
  return (
    <div className="flex-col gap-xl" style={{ minHeight: 'calc(100vh - 48px)', justifyContent: 'center' }}>
      
      {/* Header */}
      <div className="flex-col gap-sm" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem' }}>
          5<span className="text-gradient">inco</span>
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem' }}>
          El fin de las filas físicas
        </p>
      </div>

      {/* Main Actions */}
      <div className="flex-col gap-md">
        
        <div className="glass-card flex-col gap-sm" style={{ border: '1px solid var(--accent-primary)' }}>
          <div className="flex-between">
            <span style={{ fontSize: '2rem' }}>🏢</span>
            <span className="text-accent" style={{ fontWeight: 600 }}>Para Comercios</span>
          </div>
          <h3>¿Tienes un local?</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Únete a 5inco y elimina las colas en tus cajas. Gestiona turnos, agrega publicidad y fideliza clientes.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <a href="/registro-negocio" className="btn-primary" style={{ flex: 1 }}>
              Registrarme como negocio
            </a>
            <a href="/login-negocio" className="btn-secondary">
              Ingresar
            </a>
          </div>
        </div>

        <div className="glass-card flex-col gap-sm">
          <div className="flex-between">
            <span style={{ fontSize: '2rem' }}>🛒</span>
            <span style={{ fontWeight: 600 }}>Para Clientes</span>
          </div>
          <h3>Demo Cliente</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            Escanea un QR para pedir turno en un local y sigue comprando.
          </p>
          <a href="/demo-local" className="btn-secondary" style={{ marginTop: '8px' }}>
            Ver Vista Cliente
          </a>
        </div>

      </div>
      
      <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '24px' }}>
        <p className="text-muted" style={{ fontSize: '0.8rem' }}>
          Plataforma de Turnos Inteligentes
        </p>
      </div>
    </div>
  );
}
