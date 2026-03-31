// Auto-generated types from Supabase schema
// Run: npx supabase gen types typescript --project-id <project-id> > types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          clerk_user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          tier: 'none' | 'starter' | 'pro' | 'business'
          subscription_status: 'active' | 'past_due' | 'canceled' | 'inactive'
          subscription_period_end: string | null
          mayar_customer_id: string | null
          polar_customer_id: string | null
          payment_provider: 'mayar' | 'polar' | null
          credits: number
          referred_by_code: string | null
          public_gallery_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          tier?: 'none' | 'starter' | 'pro' | 'business'
          subscription_status?: 'active' | 'past_due' | 'canceled' | 'inactive'
          subscription_period_end?: string | null
          mayar_customer_id?: string | null
          polar_customer_id?: string | null
          payment_provider?: 'mayar' | 'polar' | null
          credits?: number
          referred_by_code?: string | null
          public_gallery_default?: boolean
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      generations: {
        Row: {
          id: string
          profile_id: string
          clerk_user_id: string
          type: 'element' | 'mockup'
          style: 'watercolor' | 'line_art' | 'cartoon' | 'boho' | 'minimalist' | null
          prompt_raw: string | null
          prompt_enhanced: string | null
          reference_image_r2_key: string | null
          invitation_r2_key: string | null
          scene_preset: string | null
          custom_scene_prompt: string | null
          result_r2_keys: string[]
          result_count: number
          model_used: string
          gemini_used: boolean
          generation_time_ms: number | null
          resolution: number
          is_public: boolean
          public_approved: boolean
          credits_spent: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['generations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['generations']['Insert']>
        Relationships: []
      }
      purchases: {
        Row: {
          id: string
          profile_id: string
          clerk_user_id: string
          plan: 'starter' | 'pro' | 'business' | 'topup'
          credits_added: number
          amount_idr: number | null
          amount_usd: number | null
          currency: 'IDR' | 'USD'
          payment_provider: 'mayar' | 'polar'
          payment_id: string
          payment_status: 'pending' | 'success' | 'failed' | 'refunded'
          is_subscription: boolean
          subscription_id: string | null
          referred_by_code: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['purchases']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['purchases']['Insert']>
        Relationships: []
      }
      affiliates: {
        Row: {
          id: string
          profile_id: string
          clerk_user_id: string
          code: string
          clicks: number
          conversions: number
          credits_earned: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['affiliates']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['affiliates']['Insert']>
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          id: string
          affiliate_id: string
          referred_profile_id: string | null
          plan: string
          credits_awarded: number
          status: 'awarded' | 'reversed'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['affiliate_referrals']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['affiliate_referrals']['Insert']>
        Relationships: []
      }
      payment_events: {
        Row: {
          id: string
          provider: 'mayar' | 'polar'
          type: string
          processed_at: string
        }
        Insert: Database['public']['Tables']['payment_events']['Row']
        Update: Partial<Database['public']['Tables']['payment_events']['Row']>
        Relationships: []
      }
      generation_counter: {
        Row: {
          id: number
          total_count: number
        }
        Insert: Database['public']['Tables']['generation_counter']['Row']
        Update: Partial<Database['public']['Tables']['generation_counter']['Row']>
        Relationships: []
      }
      remove_bg_jobs: {
        Row: {
          id: string
          profile_id: string
          clerk_user_id: string
          source_r2_key: string
          result_r2_key: string
          credits_spent: number
          status: 'success' | 'failed'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['remove_bg_jobs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['remove_bg_jobs']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
