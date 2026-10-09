// Generato da Supabase (tipi del database). Rigenerare dopo ogni migrazione.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      amministratori: {
        Row: {
          creato_il: string
          utente: string
        }
        Insert: {
          creato_il?: string
          utente: string
        }
        Update: {
          creato_il?: string
          utente?: string
        }
        Relationships: []
      }
      archivio_fiscale: {
        Row: {
          archiviato_il: string
          codice_fiscale: string
          conservare_fino_al: string
          data_nascita: string
          id: number
          nome: string | null
          partita_iva: string | null
          residenza: string
          utente: string
        }
        Insert: {
          archiviato_il?: string
          codice_fiscale: string
          conservare_fino_al?: string
          data_nascita: string
          id?: never
          nome?: string | null
          partita_iva?: string | null
          residenza: string
          utente: string
        }
        Update: {
          archiviato_il?: string
          codice_fiscale?: string
          conservare_fino_al?: string
          data_nascita?: string
          id?: never
          nome?: string | null
          partita_iva?: string | null
          residenza?: string
          utente?: string
        }
        Relationships: []
      }
      bacheca: {
        Row: {
          autore: string
          competenza: string | null
          creato_il: string
          dettagli: string
          foto: string | null
          id: number
          risposte: number
          scade_il: string
          stato: string
          titolo: string
          zona: string
        }
        Insert: {
          autore: string
          competenza?: string | null
          creato_il?: string
          dettagli?: string
          foto?: string | null
          id?: never
          risposte?: number
          scade_il?: string
          stato?: string
          titolo: string
          zona: string
        }
        Update: {
          autore?: string
          competenza?: string | null
          creato_il?: string
          dettagli?: string
          foto?: string | null
          id?: never
          risposte?: number
          scade_il?: string
          stato?: string
          titolo?: string
          zona?: string
        }
        Relationships: [
          {
            foreignKeyName: "bacheca_autore_fkey"
            columns: ["autore"]
            isOneToOne: false
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
        ]
      }
      blocchi: {
        Row: {
          bloccato: string
          creato_il: string
          utente: string
        }
        Insert: {
          bloccato: string
          creato_il?: string
          utente: string
        }
        Update: {
          bloccato?: string
          creato_il?: string
          utente?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocchi_bloccato_fkey"
            columns: ["bloccato"]
            isOneToOne: false
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocchi_utente_fkey"
            columns: ["utente"]
            isOneToOne: false
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
        ]
      }
      consensi: {
        Row: {
          accettato_il: string
          documento: string
          id: number
          utente: string
          versione: string
        }
        Insert: {
          accettato_il?: string
          documento: string
          id?: never
          utente: string
          versione: string
        }
        Update: {
          accettato_il?: string
          documento?: string
          id?: never
          utente?: string
          versione?: string
        }
        Relationships: []
      }
      dati_fiscali: {
        Row: {
          aggiornato_il: string
          codice_fiscale: string
          creato_il: string
          data_nascita: string
          dichiarazione_fiscale: boolean
          id: string
          residenza: string
        }
        Insert: {
          aggiornato_il?: string
          codice_fiscale: string
          creato_il?: string
          data_nascita: string
          dichiarazione_fiscale: boolean
          id: string
          residenza: string
        }
        Update: {
          aggiornato_il?: string
          codice_fiscale?: string
          creato_il?: string
          data_nascita?: string
          dichiarazione_fiscale?: boolean
          id?: string
          residenza?: string
        }
        Relationships: [
          {
            foreignKeyName: "dati_fiscali_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "professionisti"
            referencedColumns: ["id"]
          },
        ]
      }
      eventi: {
        Row: {
          giorno: string
          id: number
          nome: string
        }
        Insert: {
          giorno?: string
          id?: never
          nome: string
        }
        Update: {
          giorno?: string
          id?: never
          nome?: string
        }
        Relationships: []
      }
      giudizi: {
        Row: {
          cliente: string | null
          commento: string | null
          comunicazione: number
          creato_il: string
          nascosto: boolean
          parola: number
          prenotazione: number
          professionista: string
          pulizia: number
          punteggio: number | null
          puntualita: number
          qualita: number
          risposta: string | null
          risposta_il: string | null
        }
        Insert: {
          cliente?: string | null
          commento?: string | null
          comunicazione: number
          creato_il?: string
          nascosto?: boolean
          parola: number
          prenotazione: number
          professionista: string
          pulizia: number
          punteggio?: number | null
          puntualita: number
          qualita: number
          risposta?: string | null
          risposta_il?: string | null
        }
        Update: {
          cliente?: string | null
          commento?: string | null
          comunicazione?: number
          creato_il?: string
          nascosto?: boolean
          parola?: number
          prenotazione?: number
          professionista?: string
          pulizia?: number
          punteggio?: number | null
          puntualita?: number
          qualita?: number
          risposta?: string | null
          risposta_il?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giudizi_cliente_fkey"
            columns: ["cliente"]
            isOneToOne: false
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giudizi_prenotazione_fkey"
            columns: ["prenotazione"]
            isOneToOne: true
            referencedRelation: "prenotazioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giudizi_professionista_fkey"
            columns: ["professionista"]
            isOneToOne: false
            referencedRelation: "professionisti"
            referencedColumns: ["id"]
          },
        ]
      }
      indirizzi: {
        Row: {
          cliente: string
          indirizzo: string
          prenotazione: number
        }
        Insert: {
          cliente: string
          indirizzo: string
          prenotazione: number
        }
        Update: {
          cliente?: string
          indirizzo?: string
          prenotazione?: number
        }
        Relationships: [
          {
            foreignKeyName: "indirizzi_cliente_fkey"
            columns: ["cliente"]
            isOneToOne: false
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indirizzi_prenotazione_fkey"
            columns: ["prenotazione"]
            isOneToOne: true
            referencedRelation: "prenotazioni"
            referencedColumns: ["id"]
          },
        ]
      }
      messaggi: {
        Row: {
          autore: string
          creato_il: string
          id: number
          letto_il: string | null
          prenotazione: number
          testo: string
        }
        Insert: {
          autore: string
          creato_il?: string
          id?: never
          letto_il?: string | null
          prenotazione: number
          testo: string
        }
        Update: {
          autore?: string
          creato_il?: string
          id?: never
          letto_il?: string | null
          prenotazione?: number
          testo?: string
        }
        Relationships: [
          {
            foreignKeyName: "messaggi_autore_fkey"
            columns: ["autore"]
            isOneToOne: false
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messaggi_prenotazione_fkey"
            columns: ["prenotazione"]
            isOneToOne: false
            referencedRelation: "prenotazioni"
            referencedColumns: ["id"]
          },
        ]
      }
      notifiche: {
        Row: {
          creato_il: string
          id: number
          letta: boolean
          link: string
          testo: string
          tipo: string
          utente: string
        }
        Insert: {
          creato_il?: string
          id?: never
          letta?: boolean
          link?: string
          testo: string
          tipo: string
          utente: string
        }
        Update: {
          creato_il?: string
          id?: never
          letta?: boolean
          link?: string
          testo?: string
          tipo?: string
          utente?: string
        }
        Relationships: []
      }
      preferiti: {
        Row: {
          creato_il: string
          professionista: string
          utente: string
        }
        Insert: {
          creato_il?: string
          professionista: string
          utente: string
        }
        Update: {
          creato_il?: string
          professionista?: string
          utente?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferiti_professionista_fkey"
            columns: ["professionista"]
            isOneToOne: false
            referencedRelation: "professionisti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferiti_utente_fkey"
            columns: ["utente"]
            isOneToOne: false
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
        ]
      }
      prenotazioni: {
        Row: {
          aggiornato_il: string
          cliente: string | null
          competenza: string
          controproposta: boolean
          creato_il: string
          descrizione: string
          giorno: string
          id: number
          indirizzo: string | null
          motivo: string | null
          ora: string
          ore: number | null
          post: number | null
          professionista: string
          stato: string
          tariffa_oraria: number
          zona: string
        }
        Insert: {
          aggiornato_il?: string
          cliente?: string | null
          competenza: string
          controproposta?: boolean
          creato_il?: string
          descrizione: string
          giorno: string
          id?: never
          indirizzo?: string | null
          motivo?: string | null
          ora: string
          ore?: number | null
          post?: number | null
          professionista: string
          stato?: string
          tariffa_oraria: number
          zona: string
        }
        Update: {
          aggiornato_il?: string
          cliente?: string | null
          competenza?: string
          controproposta?: boolean
          creato_il?: string
          descrizione?: string
          giorno?: string
          id?: never
          indirizzo?: string | null
          motivo?: string | null
          ora?: string
          ore?: number | null
          post?: number | null
          professionista?: string
          stato?: string
          tariffa_oraria?: number
          zona?: string
        }
        Relationships: [
          {
            foreignKeyName: "prenotazioni_cliente_fkey"
            columns: ["cliente"]
            isOneToOne: false
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prenotazioni_post_fkey"
            columns: ["post"]
            isOneToOne: false
            referencedRelation: "bacheca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prenotazioni_professionista_fkey"
            columns: ["professionista"]
            isOneToOne: false
            referencedRelation: "professionisti"
            referencedColumns: ["id"]
          },
        ]
      }
      professionisti: {
        Row: {
          abilitazione_impianti: boolean
          aggiornato_il: string
          assicurazione_rc: boolean
          bio: string
          competenze: string[]
          creato_il: string
          disponibile: boolean
          giudizi: number
          id: string
          ida: number | null
          lavori: number
          partita_iva: string | null
          su_preventivo: boolean
          tariffa_oraria: number
          tipo: string
          verificato: boolean
          zone: string[]
        }
        Insert: {
          abilitazione_impianti?: boolean
          aggiornato_il?: string
          assicurazione_rc?: boolean
          bio?: string
          competenze: string[]
          creato_il?: string
          disponibile?: boolean
          giudizi?: number
          id: string
          ida?: number | null
          lavori?: number
          partita_iva?: string | null
          su_preventivo?: boolean
          tariffa_oraria: number
          tipo: string
          verificato?: boolean
          zone: string[]
        }
        Update: {
          abilitazione_impianti?: boolean
          aggiornato_il?: string
          assicurazione_rc?: boolean
          bio?: string
          competenze?: string[]
          creato_il?: string
          disponibile?: boolean
          giudizi?: number
          id?: string
          ida?: number | null
          lavori?: number
          partita_iva?: string | null
          su_preventivo?: boolean
          tariffa_oraria?: number
          tipo?: string
          verificato?: boolean
          zone?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "professionisti_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profili"
            referencedColumns: ["id"]
          },
        ]
      }
      profili: {
        Row: {
          aggiornato_il: string
          creato_il: string
          foto: string | null
          id: string
          in_pausa: boolean
          nome: string
          ruolo: string
          sospeso: boolean
          zona: string
        }
        Insert: {
          aggiornato_il?: string
          creato_il?: string
          foto?: string | null
          id: string
          in_pausa?: boolean
          nome: string
          ruolo?: string
          sospeso?: boolean
          zona: string
        }
        Update: {
          aggiornato_il?: string
          creato_il?: string
          foto?: string | null
          id?: string
          in_pausa?: boolean
          nome?: string
          ruolo?: string
          sospeso?: boolean
          zona?: string
        }
        Relationships: []
      }
      proposte: {
        Row: {
          creato_il: string
          id: number
          messaggio: string
          post: number
          professionista: string
        }
        Insert: {
          creato_il?: string
          id?: never
          messaggio: string
          post: number
          professionista: string
        }
        Update: {
          creato_il?: string
          id?: never
          messaggio?: string
          post?: number
          professionista?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposte_post_fkey"
            columns: ["post"]
            isOneToOne: false
            referencedRelation: "bacheca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposte_professionista_fkey"
            columns: ["professionista"]
            isOneToOne: false
            referencedRelation: "professionisti"
            referencedColumns: ["id"]
          },
        ]
      }
      push_iscrizioni: {
        Row: {
          auth: string
          creato_il: string
          endpoint: string
          id: number
          p256dh: string
          utente: string
        }
        Insert: {
          auth: string
          creato_il?: string
          endpoint: string
          id?: never
          p256dh: string
          utente: string
        }
        Update: {
          auth?: string
          creato_il?: string
          endpoint?: string
          id?: never
          p256dh?: string
          utente?: string
        }
        Relationships: []
      }
      segnalazioni: {
        Row: {
          autore: string | null
          azione: string | null
          creato_il: string
          deciso_da: string | null
          deciso_il: string | null
          id: number
          motivazione: string | null
          motivo: string
          oggetto_id: string
          oggetto_tipo: string
          segnalato: string | null
          stato: string
          testo: string | null
          tipo: string
        }
        Insert: {
          autore?: string | null
          azione?: string | null
          creato_il?: string
          deciso_da?: string | null
          deciso_il?: string | null
          id?: never
          motivazione?: string | null
          motivo: string
          oggetto_id: string
          oggetto_tipo: string
          segnalato?: string | null
          stato?: string
          testo?: string | null
          tipo: string
        }
        Update: {
          autore?: string | null
          azione?: string | null
          creato_il?: string
          deciso_da?: string | null
          deciso_il?: string | null
          id?: never
          motivazione?: string | null
          motivo?: string
          oggetto_id?: string
          oggetto_tipo?: string
          segnalato?: string | null
          stato?: string
          testo?: string | null
          tipo?: string
        }
        Relationships: []
      }
      uscite: {
        Row: {
          giorno: string
          id: number
          motivo: string
        }
        Insert: {
          giorno?: string
          id?: never
          motivo: string
        }
        Update: {
          giorno?: string
          id?: never
          motivo?: string
        }
        Relationships: []
      }
      verifiche: {
        Row: {
          creato_il: string
          deciso_da: string | null
          deciso_il: string | null
          disponibilita: string
          id: number
          motivazione: string | null
          preferenza: string
          professionista: string
          stato: string
        }
        Insert: {
          creato_il?: string
          deciso_da?: string | null
          deciso_il?: string | null
          disponibilita?: string
          id?: never
          motivazione?: string | null
          preferenza: string
          professionista: string
          stato?: string
        }
        Update: {
          creato_il?: string
          deciso_da?: string | null
          deciso_il?: string | null
          disponibilita?: string
          id?: never
          motivazione?: string | null
          preferenza?: string
          professionista?: string
          stato?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifiche_professionista_fkey"
            columns: ["professionista"]
            isOneToOne: false
            referencedRelation: "professionisti"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bloccati_tra: { Args: { a: string; b: string }; Returns: boolean }
      cambia_stato_prenotazione: {
        Args: { p_azione: string; p_id: number; p_motivo?: string }
        Returns: string
      }
      competenze_valide: { Args: never; Returns: string[] }
      decidi_segnalazione: {
        Args: {
          p_azione: string
          p_esito: string
          p_id: number
          p_motivazione: string
        }
        Returns: undefined
      }
      decidi_verifica: {
        Args: { p_esito: string; p_id: number; p_motivazione?: string }
        Returns: undefined
      }
      diventa_professionista: {
        Args: {
          p_abilitazione: boolean
          p_assicurazione: boolean
          p_bio: string
          p_codice_fiscale: string
          p_competenze: string[]
          p_data_nascita: string
          p_partita_iva: string
          p_residenza: string
          p_su_preventivo: boolean
          p_tariffa: number
          p_tipo: string
          p_versione_termini: string
          p_zone: string[]
        }
        Returns: undefined
      }
      e_admin: { Args: never; Returns: boolean }
      e_parte: { Args: { p: number }; Returns: boolean }
      e_sospeso: { Args: { u: string }; Returns: boolean }
      giudizi_di: {
        Args: { p_professionista: string }
        Returns: {
          autore: string
          commento: string
          competenza: string
          comunicazione: number
          creato_il: string
          parola: number
          prenotazione: number
          pulizia: number
          punteggio: number
          puntualita: number
          qualita: number
          risposta: string
        }[]
      }
      ha_contatti: { Args: { t: string }; Returns: boolean }
      notifica: {
        Args: { link: string; testo: string; tipo: string; u: string }
        Returns: undefined
      }
      numeri: { Args: { p_giorni?: number }; Returns: Json }
      orari_occupati: {
        Args: { p_professionista: string }
        Returns: {
          giorno: string
          ora: string
        }[]
      }
      prenota: {
        Args: {
          p_competenza: string
          p_descrizione: string
          p_giorno: string
          p_indirizzo: string
          p_ora: string
          p_ore: number | null
          p_post?: number | null
          p_professionista: string
          p_tariffa: number
          p_zona: string
        }
        Returns: number
      }
      prepara_eliminazione: { Args: { p_motivo?: string }; Returns: undefined }
      primo_nome: { Args: { u: string }; Returns: string }
      profilo_visibile: { Args: { u: string }; Returns: boolean }
      proponi_orario: {
        Args: { p_giorno: string; p_id: number; p_ora: string }
        Returns: undefined
      }
      registra_evento: { Args: { p_nome: string }; Returns: undefined }
      riattiva_account: {
        Args: { p_motivazione: string; p_utente: string }
        Returns: undefined
      }
      ricalcola_ida: { Args: { p: string }; Returns: undefined }
      rispondi_giudizio: {
        Args: { p_prenotazione: number; p_testo: string }
        Returns: undefined
      }
      segna_letti: { Args: { p_prenotazione: number }; Returns: undefined }
      zone_valide: { Args: never; Returns: string[] }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
