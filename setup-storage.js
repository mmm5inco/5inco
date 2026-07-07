const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ibwvbkedilplcxoqpnlr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid3Zia2VkaWxwbGN4b3FwbmxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY4OTk5NCwiZXhwIjoyMDk4MjY1OTk0fQ.EiGazZIt0I0APXJhxOvJV8gcvSO8sSj0kC239x2gRe0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('Creando bucket de banners...');
  const { data, error } = await supabase.storage.createBucket('banners', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  });

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
      console.log('El bucket "banners" ya existe.');
    } else {
      console.error('Error creando bucket:', error);
    }
  } else {
    console.log('Bucket "banners" creado exitosamente.');
  }

  // Set RLS Policies using SQL (Optional, but default is public if created as public)
}

setup();
