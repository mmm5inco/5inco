import { NextResponse } from 'next/server';
import { Preference, MercadoPagoConfig } from 'mercadopago';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Inicializar Supabase Admin para actualizar la DB (Service Role)
const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createSupabaseClient(supabaseAdminUrl, supabaseAdminKey);

export async function POST(request: Request) {
  try {
    const { localId, slug } = await request.json();

    // 1. Verificación básica de seguridad con Supabase Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      console.error('Falta MERCADOPAGO_ACCESS_TOKEN en las variables de entorno de Vercel');
      return NextResponse.json({ error: 'Error de configuración: Falta Token de MercadoPago en el servidor' }, { status: 500 });
    }

    // 2. Inicializar MercadoPago con el token del CEO
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
    const preference = new Preference(client);

    // 3. Crear el plan de pago (Preference en lugar de Preapproval para evitar error 500)
    // El 'external_reference' es VITAL: es lo que nos dirá QUÉ local pagó cuando el webhook escuche.
    const origin = request.headers.get('origin') || request.headers.get('referer');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin || 'https://5inco.com.ar';
    
    const body = {
      items: [
        {
          id: 'suscripcion_mensual',
          title: 'Suscripción Mensual - 5inco SaaS',
          quantity: 1,
          unit_price: 45000,
          currency_id: 'ARS'
        }
      ],
      back_urls: {
        success: `${baseUrl}/${slug}/admin`,
        failure: `${baseUrl}/${slug}/admin`,
        pending: `${baseUrl}/${slug}/admin`
      },
      auto_return: 'approved',
      notification_url: 'https://5inco.com.ar/api/mercadopago/webhook',
      external_reference: localId, // Identificador de nuestro supermercado
    };

    // @ts-ignore (evitamos error de tipado estricto si lo hay)
    const response = await preference.create({ body });

    // Guardar temporalmente el ID de la preferencia generada en la BD (opcional)
    if (response.id) {
      await supabaseAdmin
        .from('locales')
        .update({ mp_subscription_id: response.id })
        .eq('id', localId);
    }

    // Retornamos el init_point (La URL de pago de MercadoPago)
    return NextResponse.json({ init_point: response.init_point });

  } catch (error: any) {
    console.error('Error generando link de MercadoPago:', error);
    return NextResponse.json({ 
      error: 'Error generando link de pago',
      details: error.message || String(error)
    }, { status: 500 });
  }
}
