export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          actor_user_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          actor_user_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          actor_user_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_invite_codes: {
        Row: {
          code: string
          community_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
        }
        Insert: {
          code: string
          community_id: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
        }
        Update: {
          code?: string
          community_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_invite_codes_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: true
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_invite_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_memberships: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_rules: {
        Row: {
          community_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          oka_tie_handling: Database["public"]["Enums"]["tie_handling"]
          other_points_1_name: string | null
          other_points_2_name: string | null
          other_points_3_name: string | null
          other_points_4_name: string | null
          other_points_5_name: string | null
          player_count: number
          rate: number
          return_score: number
          starting_score: number
          tobi_enabled: boolean
          uma_enabled: boolean
          uma_points_1: number | null
          uma_points_2: number | null
          uma_tie_handling: Database["public"]["Enums"]["tie_handling"] | null
          updated_at: string
          yakitori_enabled: boolean
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          oka_tie_handling: Database["public"]["Enums"]["tie_handling"]
          other_points_1_name?: string | null
          other_points_2_name?: string | null
          other_points_3_name?: string | null
          other_points_4_name?: string | null
          other_points_5_name?: string | null
          player_count: number
          rate: number
          return_score: number
          starting_score: number
          tobi_enabled: boolean
          uma_enabled: boolean
          uma_points_1?: number | null
          uma_points_2?: number | null
          uma_tie_handling?: Database["public"]["Enums"]["tie_handling"] | null
          updated_at?: string
          yakitori_enabled: boolean
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          oka_tie_handling?: Database["public"]["Enums"]["tie_handling"]
          other_points_1_name?: string | null
          other_points_2_name?: string | null
          other_points_3_name?: string | null
          other_points_4_name?: string | null
          other_points_5_name?: string | null
          player_count?: number
          rate?: number
          return_score?: number
          starting_score?: number
          tobi_enabled?: boolean
          uma_enabled?: boolean
          uma_points_1?: number | null
          uma_points_2?: number | null
          uma_tie_handling?: Database["public"]["Enums"]["tie_handling"] | null
          updated_at?: string
          yakitori_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "community_rules_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          base_points: number
          created_at: string
          id: string
          manual_points_1: number
          manual_points_2: number
          manual_points_3: number
          match_id: string
          other_points_1: number
          other_points_2: number
          other_points_3: number
          other_points_4: number
          other_points_5: number
          points: number
          rank: number
          score: number
          seat: Database["public"]["Enums"]["seat"]
          tobi_points: number
          tournament_participant_id: string
          uma_points: number
          updated_at: string
          yakitori_points: number
        }
        Insert: {
          base_points: number
          created_at?: string
          id?: string
          manual_points_1: number
          manual_points_2: number
          manual_points_3: number
          match_id: string
          other_points_1: number
          other_points_2: number
          other_points_3: number
          other_points_4: number
          other_points_5: number
          points: number
          rank: number
          score: number
          seat: Database["public"]["Enums"]["seat"]
          tobi_points: number
          tournament_participant_id: string
          uma_points: number
          updated_at?: string
          yakitori_points: number
        }
        Update: {
          base_points?: number
          created_at?: string
          id?: string
          manual_points_1?: number
          manual_points_2?: number
          manual_points_3?: number
          match_id?: string
          other_points_1?: number
          other_points_2?: number
          other_points_3?: number
          other_points_4?: number
          other_points_5?: number
          points?: number
          rank?: number
          score?: number
          seat?: Database["public"]["Enums"]["seat"]
          tobi_points?: number
          tournament_participant_id?: string
          uma_points?: number
          updated_at?: string
          yakitori_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_tournament_participant_id_fkey"
            columns: ["tournament_participant_id"]
            isOneToOne: false
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          manual_points_1_title: string | null
          manual_points_2_title: string | null
          manual_points_3_title: string | null
          tournament_id: string
          tournament_rule_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          manual_points_1_title?: string | null
          manual_points_2_title?: string | null
          manual_points_3_title?: string | null
          tournament_id: string
          tournament_rule_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          manual_points_1_title?: string | null
          manual_points_2_title?: string | null
          manual_points_3_title?: string | null
          tournament_id?: string
          tournament_rule_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_rule_same_tournament_fk"
            columns: ["tournament_rule_id", "tournament_id"]
            isOneToOne: false
            referencedRelation: "tournament_rules"
            referencedColumns: ["id", "tournament_id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          comment: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          comment?: string | null
          created_at?: string
          display_name: string
          id?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          comment?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      tournament_participants: {
        Row: {
          created_at: string
          guest_display_name: string | null
          id: string
          tournament_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guest_display_name?: string | null
          id?: string
          tournament_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guest_display_name?: string | null
          id?: string
          tournament_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_point_adjustments: {
        Row: {
          adjustment_points_1: number
          adjustment_points_2: number
          adjustment_points_3: number
          adjustment_points_4: number
          adjustment_points_5: number
          created_at: string
          id: string
          tournament_participant_id: string
          updated_at: string
        }
        Insert: {
          adjustment_points_1: number
          adjustment_points_2: number
          adjustment_points_3: number
          adjustment_points_4: number
          adjustment_points_5: number
          created_at?: string
          id?: string
          tournament_participant_id: string
          updated_at?: string
        }
        Update: {
          adjustment_points_1?: number
          adjustment_points_2?: number
          adjustment_points_3?: number
          adjustment_points_4?: number
          adjustment_points_5?: number
          created_at?: string
          id?: string
          tournament_participant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_point_adjustments_tournament_participant_id_fkey"
            columns: ["tournament_participant_id"]
            isOneToOne: true
            referencedRelation: "tournament_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_rules: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          oka_tie_handling: Database["public"]["Enums"]["tie_handling"]
          other_points_1_name: string | null
          other_points_2_name: string | null
          other_points_3_name: string | null
          other_points_4_name: string | null
          other_points_5_name: string | null
          player_count: number
          rate: number
          return_score: number
          starting_score: number
          tobi_enabled: boolean
          tournament_id: string
          uma_enabled: boolean
          uma_points_1: number | null
          uma_points_2: number | null
          uma_tie_handling: Database["public"]["Enums"]["tie_handling"] | null
          updated_at: string
          yakitori_enabled: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          oka_tie_handling: Database["public"]["Enums"]["tie_handling"]
          other_points_1_name?: string | null
          other_points_2_name?: string | null
          other_points_3_name?: string | null
          other_points_4_name?: string | null
          other_points_5_name?: string | null
          player_count: number
          rate: number
          return_score: number
          starting_score: number
          tobi_enabled: boolean
          tournament_id: string
          uma_enabled: boolean
          uma_points_1?: number | null
          uma_points_2?: number | null
          uma_tie_handling?: Database["public"]["Enums"]["tie_handling"] | null
          updated_at?: string
          yakitori_enabled: boolean
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          oka_tie_handling?: Database["public"]["Enums"]["tie_handling"]
          other_points_1_name?: string | null
          other_points_2_name?: string | null
          other_points_3_name?: string | null
          other_points_4_name?: string | null
          other_points_5_name?: string | null
          player_count?: number
          rate?: number
          return_score?: number
          starting_score?: number
          tobi_enabled?: boolean
          tournament_id?: string
          uma_enabled?: boolean
          uma_points_1?: number | null
          uma_points_2?: number | null
          uma_tie_handling?: Database["public"]["Enums"]["tie_handling"] | null
          updated_at?: string
          yakitori_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tournament_rules_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          adjustment_points_1_title: string | null
          adjustment_points_2_title: string | null
          adjustment_points_3_title: string | null
          adjustment_points_4_title: string | null
          adjustment_points_5_title: string | null
          community_id: string
          created_at: string
          held_on: string
          id: string
          memo: string | null
          name: string
          updated_at: string
        }
        Insert: {
          adjustment_points_1_title?: string | null
          adjustment_points_2_title?: string | null
          adjustment_points_3_title?: string | null
          adjustment_points_4_title?: string | null
          adjustment_points_5_title?: string | null
          community_id: string
          created_at?: string
          held_on: string
          id?: string
          memo?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          adjustment_points_1_title?: string | null
          adjustment_points_2_title?: string | null
          adjustment_points_3_title?: string | null
          adjustment_points_4_title?: string | null
          adjustment_points_5_title?: string | null
          community_id?: string
          created_at?: string
          held_on?: string
          id?: string
          memo?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_community: {
        Args: { comment?: string; name: string }
        Returns: string
      }
      join_community: { Args: { code: string }; Returns: string }
      leave_community: { Args: { community_id: string }; Returns: undefined }
      withdraw_account: { Args: never; Returns: undefined }
    }
    Enums: {
      activity_action: "insert" | "update" | "delete"
      seat: "east" | "south" | "west" | "north"
      tie_handling: "kamicha" | "split" | "manual"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_action: ["insert", "update", "delete"],
      seat: ["east", "south", "west", "north"],
      tie_handling: ["kamicha", "split", "manual"],
    },
  },
} as const

