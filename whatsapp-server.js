const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// clients will map local_slug to { instance: Client, status: string, qr: string }
const clients = {};

console.log('Iniciando Motor Multi-Tenant de WhatsApp...');

// Función para inicializar un nuevo cliente
const initializeClient = (slug) => {
    console.log(`[${slug}] Inicializando cliente...`);
    
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
        clients[slug].qr = await qrcode.toDataURL(qr);
    });

    client.on('ready', () => {
        console.log(`[${slug}] ✅ Cliente Conectado y Listo!`);
        clients[slug].status = 'connected';
        clients[slug].qr = '';
    });

    client.on('authenticated', () => {
        console.log(`[${slug}] ✅ Autenticación Exitosa`);
        clients[slug].status = 'connected';
    });

    client.on('auth_failure', msg => {
        console.error(`[${slug}] ❌ Fallo la Autenticación`, msg);
        clients[slug].status = 'disconnected';
    });

    client.on('disconnected', (reason) => {
        console.log(`[${slug}] ❌ Cliente Desconectado`, reason);
        clients[slug].status = 'disconnected';
        clients[slug].qr = '';
    });

    client.initialize().catch(err => {
        console.error(`[${slug}] Error inicializando:`, err);
    });
};

// -- API ENDPOINTS --

// Estado actual (Para que Next.js sepa qué mostrar)
app.get('/api/whatsapp/status', (req, res) => {
    const { slug } = req.query;
    
    if (!slug) {
        return res.status(400).json({ error: 'Falta slug' });
    }

    if (!clients[slug]) {
        // Inicializar on-demand
        initializeClient(slug);
    }

    res.json({
        status: clients[slug].status,
        qr: clients[slug].qr
    });
});

// Enviar Mensaje
app.post('/api/whatsapp/send', async (req, res) => {
    try {
        const { slug, number, message } = req.body;
        
        if (!slug) {
            return res.status(400).json({ error: 'Falta slug del local' });
        }

        const localClient = clients[slug];
        
        if (!localClient || localClient.status !== 'connected') {
            return res.status(400).json({ error: 'WhatsApp no está conectado para este local' });
        }
        
        if (!number || !message) {
            return res.status(400).json({ error: 'Falta número o mensaje' });
        }

        // Formateo de numero
        let chatId = `${number.replace(/\D/g, '')}`;
        if (!chatId.startsWith('549')) {
            if (chatId.startsWith('299')) {
                chatId = `549${chatId}`;
            }
        }
        chatId = `${chatId}@c.us`;
        
        await localClient.instance.sendMessage(chatId, message);
        console.log(`[${slug}] Mensaje enviado a ${chatId}`);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        res.status(500).json({ error: 'Error interno al enviar' });
    }
});

const PORT = 3333;
app.listen(PORT, () => {
    console.log(`🚀 Microservicio Multi-Tenant corriendo en http://localhost:${PORT}`);
});
