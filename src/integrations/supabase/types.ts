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
      ai_reviews: {
        Row: {
          created_at: string
          id: string
          improvements: string | null
          next_action: string | null
          score: number
          strengths: string | null
          submission_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          improvements?: string | null
          next_action?: string | null
          score: number
          strengths?: string | null
          submission_id: string
        }
        Update: {
          created_at?: string
          id?: string
          improvements?: string | null
          next_action?: string | null
          score?: number
          strengths?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_reviews_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          action: Database["public"]["Enums"]["ai_action_type"]
          count: number
          id: string
          usage_date: string
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["ai_action_type"]
          count?: number
          id?: string
          usage_date?: string
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["ai_action_type"]
          count?: number
          id?: string
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      milestones: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number
          roadmap_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          roadmap_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          roadmap_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmaps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          content: string
          created_at: string
          github_link: string | null
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          github_link?: string | null
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          github_link?: string | null
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_videos: {
        Row: {
          channel: string
          created_at: string
          id: string
          task_id: string
          title: string
          url: string
          video_id: string
          watched: boolean
          watched_at: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          task_id: string
          title: string
          url: string
          video_id: string
          watched?: boolean
          watched_at?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          task_id?: string
          title?: string
          url?: string
          video_id?: string
          watched?: boolean
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_videos_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          milestone_id: string
          order_index: number
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          milestone_id: string
          order_index?: number
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          milestone_id?: string
          order_index?: number
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      testing_answers: {
        Row: {
          answer_text: string
          created_at: string
          feedback: string | null
          id: string
          question_id: string
          score: number | null
        }
        Insert: {
          answer_text: string
          created_at?: string
          feedback?: string | null
          id?: string
          question_id: string
          score?: number | null
        }
        Update: {
          answer_text?: string
          created_at?: string
          feedback?: string | null
          id?: string
          question_id?: string
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "testing_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "testing_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      testing_attempts: {
        Row: {
          created_at: string
          id: string
          passed: boolean | null
          reflection_feedback: string | null
          reflection_score: number | null
          reflection_text: string
          task_id: string
          user_id: string
          video_summaries: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          passed?: boolean | null
          reflection_feedback?: string | null
          reflection_score?: number | null
          reflection_text: string
          task_id: string
          user_id: string
          video_summaries?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          passed?: boolean | null
          reflection_feedback?: string | null
          reflection_score?: number | null
          reflection_text?: string
          task_id?: string
          user_id?: string
          video_summaries?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "testing_attempts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      testing_questions: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          order_index: number
          question_text: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          order_index?: number
          question_text: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          order_index?: number
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "testing_questions_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "testing_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          branch: Database["public"]["Enums"]["branch_type"] | null
          created_at: string
          id: string
          onboarding_completed: boolean | null
          skill_level: Database["public"]["Enums"]["skill_level"] | null
          target_role: Database["public"]["Enums"]["target_role"] | null
          updated_at: string
          user_id: string
          weekly_hours: number | null
        }
        Insert: {
          branch?: Database["public"]["Enums"]["branch_type"] | null
          created_at?: string
          id?: string
          onboarding_completed?: boolean | null
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          target_role?: Database["public"]["Enums"]["target_role"] | null
          updated_at?: string
          user_id: string
          weekly_hours?: number | null
        }
        Update: {
          branch?: Database["public"]["Enums"]["branch_type"] | null
          created_at?: string
          id?: string
          onboarding_completed?: boolean | null
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          target_role?: Database["public"]["Enums"]["target_role"] | null
          updated_at?: string
          user_id?: string
          weekly_hours?: number | null
        }
        Relationships: []
      }
      video_summaries_cache: {
        Row: {
          created_at: string
          summary_text: string
          video_id: string
        }
        Insert: {
          created_at?: string
          summary_text: string
          video_id: string
        }
        Update: {
          created_at?: string
          summary_text?: string
          video_id?: string
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
      ai_action_type: "roadmap_generation" | "project_review"
      branch_type: "CSE" | "IT" | "ECE"
      skill_level: "Beginner" | "Intermediate" | "Advanced"
      target_role: "Frontend" | "Backend" | "Full Stack"
      task_status: "todo" | "in_progress" | "done" | "testing"
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
      ai_action_type: ["roadmap_generation", "project_review"],
      branch_type: ["CSE", "IT", "ECE"],
      skill_level: ["Beginner", "Intermediate", "Advanced"],
      target_role: ["Frontend", "Backend", "Full Stack"],
      task_status: ["todo", "in_progress", "done", "testing"],
    },
  },
} as const
