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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          last_accessed_at: string | null
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          last_accessed_at?: string | null
          token?: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          last_accessed_at?: string | null
          token?: string
        }
        Relationships: []
      }
      ai_response_feedback: {
        Row: {
          applied_to_knowledge: boolean | null
          company_id: string | null
          correction_text: string | null
          created_at: string | null
          feedback_type: string | null
          id: string
          message_id: string | null
          reviewed_by: string | null
          user_id: string | null
        }
        Insert: {
          applied_to_knowledge?: boolean | null
          company_id?: string | null
          correction_text?: string | null
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          message_id?: string | null
          reviewed_by?: string | null
          user_id?: string | null
        }
        Update: {
          applied_to_knowledge?: boolean | null
          company_id?: string | null
          correction_text?: string | null
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          message_id?: string | null
          reviewed_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_response_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_response_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          alert_type: string
          conversation_id: string | null
          details: Json | null
          id: string
          sent_at: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          conversation_id?: string | null
          details?: Json | null
          id?: string
          sent_at?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          conversation_id?: string | null
          details?: Json | null
          id?: string
          sent_at?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      b2b_inquiries: {
        Row: {
          company_name: string | null
          contact_info: string | null
          conversation_id: string | null
          created_at: string | null
          goals: string | null
          id: string
          interest_type: string | null
          notes: string | null
          role: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          contact_info?: string | null
          conversation_id?: string | null
          created_at?: string | null
          goals?: string | null
          id?: string
          interest_type?: string | null
          notes?: string | null
          role?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          contact_info?: string | null
          conversation_id?: string | null
          created_at?: string | null
          goals?: string | null
          id?: string
          interest_type?: string | null
          notes?: string | null
          role?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_inquiries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b2b_inquiries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_uploads: {
        Row: {
          file_name: string
          file_type: string | null
          file_url: string | null
          id: string
          manufacturer_id: string | null
          notes: string | null
          pages_processed: number | null
          processed_at: string | null
          products_extracted: number | null
          status: string | null
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          manufacturer_id?: string | null
          notes?: string | null
          pages_processed?: number | null
          processed_at?: string | null
          products_extracted?: number | null
          status?: string | null
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          manufacturer_id?: string | null
          notes?: string | null
          pages_processed?: number | null
          processed_at?: string | null
          products_extracted?: number | null
          status?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_uploads_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_profiles"
            referencedColumns: ["manufacturer_id"]
          },
          {
            foreignKeyName: "catalog_uploads_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          name: string
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          name: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          name?: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_patterns: {
        Row: {
          conversion_rate: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          pattern_type: string
          successful_path: string[] | null
          trigger_phrase: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pattern_type: string
          successful_path?: string[] | null
          trigger_phrase?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          pattern_type?: string
          successful_path?: string[] | null
          trigger_phrase?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          b2b_completed: boolean | null
          b2b_pending: boolean | null
          created_at: string | null
          detected_persona: string | null
          id: string
          offers_shown: string[] | null
          referral_completed: boolean | null
          referral_pending: boolean | null
          session_id: string | null
          shortcut_selected: string | null
          transcript_emailed: boolean | null
          transcript_emailed_at: string | null
          transcript_offered: boolean | null
          user_id: string | null
        }
        Insert: {
          b2b_completed?: boolean | null
          b2b_pending?: boolean | null
          created_at?: string | null
          detected_persona?: string | null
          id?: string
          offers_shown?: string[] | null
          referral_completed?: boolean | null
          referral_pending?: boolean | null
          session_id?: string | null
          shortcut_selected?: string | null
          transcript_emailed?: boolean | null
          transcript_emailed_at?: string | null
          transcript_offered?: boolean | null
          user_id?: string | null
        }
        Update: {
          b2b_completed?: boolean | null
          b2b_pending?: boolean | null
          created_at?: string | null
          detected_persona?: string | null
          id?: string
          offers_shown?: string[] | null
          referral_completed?: boolean | null
          referral_pending?: boolean | null
          session_id?: string | null
          shortcut_selected?: string | null
          transcript_emailed?: boolean | null
          transcript_emailed_at?: string | null
          transcript_offered?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      depth_recommendations: {
        Row: {
          height_max: number | null
          height_min: number | null
          id: string
          max_depth: number | null
          min_depth: number | null
          recommended_depth: number | null
        }
        Insert: {
          height_max?: number | null
          height_min?: number | null
          id?: string
          max_depth?: number | null
          min_depth?: number | null
          recommended_depth?: number | null
        }
        Update: {
          height_max?: number | null
          height_min?: number | null
          id?: string
          max_depth?: number | null
          min_depth?: number | null
          recommended_depth?: number | null
        }
        Relationships: []
      }
      expert_knowledge: {
        Row: {
          company_id: string | null
          created_at: string | null
          expert_id: string | null
          id: string
          knowledge_text: string
          knowledge_type: string | null
          question_pattern: string | null
          scope: string
          topic: string
          updated_at: string | null
          upvotes: number | null
          verified: boolean | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          expert_id?: string | null
          id?: string
          knowledge_text: string
          knowledge_type?: string | null
          question_pattern?: string | null
          scope: string
          topic: string
          updated_at?: string | null
          upvotes?: number | null
          verified?: boolean | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          expert_id?: string | null
          id?: string
          knowledge_text?: string
          knowledge_type?: string | null
          question_pattern?: string | null
          scope?: string
          topic?: string
          updated_at?: string | null
          upvotes?: number | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "expert_knowledge_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          message_id: string | null
          rating: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          rating?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          rating?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      finishes: {
        Row: {
          code: string
          compatible_materials: string[] | null
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          compatible_materials?: string[] | null
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          compatible_materials?: string[] | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      followup_clicks: {
        Row: {
          clicked_question: string
          conversation_id: string | null
          created_at: string | null
          followup_id: string | null
          id: string
          user_id: string | null
          variant_group: string | null
        }
        Insert: {
          clicked_question: string
          conversation_id?: string | null
          created_at?: string | null
          followup_id?: string | null
          id?: string
          user_id?: string | null
          variant_group?: string | null
        }
        Update: {
          clicked_question?: string
          conversation_id?: string | null
          created_at?: string | null
          followup_id?: string | null
          id?: string
          user_id?: string | null
          variant_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_clicks_followup_id_fkey"
            columns: ["followup_id"]
            isOneToOne: false
            referencedRelation: "suggested_followups"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary: {
        Row: {
          aliases: string[] | null
          category: string | null
          created_at: string | null
          full_definition: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          related_terms: string[] | null
          short_definition: string
          term: string
        }
        Insert: {
          aliases?: string[] | null
          category?: string | null
          created_at?: string | null
          full_definition?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          related_terms?: string[] | null
          short_definition: string
          term: string
        }
        Update: {
          aliases?: string[] | null
          category?: string | null
          created_at?: string | null
          full_definition?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          related_terms?: string[] | null
          short_definition?: string
          term?: string
        }
        Relationships: []
      }
      glossary_analytics: {
        Row: {
          action: string
          conversation_id: string | null
          created_at: string | null
          id: string
          term_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          term_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          term_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "glossary_analytics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glossary_analytics_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "glossary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glossary_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      image_search_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          query: string
          results: Json | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          query: string
          results?: Json | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          query?: string
          results?: Json | null
        }
        Relationships: []
      }
      insights_reports: {
        Row: {
          created_at: string | null
          id: string
          insights: string | null
          metrics: Json | null
          period_end: string
          period_start: string
          recommendations: string[] | null
          report_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          insights?: string | null
          metrics?: Json | null
          period_end: string
          period_start: string
          recommendations?: string[] | null
          report_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          insights?: string | null
          metrics?: Json | null
          period_end?: string
          period_start?: string
          recommendations?: string[] | null
          report_type?: string | null
        }
        Relationships: []
      }
      knowledge_gaps: {
        Row: {
          created_at: string | null
          frequency: number | null
          id: string
          question: string
          resolution: string | null
          resolved: boolean | null
        }
        Insert: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          question: string
          resolution?: string | null
          resolved?: boolean | null
        }
        Update: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          question?: string
          resolution?: string | null
          resolved?: boolean | null
        }
        Relationships: []
      }
      led_colors: {
        Row: {
          code: string
          hex_code: string | null
          is_standard: boolean | null
          kelvin: number | null
          name: string
          sort_order: number | null
        }
        Insert: {
          code: string
          hex_code?: string | null
          is_standard?: boolean | null
          kelvin?: number | null
          name: string
          sort_order?: number | null
        }
        Update: {
          code?: string
          hex_code?: string | null
          is_standard?: boolean | null
          kelvin?: number | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      lighting_profiles: {
        Row: {
          binary_code: string
          created_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          layers_count: number | null
          name: string
          sort_order: number | null
        }
        Insert: {
          binary_code: string
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          layers_count?: number | null
          name: string
          sort_order?: number | null
        }
        Update: {
          binary_code?: string
          created_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          layers_count?: number | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      manufacturers: {
        Row: {
          catalog_updated_at: string | null
          catalog_url: string | null
          catalog_version: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          notes: string | null
          price_tier: string | null
          slug: string
          website: string | null
        }
        Insert: {
          catalog_updated_at?: string | null
          catalog_url?: string | null
          catalog_version?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          notes?: string | null
          price_tier?: string | null
          slug: string
          website?: string | null
        }
        Update: {
          catalog_updated_at?: string | null
          catalog_url?: string | null
          catalog_version?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          price_tier?: string | null
          slug?: string
          website?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string | null
          code: string
          name: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          code: string
          name: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          code?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mode_selections: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          mode: string
          previous_mode: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          mode: string
          previous_mode?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          mode?: string
          previous_mode?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mode_selections_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mode_selections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          company_name: string
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          location_city: string | null
          location_state: string | null
          notes: string | null
          phone: string | null
          services: string[] | null
        }
        Insert: {
          company_name: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          location_city?: string | null
          location_state?: string | null
          notes?: string | null
          phone?: string | null
          services?: string[] | null
        }
        Update: {
          company_name?: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          location_city?: string | null
          location_state?: string | null
          notes?: string | null
          phone?: string | null
          services?: string[] | null
        }
        Relationships: []
      }
      pricing: {
        Row: {
          created_at: string | null
          depth_inches: number | null
          height_inches: number | null
          id: string
          material: string | null
          price: number | null
          product_id: string | null
        }
        Insert: {
          created_at?: string | null
          depth_inches?: number | null
          height_inches?: number | null
          id?: string
          material?: string | null
          price?: number | null
          product_id?: string | null
        }
        Update: {
          created_at?: string | null
          depth_inches?: number | null
          height_inches?: number | null
          id?: string
          material?: string | null
          price?: number | null
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_full"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          catalog_page: string | null
          category: string | null
          construction: string | null
          created_at: string | null
          depth_options: number[] | null
          finishes: string[] | null
          has_pricing: boolean | null
          has_trim_cap: boolean | null
          height_max: number | null
          height_min: number | null
          id: string
          is_active: boolean | null
          led_options: string[] | null
          manufacturer_id: string | null
          materials: string[] | null
          name: string
          notes: string | null
          price_unit: string | null
          profile_id: string | null
          reveal_options: number[] | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          catalog_page?: string | null
          category?: string | null
          construction?: string | null
          created_at?: string | null
          depth_options?: number[] | null
          finishes?: string[] | null
          has_pricing?: boolean | null
          has_trim_cap?: boolean | null
          height_max?: number | null
          height_min?: number | null
          id?: string
          is_active?: boolean | null
          led_options?: string[] | null
          manufacturer_id?: string | null
          materials?: string[] | null
          name: string
          notes?: string | null
          price_unit?: string | null
          profile_id?: string | null
          reveal_options?: number[] | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          catalog_page?: string | null
          category?: string | null
          construction?: string | null
          created_at?: string | null
          depth_options?: number[] | null
          finishes?: string[] | null
          has_pricing?: boolean | null
          has_trim_cap?: boolean | null
          height_max?: number | null
          height_min?: number | null
          id?: string
          is_active?: boolean | null
          led_options?: string[] | null
          manufacturer_id?: string | null
          materials?: string[] | null
          name?: string
          notes?: string | null
          price_unit?: string | null
          profile_id?: string | null
          reveal_options?: number[] | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_profiles"
            referencedColumns: ["manufacturer_id"]
          },
          {
            foreignKeyName: "products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "lighting_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      referrals: {
        Row: {
          best_time_to_call: string | null
          conversation_id: string | null
          created_at: string | null
          email: string | null
          id: string
          location_city: string | null
          location_state: string | null
          notes: string | null
          partner_id: string | null
          phone: string | null
          preferred_contact: string | null
          project_type: string | null
          status: string | null
          timeline: string | null
          timezone: string | null
          user_id: string | null
        }
        Insert: {
          best_time_to_call?: string | null
          conversation_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          location_city?: string | null
          location_state?: string | null
          notes?: string | null
          partner_id?: string | null
          phone?: string | null
          preferred_contact?: string | null
          project_type?: string | null
          status?: string | null
          timeline?: string | null
          timezone?: string | null
          user_id?: string | null
        }
        Update: {
          best_time_to_call?: string | null
          conversation_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          location_city?: string | null
          location_state?: string | null
          notes?: string | null
          partner_id?: string | null
          phone?: string | null
          preferred_contact?: string | null
          project_type?: string | null
          status?: string | null
          timeline?: string | null
          timezone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          is_active: boolean | null
          setting_name: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          setting_name: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          setting_name?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      signexperts_referrals: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: string
          referral_context: string | null
          referral_type: string
          user_id: string | null
          user_response: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          referral_context?: string | null
          referral_type?: string
          user_id?: string | null
          user_response?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: string
          referral_context?: string | null
          referral_type?: string
          user_id?: string | null
          user_response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signexperts_referrals_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signexperts_referrals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      spec_sheets: {
        Row: {
          company_logo_url: string | null
          company_name: string | null
          configuration: Json
          created_at: string | null
          downloaded_count: number | null
          emailed_count: number | null
          id: string
          pdf_url: string | null
          profile_id: string | null
          reference_number: string | null
        }
        Insert: {
          company_logo_url?: string | null
          company_name?: string | null
          configuration: Json
          created_at?: string | null
          downloaded_count?: number | null
          emailed_count?: number | null
          id?: string
          pdf_url?: string | null
          profile_id?: string | null
          reference_number?: string | null
        }
        Update: {
          company_logo_url?: string | null
          company_name?: string | null
          configuration?: Json
          created_at?: string | null
          downloaded_count?: number | null
          emailed_count?: number | null
          id?: string
          pdf_url?: string | null
          profile_id?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spec_sheets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "lighting_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spec_sheets_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      suggested_followups: {
        Row: {
          category: string | null
          click_count: number | null
          created_at: string | null
          followup_questions: string[] | null
          id: string
          impression_count: number | null
          is_active: boolean | null
          success_rate: number | null
          trigger_keywords: string[] | null
          usage_count: number | null
          variant_group: string | null
        }
        Insert: {
          category?: string | null
          click_count?: number | null
          created_at?: string | null
          followup_questions?: string[] | null
          id?: string
          impression_count?: number | null
          is_active?: boolean | null
          success_rate?: number | null
          trigger_keywords?: string[] | null
          usage_count?: number | null
          variant_group?: string | null
        }
        Update: {
          category?: string | null
          click_count?: number | null
          created_at?: string | null
          followup_questions?: string[] | null
          id?: string
          impression_count?: number | null
          is_active?: boolean | null
          success_rate?: number | null
          trigger_keywords?: string[] | null
          usage_count?: number | null
          variant_group?: string | null
        }
        Relationships: []
      }
      usage_stats: {
        Row: {
          created_at: string
          date: string
          estimated_cost_cents: number | null
          id: string
          total_api_calls: number | null
          total_blocked_limit: number | null
          total_blocked_spam: number | null
          total_off_topic: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date?: string
          estimated_cost_cents?: number | null
          id?: string
          total_api_calls?: number | null
          total_blocked_limit?: number | null
          total_blocked_spam?: number | null
          total_off_topic?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          estimated_cost_cents?: number | null
          id?: string
          total_api_calls?: number | null
          total_blocked_limit?: number | null
          total_blocked_spam?: number | null
          total_off_topic?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_context: {
        Row: {
          context_key: string
          context_type: string
          context_value: string
          created_at: string | null
          id: string
          is_active: boolean | null
          user_id: string | null
        }
        Insert: {
          context_key: string
          context_type: string
          context_value: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Update: {
          context_key?: string
          context_type?: string
          context_value?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_context_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          company_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          company_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          company_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string | null
          business_name: string | null
          company: string | null
          contacted: boolean | null
          created_at: string | null
          email: string
          experience_level: string
          help_areas: string[] | null
          id: string
          intent: string
          is_verified: boolean | null
          last_message_at: string | null
          last_message_date: string | null
          location: string | null
          messages_today: number | null
          name: string
          off_topic_count: number | null
          phone: string | null
          project_type: string | null
          role: string | null
          services: string[] | null
          sign_type_interest: string | null
          spam_flags: number | null
          subscription_tier: string | null
          tier: string | null
          timeline: string | null
          title: string | null
          topic_focus: string | null
          tos_accepted: boolean | null
          user_type: string | null
        }
        Insert: {
          auth_id?: string | null
          business_name?: string | null
          company?: string | null
          contacted?: boolean | null
          created_at?: string | null
          email: string
          experience_level: string
          help_areas?: string[] | null
          id?: string
          intent: string
          is_verified?: boolean | null
          last_message_at?: string | null
          last_message_date?: string | null
          location?: string | null
          messages_today?: number | null
          name: string
          off_topic_count?: number | null
          phone?: string | null
          project_type?: string | null
          role?: string | null
          services?: string[] | null
          sign_type_interest?: string | null
          spam_flags?: number | null
          subscription_tier?: string | null
          tier?: string | null
          timeline?: string | null
          title?: string | null
          topic_focus?: string | null
          tos_accepted?: boolean | null
          user_type?: string | null
        }
        Update: {
          auth_id?: string | null
          business_name?: string | null
          company?: string | null
          contacted?: boolean | null
          created_at?: string | null
          email?: string
          experience_level?: string
          help_areas?: string[] | null
          id?: string
          intent?: string
          is_verified?: boolean | null
          last_message_at?: string | null
          last_message_date?: string | null
          location?: string | null
          messages_today?: number | null
          name?: string
          off_topic_count?: number | null
          phone?: string | null
          project_type?: string | null
          role?: string | null
          services?: string[] | null
          sign_type_interest?: string | null
          spam_flags?: number | null
          subscription_tier?: string | null
          tier?: string | null
          timeline?: string | null
          title?: string | null
          topic_focus?: string | null
          tos_accepted?: boolean | null
          user_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      manufacturer_profiles: {
        Row: {
          binary_code: string | null
          depth_options: number[] | null
          height_max: number | null
          height_min: number | null
          manufacturer_id: string | null
          manufacturer_name: string | null
          materials: string[] | null
          price_tier: string | null
          profile_id: string | null
          profile_name: string | null
          slug: string | null
        }
        Relationships: []
      }
      products_full: {
        Row: {
          catalog_page: string | null
          category: string | null
          construction: string | null
          created_at: string | null
          depth_options: number[] | null
          finishes: string[] | null
          has_pricing: boolean | null
          has_trim_cap: boolean | null
          height_max: number | null
          height_min: number | null
          id: string | null
          is_active: boolean | null
          led_options: string[] | null
          manufacturer_id: string | null
          manufacturer_name: string | null
          manufacturer_price_tier: string | null
          manufacturer_slug: string | null
          materials: string[] | null
          name: string | null
          notes: string | null
          price_unit: string | null
          profile_code: string | null
          profile_id: string | null
          profile_name: string | null
          reveal_options: number[] | null
          slug: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_profiles"
            referencedColumns: ["manufacturer_id"]
          },
          {
            foreignKeyName: "products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "lighting_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "manufacturer_profiles"
            referencedColumns: ["profile_id"]
          },
        ]
      }
    }
    Functions: {
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_company_role: {
        Args: {
          _company_id: string
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "platform_admin" | "company_admin" | "expert" | "user"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["platform_admin", "company_admin", "expert", "user"],
    },
  },
} as const
