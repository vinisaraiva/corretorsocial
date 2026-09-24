export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_credit_ledger: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaign_variants: {
        Row: {
          campaign_id: string
          caption: string | null
          created_at: string
          cta: string | null
          format: string
          hashtags: string[]
          headline: string | null
          id: string
          provider: Database["public"]["Enums"]["social_provider"]
          render_metadata: Json
          rendered_asset_path: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          caption?: string | null
          created_at?: string
          cta?: string | null
          format: string
          hashtags?: string[]
          headline?: string | null
          id?: string
          provider: Database["public"]["Enums"]["social_provider"]
          render_metadata?: Json
          rendered_asset_path?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          caption?: string | null
          created_at?: string
          cta?: string | null
          format?: string
          hashtags?: string[]
          headline?: string | null
          id?: string
          provider?: Database["public"]["Enums"]["social_provider"]
          render_metadata?: Json
          rendered_asset_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ai_model: string | null
          created_at: string
          generation_metadata: Json
          id: string
          marketing_angle: string | null
          property_id: string
          published_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string
          user_id: string
          visual_style: string
        }
        Insert: {
          ai_model?: string | null
          created_at?: string
          generation_metadata?: Json
          id?: string
          marketing_angle?: string | null
          property_id: string
          published_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
          user_id: string
          visual_style?: string
        }
        Update: {
          ai_model?: string | null
          created_at?: string
          generation_metadata?: Json
          id?: string
          marketing_angle?: string | null
          property_id?: string
          published_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
          user_id?: string
          visual_style?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          payload: Json
          priority: number
          result: Json | null
          run_after: string
          status: Database["public"]["Enums"]["job_status"]
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json | null
          run_after?: string
          status?: Database["public"]["Enums"]["job_status"]
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json | null
          run_after?: string
          status?: Database["public"]["Enums"]["job_status"]
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_name: string | null
          city: string | null
          communication_tone: string
          created_at: string
          creci: string | null
          default_cta: string
          email: string | null
          logo_path: string | null
          onboarding_completed: boolean
          phone: string | null
          primary_color: string
          professional_name: string | null
          review_before_publish: boolean
          secondary_color: string
          service_regions: string[]
          updated_at: string
          user_id: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          agency_name?: string | null
          city?: string | null
          communication_tone?: string
          created_at?: string
          creci?: string | null
          default_cta?: string
          email?: string | null
          logo_path?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          primary_color?: string
          professional_name?: string | null
          review_before_publish?: boolean
          secondary_color?: string
          service_regions?: string[]
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          agency_name?: string | null
          city?: string | null
          communication_tone?: string
          created_at?: string
          creci?: string | null
          default_cta?: string
          email?: string | null
          logo_path?: string | null
          onboarding_completed?: boolean
          phone?: string | null
          primary_color?: string
          professional_name?: string | null
          review_before_publish?: boolean
          secondary_color?: string
          service_regions?: string[]
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          area_m2: number | null
          archived_from_status: Database["public"]["Enums"]["property_status"] | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          condo_fee: number | null
          created_at: string
          description: string | null
          exact_location_private: boolean
          external_source_id: string | null
          highlights: string[]
          id: string
          imported_at: string | null
          iptu: number | null
          neighborhood: string | null
          parking: number | null
          price: number | null
          property_type: string | null
          public_location: string | null
          purpose: string
          source_domain: string | null
          source_url: string | null
          state: string | null
          status: Database["public"]["Enums"]["property_status"]
          suites: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area_m2?: number | null
          archived_from_status?: Database["public"]["Enums"]["property_status"] | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          condo_fee?: number | null
          created_at?: string
          description?: string | null
          exact_location_private?: boolean
          external_source_id?: string | null
          highlights?: string[]
          id?: string
          imported_at?: string | null
          iptu?: number | null
          neighborhood?: string | null
          parking?: number | null
          price?: number | null
          property_type?: string | null
          public_location?: string | null
          purpose?: string
          source_domain?: string | null
          source_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          suites?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area_m2?: number | null
          archived_from_status?: Database["public"]["Enums"]["property_status"] | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          condo_fee?: number | null
          created_at?: string
          description?: string | null
          exact_location_private?: boolean
          external_source_id?: string | null
          highlights?: string[]
          id?: string
          imported_at?: string | null
          iptu?: number | null
          neighborhood?: string | null
          parking?: number | null
          price?: number | null
          property_type?: string | null
          public_location?: string | null
          purpose?: string
          source_domain?: string | null
          source_url?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          suites?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_media: {
        Row: {
          ai_score: number | null
          ai_tags: string[]
          created_at: string
          height: number | null
          id: string
          is_cover: boolean
          media_type: string
          original_url: string | null
          property_id: string
          sort_order: number
          storage_path: string | null
          width: number | null
        }
        Insert: {
          ai_score?: number | null
          ai_tags?: string[]
          created_at?: string
          height?: number | null
          id?: string
          is_cover?: boolean
          media_type?: string
          original_url?: string | null
          property_id: string
          sort_order?: number
          storage_path?: string | null
          width?: number | null
        }
        Update: {
          ai_score?: number | null
          ai_tags?: string[]
          created_at?: string
          height?: number | null
          id?: string
          is_cover?: boolean
          media_type?: string
          original_url?: string | null
          property_id?: string
          sort_order?: number
          storage_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_media_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          campaign_variant_id: string
          created_at: string
          external_post_id: string | null
          external_url: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          published_at: string | null
          retry_count: number
          scheduled_for: string | null
          social_connection_id: string | null
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          campaign_variant_id: string
          created_at?: string
          external_post_id?: string | null
          external_url?: string | null
          id?: string
          idempotency_key: string
          last_error?: string | null
          published_at?: string | null
          retry_count?: number
          scheduled_for?: string | null
          social_connection_id?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          campaign_variant_id?: string
          created_at?: string
          external_post_id?: string | null
          external_url?: string | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          published_at?: string | null
          retry_count?: number
          scheduled_for?: string | null
          social_connection_id?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_campaign_variant_id_fkey"
            columns: ["campaign_variant_id"]
            isOneToOne: false
            referencedRelation: "campaign_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_social_connection_id_fkey"
            columns: ["social_connection_id"]
            isOneToOne: false
            referencedRelation: "social_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          created_at: string
          display_name: string | null
          expires_at: string | null
          external_account_id: string | null
          id: string
          metadata: Json
          provider: Database["public"]["Enums"]["social_provider"]
          status: string
          token_secret_ref: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          expires_at?: string | null
          external_account_id?: string | null
          id?: string
          metadata?: Json
          provider: Database["public"]["Enums"]["social_provider"]
          status?: string
          token_secret_ref?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          expires_at?: string | null
          external_account_id?: string | null
          id?: string
          metadata?: Json
          provider?: Database["public"]["Enums"]["social_provider"]
          status?: string
          token_secret_ref?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_links: {
        Row: {
          campaign_id: string | null
          clicks: number
          created_at: string
          destination_url: string
          id: string
          property_id: string | null
          provider: Database["public"]["Enums"]["social_provider"] | null
          short_code: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number
          created_at?: string
          destination_url: string
          id?: string
          property_id?: string | null
          provider?: Database["public"]["Enums"]["social_provider"] | null
          short_code: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          clicks?: number
          created_at?: string
          destination_url?: string
          id?: string
          property_id?: string | null
          provider?: Database["public"]["Enums"]["social_provider"] | null
          short_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracking_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracking_links_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      remove_property_media: {
        Args: {
          p_media_id: string
          p_property_id: string
        }
        Returns: string
      }
      reorder_property_media: {
        Args: {
          p_media_ids: string[]
          p_property_id: string
        }
        Returns: undefined
      }
      set_property_cover: {
        Args: {
          p_media_id: string
          p_property_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      campaign_status:
        | "draft"
        | "generating"
        | "ready"
        | "scheduled"
        | "publishing"
        | "published"
        | "failed"
      job_status:
        | "queued"
        | "processing"
        | "completed"
        | "failed"
        | "retrying"
        | "cancelled"
      property_status: "active" | "paused" | "sold" | "rented" | "archived"
      publication_status:
        | "queued"
        | "processing"
        | "published"
        | "failed"
        | "cancelled"
      social_provider: "instagram" | "facebook" | "tiktok" | "google_business"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      campaign_status: [
        "draft",
        "generating",
        "ready",
        "scheduled",
        "publishing",
        "published",
        "failed",
      ],
      job_status: [
        "queued",
        "processing",
        "completed",
        "failed",
        "retrying",
        "cancelled",
      ],
      property_status: ["active", "paused", "sold", "rented", "archived"],
      publication_status: [
        "queued",
        "processing",
        "published",
        "failed",
        "cancelled",
      ],
      social_provider: ["instagram", "facebook", "tiktok", "google_business"],
    },
  },
} as const
