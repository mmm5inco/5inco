# Estado del Proyecto: 5inco

## Contexto y Perfil
El usuario busca eficiencia y automatización extrema (cero fricción). Actuamos como su socio tecnológico y director creativo. 
El proyecto es una aplicación web (PWA) multi-tenant orientada a eliminar las colas físicas.
**Objetivo UX Principal:** Reducir el tiempo de espera físico a CERO. Diseño premium, intuitivo y con funcionalidades que la IA gestione sola (ej. asignación inteligente de caja).

## Decisiones y Por Qué lo Hacemos
- **Stack elegido:** Next.js + CSS Vanilla (estética premium) + Supabase (PostgreSQL Realtime).
- **Flujo PWA vs WhatsApp:** Se decidió que la app sea una PWA para evitar compartir números de teléfono del staff y costos de APIs. Todo sucede in-app.
- **Algoritmo de Asignación:** El sistema decidirá a qué caja va el cliente para balancear las colas de forma automática.
- **Gamificación (Puntos):** Se integró un sistema de puntos que el cliente gana al comprar y que puede canjear para "saltar la fila" cuando tiene urgencia.
- **Código de Verificación:** Para seguridad y evitar robos de turno, la app genera un código alfanumérico corto (ej. A2B) cuando llama al cliente, el cual el cajero debe pedir.
- **Gestión de Tiempos:** Funciones para el cajero de llamar anticipadamente, saltar o pausar clientes, y un botón "Estoy yendo" para el usuario.

## Estado Actual
- **Fase:** Backend y UI Híbrida completamente sincronizados.
- **Acción Reciente:** 
  - Integración Realtime completada: Las Cajas, Turnos y el Panel de Administrador leen y escriben en Supabase (PostgreSQL).
  - Implementación del Motor de Cajas Especiales (Rápida/Prioridad) con balanceo automático a fila general si quedan vacías.
  - Implementación de estado Activo/Inactivo de cajeros y cálculo de Tiempo Estimado.
  - Configuración RLS (Row Level Security) aplicada en DB para permitir a los clientes ingresar de manera pública.

## Impacto (Dependencias)
- Toda la base de datos se estructurará ahora pensando en `puntos` para los clientes y `códigos de verificación` en los turnos.
- La versión de Next.js 16 instalada requiere un tratamiento asíncrono estricto de las `cookies()` del servidor.
- **Rutas Dinámicas:** El panel de administración y los accesos a cajas residen en la ruta `/[slug]`.
- **Estrategia de Negocio:** Se ha creado un documento de análisis (`analisis_negocio.md`) con los esquemas de monetización y retención de supermercados, validando el modelo AdSense para filas cruzadas no competidoras.
