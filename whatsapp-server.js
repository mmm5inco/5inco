require('dotenv').config({ path: '.env.local' });
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibwvbkedilplcxoqpnlr.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid3Zia2VkaWxwbGN4b3FwbmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4OTk5NCwiZXhwIjoyMDk4MjY1OTk0fQ.EiGazZIt0I0APXJhxOvJV8gcvSO8sSj0kC239x2gRe0';

const supabase = createClient(supabaseUrl, supabaseKey);

// clients will map local_slug to { instance: Client, status: string, qr: string }
const clients = {};

console.log('Iniciando Puente Mágico de WhatsApp con Supabase...');

// Función para actualizar el estado en Supabase
const updateSupabaseSession = async (slug, status, qr = '') => {
    await supabase
        .from('whatsapp_sesiones')
        .upsert({ slug, status, qr_code: qr, actualizado_en: new Date().toISOString() });
};

// Función para inicializar un nuevo cliente
const initializeClient = async (slug) => {
    if (clients[slug]) return; // ya inicializado

    console.log(`[${slug}] Inicializando cliente local...`);
    
    const client = new Client({
        authStrategy: new LocalAuth({ 
            clientId: slug, 
            dataPath: './whatsapp-sessions' 
        }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
        }
    });

    clients[slug] = {
        instance: client,
        status: 'disconnected',
        qr: ''
    };

    client.on('qr', async (qr) => {
        console.log(`[${slug}] NUEVO QR RECIBIDO. Escanea desde el Panel de Administrador.`);
        clients[slug].status = 'qr';
        const qrUrl = await qrcode.toDataURL(qr);
        clients[slug].qr = qrUrl;
        await updateSupabaseSession(slug, 'qr', qrUrl);
    });

    client.on('ready', async () => {
        console.log(`[${slug}] ✅ Cliente Conectado y Listo!`);
        clients[slug].status = 'connected';
        clients[slug].qr = '';
        await updateSupabaseSession(slug, 'connected', '');
    });

    client.on('authenticated', () => {
        console.log(`[${slug}] ✅ Autenticación Exitosa`);
    });

    client.on('auth_failure', async msg => {
        console.error(`[${slug}] ❌ Fallo la Autenticación`, msg);
        clients[slug].status = 'disconnected';
        await updateSupabaseSession(slug, 'disconnected', '');
    });

    client.on('disconnected', async (reason) => {
        console.log(`[${slug}] ❌ Cliente Desconectado`, reason);
        clients[slug].status = 'disconnected';
        clients[slug].qr = '';
        await updateSupabaseSession(slug, 'disconnected', '');
    });

    client.initialize().catch(err => {
        console.error(`[${slug}] Error inicializando:`, err);
    });
};

// Cargar todas las sesiones activas en la BD e inicializarlas
const loadSessions = async () => {
    const { data } = await supabase.from('locales').select('slug');
    if (data) {
        for (const local of data) {
            await initializeClient(local.slug);
        }
    }
};

// --- ESCUCHAR NUEVOS MENSAJES DESDE VERCEL VÍA SUPABASE ---
supabase
  .channel('mensajes_pendientes')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'whatsapp_mensajes', filter: "estado=eq.pendiente" },
    async (payload) => {
      const msj = payload.new;
      console.log(`🔔 Nuevo mensaje detectado en DB para [${msj.slug}] hacia ${msj.telefono}`);
      
      const slug = msj.slug;
      
      if (!clients[slug]) {
          await initializeClient(slug);
      }
      
      const localClient = clients[slug];
      
      if (!localClient || localClient.status !== 'connected') {
          console.error(`❌ [${slug}] WhatsApp no está conectado. Mensaje marcado como error.`);
          await supabase.from('whatsapp_mensajes').update({ estado: 'error' }).eq('id', msj.id);
          return;
      }
      
      try {
          // Formateo de numero
          let chatId = `${msj.telefono.replace(/\D/g, '')}`;
          if (!chatId.startsWith('549')) {
              if (chatId.startsWith('299')) {
                  chatId = `549${chatId}`;
              }
          }
          chatId = `${chatId}@c.us`;
          
          await localClient.instance.sendMessage(chatId, msj.mensaje);
          console.log(`✅ [${slug}] Mensaje enviado a ${chatId}`);
          
          await supabase.from('whatsapp_mensajes').update({ estado: 'enviado' }).eq('id', msj.id);
      } catch (error) {
          console.error(`❌ [${slug}] Error enviando mensaje a ${msj.telefono}:`, error);
          await supabase.from('whatsapp_mensajes').update({ estado: 'error' }).eq('id', msj.id);
      }
    }
  )
  .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
          console.log('🎧 Escuchando nuevos mensajes desde Vercel vía Supabase Realtime...');
      }
  });

loadSessions();
