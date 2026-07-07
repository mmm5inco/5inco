-- 1. Asegurar que RLS esté habilitado en el bucket (por seguridad general)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que cualquier usuario (incluso anónimos) pueda subir archivos al bucket "banners"
CREATE POLICY "Permitir subidas publicas a banners"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'banners');

-- 3. Permitir que cualquier usuario pueda leer y descargar los archivos del bucket "banners"
CREATE POLICY "Permitir lectura publica a banners"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'banners');

-- 4. Permitir que los usuarios actualicen los archivos del bucket "banners"
CREATE POLICY "Permitir actualizacion publica a banners"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'banners');

-- 5. Permitir eliminar (opcional, por si el administrador borra un anuncio)
CREATE POLICY "Permitir eliminar publica a banners"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'banners');
