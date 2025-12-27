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
      users: {
        Row: {
          business_name: string | null
          contacted: boolean | null
          created_at: string | null
          email: string
          experience_level: string
          id: string
          intent: string
          last_message_at: string | null
          last_message_date: string | null
          location: string | null
          messages_today: number | null
          name: string
          off_topic_count: number | null
          phone: string | null
          project_type: string | null
          spam_flags: number | null
          tier: string | null
          timeline: string | null
          tos_accepted: boolean | null
        }
        Insert: {
          business_name?: string | null
          contacted?: boolean | null
          created_at?: string | null
          email: string
          experience_level: string
          id?: string
          intent: string
          last_message_at?: string | null
          last_message_date?: string | null
          location?: string | null
          messages_today?: number | null
          name: string
          off_topic_count?: number | null
          phone?: string | null
          project_type?: string | null
          spam_flags?: number | null
          tier?: string | null
          timeline?: string | null
          tos_accepted?: boolean | null
        }
        Update: {
          business_name?: string | null
          contacted?: boolean | null
          created_at?: string | null
          email?: string
          experience_level?: string
          id?: string
          intent?: string
          last_message_at?: string | null
          last_message_date?: string | null
          location?: string | null
          messages_today?: number | null
          name?: string
          off_topic_count?: number | null
          phone?: string | null
          project_type?: string | null
          spam_flags?: number | null
          tier?: string | null
          timeline?: string | null
          tos_accepted?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
