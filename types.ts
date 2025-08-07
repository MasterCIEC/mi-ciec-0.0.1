// This file is partially generated and partially hand-crafted to match the new DB schema.
import { AuthSession } from "@supabase/supabase-js";

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
      afiliaciones: {
        Row: {
          id_establecimiento: string
          rif_institucion: string
        }
        Insert: {
          id_establecimiento: string
          rif_institucion: string
        }
        Update: {
          id_establecimiento?: string
          rif_institucion?: string
        }
        Relationships: [
          {
            foreignKeyName: "afiliaciones_id_establecimiento_fkey"
            columns: ["id_establecimiento"]
            referencedRelation: "establecimientos"
            referencedColumns: ["id_establecimiento"]
          },
          {
            foreignKeyName: "afiliaciones_rif_institucion_fkey"
            columns: ["rif_institucion"]
            referencedRelation: "instituciones"
            referencedColumns: ["rif"]
          }
        ]
      }
      clases_caev: {
        Row: {
          id_clase: string
          id_division: string
          nombre_clase: string
          descripcion_clase: string | null
        }
        Insert: {
          id_clase?: string
          id_division: string
          nombre_clase: string
          descripcion_clase?: string | null
        }
        Update: {
          id_clase?: string
          id_division?: string
          nombre_clase?: string
          descripcion_clase?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clases_caev_id_division_fkey"
            columns: ["id_division"]
            referencedRelation: "divisiones_caev"
            referencedColumns: ["id_division"]
          }
        ]
      }
      companias: {
        Row: {
          rif: string
          razon_social: string
          logo: string | null
          direccion_fiscal: string | null
          ano_fundacion: string | null
        }
        Insert: {
          rif: string
          razon_social: string
          logo?: string | null
          direccion_fiscal?: string | null
          ano_fundacion?: string | null
        }
        Update: {
          rif?: string
          razon_social?: string
          logo?: string | null
          direccion_fiscal?: string | null
          ano_fundacion?: string | null
        }
        Relationships: []
      }
      direcciones: {
        Row: {
          id_direccion: number
          id_parroquia: number
          direccion_detallada: string | null
          latitud: number | null
          longitud: number | null
        }
        Insert: {
          id_direccion?: number
          id_parroquia: number
          direccion_detallada?: string | null
          latitud?: number | null
          longitud?: number | null
        }
        Update: {
          id_direccion?: number
          id_parroquia?: number
          direccion_detallada?: string | null
          latitud?: number | null
          longitud?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "direcciones_id_parroquia_fkey"
            columns: ["id_parroquia"]
            referencedRelation: "parroquias"
            referencedColumns: ["id_parroquia"]
          }
        ]
      }
      divisiones_caev: {
        Row: {
          id_division: string
          id_seccion: string
          nombre_division: string
          descripcion_division: string | null
        }
        Insert: {
          id_division?: string
          id_seccion: string
          nombre_division: string
          descripcion_division?: string | null
        }
        Update: {
          id_division?: string
          id_seccion?: string
          nombre_division?: string
          descripcion_division?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "divisiones_caev_id_seccion_fkey"
            columns: ["id_seccion"]
            referencedRelation: "secciones_caev"
            referencedColumns: ["id_seccion"]
          }
        ]
      }
      establecimiento_procesos: {
        Row: {
          id_establecimiento: string
          id_proceso: number
          porcentaje_capacidad_uso: number | null
        }
        Insert: {
          id_establecimiento: string
          id_proceso: number
          porcentaje_capacidad_uso?: number | null
        }
        Update: {
          id_establecimiento?: string
          id_proceso?: number
          porcentaje_capacidad_uso?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "establecimiento_procesos_id_establecimiento_fkey"
            columns: ["id_establecimiento"]
            referencedRelation: "establecimientos"
            referencedColumns: ["id_establecimiento"]
          },
          {
            foreignKeyName: "establecimiento_procesos_id_proceso_fkey"
            columns: ["id_proceso"]
            referencedRelation: "procesos_productivos"
            referencedColumns: ["id_proceso"]
          }
        ]
      }
      establecimiento_productos: {
        Row: {
          id_establecimiento: string
          id_producto: number
        }
        Insert: {
          id_establecimiento: string
          id_producto: number
        }
        Update: {
          id_establecimiento?: string
          id_producto?: number
        }
        Relationships: [
          {
            foreignKeyName: "establecimiento_productos_id_establecimiento_fkey"
            columns: ["id_establecimiento"]
            referencedRelation: "establecimientos"
            referencedColumns: ["id_establecimiento"]
          },
          {
            foreignKeyName: "establecimiento_productos_id_producto_fkey"
            columns: ["id_producto"]
            referencedRelation: "productos"
            referencedColumns: ["id_producto"]
          }
        ]
      }
      establecimientos: {
        Row: {
          id_establecimiento: string
          rif_compania: string
          nombre_establecimiento: string
          id_direccion: number | null
          id_clase_caev: string | null
          email_principal: string | null
          telefono_principal_1: string | null
          telefono_principal_2: string | null
          fecha_apertura: string | null
          personal_obrero: number | null
          personal_empleado: number | null
          personal_directivo: number | null
        }
        Insert: {
          id_establecimiento?: string
          rif_compania: string
          nombre_establecimiento: string
          id_direccion?: number | null
          id_clase_caev?: string | null
          email_principal?: string | null
          telefono_principal_1?: string | null
          telefono_principal_2?: string | null
          fecha_apertura?: string | null
          personal_obrero?: number | null
          personal_empleado?: number | null
          personal_directivo?: number | null
        }
        Update: {
          id_establecimiento?: string
          rif_compania?: string
          nombre_establecimiento?: string
          id_direccion?: number | null
          id_clase_caev?: string | null
          email_principal?: string | null
          telefono_principal_1?: string | null
          telefono_principal_2?: string | null
          fecha_apertura?: string | null
          personal_obrero?: number | null
          personal_empleado?: number | null
          personal_directivo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "establecimientos_id_clase_caev_fkey"
            columns: ["id_clase_caev"]
            referencedRelation: "clases_caev"
            referencedColumns: ["id_clase"]
          },
          {
            foreignKeyName: "establecimientos_id_direccion_fkey"
            columns: ["id_direccion"]
            referencedRelation: "direcciones"
            referencedColumns: ["id_direccion"]
          },
          {
            foreignKeyName: "establecimientos_rif_compania_fkey"
            columns: ["rif_compania"]
            referencedRelation: "companias"
            referencedColumns: ["rif"]
          }
        ]
      }
      estados: {
        Row: {
          id_estado: number
          nombre_estado: string
        }
        Insert: { id_estado?: number; nombre_estado: string }
        Update: { id_estado?: number; nombre_estado?: string }
        Relationships: []
      }
      instituciones: {
        Row: {
          rif: string
          nombre: string
          abreviacion: string | null
          logo_gremio: string | null
          id_direccion: number | null
          ano_fundacion: string | null
        }
        Insert: {
          rif: string
          nombre: string
          abreviacion?: string | null
          logo_gremio?: string | null
          id_direccion?: number | null
          ano_fundacion?: string | null
        }
        Update: {
          rif?: string
          nombre?: string
          abreviacion?: string | null
          logo_gremio?: string | null
          id_direccion?: number | null
          ano_fundacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instituciones_id_direccion_fkey"
            columns: ["id_direccion"]
            referencedRelation: "direcciones"
            referencedColumns: ["id_direccion"]
          }
        ]
      }
      institucion_servicios: {
        Row: {
          rif_institucion: string
          id_servicio: number
        }
        Insert: {
          rif_institucion: string
          id_servicio: number
        }
        Update: {
          rif_institucion?: string
          id_servicio?: number
        }
        Relationships: [
          {
            foreignKeyName: "institucion_servicios_id_servicio_fkey"
            columns: ["id_servicio"]
            referencedRelation: "servicios"
            referencedColumns: ["id_servicio"]
          },
          {
            foreignKeyName: "institucion_servicios_rif_institucion_fkey"
            columns: ["rif_institucion"]
            referencedRelation: "instituciones"
            referencedColumns: ["rif"]
          }
        ]
      }
      integrantes: {
        Row: {
          id_integrante: number
          id_establecimiento: string
          nombre_persona: string
          cargo: string | null
          email: string | null
          telefono: string | null
        }
        Insert: {
          id_integrante?: number
          id_establecimiento: string
          nombre_persona: string
          cargo?: string | null
          email?: string | null
          telefono?: string | null
        }
        Update: {
          id_integrante?: number
          id_establecimiento?: string
          nombre_persona?: string
          cargo?: string | null
          email?: string | null
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrantes_id_establecimiento_fkey"
            columns: ["id_establecimiento"]
            referencedRelation: "establecimientos"
            referencedColumns: ["id_establecimiento"]
          }
        ]
      }
      municipios: {
        Row: {
          id_municipio: number
          id_estado: number
          nombre_municipio: string
        }
        Insert: { id_municipio?: number; id_estado: number; nombre_municipio: string; }
        Update: { id_municipio?: number; id_estado?: number; nombre_municipio?: string; }
        Relationships: [
          {
            foreignKeyName: "municipios_id_estado_fkey"
            columns: ["id_estado"]
            referencedRelation: "estados"
            referencedColumns: ["id_estado"]
          }
        ]
      }
      parroquias: {
        Row: {
          id_parroquia: number
          id_municipio: number
          nombre_parroquia: string
        }
        Insert: { id_parroquia?: number; id_municipio: number; nombre_parroquia: string; }
        Update: { id_parroquia?: number; id_municipio?: number; nombre_parroquia?: string; }
        Relationships: [
          {
            foreignKeyName: "parroquias_id_municipio_fkey"
            columns: ["id_municipio"]
            referencedRelation: "municipios"
            referencedColumns: ["id_municipio"]
          }
        ]
      }
       procesos_productivos: {
        Row: {
          id_proceso: number
          nombre_proceso: string
          descripcion: string | null
        }
        Insert: {
          id_proceso?: number
          nombre_proceso: string
          descripcion?: string | null
        }
        Update: {
          id_proceso?: number
          nombre_proceso?: string
          descripcion?: string | null
        }
        Relationships: []
      }
      productos: {
        Row: {
          id_producto: number
          nombre_producto: string
        }
        Insert: {
          id_producto?: number
          nombre_producto: string
        }
        Update: {
          id_producto?: number
          nombre_producto?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: "administrador" | "usuario"
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: "administrador" | "usuario"
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: "administrador" | "usuario"
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      secciones_caev: {
        Row: {
          id_seccion: string
          nombre_seccion: string
          descripcion_seccion: string | null
        }
        Insert: { id_seccion?: string; nombre_seccion: string; descripcion_seccion?: string | null; }
        Update: { id_seccion?: string; nombre_seccion?: string; descripcion_seccion?: string | null; }
        Relationships: []
      }
      servicios: {
        Row: {
          id_servicio: number
          nombre_servicio: string
        }
        Insert: {
          id_servicio?: number
          nombre_servicio: string
        }
        Update: {
          id_servicio?: number
          nombre_servicio?: string
        }
        Relationships: []
      }
    }
    Views: {
      [key: string]: never
    }
    Functions: {
      [key: string]: never
    }
    Enums: {
      [key: string]: never
    }
    CompositeTypes: {
      [key: string]: never
    }
  }
}

