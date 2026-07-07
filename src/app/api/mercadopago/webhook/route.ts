import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    // MercadoPago envía la info de notificación en query params o body
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || url.searchParams.get('type');
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');
    
    // Si la acción es "payment", procesamos el pago
    if ((action === 'payment' || url.searchParams.get('topic') === 'payment') && dataId) {
      
      const client = new (require('mercadopago').MercadoPagoConfig)({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
      const payment = new (require('mercadopago').Payment)(client);
      
      const paymentData = await payment.get({ id: dataId });
      
      if (paymentData) {
        // external_reference tiene el ID de nuestro local (lo seteamos en la creación de la preferencia)
        const localId = paymentData.external_reference;
        const status = paymentData.status; // 'approved', 'rejected', 'in_process', etc.
        
        if (localId) {
          // Si el pago está aprobado
          if (status === 'approved') {
            await supabase
              .from('locales')
              .update({ estado_suscripcion: 'activa' })
              .eq('id', localId);
          } 
          // Si fue rechazado
          else if (status === 'rejected' || status === 'cancelled' || status === 'refunded') {
            await supabase
              .from('locales')
              .update({ estado_suscripcion: 'vencida' })
              .eq('id', localId);
          }
        }
      }
    }

    // MercadoPago exige que siempre respondamos 200 OK rápido
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error en Webhook de MercadoPago:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
