-- 1. Crear tabla para las sesiones de WhatsApp
CREATE TABLE public.whatsapp_sesiones (
    slug VARCHAR(255) PRIMARY KEY,
    status VARCHAR(50) DEFAULT 'desconectado',
    qr_code TEXT,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla para los mensajes pendientes de WhatsApp
CREATE TABLE public.whatsapp_mensajes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug VARCHAR(255) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, enviado, error
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar seguridad mínima (RLS) pero permitir acceso completo de momento
-- Dado que solo se usa internamente, permitimos lectura/escritura publica (la seguridad la manejaremos a nivel de Vercel/Nodejs)
ALTER TABLE public.whatsapp_sesiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access whatsapp_sesiones" ON public.whatsapp_sesiones FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public full access whatsapp_mensajes" ON public.whatsapp_mensajes FOR ALL TO public USING (true) WITH CHECK (true);

-- 4. Habilitar la transmisión en Tiempo Real para whatsapp_mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_mensajes;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_sesiones;
