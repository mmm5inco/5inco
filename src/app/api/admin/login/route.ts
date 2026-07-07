import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    // Compara la contraseña recibida con la variable de entorno
    if (password === process.env.CEO_PASSWORD) {
      // Si es correcta, crea una cookie HttpOnly válida por 1 día
      const cookieStore = await cookies();
      cookieStore.set({
        name: 'ceo_auth_token',
        value: 'authenticated',
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24,
        sameSite: 'strict',
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Clave incorrecta' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error procesando login' }, { status: 500 });
  }
}
