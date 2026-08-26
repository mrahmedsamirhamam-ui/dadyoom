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
      achievements: {
        Row: {
          code: string
          description: string | null
          icon: string | null
          id: string
          title: string
          xp_reward: number | null
        }
        Insert: {
          code: string
          description?: string | null
          icon?: string | null
          id?: string
          title: string
          xp_reward?: number | null
        }
        Update: {
          code?: string
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      ai_assessments: {
        Row: {
          choices: Json
          completed: boolean | null
          correct_answer: number
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          lesson_id: string | null
          passage: string
          question: string
          skill: string | null
          student_email: string
          title: string
        }
        Insert: {
          choices: Json
          completed?: boolean | null
          correct_answer: number
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          passage: string
          question: string
          skill?: string | null
          student_email: string
          title: string
        }
        Update: {
          choices?: Json
          completed?: boolean | null
          correct_answer?: number
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          passage?: string
          question?: string
          skill?: string | null
          student_email?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_assessments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          lesson_id: string | null
          message: string
          priority: string | null
          student_email: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          lesson_id?: string | null
          message: string
          priority?: string | null
          student_email: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          lesson_id?: string | null
          message?: string
          priority?: string | null
          student_email?: string
          title?: string
        }
        Relationships: []
      }
      ai_tutor_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_messages_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      avatar: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      book_imports: {
        Row: {
          curriculum_id: string | null
          finished_at: string | null
          id: string
          imported_lessons: number | null
          imported_questions: number | null
          imported_vocabulary: number | null
          source_pdf: string
          started_at: string | null
          status: string
          title: string
          total_pages: number
        }
        Insert: {
          curriculum_id?: string | null
          finished_at?: string | null
          id?: string
          imported_lessons?: number | null
          imported_questions?: number | null
          imported_vocabulary?: number | null
          source_pdf: string
          started_at?: string | null
          status?: string
          title: string
          total_pages: number
        }
        Update: {
          curriculum_id?: string | null
          finished_at?: string | null
          id?: string
          imported_lessons?: number | null
          imported_questions?: number | null
          imported_vocabulary?: number | null
          source_pdf?: string
          started_at?: string | null
          status?: string
          title?: string
          total_pages?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          created_at: string
          id: string
          message: string
          page: string | null
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          page?: string | null
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          page?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      choices: {
        Row: {
          choice_text: string
          id: string
          is_correct: boolean | null
          question_id: string | null
        }
        Insert: {
          choice_text: string
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
        }
        Update: {
          choice_text?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
        }
        Relationships: []
      }
      country: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      courses: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          level: string
          published: boolean | null
          title: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          level: string
          published?: boolean | null
          title: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          level?: string
          published?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      created_at: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      curricula: {
        Row: {
          academic_year: string | null
          country_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
        }
        Insert: {
          academic_year?: string | null
          country_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
        }
        Update: {
          academic_year?: string | null
          country_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curricula_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      edu_activities: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          instructions: string | null
          is_published: boolean
          lesson_id: string
          order_no: number
          payload: Json
          points: number
          title: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_published?: boolean
          lesson_id: string
          order_no?: number
          payload?: Json
          points?: number
          title: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_published?: boolean
          lesson_id?: string
          order_no?: number
          payload?: Json
          points?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "edu_activities_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "edu_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      edu_badges: {
        Row: {
          code: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          points_required: number
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          points_required?: number
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          points_required?: number
          title?: string
        }
        Relationships: []
      }
      edu_countries: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
        }
        Relationships: []
      }
      edu_curricula: {
        Row: {
          academic_year: string
          country_id: string
          created_at: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
        }
        Insert: {
          academic_year?: string
          country_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
        }
        Update: {
          academic_year?: string
          country_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edu_curricula_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "edu_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      edu_grades: {
        Row: {
          created_at: string
          curriculum_id: string
          id: string
          name_ar: string
          name_en: string | null
          order_no: number
        }
        Insert: {
          created_at?: string
          curriculum_id: string
          id?: string
          name_ar: string
          name_en?: string | null
          order_no?: number
        }
        Update: {
          created_at?: string
          curriculum_id?: string
          id?: string
          name_ar?: string
          name_en?: string | null
          order_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "edu_grades_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "edu_curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      edu_learner_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_opened_at: string
          lesson_id: string
          progress_percent: number
          score: number | null
          started_at: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_opened_at?: string
          lesson_id: string
          progress_percent?: number
          score?: number | null
          started_at?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_opened_at?: string
          lesson_id?: string
          progress_percent?: number
          score?: number | null
          started_at?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "edu_learner_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "edu_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      edu_lessons: {
        Row: {
          audio_url: string | null
          content: Json
          created_at: string
          created_by: string | null
          difficulty: string
          estimated_minutes: number
          id: string
          is_published: boolean
          objective: string | null
          order_no: number
          points_reward: number
          slug: string
          title: string
          unit_id: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          audio_url?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          difficulty?: string
          estimated_minutes?: number
          id?: string
          is_published?: boolean
          objective?: string | null
          order_no?: number
          points_reward?: number
          slug: string
          title: string
          unit_id: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          audio_url?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          difficulty?: string
          estimated_minutes?: number
          id?: string
          is_published?: boolean
          objective?: string | null
          order_no?: number
          points_reward?: number
          slug?: string
          title?: string
          unit_id?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edu_lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "edu_units"
            referencedColumns: ["id"]
          },
        ]
      }
      edu_point_transactions: {
        Row: {
          activity_id: string | null
          created_at: string
          id: string
          lesson_id: string | null
          metadata: Json
          points: number
          reason: string
          student_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          metadata?: Json
          points: number
          reason: string
          student_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          id?: string
          lesson_id?: string | null
          metadata?: Json
          points?: number
          reason?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edu_point_transactions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "edu_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edu_point_transactions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "edu_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      edu_questions: {
        Row: {
          activity_id: string
          choices: Json | null
          correct_answer: Json | null
          created_at: string
          explanation: string | null
          id: string
          order_no: number
          points: number
          question_text: string
          question_type: string
        }
        Insert: {
          activity_id: string
          choices?: Json | null
          correct_answer?: Json | null
          created_at?: string
          explanation?: string | null
          id?: string
          order_no?: number
          points?: number
          question_text: string
          question_type: string
        }
        Update: {
          activity_id?: string
          choices?: Json | null
          correct_answer?: Json | null
          created_at?: string
          explanation?: string | null
          id?: string
          order_no?: number
          points?: number
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "edu_questions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "edu_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      edu_student_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          id: string
          student_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          id?: string
          student_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edu_student_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "edu_badges"
            referencedColumns: ["id"]
          },
        ]
      }
      edu_subjects: {
        Row: {
          color: string | null
          created_at: string
          grade_id: string
          icon: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
          order_no: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          grade_id: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
          order_no?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          grade_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
          order_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "edu_subjects_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "edu_grades"
            referencedColumns: ["id"]
          },
        ]
      }
      edu_units: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          order_no: number
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          order_no?: number
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          order_no?: number
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "edu_units_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "edu_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      educational_stages: {
        Row: {
          created_at: string
          curriculum_id: string
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
          stage_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum_id: string
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
          stage_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum_id?: string
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
          stage_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      grade: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      grades: {
        Row: {
          created_at: string
          curriculum_id: string
          grade_number: number | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          curriculum_id: string
          grade_number?: number | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          curriculum_id?: string
          grade_number?: number | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "grades_curriculum_id_fkey"
            columns: ["curriculum_id"]
            isOneToOne: false
            referencedRelation: "curricula"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_plans: {
        Row: {
          completed: boolean | null
          created_at: string | null
          daily_goal: string | null
          focus_skill: string | null
          id: string
          message: string
          motivation: string | null
          practice_type: string | null
          priority: string
          recommended_lesson: string | null
          student_email: string
          title: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          daily_goal?: string | null
          focus_skill?: string | null
          id?: string
          message: string
          motivation?: string | null
          practice_type?: string | null
          priority: string
          recommended_lesson?: string | null
          student_email: string
          title: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          daily_goal?: string | null
          focus_skill?: string | null
          id?: string
          message?: string
          motivation?: string | null
          practice_type?: string | null
          priority?: string
          recommended_lesson?: string | null
          student_email?: string
          title?: string
        }
        Relationships: []
      }
      lesson_activities: {
        Row: {
          activity_order: number
          activity_type: string
          content: Json
          created_at: string
          id: string
          instructions: string | null
          is_published: boolean
          lesson_id: string
          points: number
          title: string
          updated_at: string
        }
        Insert: {
          activity_order?: number
          activity_type: string
          content?: Json
          created_at?: string
          id?: string
          instructions?: string | null
          is_published?: boolean
          lesson_id: string
          points?: number
          title: string
          updated_at?: string
        }
        Update: {
          activity_order?: number
          activity_type?: string
          content?: Json
          created_at?: string
          id?: string
          instructions?: string | null
          is_published?: boolean
          lesson_id?: string
          points?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_ai_metadata: {
        Row: {
          created_at: string
          difficulty_level: string | null
          estimated_duration_minutes: number | null
          id: string
          keywords: string[]
          lesson_id: string
          reading_level: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty_level?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          keywords?: string[]
          lesson_id: string
          reading_level?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty_level?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          keywords?: string[]
          lesson_id?: string
          reading_level?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_ai_metadata_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_characters: {
        Row: {
          character_name: string
          character_role: string | null
          created_at: string
          display_order: number
          id: string
          lesson_id: string
        }
        Insert: {
          character_name: string
          character_role?: string | null
          created_at?: string
          display_order?: number
          id?: string
          lesson_id: string
        }
        Update: {
          character_name?: string
          character_role?: string | null
          created_at?: string
          display_order?: number
          id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_characters_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          role: string
          student_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          role: string
          student_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          role?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_chat_messages_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_explanations: {
        Row: {
          content: string
          created_at: string
          explanation_type: string
          id: string
          lesson_id: string
        }
        Insert: {
          content: string
          created_at?: string
          explanation_type: string
          id?: string
          lesson_id: string
        }
        Update: {
          content?: string
          created_at?: string
          explanation_type?: string
          id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_explanations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_learning_objectives: {
        Row: {
          created_at: string
          display_order: number
          id: string
          lesson_id: string
          objective: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          lesson_id: string
          objective: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          lesson_id?: string
          objective?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_learning_objectives_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_main_ideas: {
        Row: {
          created_at: string
          display_order: number
          id: string
          idea: string
          lesson_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          idea: string
          lesson_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          idea?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_main_ideas_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_mastery: {
        Row: {
          asked_questions: number
          correct_answers: number
          id: string
          last_answer: string | null
          last_question: string | null
          lesson_id: string
          mastery_score: number
          student_id: string
          updated_at: string
          wrong_answers: number
        }
        Insert: {
          asked_questions?: number
          correct_answers?: number
          id?: string
          last_answer?: string | null
          last_question?: string | null
          lesson_id: string
          mastery_score?: number
          student_id: string
          updated_at?: string
          wrong_answers?: number
        }
        Update: {
          asked_questions?: number
          correct_answers?: number
          id?: string
          last_answer?: string | null
          last_question?: string | null
          lesson_id?: string
          mastery_score?: number
          student_id?: string
          updated_at?: string
          wrong_answers?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_mastery_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_paragraphs: {
        Row: {
          content: string
          created_at: string
          id: string
          lesson_id: string
          paragraph_number: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lesson_id: string
          paragraph_number: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lesson_id?: string
          paragraph_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_paragraphs_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_sentence_embeddings: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          lesson_id: string
          paragraph_number: number
          sentence: string
          sentence_number: number
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          lesson_id: string
          paragraph_number: number
          sentence: string
          sentence_number: number
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          lesson_id?: string
          paragraph_number?: number
          sentence?: string
          sentence_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sentence_embeddings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_skills: {
        Row: {
          created_at: string
          display_order: number
          id: string
          lesson_id: string
          skill: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          lesson_id: string
          skill: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          lesson_id?: string
          skill?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_skills_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_teacher_notes: {
        Row: {
          content: string
          created_at: string
          display_order: number
          id: string
          lesson_id: string
          note_type: string
        }
        Insert: {
          content: string
          created_at?: string
          display_order?: number
          id?: string
          lesson_id: string
          note_type: string
        }
        Update: {
          content?: string
          created_at?: string
          display_order?: number
          id?: string
          lesson_id?: string
          note_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_teacher_notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_values: {
        Row: {
          created_at: string
          display_order: number
          id: string
          lesson_id: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          lesson_id: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          lesson_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_values_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_vocabulary: {
        Row: {
          created_at: string | null
          display_order: number
          example: string | null
          id: string
          lesson_id: string
          meaning: string
          updated_at: string | null
          word: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          example?: string | null
          id?: string
          lesson_id: string
          meaning: string
          updated_at?: string | null
          word: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          example?: string | null
          id?: string
          lesson_id?: string
          meaning?: string
          updated_at?: string | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_vocabulary_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          estimated_minutes: number | null
          id: string
          instructions: Json
          is_free: boolean
          learning_objectives: Json
          lesson_number: number | null
          lesson_type: string
          slug: string | null
          sort_order: number
          source_page_end: number | null
          source_page_start: number | null
          source_pdf_url: string | null
          status: string
          summary: string | null
          title: string
          unit_id: string
          updated_at: string
          vocabulary: Json
        }
        Insert: {
          content?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          instructions?: Json
          is_free?: boolean
          learning_objectives?: Json
          lesson_number?: number | null
          lesson_type?: string
          slug?: string | null
          sort_order?: number
          source_page_end?: number | null
          source_page_start?: number | null
          source_pdf_url?: string | null
          status?: string
          summary?: string | null
          title: string
          unit_id: string
          updated_at?: string
          vocabulary?: Json
        }
        Update: {
          content?: string | null
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          instructions?: Json
          is_free?: boolean
          learning_objectives?: Json
          lesson_number?: number | null
          lesson_type?: string
          slug?: string | null
          sort_order?: number
          source_page_end?: number | null
          source_page_start?: number | null
          source_pdf_url?: string | null
          status?: string
          summary?: string | null
          title?: string
          unit_id?: string
          updated_at?: string
          vocabulary?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          role: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          role: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      reading_passport_entries: {
        Row: {
          completed_at: string | null
          comprehension_score: number | null
          created_at: string
          creative_response: string | null
          critical_reflection: string | null
          id: string
          lesson_id: string
          status: string
          student_id: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          comprehension_score?: number | null
          created_at?: string
          creative_response?: string | null
          critical_reflection?: string | null
          id?: string
          lesson_id: string
          status?: string
          student_id: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          comprehension_score?: number | null
          created_at?: string
          creative_response?: string | null
          critical_reflection?: string | null
          id?: string
          lesson_id?: string
          status?: string
          student_id?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_passport_entries_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_passport_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_attempts: {
        Row: {
          answered_at: string | null
          id: string
          is_correct: boolean
          question_id: string
          selected_answer: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          id?: string
          is_correct: boolean
          question_id: string
          selected_answer: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_answer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          lesson_id: string
          options: Json
          points: number
          question: string
          question_order: number
          question_type: string
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id: string
          options?: Json
          points?: number
          question: string
          question_order: number
          question_type: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id?: string
          options?: Json
          points?: number
          question?: string
          question_order?: number
          question_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          finished_at: string | null
          id: string
          passed: boolean | null
          quiz_id: string | null
          score: number | null
          started_at: string | null
          student_id: string | null
        }
        Insert: {
          finished_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string | null
          score?: number | null
          started_at?: string | null
          student_id?: string | null
        }
        Update: {
          finished_at?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string | null
          score?: number | null
          started_at?: string | null
          student_id?: string | null
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_answer: Json
          created_at: string
          explanation: string | null
          id: string
          options: Json
          points: number
          question_order: number
          question_text: string
          question_type: string
          quiz_id: string
          updated_at: string
        }
        Insert: {
          correct_answer?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          points?: number
          question_order?: number
          question_text: string
          question_type: string
          quiz_id: string
          updated_at?: string
        }
        Update: {
          correct_answer?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          points?: number
          question_order?: number
          question_text?: string
          question_type?: string
          quiz_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean
          lesson_id: string | null
          passing_score: number
          title: string
          total_points: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          lesson_id?: string | null
          passing_score?: number
          title: string
          total_points?: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          lesson_id?: string | null
          passing_score?: number
          title?: string
          total_points?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      school: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      student_achievements: {
        Row: {
          achievement_code: string | null
          achievement_key: string
          description: string | null
          earned_at: string | null
          icon: string | null
          id: string
          student_email: string
          title: string
          unlocked_at: string
        }
        Insert: {
          achievement_code?: string | null
          achievement_key: string
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          student_email: string
          title: string
          unlocked_at?: string
        }
        Update: {
          achievement_code?: string | null
          achievement_key?: string
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          student_email?: string
          title?: string
          unlocked_at?: string
        }
        Relationships: []
      }
      student_answers: {
        Row: {
          answered_at: string | null
          id: string
          is_correct: boolean | null
          question_id: string | null
          selected_answer: number | null
          student_email: string
        }
        Insert: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          selected_answer?: number | null
          student_email: string
        }
        Update: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string | null
          selected_answer?: number | null
          student_email?: string
        }
        Relationships: []
      }
      student_assessments: {
        Row: {
          correct: boolean | null
          created_at: string | null
          difficulty: string | null
          feedback: string | null
          id: string
          lesson_id: string | null
          mistake_category: string | null
          mistakes: string[] | null
          model_answer: string | null
          question: string | null
          recommendation: string | null
          score: number | null
          skill: string | null
          strengths: string[] | null
          student_answer: string | null
          student_email: string
          teacher_comment: string | null
        }
        Insert: {
          correct?: boolean | null
          created_at?: string | null
          difficulty?: string | null
          feedback?: string | null
          id?: string
          lesson_id?: string | null
          mistake_category?: string | null
          mistakes?: string[] | null
          model_answer?: string | null
          question?: string | null
          recommendation?: string | null
          score?: number | null
          skill?: string | null
          strengths?: string[] | null
          student_answer?: string | null
          student_email: string
          teacher_comment?: string | null
        }
        Update: {
          correct?: boolean | null
          created_at?: string | null
          difficulty?: string | null
          feedback?: string | null
          id?: string
          lesson_id?: string | null
          mistake_category?: string | null
          mistakes?: string[] | null
          model_answer?: string | null
          question?: string | null
          recommendation?: string | null
          score?: number | null
          skill?: string | null
          strengths?: string[] | null
          student_answer?: string | null
          student_email?: string
          teacher_comment?: string | null
        }
        Relationships: []
      }
      student_learning_profile: {
        Row: {
          average_score: number
          completed_lessons: number
          created_at: string | null
          current_level: number
          last_activity_at: string | null
          learning_speed: string | null
          mastered_lessons: number
          preferred_learning_style: string | null
          strongest_skill: string | null
          student_id: string
          total_xp: number
          updated_at: string | null
          weakest_skill: string | null
        }
        Insert: {
          average_score?: number
          completed_lessons?: number
          created_at?: string | null
          current_level?: number
          last_activity_at?: string | null
          learning_speed?: string | null
          mastered_lessons?: number
          preferred_learning_style?: string | null
          strongest_skill?: string | null
          student_id: string
          total_xp?: number
          updated_at?: string | null
          weakest_skill?: string | null
        }
        Update: {
          average_score?: number
          completed_lessons?: number
          created_at?: string | null
          current_level?: number
          last_activity_at?: string | null
          learning_speed?: string | null
          mastered_lessons?: number
          preferred_learning_style?: string | null
          strongest_skill?: string | null
          student_id?: string
          total_xp?: number
          updated_at?: string | null
          weakest_skill?: string | null
        }
        Relationships: []
      }
      student_lesson_progress: {
        Row: {
          attempts: number
          best_score: number
          completed_at: string | null
          created_at: string | null
          id: string
          last_score: number
          lesson_id: string
          progress_percent: number
          started_at: string | null
          status: string
          student_id: string
          time_spent_seconds: number
          updated_at: string | null
          xp: number
        }
        Insert: {
          attempts?: number
          best_score?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_score?: number
          lesson_id: string
          progress_percent?: number
          started_at?: string | null
          status?: string
          student_id: string
          time_spent_seconds?: number
          updated_at?: string | null
          xp?: number
        }
        Update: {
          attempts?: number
          best_score?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_score?: number
          lesson_id?: string
          progress_percent?: number
          started_at?: string | null
          status?: string
          student_id?: string
          time_spent_seconds?: number
          updated_at?: string | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      student_mistakes: {
        Row: {
          category: string
          id: string
          last_lesson_id: string | null
          mistake_count: number
          student_email: string
          updated_at: string
        }
        Insert: {
          category: string
          id?: string
          last_lesson_id?: string | null
          mistake_count?: number
          student_email: string
          updated_at?: string
        }
        Update: {
          category?: string
          id?: string
          last_lesson_id?: string | null
          mistake_count?: number
          student_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          earned_points: number | null
          id: string
          lesson_id: string | null
          score: number | null
          student_email: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          earned_points?: number | null
          id?: string
          lesson_id?: string | null
          score?: number | null
          student_email: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          earned_points?: number | null
          id?: string
          lesson_id?: string | null
          score?: number | null
          student_email?: string
        }
        Relationships: []
      }
      student_skills: {
        Row: {
          attempts: number
          correct_attempts: number
          id: string
          score: number
          skill: string
          student_email: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          correct_attempts?: number
          id?: string
          score?: number
          skill: string
          student_email: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          correct_attempts?: number
          id?: string
          score?: number
          skill?: string
          student_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_stats: {
        Row: {
          completed_courses: number | null
          completed_lessons: number | null
          points: number | null
          student_email: string
          updated_at: string | null
        }
        Insert: {
          completed_courses?: number | null
          completed_lessons?: number | null
          points?: number | null
          student_email: string
          updated_at?: string | null
        }
        Update: {
          completed_courses?: number | null
          completed_lessons?: number | null
          points?: number | null
          student_email?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_streaks: {
        Row: {
          current_streak: number
          last_activity_date: string | null
          longest_streak: number
          student_email: string
          updated_at: string
        }
        Insert: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          student_email: string
          updated_at?: string
        }
        Update: {
          current_streak?: number
          last_activity_date?: string | null
          longest_streak?: number
          student_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string
          description: string | null
          grade_id: string
          id: string
          image_url: string | null
          sort_order: number
          title: string
          unit_number: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          grade_id: string
          id?: string
          image_url?: string | null
          sort_order?: number
          title: string
          unit_number?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          grade_id?: string
          id?: string
          image_url?: string | null
          sort_order?: number
          title?: string
          unit_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "units_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_student_points: {
        Args: { p_points: number; p_student_email: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      match_lesson_context: {
        Args: {
          context_radius?: number
          filter_lesson_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          context_text: string
          lesson_id: string
          matched_id: string
          matched_sentence: string
          paragraph_number: number
          sentence_number: number
          similarity: number
        }[]
      }
      match_lesson_sentences: {
        Args: {
          filter_lesson_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          id: string
          lesson_id: string
          paragraph_number: number
          sentence: string
          sentence_number: number
          similarity: number
        }[]
      }
      update_student_streak: {
        Args: { p_activity_date: string; p_student_email: string }
        Returns: {
          current_streak: number
          last_activity_date: string
          longest_streak: number
        }[]
      }
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
