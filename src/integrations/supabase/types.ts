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
      categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      comentario_likes: {
        Row: {
          comentario_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comentario_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comentario_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentario_likes_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "drink_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      drink_categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      drink_comentarios: {
        Row: {
          created_at: string
          drink_id: string
          id: string
          texto: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drink_id: string
          id?: string
          texto: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          drink_id?: string
          id?: string
          texto?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drink_comentarios_drink_id_fkey"
            columns: ["drink_id"]
            isOneToOne: false
            referencedRelation: "drinks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drink_comentarios_drink_id_fkey"
            columns: ["drink_id"]
            isOneToOne: false
            referencedRelation: "drinks_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      drink_drink_categorias: {
        Row: {
          categoria_id: string
          created_at: string
          drink_id: string
        }
        Insert: {
          categoria_id: string
          created_at?: string
          drink_id: string
        }
        Update: {
          categoria_id?: string
          created_at?: string
          drink_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drink_drink_categorias_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "drink_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drink_drink_categorias_drink_id_fkey"
            columns: ["drink_id"]
            isOneToOne: false
            referencedRelation: "drinks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drink_drink_categorias_drink_id_fkey"
            columns: ["drink_id"]
            isOneToOne: false
            referencedRelation: "drinks_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      drink_favoritos: {
        Row: {
          created_at: string
          drink_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drink_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          drink_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drink_favoritos_drink_id_fkey"
            columns: ["drink_id"]
            isOneToOne: false
            referencedRelation: "drinks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drink_favoritos_drink_id_fkey"
            columns: ["drink_id"]
            isOneToOne: false
            referencedRelation: "drinks_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      drink_ingredientes: {
        Row: {
          drink_id: string
          ingrediente_id: string
          opcional: boolean
          quantidade: number | null
          unidade: string
        }
        Insert: {
          drink_id: string
          ingrediente_id: string
          opcional?: boolean
          quantidade?: number | null
          unidade?: string
        }
        Update: {
          drink_id?: string
          ingrediente_id?: string
          opcional?: boolean
          quantidade?: number | null
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "drink_ingredientes_drink_id_fkey"
            columns: ["drink_id"]
            isOneToOne: false
            referencedRelation: "drinks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drink_ingredientes_drink_id_fkey"
            columns: ["drink_id"]
            isOneToOne: false
            referencedRelation: "drinks_lista"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drink_ingredientes_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      drink_likes: {
        Row: {
          created_at: string
          drink_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drink_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          drink_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drink_likes_drink_id_fkey"
            columns: ["drink_id"]
            isOneToOne: false
            referencedRelation: "drinks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drink_likes_drink_id_fkey"
            columns: ["drink_id"]
            isOneToOne: false
            referencedRelation: "drinks_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      drink_redirects: {
        Row: {
          created_at: string
          new_id: string
          old_id: string
        }
        Insert: {
          created_at?: string
          new_id: string
          old_id: string
        }
        Update: {
          created_at?: string
          new_id?: string
          old_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drink_redirects_new_id_fkey"
            columns: ["new_id"]
            isOneToOne: false
            referencedRelation: "drinks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drink_redirects_new_id_fkey"
            columns: ["new_id"]
            isOneToOne: false
            referencedRelation: "drinks_lista"
            referencedColumns: ["id"]
          },
        ]
      }
      drink_remocoes_log: {
        Row: {
          created_at: string
          drink_id: string | null
          drink_nome: string
          drink_slug: string | null
          id: string
          motivo: string
          removido_por: string
          removido_por_email: string | null
        }
        Insert: {
          created_at?: string
          drink_id?: string | null
          drink_nome: string
          drink_slug?: string | null
          id?: string
          motivo: string
          removido_por: string
          removido_por_email?: string | null
        }
        Update: {
          created_at?: string
          drink_id?: string | null
          drink_nome?: string
          drink_slug?: string | null
          id?: string
          motivo?: string
          removido_por?: string
          removido_por_email?: string | null
        }
        Relationships: []
      }
      drinks: {
        Row: {
          copo: string | null
          created_at: string
          created_by: string | null
          dificuldade: string
          guarnicao: string | null
          historia: string | null
          id: string
          imagem_url: string | null
          metodo_preparo: string | null
          nome: string
          passos: Json
          preparo: string
          slug: string | null
        }
        Insert: {
          copo?: string | null
          created_at?: string
          created_by?: string | null
          dificuldade?: string
          guarnicao?: string | null
          historia?: string | null
          id?: string
          imagem_url?: string | null
          metodo_preparo?: string | null
          nome: string
          passos?: Json
          preparo?: string
          slug?: string | null
        }
        Update: {
          copo?: string | null
          created_at?: string
          created_by?: string | null
          dificuldade?: string
          guarnicao?: string | null
          historia?: string | null
          id?: string
          imagem_url?: string | null
          metodo_preparo?: string | null
          nome?: string
          passos?: Json
          preparo?: string
          slug?: string | null
        }
        Relationships: []
      }
      ingredientes: {
        Row: {
          categoria_id: string | null
          created_at: string
          created_by: string | null
          id: string
          nome: string
          quantidade: number
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          quantidade?: number
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "ingredientes_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      meu_bar: {
        Row: {
          created_at: string
          id: string
          ingrediente_id: string
          observacoes: string | null
          preco_garrafa: number | null
          updated_at: string
          user_id: string
          volume_garrafa_ml: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingrediente_id: string
          observacoes?: string | null
          preco_garrafa?: number | null
          updated_at?: string
          user_id: string
          volume_garrafa_ml?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          ingrediente_id?: string
          observacoes?: string | null
          preco_garrafa?: number | null
          updated_at?: string
          user_id?: string
          volume_garrafa_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meu_bar_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          dose_ml: number
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          dose_ml?: number
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          dose_ml?: number
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_indexacao_log: {
        Row: {
          consultado_em: string
          consultado_por: string | null
          coverage_state: string | null
          erro: string | null
          google_canonical: string | null
          id: string
          indexing_state: string | null
          inspection_link: string | null
          last_crawl_time: string | null
          page_fetch_state: string | null
          robots_txt_state: string | null
          tipo: string
          url: string
          user_canonical: string | null
          verdict: string | null
        }
        Insert: {
          consultado_em?: string
          consultado_por?: string | null
          coverage_state?: string | null
          erro?: string | null
          google_canonical?: string | null
          id?: string
          indexing_state?: string | null
          inspection_link?: string | null
          last_crawl_time?: string | null
          page_fetch_state?: string | null
          robots_txt_state?: string | null
          tipo?: string
          url: string
          user_canonical?: string | null
          verdict?: string | null
        }
        Update: {
          consultado_em?: string
          consultado_por?: string | null
          coverage_state?: string | null
          erro?: string | null
          google_canonical?: string | null
          id?: string
          indexing_state?: string | null
          inspection_link?: string | null
          last_crawl_time?: string | null
          page_fetch_state?: string | null
          robots_txt_state?: string | null
          tipo?: string
          url?: string
          user_canonical?: string | null
          verdict?: string | null
        }
        Relationships: []
      }
      seo_sitemap_log: {
        Row: {
          acao: string
          criado_em: string
          criado_por: string | null
          erro: string | null
          errors: number | null
          id: string
          is_pending: boolean | null
          last_downloaded: string | null
          last_submitted: string | null
          sitemap_url: string
          total_urls: number | null
          warnings: number | null
        }
        Insert: {
          acao?: string
          criado_em?: string
          criado_por?: string | null
          erro?: string | null
          errors?: number | null
          id?: string
          is_pending?: boolean | null
          last_downloaded?: string | null
          last_submitted?: string | null
          sitemap_url: string
          total_urls?: number | null
          warnings?: number | null
        }
        Update: {
          acao?: string
          criado_em?: string
          criado_por?: string | null
          erro?: string | null
          errors?: number | null
          id?: string
          is_pending?: boolean | null
          last_downloaded?: string | null
          last_submitted?: string | null
          sitemap_url?: string
          total_urls?: number | null
          warnings?: number | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      drinks_lista: {
        Row: {
          created_by: string | null
          dificuldade: string | null
          id: string | null
          imagem_url: string | null
          nome: string | null
          slug: string | null
          total_ingredientes: number | null
        }
        Insert: {
          created_by?: string | null
          dificuldade?: string | null
          id?: string | null
          imagem_url?: string | null
          nome?: string | null
          slug?: string | null
          total_ingredientes?: never
        }
        Update: {
          created_by?: string | null
          dificuldade?: string | null
          id?: string | null
          imagem_url?: string | null
          nome?: string | null
          slug?: string | null
          total_ingredientes?: never
        }
        Relationships: []
      }
    }
    Functions: {
      buscar_drinks: {
        Args: {
          _categorias?: string[]
          _comparador?: string
          _dificuldades?: string[]
          _ingredientes?: string[]
          _limite?: number
          _offset?: number
          _qtd?: number
        }
        Returns: Json
      }
      buscar_drinks_lista: {
        Args: {
          _categorias?: string[]
          _comparador?: string
          _dificuldades?: string[]
          _ingredientes?: string[]
          _limite?: number
          _offset?: number
          _qtd?: number
        }
        Returns: Json
      }
      can_edit: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      slugify: { Args: { _txt: string }; Returns: string }
      unificar_ingredientes: {
        Args: { _destino: string; _ids: string[]; _novo_nome?: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "editor"
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
      app_role: ["admin", "editor"],
    },
  },
} as const
