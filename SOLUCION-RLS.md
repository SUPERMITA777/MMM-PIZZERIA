# 🔐 SOLUCIÓN PARA ERROR RLS EN BUCKET CATEGORIAS

## ❌ Problema Identificado
```
StorageApiError: new row violates row-level security policy
```

**Causa:** La aplicación web usa la clave `anon` (usuarios anónimos) pero las políticas RLS del bucket "categorias" no permiten acceso a usuarios anónimos.

## ✅ SOLUCIÓN MANUAL (REQUERIDA)

### Paso 1: Acceder al Dashboard de Supabase
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: `cwulvffuheotxzpocxla`
3. Ve a **SQL Editor** en el menú lateral

### Paso 2: Ejecutar SQL de Configuración
Copia y pega todo este código SQL en el editor y haz clic en **"Run"**:

```sql
-- LIMPIAR POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Allow anon uploads to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon access to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon updates to categorias bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon deletes from categorias bucket" ON storage.objects;

-- HABILITAR RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- CREAR POLÍTICAS PARA USUARIOS ANÓNIMOS
CREATE POLICY "Allow anon uploads to categorias bucket" 
ON storage.objects 
FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'categorias');

CREATE POLICY "Allow anon access to categorias bucket" 
ON storage.objects 
FOR SELECT 
TO anon
USING (bucket_id = 'categorias');

CREATE POLICY "Allow anon updates to categorias bucket" 
ON storage.objects 
FOR UPDATE 
TO anon
USING (bucket_id = 'categorias')
WITH CHECK (bucket_id = 'categorias');

CREATE POLICY "Allow anon deletes from categorias bucket" 
ON storage.objects 
FOR DELETE 
TO anon
USING (bucket_id = 'categorias');
```

### Paso 3: Verificar Configuración
Después de ejecutar el SQL, verifica que las políticas se crearon:

```sql
SELECT 
    policyname, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%categorias%'
ORDER BY policyname;
```

Deberías ver 4 políticas:
- `Allow anon uploads to categorias bucket` (INSERT)
- `Allow anon access to categorias bucket` (SELECT)  
- `Allow anon updates to categorias bucket` (UPDATE)
- `Allow anon deletes from categorias bucket` (DELETE)

## 🧪 PROBAR LA SOLUCIÓN

### Después de Ejecutar el SQL:
1. **Recarga** la página del panel de administración
2. Ve a **"MENÚ" → "Crear categoría"**
3. Llena el formulario y **selecciona una imagen**
4. Haz clic en **"Guardar"**

### Resultado Esperado:
```
✅ Categoría creada: Object
📤 Subiendo archivo: [archivo] [tamaño]  
✅ Imagen subida exitosamente: Object
✅ Categoría e imagen guardadas correctamente
```

## 📋 ALTERNATIVA: Interfaz Gráfica

Si prefieres usar la interfaz gráfica:

1. Ve a **Storage → Policies** en Supabase
2. Busca el bucket **"categorias"**  
3. Crea 4 nuevas políticas:

### Política 1: Upload (INSERT)
- **Policy name:** `Allow anon uploads to categorias bucket`
- **Allowed operation:** `INSERT`
- **Target roles:** `anon`
- **WITH CHECK expression:** `bucket_id = 'categorias'`

### Política 2: Read (SELECT)
- **Policy name:** `Allow anon access to categorias bucket`
- **Allowed operation:** `SELECT`
- **Target roles:** `anon`
- **USING expression:** `bucket_id = 'categorias'`

### Política 3: Update (UPDATE)
- **Policy name:** `Allow anon updates to categorias bucket`
- **Allowed operation:** `UPDATE`
- **Target roles:** `anon`
- **USING expression:** `bucket_id = 'categorias'`
- **WITH CHECK expression:** `bucket_id = 'categorias'`

### Política 4: Delete (DELETE)
- **Policy name:** `Allow anon deletes from categorias bucket`
- **Allowed operation:** `DELETE`
- **Target roles:** `anon`
- **USING expression:** `bucket_id = 'categorias'`

## 🎯 ¿POR QUÉ ES NECESARIO ESTO?

- Tu aplicación web usa la clave `anon` para conectarse a Supabase
- El bucket "categorias" tiene Row Level Security (RLS) habilitado
- Sin políticas específicas para `anon`, las operaciones son bloqueadas
- Estas políticas permiten que usuarios anónimos suban/lean/actualicen/eliminen archivos en el bucket "categorias"

## ✅ DESPUÉS DE LA CONFIGURACIÓN

Una vez completado, podrás:
- ✅ Crear categorías sin errores
- ✅ Subir imágenes al bucket "categorias"  
- ✅ Ver las imágenes públicamente
- ✅ Actualizar y eliminar imágenes

---

**¡Después de ejecutar el SQL, prueba crear una categoría con imagen para confirmar que todo funciona!** 🎉

