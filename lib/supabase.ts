
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://moqahxuwuqqsqimiotgv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_5u2THbc6_dYkfuVL7Cbc7g_gF1HFmH9';

/**
 * Standard Supabase client for browser-based React applications.
 * Directly uses the provided project URL and public key.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Type-safe database interface for the Awasser s4 Virtual Museum.
 * Handles the mapping between database snake_case and application camelCase.
 */
export const db = {
  exhibitions: {
    async getAll() {
      const { data, error } = await supabase
        .from('exhibitions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        qrCodeUrl: item.qr_code_url,
        isEvent: item.is_event,
        startDate: item.start_date,
        endDate: item.end_date,
        createdAt: item.created_at,
        coverImage: item.cover_image
      }));
    },
    async create(journey: any) {
      const { data, error } = await supabase
        .from('exhibitions')
        .insert([{
          theme: journey.theme,
          creator: journey.creator,
          points: journey.points,
          qr_code_url: journey.qr_code_url,
          is_event: journey.is_event,
          start_date: journey.start_date,
          end_date: journey.end_date,
          cover_image: journey.cover_image
        }])
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
      return (data || []).map(item => ({
        ...item,
        imageUrl: item.imageUrl || item.image_url,
        modelUrl: item.modelUrl || item.model_url
      }));
    }
  },
  mediaVault: {
    async getAll() {
      const { data, error } = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        sizeInMb: item.size_in_mb,
        createdAt: item.created_at
      }));
    },
    async add(asset: any) {
      const { data, error } = await supabase
        .from('media_assets')
        .insert([{
          title: asset.title,
          type: asset.type,
          url: asset.url,
          status: asset.status,
          size_in_mb: asset.size_in_mb
        }])
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
