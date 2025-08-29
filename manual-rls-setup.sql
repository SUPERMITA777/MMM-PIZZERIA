-- =====================================================
-- CONFIGURACIÓN MANUAL DE POLÍTICAS RLS PARA BUCKET CATEGORIAS
-- =====================================================
-- Ejecuta este SQL en el Dashboard de Supabase → SQL Editor

-- 1. LIMPIAR POLÍTICAS EXISTENTES (si existen)
DROP POLICY IF EXISTS "Allow anon uploads to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon access to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon updates to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon deletes from categorias bucket" ON storage.objects;

-- 2. HABILITAR RLS EN TABLAS DE STORAGE (si no está habilitado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 3. CREAR POLÍTICAS PARA USUARIOS ANÓNIMOS (anon)
-- Política para permitir subir archivos
CREATE POLICY "Allow anon uploads to categorias bucket" 
ON storage.objects 
FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'categorias');

-- Política para permitir leer archivos
CREATE POLICY "Allow anon access to categorias bucket" 
ON storage.objects 
FOR SELECT 
TO anon
USING (bucket_id = 'categorias');

-- Política para permitir actualizar archivos
CREATE POLICY "Allow anon updates to categorias bucket" 
ON storage.objects 
FOR UPDATE 
TO anon
USING (bucket_id = 'categorias')
WITH CHECK (bucket_id = 'categorias');

-- Política para permitir eliminar archivos
CREATE POLICY "Allow anon deletes from categorias bucket" 
ON storage.objects 
FOR DELETE 
TO anon
USING (bucket_id = 'categorias');

-- 4. VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%categorias%'
ORDER BY policyname;