// Main entity types
export type Compania = Database['public']['Tables']['companias']['Row'];
export type CompaniaInsert = Database['public']['Tables']['companias']['Insert'];
export type CompaniaUpdate = Database['public']['Tables']['companias']['Update'];
export type Direccion = Database['public']['Tables']['direcciones']['Row'];
export type DireccionInsert = Database['public']['Tables']['direcciones']['Insert'];
export type DireccionUpdate = Database['public']['Tables']['direcciones']['Update'];
export type Establecimiento = Database['public']['Tables']['establecimientos']['Row'];
export type EstablecimientoInsert = Database['public']['Tables']['establecimientos']['Insert'];
export type EstablecimientoUpdate = Database['public']['Tables']['establecimientos']['Update'];

export type Estado = Database['public']['Tables']['estados']['Row'];
export type Municipio = Database['public']['Tables']['municipios']['Row'];
export type Parroquia = Database['public']['Tables']['parroquias']['Row'];

export type SeccionCaev = Database['public']['Tables']['secciones_caev']['Row'];
export type DivisionCaev = Database['public']['Tables']['divisiones_caev']['Row'];
export type ClaseCaev = Database['public']['Tables']['clases_caev']['Row'];

export type Institucion = Database['public']['Tables']['instituciones']['Row'];
export type InstitucionInsert = Database['public']['Tables']['instituciones']['Insert'];
export type InstitucionUpdate = Database['public']['Tables']['instituciones']['Update'];

