import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jctcgtmvgzjdstjsjhbo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjdGNndG12Z3pqZHN0anNqaGJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyOTIzMzIsImV4cCI6MjA3NTg2ODMzMn0.ONxfsvzlQOC4KwZF6l7RUUGmhHzVMXHMEhW_PyjGIu0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      //'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }
});

// Helper para subir archivos
// Helper para subir archivos - VERSIÓN FINAL CORREGIDA
export const uploadFile = async (file, reportId) => {
  try {
    console.log('📤 Datos del archivo recibido:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      isFile: file instanceof File,
      reportId
    });

    // Validar que sea un File object real
    if (!(file instanceof File)) {
      throw new Error('El objeto no es un archivo válido (File)');
    }

    // Validar tamaño (10MB máximo)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('El archivo excede el tamaño máximo de 10MB');
    }

    // Generar nombre único
    const fileExt = file.name.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const fileName = `${reportId}/${timestamp}-${randomString}.${fileExt}`;
    
    console.log('📝 Preparando subida:', {
      fileName,
      contentType: file.type
    });

    // IMPORTANTE: Subir el File directamente, NO convertirlo
    const { data, error } = await supabase.storage
      .from('report-attachments')
      .upload(fileName, file, {  // ← Pasar el FILE directamente
        cacheControl: '3600',
        upsert: false,
        contentType: file.type  // ← Usar el tipo original del archivo
      });

    if (error) {
      console.error('❌ Error de Supabase Storage:', error);
      throw new Error(`Error subiendo archivo: ${error.message}`);
    }

    console.log('✅ Archivo subido exitosamente:', data);
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('report-attachments')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('🔗 URL pública generada:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('❌ Error completo en uploadFile:', error);
    throw error;
  }
};









// Helper para obtener categorías
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error en getCategories:', error);
    return [];
  }
};

// Helper para obtener entidades
export const getEntities = async () => {
  try {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error obteniendo entidades:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error en getEntities:', error);
    return [];
  }
};

// Test de conexión
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('count');
    
    if (error) {
      console.error('❌ Error de conexión:', error);
      return false;
    }
    console.log('✅ Conexión exitosa a Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    return false;
  }
};