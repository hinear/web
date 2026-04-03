export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      activity_logs: {
        Row: {
          actor_id: string;
          created_at: string;
          field: string | null;
          from_value: Json | null;
          id: string;
          issue_id: string;
          project_id: string;
          summary: string;
          to_value: Json | null;
          type: string;
        };
        Insert: {
          actor_id: string;
          created_at?: string;
          field?: string | null;
          from_value?: Json | null;
          id?: string;
          issue_id: string;
          project_id: string;
          summary: string;
          to_value?: Json | null;
          type: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["activity_logs"]["Insert"]
        >;
        Relationships: [];
      };
      comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          issue_id: string;
          parent_comment_id: string | null;
          project_id: string;
          thread_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          issue_id: string;
          parent_comment_id?: string | null;
          project_id: string;
          thread_id?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [];
      };
      github_integrations: {
        Row: {
          auto_merge: boolean | null;
          branch_name: string | null;
          created_at: string | null;
          github_issue_id: number | null;
          github_pr_number: number | null;
          github_repo_full_name: string | null;
          id: string;
          issue_id: string;
          project_id: string;
          synced_at: string | null;
        };
        Insert: {
          auto_merge?: boolean | null;
          branch_name?: string | null;
          created_at?: string | null;
          github_issue_id?: number | null;
          github_pr_number?: number | null;
          github_repo_full_name?: string | null;
          id?: string;
          issue_id: string;
          project_id: string;
          synced_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["github_integrations"]["Insert"]
        >;
        Relationships: [];
      };
      invitations: {
        Row: {
          created_at: string | null;
          email: string;
          expires_at: string;
          id: string;
          project_id: string;
          role: string;
          status: string;
          token: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          expires_at?: string;
          id?: string;
          project_id: string;
          role?: string;
          status?: string;
          token: string;
        };
        Update: Partial<Database["public"]["Tables"]["invitations"]["Insert"]>;
        Relationships: [];
      };
      issue_labels: {
        Row: {
          created_at: string;
          issue_id: string;
          label_id: string;
          project_id: string;
        };
        Insert: {
          created_at?: string;
          issue_id: string;
          label_id: string;
          project_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["issue_labels"]["Insert"]>;
        Relationships: [];
      };
      issue_templates: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          default_description: string | null;
          default_labels: string[] | null;
          default_priority: string | null;
          default_status: string;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          project_id: string;
          title_template: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          default_description?: string | null;
          default_labels?: string[] | null;
          default_priority?: string | null;
          default_status?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          project_id: string;
          title_template?: string;
          updated_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["issue_templates"]["Insert"]
        >;
        Relationships: [];
      };
      issues: {
        Row: {
          assignee_id: string | null;
          created_at: string;
          created_by: string;
          description: string;
          due_date: string | null;
          github_issue_id: number | null;
          github_issue_number: number | null;
          github_sync_status: string | null;
          github_synced_at: string | null;
          id: string;
          identifier: string;
          issue_number: number;
          priority: string;
          project_id: string;
          search_vector: string | null;
          status: string;
          title: string;
          updated_at: string;
          updated_by: string;
          version: number;
        };
        Insert: {
          assignee_id?: string | null;
          created_at?: string;
          created_by: string;
          description?: string;
          due_date?: string | null;
          github_issue_id?: number | null;
          github_issue_number?: number | null;
          github_sync_status?: string | null;
          github_synced_at?: string | null;
          id?: string;
          identifier?: string;
          issue_number?: number;
          priority?: string;
          project_id: string;
          status?: string;
          title: string;
          updated_at?: string;
          updated_by: string;
          version?: number;
        };
        Update: Partial<Database["public"]["Tables"]["issues"]["Insert"]>;
        Relationships: [];
      };
      labels: {
        Row: {
          color: string;
          created_at: string;
          created_by: string;
          id: string;
          name: string;
          name_key: string;
          project_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          created_by: string;
          id?: string;
          name: string;
          name_key: string;
          project_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["labels"]["Insert"]>;
        Relationships: [];
      };
      mcp_access_tokens: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          last_used_at: string | null;
          name: string;
          revoked_at: string | null;
          token_hash: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          last_used_at?: string | null;
          name: string;
          revoked_at?: string | null;
          token_hash: string;
          user_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["mcp_access_tokens"]["Insert"]
        >;
        Relationships: [];
      };
      mcp_oauth_auth_codes: {
        Row: {
          client_id: string;
          code_challenge: string | null;
          code_challenge_method: string | null;
          code_hash: string;
          created_at: string;
          expires_at: string;
          redirect_uri: string;
          scope: string;
          user_id: string;
        };
        Insert: {
          client_id: string;
          code_challenge?: string | null;
          code_challenge_method?: string | null;
          code_hash: string;
          created_at?: string;
          expires_at?: string;
          redirect_uri: string;
          scope?: string;
          user_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["mcp_oauth_auth_codes"]["Insert"]
        >;
        Relationships: [];
      };
      mcp_oauth_clients: {
        Row: {
          client_id: string;
          client_name: string | null;
          client_secret_hash: string;
          created_at: string;
          id: string;
          redirect_uris: Json;
        };
        Insert: {
          client_id: string;
          client_name?: string | null;
          client_secret_hash: string;
          created_at?: string;
          id?: string;
          redirect_uris?: Json;
        };
        Update: Partial<
          Database["public"]["Tables"]["mcp_oauth_clients"]["Insert"]
        >;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          comment_added: boolean;
          created_at: string;
          issue_assigned: boolean;
          issue_status_changed: boolean;
          project_invited: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          comment_added?: boolean;
          created_at?: string;
          issue_assigned?: boolean;
          issue_status_changed?: boolean;
          project_invited?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_preferences"]["Insert"]
        >;
        Relationships: [];
      };
      optimization_records: {
        Row: {
          after_value: number;
          before_value: number;
          bottleneck_id: string;
          created_at: string;
          description: string;
          id: string;
          implementation: string;
          improvement_percentage: number;
          title: string;
          verified_at: string | null;
        };
        Insert: {
          after_value: number;
          before_value: number;
          bottleneck_id: string;
          created_at?: string;
          description: string;
          id?: string;
          implementation: string;
          improvement_percentage: number;
          title: string;
          verified_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["optimization_records"]["Insert"]
        >;
        Relationships: [];
      };
      performance_baselines: {
        Row: {
          created_at: string;
          critical_threshold: number;
          id: string;
          metric_name: string;
          route: string | null;
          target_value: number;
          unit: string;
          updated_at: string;
          warning_threshold: number;
        };
        Insert: {
          created_at?: string;
          critical_threshold: number;
          id?: string;
          metric_name: string;
          route?: string | null;
          target_value: number;
          unit: string;
          updated_at?: string;
          warning_threshold: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["performance_baselines"]["Insert"]
        >;
        Relationships: [];
      };
      performance_bottlenecks: {
        Row: {
          category: string;
          current_value: number;
          description: string;
          id: string;
          identified_at: string;
          impact: string;
          location: string;
          resolved_at: string | null;
          severity: string;
          status: string;
          suggestion: string;
          target_value: number;
          title: string;
          unit: string;
        };
        Insert: {
          category: string;
          current_value: number;
          description: string;
          id?: string;
          identified_at?: string;
          impact: string;
          location: string;
          resolved_at?: string | null;
          severity: string;
          status: string;
          suggestion: string;
          target_value: number;
          title: string;
          unit: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["performance_bottlenecks"]["Insert"]
        >;
        Relationships: [];
      };
      performance_metrics: {
        Row: {
          environment: string;
          id: string;
          metadata: Json | null;
          name: string;
          route: string | null;
          timestamp: string;
          unit: string;
          value: number;
        };
        Insert: {
          environment: string;
          id?: string;
          metadata?: Json | null;
          name: string;
          route?: string | null;
          timestamp?: string;
          unit: string;
          value: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["performance_metrics"]["Insert"]
        >;
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          email: string;
          email_normalized: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          email: string;
          email_normalized: string;
          id: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      project_invitations: {
        Row: {
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          project_id: string;
          role: Database["public"]["Enums"]["project_member_role"];
          status: Database["public"]["Enums"]["invitation_status"];
          token: string;
          updated_at: string;
        };
        Insert: {
          accepted_by?: string | null;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          invited_by: string;
          project_id: string;
          role?: Database["public"]["Enums"]["project_member_role"];
          status?: Database["public"]["Enums"]["invitation_status"];
          token: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["project_invitations"]["Insert"]
        >;
        Relationships: [];
      };
      project_members: {
        Row: {
          created_at: string;
          project_id: string;
          role: Database["public"]["Enums"]["project_member_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          project_id: string;
          role: Database["public"]["Enums"]["project_member_role"];
          user_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["project_members"]["Insert"]
        >;
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string;
          created_by: string;
          github_integration_enabled: boolean | null;
          github_repo_name: string | null;
          github_repo_owner: string | null;
          id: string;
          issue_seq: number;
          key: string;
          name: string;
          type: Database["public"]["Enums"]["project_type"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          github_integration_enabled?: boolean | null;
          github_repo_name?: string | null;
          github_repo_owner?: string | null;
          id?: string;
          issue_seq?: number;
          key: string;
          name: string;
          type: Database["public"]["Enums"]["project_type"];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth_key: string;
          created_at: string;
          endpoint: string;
          id: string;
          is_active: boolean;
          p256dh_key: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auth_key: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          is_active?: boolean;
          p256dh_key: string;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["push_subscriptions"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_project_with_owner: {
        Args: {
          project_key: string;
          project_name: string;
          project_type: Database["public"]["Enums"]["project_type"];
        };
        Returns: Database["public"]["Tables"]["projects"]["Row"];
      };
      get_project_board_issues: {
        Args: {
          p_project_id: string;
        };
        Returns: {
          assignee: Json | null;
          created_at: string;
          due_date: string | null;
          id: string;
          identifier: string;
          issue_number: number;
          labels: Json;
          priority: string;
          project_id: string;
          status: string;
          title: string;
          updated_at: string;
        }[];
      };
      is_project_member: {
        Args: {
          target_project_id: string;
        };
        Returns: boolean;
      };
      is_project_owner: {
        Args: {
          target_project_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      invitation_status: "pending" | "accepted" | "revoked" | "expired";
      project_member_role: "owner" | "member";
      project_type: "personal" | "team";
    };
    CompositeTypes: Record<string, never>;
  };
}

export type TableName = keyof Database["public"]["Tables"];

export type TableRow<Name extends TableName> =
  Database["public"]["Tables"][Name]["Row"];
export type TableInsert<Name extends TableName> =
  Database["public"]["Tables"][Name]["Insert"];
export type TableUpdate<Name extends TableName> =
  Database["public"]["Tables"][Name]["Update"];
