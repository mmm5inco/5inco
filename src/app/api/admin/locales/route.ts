import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Usamos el SERVICE ROLE KEY para hacer consultas de admin brincando el RLS temporalmente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  // Verificar si está autenticado
  const cookieStore = await cookies();
  const token = cookieStore.get('ceo_auth_token');
  if (!token || token.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: locales } = await supabaseAdmin.from('locales').select('*');
  const { count: turnos } = await supabaseAdmin.from('turnos').select('*', { count: 'exact', head: true });

  return NextResponse.json({ locales, turnos });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('ceo_auth_token');
  if (!token || token.value !== 'authenticated') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id, estado_suscripcion } = await request.json();
  const { data, error } = await supabaseAdmin
    .from('locales')
    .update({ estado_suscripcion })
    .eq('id', id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, local: data });
}
