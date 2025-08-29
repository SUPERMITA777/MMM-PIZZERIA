-- Políticas RLS para el bucket 'productos'
-- Estas políticas permiten que el anon role pueda subir, ver, actualizar y eliminar imágenes de productos

-- Política para permitir inserción (upload) de imágenes al bucket productos
CREATE POLICY "Allow anon uploads to productos bucket"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'productos');

-- Política para permitir acceso (lectura) a imágenes del bucket productos
CREATE POLICY "Allow anon access to productos bucket"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'productos');

-- Política para permitir actualización de imágenes en el bucket productos
CREATE POLICY "Allow anon updates to productos bucket"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'productos')
WITH CHECK (bucket_id = 'productos');

-- Política para permitir eliminación de imágenes del bucket productos
CREATE POLICY "Allow anon deletes from productos bucket"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'productos');
