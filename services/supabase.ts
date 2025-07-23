
import { createClient } from '@supabase/supabase-js';
import { Company } from '../types';

// IMPORTANT: In a real-world application, these should be stored in environment variables.
const supabaseUrl = "https://pkbbwqgmhucodzvecgcy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrYmJ3cWdtaHVjb2R6dmVjZ2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NzA4MzksImV4cCI6MjA2NzA0NjgzOX0.k1mtcHcDG3nbqEaRkAPwSONvAQbZKUrsxQQK1sEQ1Vg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getCompaniesWithLocation = async (): Promise<Company[]> => {
    const { data, error } = await supabase
        .from('empresas')
        .select('code, razon_social, latitude, longitude, nombre_establecimiento')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

    if (error) {
        console.error("Error fetching companies with location:", error);
        return [];
    }
    return data;
};
