import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { turnoId } = await request.json();

    if (!turnoId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Actualizamos el turno para indicar que se está cediendo
    const { data, error } = await supabaseAdmin
      .from('turnos')
      .update({ cediendo: true })
      .eq('id', turnoId)
      .eq('estado', 'esperando') // Solo si sigue esperando
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, turno: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