export type Integrante = Database['public']['Tables']['integrantes']['Row'];
export type IntegranteInsert = Database['public']['Tables']['integrantes']['Insert'];
export type IntegranteUpdate = Database['public']['Tables']['integrantes']['Update'];

export type Producto = Database['public']['Tables']['productos']['Row'];
export type ProductoInsert = Database['public']['Tables']['productos']['Insert'];
export type ProcesoProductivo = Database['public']['Tables']['procesos_productivos']['Row'];
export type ProcesoProductivoInsert = Database['public']['Tables']['procesos_productivos']['Insert'];
export type Servicio = Database['public']['Tables']['servicios']['Row'];
export type EstablecimientoProducto = Database['public']['Tables']['establecimiento_productos']['Row'];
export type EstablecimientoProductoInsert = Database['public']['Tables']['establecimiento_productos']['Insert'];
export type EstablecimientoProceso = Database['public']['Tables']['establecimiento_procesos']['Row'];
export type EstablecimientoProcesoInsert = Database['public']['Tables']['establecimiento_procesos']['Insert'];
export type EstablecimientoProcesoUpdate = Database['public']['Tables']['establecimiento_procesos']['Update'];
export type InstitucionServicio = Database['public']['Tables']['institucion_servicios']['Row'];
export type InstitucionServicioInsert = Database['public']['Tables']['institucion_servicios']['Insert'];
export type Afiliacion = Database['public']['Tables']['afiliaciones']['Row'];
export type AfiliacionInsert = Database['public']['Tables']['afiliaciones']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];


