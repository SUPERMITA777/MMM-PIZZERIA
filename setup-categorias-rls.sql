
-- =====================================================
-- LIMPIAR POLÍTICAS EXISTENTES PARA CATEGORIAS
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow public uploads to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon to view categorias bucket" ON storage.buckets;

-- =====================================================
-- CREAR POLÍTICAS RLS PARA BUCKET "CATEGORIAS"
-- =====================================================

-- Habilitar RLS si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- Política para permitir que anon vea el bucket categorias
CREATE POLICY "Allow anon to view categorias bucket"
ON storage.buckets 
FOR SELECT 
TO anon
USING (name = 'categorias');

-- Política para permitir que cualquiera suba archivos al bucket categorias
CREATE POLICY "Allow public uploads to categorias bucket"
ON storage.objects 
FOR INSERT 
TO public
WITH CHECK (bucket_id = 'categorias');

-- Política para permitir que cualquiera lea archivos del bucket categorias
CREATE POLICY "Allow public access to categorias bucket"
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'categorias');

-- Política para permitir actualizar archivos del bucket categorias
CREATE POLICY "Allow updates to categorias bucket"
ON storage.objects 
FOR UPDATE 
TO public
USING (bucket_id = 'categorias')
WITH CHECK (bucket_id = 'categorias');

-- Política para permitir eliminar archivos del bucket categorias
CREATE POLICY "Allow deletes from categorias bucket"
ON storage.objects 
FOR DELETE 
TO public
USING (bucket_id = 'categorias');

-- =====================================================
-- VERIFICAR POLÍTICAS CREADAS
-- =====================================================

-- Mostrar todas las políticas para storage.objects relacionadas con categorias
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%categorias%';

-- Mostrar todas las políticas para storage.buckets relacionadas con categorias
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'buckets' 
AND schemaname = 'storage' 
AND policyname LIKE '%categorias%';

\echo '✅ Políticas RLS para bucket categorias configuradas exitosamente'
