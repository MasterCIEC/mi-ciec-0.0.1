
// This file is partially generated and partially hand-crafted to match the new DB schema.

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
          id_establecimiento: number
          rif_institucion: string
        }
        Insert: {
          id_establecimiento: number
          rif_institucion: string
        }
        Update: {
          id_establecimiento?: number
          rif_institucion?: string
        }
      }
      clases_caev: {
        Row: {
          id_clase: number
          id_division: number
          nombre_clase: string
          descripcion_clase: string | null
        }
        Insert: {
          id_clase?: number
          id_division: number
          nombre_clase: string
          descripcion_clase?: string | null
        }
        Update: {
          id_clase?: number
          id_division?: number
          nombre_clase?: string
          descripcion_clase?: string | null
        }
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
      }
      divisiones_caev: {
        Row: {
          id_division: number
          id_seccion: number
          nombre_division: string
          descripcion_division: string | null
        }
        Insert: {
          id_division?: number
          id_seccion: number
          nombre_division: string
          descripcion_division?: string | null
        }
        Update: {
          id_division?: number
          id_seccion?: number
          nombre_division?: string
          descripcion_division?: string | null
        }
      }
      establecimiento_procesos: {
        Row: {
          id_establecimiento: number
          id_proceso: number
          porcentaje_capacidad_uso: number | null
        }
        Insert: {
          id_establecimiento: number
          id_proceso: number
          porcentaje_capacidad_uso?: number | null
        }
        Update: {
          id_establecimiento?: number
          id_proceso?: number
          porcentaje_capacidad_uso?: number | null
        }
      }
      establecimiento_productos: {
        Row: {
          id_establecimiento: number
          id_producto: number
        }
        Insert: {
          id_establecimiento: number
          id_producto: number
        }
        Update: {
          id_establecimiento?: number
          id_producto?: number
        }
      }
      establecimientos: {
        Row: {
          id_establecimiento: number
          rif_compania: string
          nombre_establecimiento: string
          id_direccion: number | null
          id_clase_caev: number | null
          email_principal: string | null
          telefono_principal_1: string | null
          telefono_principal_2: string | null
          fecha_apertura: string | null
          personal_obrero: number | null
          personal_empleado: number | null
          personal_directivo: number | null
        }
        Insert: {
          id_establecimiento?: number
          rif_compania: string
          nombre_establecimiento: string
          id_direccion?: number | null
          id_clase_caev?: number | null
          email_principal?: string | null
          telefono_principal_1?: string | null
          telefono_principal_2?: string | null
          fecha_apertura?: string | null
          personal_obrero?: number | null
          personal_empleado?: number | null
          personal_directivo?: number | null
        }
        Update: {
          id_establecimiento?: number
          rif_compania?: string
          nombre_establecimiento?: string
          id_direccion?: number | null
          id_clase_caev?: number | null
          email_principal?: string | null
          telefono_principal_1?: string | null
          telefono_principal_2?: string | null
          fecha_apertura?: string | null
          personal_obrero?: number | null
          personal_empleado?: number | null
          personal_directivo?: number | null
        }
      }
      estados: {
        Row: {
          id_estado: number
          nombre_estado: string
        }
        Insert: { id_estado?: number; nombre_estado: string }
        Update: { id_estado?: number; nombre_estado?: string }
      }
      instituciones: {
        Row: {
          rif: string
          nombre: string
          logo: string | null
          id_direccion: number | null
          ano_fundacion: string | null
        }
        Insert: {
          rif: string
          nombre: string
          logo?: string | null
          id_direccion?: number | null
          ano_fundacion?: string | null
        }
        Update: {
          rif?: string
          nombre?: string
          logo?: string | null
          id_direccion?: number | null
          ano_fundacion?: string | null
        }
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
      }
      integrantes: {
        Row: {
          id_integrante: number
          id_establecimiento: number
          nombre_persona: string
          cargo: string | null
          email: string | null
          telefono: string | null
        }
        Insert: {
          id_integrante?: number
          id_establecimiento: number
          nombre_persona: string
          cargo?: string | null
          email?: string | null
          telefono?: string | null
        }
        Update: {
          id_integrante?: number
          id_establecimiento?: number
          nombre_persona?: string
          cargo?: string | null
          email?: string | null
          telefono?: string | null
        }
      }
      municipios: {
        Row: {
          id_municipio: number
          id_estado: number
          nombre_municipio: string
        }
        Insert: { id_municipio?: number; id_estado: number; nombre_municipio: string; }
        Update: { id_municipio?: number; id_estado?: number; nombre_municipio?: string; }
      }
      parroquias: {
        Row: {
          id_parroquia: number
          id_municipio: number
          nombre_parroquia: string
        }
        Insert: { id_parroquia?: number; id_municipio: number; nombre_parroquia: string; }
        Update: { id_parroquia?: number; id_municipio?: number; nombre_parroquia?: string; }
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
      }
      secciones_caev: {
        Row: {
          id_seccion: number
          nombre_seccion: string
          descripcion_seccion: string | null
        }
        Insert: { id_seccion?: number; nombre_seccion: string; descripcion_seccion?: string | null; }
        Update: { id_seccion?: number; nombre_seccion?: string; descripcion_seccion?: string | null; }
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
      }
    }
  }
}

