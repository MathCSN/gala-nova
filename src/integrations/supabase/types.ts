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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      allowed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
        }
        Relationships: []
      }
      event_formulas: {
        Row: {
          color: string
          created_at: string
          id: string
          max_capacity: number
          name: string
          price: number
          sold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id: string
          max_capacity?: number
          name: string
          price?: number
          sold?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          max_capacity?: number
          name?: string
          price?: number
          sold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_settings: {
        Row: {
          contingency_percent: number
          target_margin_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contingency_percent?: number
          target_margin_percent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contingency_percent?: number
          target_margin_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_tasks: {
        Row: {
          assignee: string
          created_at: string
          deadline: string
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignee?: string
          created_at?: string
          deadline?: string
          id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignee?: string
          created_at?: string
          deadline?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_vendors: {
        Row: {
          actual_cost: number | null
          assigned_formulas: string[]
          category: string
          cost_type: string
          created_at: string
          estimated_cost: number
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_formulas?: string[]
          category?: string
          cost_type?: string
          created_at?: string
          estimated_cost?: number
          id: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_cost?: number | null
          assigned_formulas?: string[]
          category?: string
          cost_type?: string
          created_at?: string
          estimated_cost?: number
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_contacts: {
        Row: {
          address: string | null
          category: string
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          category?: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          category?: string
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_contracts: {
        Row: {
          amount: number
          created_at: string
          end_date: string | null
          file_url: string | null
          id: string
          notes: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          vendor_contact_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          end_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          vendor_contact_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          end_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          vendor_contact_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_contracts_vendor_contact_id_fkey"
            columns: ["vendor_contact_id"]
            isOneToOne: false
            referencedRelation: "vendor_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_exchanges: {
        Row: {
          content: string | null
          created_at: string
          exchange_date: string
          id: string
          subject: string
          type: string
          user_id: string
          vendor_contact_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          exchange_date?: string
          id?: string
          subject: string
          type?: string
          user_id: string
          vendor_contact_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          exchange_date?: string
          id?: string
          subject?: string
          type?: string
          user_id?: string
          vendor_contact_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_exchanges_vendor_contact_id_fkey"
            columns: ["vendor_contact_id"]
            isOneToOne: false
            referencedRelation: "vendor_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
      app_role: ["admin", "member"],
    },
  },
} as const