export type Page = 'Mapa' | 'Empresas' | 'Gremios' | 'Integrantes' | 'Reportes' | 'Auditoría' | 'Gráficos' | 'Admin';

// Draft Context Types - a flat structure for easier state management
export type EstablecimientoFormData = {
  // From Compania
  rif?: string | null;
  razon_social?: string | null;
  logo?: string | null;
  direccion_fiscal?: string | null;
  ano_fundacion?: string | null;

  // From Establecimiento
  id_establecimiento?: string;
  rif_compania?: string;
  nombre_establecimiento?: string | null;
  id_direccion?: number | null;
  id_clase_caev?: string | null;
  email_principal?: string | null;
  telefono_principal_1?: string | null;
  telefono_principal_2?: string | null;
  fecha_apertura?: string | null;
  personal_obrero?: number | null;
  personal_empleado?: number | null;
  personal_directivo?: number | null;

  // From Direccion
  // id_direccion is already above
  id_parroquia?: number | null;
  direccion_detallada?: string | null;
  latitud?: number | null;
  longitud?: number | null;

  // Form-specific state
  id_seccion?: string | null;
  id_division?: string | null;
  id_estado?: number | null;
  id_municipio?: number | null;
  isNewCompany?: boolean | null;

  // Relational data
  selectedInstitutions?: string[];
  selectedProducts?: { id_producto: number | null; nombre_producto: string }[];
  selectedProcesses?: {
    id_proceso: number | null;
    nombre_proceso: string;
    porcentaje_capacidad_uso: string | number | null;
  }[];
};

export type EmpresaDraft = {
  formData: EstablecimientoFormData;
  logoFile: File | null;
  logoPreview: string | null;
}

export type DraftContextType = {
  draft: EmpresaDraft;
  isDrawerOpen: boolean;
  isDirty: boolean;
  isDraggingBubble: boolean;
  isSubmitting: boolean;
  isConfirmDiscardModalOpen: boolean;
  discardCount: number;
  openDrawer: () => void;
  closeDrawer: () => void;
  updateDraft: (updates: Partial<EstablecimientoFormData>) => void;
  setLogo: (file: File | null, preview: string | null) => void;
  saveDraft: () => Promise<{ success: boolean; error?: string }>;
  discardDraft: () => void;
  setIsDraggingBubble: (isDragging: boolean) => void;
  handleConfirmDiscard: () => void;
  handleCancelDiscard: () => void;
};


// Auth Types
export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface AuthContextType {
  session: AuthSession | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}