// Main entity types
export type Compania = Database['public']['Tables']['companias']['Row'];
export type CompaniaInsert = Database['public']['Tables']['companias']['Insert'];
export type Direccion = Database['public']['Tables']['direcciones']['Row'];
export type DireccionInsert = Database['public']['Tables']['direcciones']['Insert'];
export type Establecimiento = Database['public']['Tables']['establecimientos']['Row'];
export type EstablecimientoInsert = Database['public']['Tables']['establecimientos']['Insert'];

export type Estado = Database['public']['Tables']['estados']['Row'];
export type Municipio = Database['public']['Tables']['municipios']['Row'];
export type Parroquia = Database['public']['Tables']['parroquias']['Row'];

export type SeccionCaev = Database['public']['Tables']['secciones_caev']['Row'];
export type DivisionCaev = Database['public']['Tables']['divisiones_caev']['Row'];
export type ClaseCaev = Database['public']['Tables']['clases_caev']['Row'];

export type Institucion = Database['public']['Tables']['instituciones']['Row'];
export type InstitucionInsert = Database['public']['Tables']['instituciones']['Insert'];

export type Integrante = Database['public']['Tables']['integrantes']['Row'];
export type IntegranteInsert = Database['public']['Tables']['integrantes']['Insert'];

export type Producto = Database['public']['Tables']['productos']['Row'];
export type ProcesoProductivo = Database['public']['Tables']['procesos_productivos']['Row'];
export type Servicio = Database['public']['Tables']['servicios']['Row'];
export type EstablecimientoProducto = Database['public']['Tables']['establecimiento_productos']['Row'];
export type EstablecimientoProceso = Database['public']['Tables']['establecimiento_procesos']['Row'];


// Combined types for convenience
export type EstablecimientoFull = Establecimiento & {
  companias: Compania | null;
  direcciones: (Direccion & {
      parroquias: (Parroquia & {
          municipios: (Municipio & {
            estados: Estado | null;
          }) | null
      }) | null
  }) | null;
  clases_caev: (ClaseCaev & {
      divisiones_caev: (DivisionCaev & {
          secciones_caev: SeccionCaev | null
      }) | null
  }) | null;
  afiliaciones: { rif_institucion: string }[];
  establecimiento_productos: { productos: Producto }[];
  establecimiento_procesos: (EstablecimientoProceso & { procesos_productivos: ProcesoProductivo })[];
};

export type Page = 'Mapa' | 'Empresas' | 'Gremios' | 'Integrantes' | 'Reportes' | 'Auditoría' | 'Gráficos' | 'Información' | 'Chat' | 'Configuración';

// Draft Context Types - a flat structure for easier state management
export type EstablecimientoFormData = Partial<
    Compania & 
    Establecimiento & 
    Direccion &
    { id_seccion: number | null, id_division: number | null } &
    { id_estado: number | null, id_municipio: number | null } &
    { isNewCompany: boolean | null } &
    {
        selectedInstitutions: string[],
        selectedProducts: { id_producto: number | null, nombre_producto: string }[],
        selectedProcesses: { id_proceso: number | null, nombre_proceso: string, porcentaje_capacidad_uso: string | number }[],
    }
>;

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
