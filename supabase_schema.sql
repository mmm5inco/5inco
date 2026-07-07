-- Esquema de Base de Datos para 5inco

-- Habilitar extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Locales
CREATE TABLE public.locales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    ubicacion TEXT,
    configuracion JSONB DEFAULT '{}'::jsonb, -- Para banners, colores, etc.
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Cajas
CREATE TABLE public.cajas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL, -- Ej: "Caja 1", "Caja Rápida"
    estado VARCHAR(50) DEFAULT 'activa', -- activa, inactiva
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Clientes (Usuarios PWA)
CREATE TABLE public.clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(255),
    telefono VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE,
    puntos_acumulados INTEGER DEFAULT 0,
    local_id_ultimo UUID REFERENCES public.locales(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Turnos (Fila Digital)
CREATE TABLE public.turnos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    caja_id UUID REFERENCES public.cajas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    local_id UUID REFERENCES public.locales(id) ON DELETE CASCADE,
    estado VARCHAR(50) DEFAULT 'en_espera', -- en_espera, yendo, llamado, completado, pausado, cancelado
    codigo_verificacion VARCHAR(10), -- Ej: A2B
    es_prioridad BOOLEAN DEFAULT FALSE,
    uso_puntos_salto BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completado_en TIMESTAMP WITH TIME ZONE
);

-- Configuración de Supabase Realtime (Permitir escuchar cambios en Turnos)
ALTER PUBLICATION supabase_realtime ADD TABLE turnos;

-- Políticas RLS básicas (Seguridad)
-- Por ahora permitimos todo para facilitar el desarrollo, luego se debe restringir
ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo locales" ON public.locales FOR ALL USING (true);
CREATE POLICY "Permitir todo cajas" ON public.cajas FOR ALL USING (true);
CREATE POLICY "Permitir todo clientes" ON public.clientes FOR ALL USING (true);
CREATE POLICY "Permitir todo turnos" ON public.turnos FOR ALL USING (true);
