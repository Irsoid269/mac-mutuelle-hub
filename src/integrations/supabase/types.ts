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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_data: Json | null
          backup_type: string
          created_at: string
          created_by: string | null
          error_message: string | null
          file_size: number | null
          id: string
          status: string
          tables_count: number | null
          total_rows: number | null
        }
        Insert: {
          backup_data?: Json | null
          backup_type?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          status?: string
          tables_count?: number | null
          total_rows?: number | null
        }
        Update: {
          backup_data?: Json | null
          backup_type?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_size?: number | null
          id?: string
          status?: string
          tables_count?: number | null
          total_rows?: number | null
        }
        Relationships: []
      }
      backup_settings: {
        Row: {
          id: string
          is_enabled: boolean
          last_backup_at: string | null
          retention_days: number
          schedule_time: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          is_enabled?: boolean
          last_backup_at?: string | null
          retention_days?: number
          schedule_time?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          is_enabled?: boolean
          last_backup_at?: string | null
          retention_days?: number
          schedule_time?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      beneficiaries: {
        Row: {
          address: string | null
          birth_date: string
          birth_place: string | null
          created_at: string
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          insured_id: string
          last_name: string
          phone: string | null
          photo_url: string | null
          relationship: Database["public"]["Enums"]["relationship_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          birth_date: string
          birth_place?: string | null
          created_at?: string
          first_name: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          insured_id: string
          last_name: string
          phone?: string | null
          photo_url?: string | null
          relationship: Database["public"]["Enums"]["relationship_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          birth_date?: string
          birth_place?: string | null
          created_at?: string
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          insured_id?: string
          last_name?: string
          phone?: string | null
          photo_url?: string | null
          relationship?: Database["public"]["Enums"]["relationship_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiaries_insured_id_fkey"
            columns: ["insured_id"]
            isOneToOne: false
            referencedRelation: "insured"
            referencedColumns: ["id"]
          },
        ]
      }
      care_authorizations: {
        Row: {
          approved_amount: number | null
          authorization_number: string
          beneficiary_id: string | null
          care_date: string
          care_type: string
          ceiling_amount: number | null
          created_at: string
          diagnosis: string | null
          doctor_name: string | null
          estimated_amount: number
          id: string
          insured_id: string
          notes: string | null
          provider_id: string | null
          status: Database["public"]["Enums"]["care_status"]
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          approved_amount?: number | null
          authorization_number: string
          beneficiary_id?: string | null
          care_date?: string
          care_type: string
          ceiling_amount?: number | null
          created_at?: string
          diagnosis?: string | null
          doctor_name?: string | null
          estimated_amount: number
          id?: string
          insured_id: string
          notes?: string | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["care_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          approved_amount?: number | null
          authorization_number?: string
          beneficiary_id?: string | null
          care_date?: string
          care_type?: string
          ceiling_amount?: number | null
          created_at?: string
          diagnosis?: string | null
          doctor_name?: string | null
          estimated_amount?: number
          id?: string
          insured_id?: string
          notes?: string | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["care_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_authorizations_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_authorizations_insured_id_fkey"
            columns: ["insured_id"]
            isOneToOne: false
            referencedRelation: "insured"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_authorizations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "healthcare_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          address: string | null
          client_code: string
          contract_number: string
          created_at: string
          created_by: string | null
          email: string | null
          end_date: string | null
          id: string
          phone: string | null
          raison_sociale: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          client_code: string
          contract_number: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          end_date?: string | null
          id?: string
          phone?: string | null
          raison_sociale: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          client_code?: string
          contract_number?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          end_date?: string | null
          id?: string
          phone?: string | null
          raison_sociale?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: []
      }
      contribution_formulas: {
        Row: {
          base_rate: number
          ceiling: number | null
          created_at: string
          description: string | null
          family_rate: number | null
          id: string
          is_active: boolean
          name: string
          options: Json | null
          updated_at: string
        }
        Insert: {
          base_rate: number
          ceiling?: number | null
          created_at?: string
          description?: string | null
          family_rate?: number | null
          id?: string
          is_active?: boolean
          name: string
          options?: Json | null
          updated_at?: string
        }
        Update: {
          base_rate?: number
          ceiling?: number | null
          created_at?: string
          description?: string | null
          family_rate?: number | null
          id?: string
          is_active?: boolean
          name?: string
          options?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      contribution_payments: {
        Row: {
          amount: number
          contribution_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_reference: string | null
        }
        Insert: {
          amount: number
          contribution_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_reference?: string | null
        }
        Update: {
          amount?: number
          contribution_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contribution_payments_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "contributions"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          formula_id: string | null
          id: string
          notes: string | null
          paid_amount: number
          payment_date: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          period_end: string
          period_start: string
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          formula_id?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          period_end: string
          period_start: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          formula_id?: string | null
          id?: string
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          period_end?: string
          period_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contributions_formula_id_fkey"
            columns: ["formula_id"]
            isOneToOne: false
            referencedRelation: "contribution_formulas"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          name: string
          related_id: string
          related_type: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          name: string
          related_id: string
          related_type: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          name?: string
          related_id?: string
          related_type?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      health_declarations: {
        Row: {
          answer: boolean
          created_at: string
          declaration_date: string
          details: string | null
          id: string
          insured_id: string
          question: string
        }
        Insert: {
          answer?: boolean
          created_at?: string
          declaration_date?: string
          details?: string | null
          id?: string
          insured_id: string
          question: string
        }
        Update: {
          answer?: boolean
          created_at?: string
          declaration_date?: string
          details?: string | null
          id?: string
          insured_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_declarations_insured_id_fkey"
            columns: ["insured_id"]
            isOneToOne: false
            referencedRelation: "insured"
            referencedColumns: ["id"]
          },
        ]
      }
      healthcare_providers: {
        Row: {
          address: string | null
          city: string | null
          convention_number: string | null
          created_at: string
          email: string | null
          id: string
          is_conventioned: boolean
          name: string
          notes: string | null
          phone: string | null
          provider_type: Database["public"]["Enums"]["provider_type"]
          tarifs: Json | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          convention_number?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_conventioned?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          provider_type: Database["public"]["Enums"]["provider_type"]
          tarifs?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          convention_number?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_conventioned?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          provider_type?: Database["public"]["Enums"]["provider_type"]
          tarifs?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      insured: {
        Row: {
          address: string | null
          birth_date: string
          birth_place: string | null
          contract_id: string
          created_at: string
          email: string | null
          employer: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          insurance_end_date: string | null
          insurance_start_date: string
          job_title: string | null
          last_name: string
          maiden_name: string | null
          marital_status: Database["public"]["Enums"]["marital_status"]
          matricule: string
          phone: string | null
          photo_url: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          work_location: string | null
        }
        Insert: {
          address?: string | null
          birth_date: string
          birth_place?: string | null
          contract_id: string
          created_at?: string
          email?: string | null
          employer?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          insurance_end_date?: string | null
          insurance_start_date?: string
          job_title?: string | null
          last_name: string
          maiden_name?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"]
          matricule: string
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          work_location?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string
          birth_place?: string | null
          contract_id?: string
          created_at?: string
          email?: string | null
          employer?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          insurance_end_date?: string | null
          insurance_start_date?: string
          job_title?: string | null
          last_name?: string
          maiden_name?: string | null
          marital_status?: Database["public"]["Enums"]["marital_status"]
          matricule?: string
          phone?: string | null
          photo_url?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insured_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reimbursement_ceilings: {
        Row: {
          care_type: string
          ceiling_amount: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          reimbursement_rate: number
          updated_at: string
        }
        Insert: {
          care_type: string
          ceiling_amount?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          reimbursement_rate?: number
          updated_at?: string
        }
        Update: {
          care_type?: string
          ceiling_amount?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          reimbursement_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      reimbursements: {
        Row: {
          approved_amount: number | null
          beneficiary_id: string | null
          care_authorization_id: string | null
          care_type: string
          claimed_amount: number
          created_at: string
          doctor_name: string | null
          exclusions: Json | null
          id: string
          insured_id: string
          medical_date: string
          notes: string | null
          paid_amount: number | null
          paid_at: string | null
          paid_by: string | null
          payment_reference: string | null
          provider_id: string | null
          reimbursement_number: string
          status: Database["public"]["Enums"]["reimbursement_status"]
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          approved_amount?: number | null
          beneficiary_id?: string | null
          care_authorization_id?: string | null
          care_type: string
          claimed_amount: number
          created_at?: string
          doctor_name?: string | null
          exclusions?: Json | null
          id?: string
          insured_id: string
          medical_date: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          provider_id?: string | null
          reimbursement_number: string
          status?: Database["public"]["Enums"]["reimbursement_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          approved_amount?: number | null
          beneficiary_id?: string | null
          care_authorization_id?: string | null
          care_type?: string
          claimed_amount?: number
          created_at?: string
          doctor_name?: string | null
          exclusions?: Json | null
          id?: string
          insured_id?: string
          medical_date?: string
          notes?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          provider_id?: string | null
          reimbursement_number?: string
          status?: Database["public"]["Enums"]["reimbursement_status"]
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reimbursements_beneficiary_id_fkey"
            columns: ["beneficiary_id"]
            isOneToOne: false
            referencedRelation: "beneficiaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reimbursements_care_authorization_id_fkey"
            columns: ["care_authorization_id"]
            isOneToOne: false
            referencedRelation: "care_authorizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reimbursements_insured_id_fkey"
            columns: ["insured_id"]
            isOneToOne: false
            referencedRelation: "insured"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reimbursements_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "healthcare_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "agent" | "medecin" | "comptabilite" | "dirigeant"
      care_status: "soumis" | "en_verification" | "valide" | "ferme" | "rejete"
      document_type:
        | "souscription"
        | "remboursement"
        | "prise_en_charge"
        | "quittance"
        | "justificatif"
        | "autre"
      gender: "M" | "F"
      marital_status: "marie" | "celibataire" | "veuf" | "divorce" | "separe"
      payment_status: "en_attente" | "paye" | "partiel" | "annule"
      provider_type:
        | "hopital"
        | "clinique"
        | "laboratoire"
        | "pharmacie"
        | "medecin"
        | "autre"
      reimbursement_status:
        | "soumis"
        | "verification"
        | "valide"
        | "paye"
        | "rejete"
      relationship_type: "conjoint" | "enfant" | "parent" | "autre"
      subscription_status:
        | "en_attente"
        | "validee"
        | "rejetee"
        | "reserve_medicale"
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
      app_role: ["admin", "agent", "medecin", "comptabilite", "dirigeant"],
      care_status: ["soumis", "en_verification", "valide", "ferme", "rejete"],
      document_type: [
        "souscription",
        "remboursement",
        "prise_en_charge",
        "quittance",
        "justificatif",
        "autre",
      ],
      gender: ["M", "F"],
      marital_status: ["marie", "celibataire", "veuf", "divorce", "separe"],
      payment_status: ["en_attente", "paye", "partiel", "annule"],
      provider_type: [
        "hopital",
        "clinique",
        "laboratoire",
        "pharmacie",
        "medecin",
        "autre",
      ],
      reimbursement_status: [
        "soumis",
        "verification",
        "valide",
        "paye",
        "rejete",
      ],
      relationship_type: ["conjoint", "enfant", "parent", "autre"],
      subscription_status: [
        "en_attente",
        "validee",
        "rejetee",
        "reserve_medicale",
      ],
    },
  },
} as const
