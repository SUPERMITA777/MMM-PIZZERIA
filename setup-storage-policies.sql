-- =====================================================
-- CONFIGURACIÓN DE POLÍTICAS DE STORAGE PARA SUPABASE
-- =====================================================

-- Crear bucket si no existe (esto debe hacerse desde el dashboard o con service role)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('imagenes', 'imagenes', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'])
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS PARA BUCKET "IMAGENES"
-- =====================================================

-- Política para permitir insertar objetos en el bucket imagenes
CREATE POLICY "Permitir subir imagenes" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'imagenes'
);

-- Política para permitir leer objetos del bucket imagenes
CREATE POLICY "Permitir leer imagenes" ON storage.objects
FOR SELECT USING (
    bucket_id = 'imagenes'
);

-- Política para permitir actualizar objetos en el bucket imagenes
CREATE POLICY "Permitir actualizar imagenes" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'imagenes'
) WITH CHECK (
    bucket_id = 'imagenes'
);

-- Política para permitir eliminar objetos del bucket imagenes
CREATE POLICY "Permitir eliminar imagenes" ON storage.objects
FOR DELETE USING (
    bucket_id = 'imagenes'
);

-- =====================================================
-- POLÍTICAS PARA BUCKET "CATEGORIAS"
-- =====================================================

-- Política para permitir insertar objetos en el bucket categorias
CREATE POLICY "Permitir subir categorias" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'categorias'
);

-- Política para permitir leer objetos del bucket categorias
CREATE POLICY "Permitir leer categorias" ON storage.objects
FOR SELECT USING (
    bucket_id = 'categorias'
);

-- Política para permitir actualizar objetos en el bucket categorias
CREATE POLICY "Permitir actualizar categorias" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'categorias'
) WITH CHECK (
    bucket_id = 'categorias'
);

-- Política para permitir eliminar objetos del bucket categorias
CREATE POLICY "Permitir eliminar categorias" ON storage.objects
FOR DELETE USING (
    bucket_id = 'categorias'
);

-- =====================================================
-- POLÍTICAS GENERALES PARA BUCKETS
-- =====================================================

-- Política para permitir crear buckets (solo para testing)
CREATE POLICY "Permitir crear buckets" ON storage.buckets
FOR INSERT WITH CHECK (true);

-- Política para permitir leer buckets
CREATE POLICY "Permitir leer buckets" ON storage.buckets
FOR SELECT USING (true);

-- Habilitar RLS en las tablas de storage si no está habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
