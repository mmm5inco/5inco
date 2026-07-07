-- 1. Permitir que CUALQUIERA (público) pueda ver/descargar los archivos en banners
CREATE POLICY "Permitir lectura publica banners" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'banners');

-- 2. Permitir que CUALQUIERA (público/anon) pueda subir nuevos archivos en banners
CREATE POLICY "Permitir subida publica banners" 
ON storage.objects FOR INSERT TO public 
WITH CHECK (bucket_id = 'banners');

-- 3. Permitir que CUALQUIERA (público/anon) pueda actualizar archivos en banners
CREATE POLICY "Permitir actualizar publica banners" 
ON storage.objects FOR UPDATE TO public 
USING (bucket_id = 'banners');
