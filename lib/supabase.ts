
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://moqahxuwuqqsqimiotgv.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'no-key-provided';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const db = {
  exhibitions: {
    async getAll() {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async create(journey: any) {
      const { data, error } = await supabase
        .from('exhibitions')
        .insert([journey])
        .select();
      if (error) throw error;
      return data[0];
    }
  },
  artworks: {
    async getAll() {
      const { data, error } = await supabase
        .from('artworks')
        .select('*');
      if (error) throw error;
      return data;
    }
  },
  mediaVault: {
    async getAll() {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async add(asset: any) {
      const { data, error } = await supabase
        .from('media_assets')
        .insert([asset])
        .select();
      if (error) throw error;
      return data[0];
    },
    async delete(id: string) {
      const { error } = await supabase
        .from('media_assets')
        .delete()
        .match({ id });
      if (error) throw error;
    }
  }
};
