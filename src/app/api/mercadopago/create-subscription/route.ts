import { NextResponse } from 'next/server';
import { PreApprovalPlan, MercadoPagoConfig } from 'mercadopago';
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
    const preApprovalPlan = new PreApprovalPlan(client);

    // 3. Crear el plan de suscripción recurrente
    const origin = request.headers.get('origin') || request.headers.get('referer');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || origin || 'https://5inco.com.ar';
    
    const body = {
      reason: 'Suscripción Mensual - 5inco SaaS',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 45000,
        currency_id: 'ARS'
      },
      back_url: `${baseUrl}/${slug}/admin`,
      external_reference: localId, // Identificador de nuestro supermercado
    };

    // @ts-ignore
    const response = await preApprovalPlan.create({ body });

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
