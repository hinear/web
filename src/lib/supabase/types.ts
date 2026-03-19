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
        Update: Partial<Database["public"]["Tables"]["activity_logs"]["Insert"]>;
        Relationships: [];
      };
      comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          issue_id: string;
          project_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          issue_id: string;
          project_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [];
      };
      issues: {
        Row: {
          assignee_id: string | null;
          created_at: string;
          created_by: string;
          description: string;
          id: string;
          identifier: string;
          issue_number: number;
          priority: string;
          project_id: string;
          status: string;
          title: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          assignee_id?: string | null;
          created_at?: string;
          created_by: string;
          description?: string;
          id?: string;
          identifier?: string;
          issue_number?: number;
          priority?: string;
          project_id: string;
          status?: string;
          title: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: Partial<Database["public"]["Tables"]["issues"]["Insert"]>;
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
        };
        Update: Partial<Database["public"]["Tables"]["project_invitations"]["Insert"]>;
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
        Update: Partial<Database["public"]["Tables"]["project_members"]["Insert"]>;
        Relationships: [];
      };
      projects: {
        Row: {
          created_at: string;
          created_by: string;
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
    };
    Views: Record<string, never>;
    Functions: {
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

export type TableRow<Name extends TableName> = Database["public"]["Tables"][Name]["Row"];
export type TableInsert<Name extends TableName> = Database["public"]["Tables"][Name]["Insert"];
