import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos el Service Role Key para saltarnos RLS en el webhook
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fallback para dev
);

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // MercadoPago envía notificaciones con "type": "subscription_preapproval"
    // o "action": "payment.created", depende de qué webhook configures.
    
    // Ejemplo de logica (pseudo-código hasta tener credenciales reales):
    if (data.type === 'subscription_preapproval' || data.action === 'payment.created') {
      const subscriptionId = data.data?.id;
      
      if (subscriptionId) {
        // Buscar el local asociado a esta suscripción
        const { data: local } = await supabase
          .from('locales')
          .select('*')
          .eq('mp_preapproval_id', subscriptionId)
          .single();
          
        if (local) {
          // Si el pago pasó, renovar suscripción a activa y extender fecha 30 días
          const nextMonth = new Date();
          nextMonth.setDate(nextMonth.getDate() + 30);

          await supabase.from('locales').update({ 
            estado_suscripcion: 'activa',
            fin_prueba_en: nextMonth.toISOString()
          }).eq('id', local.id);
        }
      }
    }

    // MercadoPago siempre espera un 200 OK rápido
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }
}
