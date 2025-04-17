
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      columns: {
        Row: {
          id: string
          title: string
          board_id: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          board_id: string
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          board_id?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      cards: {
        Row: {
          id: string
          title: string
          description: string | null
          column_id: string
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          column_id: string
          position: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          column_id?: string
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string
          board_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          color: string
          board_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          color?: string
          board_id?: string
          created_at?: string
        }
      }
      card_tags: {
        Row: {
          id: string
          card_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          card_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          card_id?: string
          tag_id?: string
          created_at?: string
        }
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
  }
}

export type Board = Database['public']['Tables']['boards']['Row']
export type Column = Database['public']['Tables']['columns']['Row']
export type Card = Database['public']['Tables']['cards']['Row']
export type Tag = Database['public']['Tables']['tags']['Row']
export type CardTag = Database['public']['Tables']['card_tags']['Row']

export type BoardWithColumns = Board & {
  columns: (Column & {
    cards: (Card & {
      tags: Tag[]
    })[]
  })[]
}