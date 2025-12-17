import type { Institution } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { mapInstitutionData } from '@/mappers/institutionMapper';

export const institutionService = {
  /**
   * Fetch all institutions
   */
  async getAllInstitutions(): Promise<Institution[]> {
    try {
      const { data, error } = await supabase
        .from('Institution')
        .select('*')
        .order('name');

      if (error) {
        console.error('Supabase error fetching institutions:', error);
        throw error;
      }

      return (data || []).map(mapInstitutionData);
    } catch (err) {
      console.error('institutionService.getAllInstitutions error:', err);
      throw err;
    }
  },

  /**
   * Fetch a single institution by ID
   */
  async getInstitutionById(institutionId: string): Promise<Institution | null> {
    try {
      const { data, error } = await supabase
        .from('Institution')
        .select('id, name, full_name, address')
        .eq('id', institutionId)
        .single();

      if (error) {
        console.error('Supabase error fetching institution:', error);
        throw error;
      }
      if (!data) return null;

      return mapInstitutionData(data);
    } catch (err) {
      console.error('institutionService.getInstitutionById error:', err);
      throw err;
    }
  },
};
