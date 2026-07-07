import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { turnoCediendoId, turnoReclamandoId } = await request.json();

    if (!turnoCediendoId || !turnoReclamandoId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // 1. Obtener ambos turnos
    const { data: turnos, error: fetchError } = await supabaseAdmin
      .from('turnos')
      .select('id, created_at, cediendo, estado')
      .in('id', [turnoCediendoId, turnoReclamandoId]);

    if (fetchError || !turnos || turnos.length !== 2) {
      return NextResponse.json({ error: 'Turnos no encontrados' }, { status: 404 });
    }

    const turnoCediendo = turnos.find(t => t.id === turnoCediendoId);
    const turnoReclamando = turnos.find(t => t.id === turnoReclamandoId);

    // 2. Verificar que el turno Cediendo sigue disponible y no fue llamado
    if (!turnoCediendo?.cediendo || turnoCediendo.estado !== 'esperando') {
      return NextResponse.json({ error: 'El turno ya no está disponible' }, { status: 409 }); // 409 Conflict
    }

    // 3. Hacemos el Swap (Intercambio Justo)
    const timeCediendo = turnoCediendo.created_at;
    const timeReclamando = turnoReclamando!.created_at;

    // Actualizamos el que reclama para que tome el lugar antiguo
    const { error: errorReclamando } = await supabaseAdmin
      .from('turnos')
      .update({ created_at: timeCediendo })
      .eq('id', turnoReclamandoId);

    if (errorReclamando) throw errorReclamando;

    // Actualizamos el que cede para que tome el lugar nuevo, y deje de ceder
    const { error: errorCediendo } = await supabaseAdmin
      .from('turnos')
      .update({ created_at: timeReclamando, cediendo: false })
      .eq('id', turnoCediendoId);

    if (errorCediendo) throw errorCediendo;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
