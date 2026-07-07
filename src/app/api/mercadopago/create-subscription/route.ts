import { NextResponse } from 'next/server';
import { PreApproval, MercadoPagoConfig } from 'mercadopago';
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

    // 2. Inicializar MercadoPago con el token del CEO
    const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '' });
    const preApproval = new PreApproval(client);

    // 3. Crear el plan de suscripción (PreApproval)
    // El 'external_reference' es VITAL: es lo que nos dirá QUÉ local pagó cuando el webhook escuche.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const body = {
      back_url: `${baseUrl}/${slug}/admin`, // A dónde vuelve después de pagar
      reason: 'Suscripción Mensual - 5inco SaaS',
      external_reference: localId, // Identificador de nuestro supermercado
      payer_email: user.email, // REQUERIDO POR MERCADOPAGO
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 45000,
        currency_id: 'ARS',
      },
      status: 'pending' // Estado inicial
    };

    const response = await preApproval.create({ body });

    // Guardar temporalmente el ID de la pre-aprobación generada en la BD (opcional)
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
    return NextResponse.json({ error: error.message || 'Error generando suscripción' }, { status: 500 });
  }
}
