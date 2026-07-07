import React from 'react';

export default function TerminosPage() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#333',
      lineHeight: '1.6'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px', color: '#111827' }}>
        Términos y Condiciones de Uso
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '40px' }}>Última actualización: 7 de Julio de 2026</p>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          1. Introducción
        </h2>
        <p>
          Bienvenido a <strong>5inco - Filas Digitales</strong> ("nosotros", "nuestro", "la Plataforma"). Al acceder o utilizar nuestro software como servicio (SaaS), usted ("el Comercio", "el Usuario") acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          2. Descripción del Servicio
        </h2>
        <p>
          5inco provee una plataforma digital que permite a los comercios gestionar filas virtuales, generar códigos QR para escaneo por parte de los clientes y enviar notificaciones automatizadas vía WhatsApp para avisar a los clientes sobre su turno.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          3. Uso de WhatsApp y Responsabilidad
        </h2>
        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
          <li style={{ marginBottom: '8px' }}>El servicio de mensajería utiliza una tecnología de automatización conectada al propio número de WhatsApp del Comercio.</li>
          <li style={{ marginBottom: '8px' }}>Es responsabilidad exclusiva del Comercio cumplir con las políticas comerciales y condiciones de uso oficiales de WhatsApp LLC (Meta).</li>
          <li style={{ marginBottom: '8px' }}><strong>No nos hacemos responsables</strong> por la suspensión, bloqueo o baneo del número de WhatsApp del Comercio derivado del uso de la plataforma.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          4. Cuentas y Seguridad
        </h2>
        <p>
          Para usar el servicio, el Comercio debe registrarse y mantener la confidencialidad de sus credenciales (URL de administración y claves de cajas). El Comercio es responsable de todas las actividades que ocurran bajo su cuenta. Nos reservamos el derecho de suspender cuentas que presenten actividad sospechosa o fraudulenta.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          5. Pagos, Pruebas Gratuitas y Suscripciones
        </h2>
        <p>
          Ofrecemos un período de prueba gratuito de 14 días. Finalizado este plazo, el Comercio deberá suscribirse mediante un pago mensual procesado de forma segura a través de <strong>MercadoPago</strong>.
        </p>
        <ul style={{ paddingLeft: '20px', listStyleType: 'disc', marginTop: '8px' }}>
          <li style={{ marginBottom: '8px' }}>Las tarifas pueden estar sujetas a impuestos locales.</li>
          <li style={{ marginBottom: '8px' }}>La suscripción se renovará automáticamente salvo cancelación previa.</li>
          <li style={{ marginBottom: '8px' }}>No se realizarán reembolsos por períodos parciales de uso.</li>
        </ul>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          6. Limitación de Responsabilidad
        </h2>
        <p>
          5inco se proporciona "tal cual" y "según disponibilidad". No garantizamos que el servicio sea ininterrumpido o libre de errores. Bajo ninguna circunstancia 5inco será responsable por daños indirectos, incidentales, lucro cesante o pérdida de datos derivados del uso de la plataforma (por ejemplo, pérdida de clientes en la fila por cortes de internet).
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          7. Modificaciones
        </h2>
        <p>
          Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento. Si la revisión es material, intentaremos proporcionar un aviso con al menos 30 días de antelación. El uso continuado de nuestro servicio después de cualquier cambio constituye su aceptación de los nuevos Términos.
        </p>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
          8. Contacto
        </h2>
        <p>
          Si tiene alguna pregunta sobre estos Términos, por favor contáctenos a través de nuestro soporte oficial o correo electrónico administrativo.
        </p>
      </section>
      
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px', marginTop: '40px', textAlign: 'center' }}>
        <a href="/" style={{ color: '#009ee3', textDecoration: 'none', fontWeight: 'bold' }}>
          ← Volver al Inicio
        </a>
      </div>
    </div>
  );
}
