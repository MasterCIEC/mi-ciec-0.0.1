import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { EstablecimientoFormData, Estado, Municipio, Parroquia, SeccionCaev, DivisionCaev, ClaseCaev, Institucion } from '../../types';
import Spinner from '../ui/Spinner';
import EmpresaFormFields from './EmpresaFormFields';
import { Save, X, RotateCcw } from 'lucide-react';
import { useDraft } from '../../contexts/DraftContext';

const EmpresaFormDrawer: React.FC = () => {
    const {
        draft,
        isDrawerOpen,
        isSubmitting,
        isDirty,
        closeDrawer,
        updateDraft,
        setLogo,
        saveDraft,
        discardDraft,
    } = useDraft();

    const { formData, logoFile, logoPreview } = draft;

    const [error, setError] = useState<string | null>(null);
    const [loadingDropdowns, setLoadingDropdowns] = useState(true);
    const hasFetchedDropdowns = useRef(false);
    
    // Dropdown data
    const [estados, setEstados] = useState<Estado[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [parroquias, setParroquias] = useState<Parroquia[]>([]);
    const [secCaev, setSecCaev] = useState<SeccionCaev[]>([]);
    const [divCaev, setDivCaev] = useState<DivisionCaev[]>([]);
    const [classCaev, setClassCaev] = useState<ClaseCaev[]>([]);
    const [instituciones, setInstituciones] = useState<Institucion[]>([]);

    useEffect(() => {
        const fetchDropdownData = async () => {
            setLoadingDropdowns(true);
            const [
               { data: e, error: e1 }, { data: m, error: e2 }, { data: p, error: e3 },
               { data: s, error: e4 }, { data: d, error: e5 }, { data: c, error: e6 },
               { data: i, error: e7 }
           ] = await Promise.all([
               supabase.from('estados').select('*'), supabase.from('municipios').select('*'),
               supabase.from('parroquias').select('*'), supabase.from('secciones_caev').select('*'),
               supabase.from('divisiones_caev').select('*'), supabase.from('clases_caev').select('*'),
               supabase.from('instituciones').select('*')
           ]);
           if (e1 || e2 || e3 || e4 || e5 || e6 || e7) {
               setError("Failed to load form metadata.");
           } else {
               setEstados((e as any) || []); setMunicipios((m as any) || []); setParroquias((p as any) || []);
               setSecCaev((s as any) || []); setDivCaev((d as any) || []); setClassCaev((c as any) || []);
               setInstituciones((i as any) || []);
               hasFetchedDropdowns.current = true;
           }
           setLoadingDropdowns(false);
       };

       if(isDrawerOpen && !hasFetchedDropdowns.current) {
           fetchDropdownData();
       } else if (isDrawerOpen) {
           setLoadingDropdowns(false);
       }
    }, [isDrawerOpen]);
    
    const handleUpdate = useCallback((updates: Partial<EstablecimientoFormData>) => {
        updateDraft(updates);
    }, [updateDraft]);
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setLogo(file, reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleClearLogo = () => {
        setLogo(null, null);
        updateDraft({logo: null});
    };
    
    const handleSubmit = async () => {
        setError(null);
        const result = await saveDraft();
        if (!result.success) {
            setError(result.error || 'Ocurrió un error desconocido.');
        }
    };
    
    const handleCancelClick = () => {
        if (isDirty) {
            discardDraft(); // This will trigger the confirmation modal
        }
    };

    const handleMinimizeDrawer = () => {
        closeDrawer();
    };
    
    const drawerClasses = `fixed top-0 right-0 h-full bg-ciec-card shadow-2xl transition-transform duration-300 ease-in-out z-40 flex flex-col`;
    
    return (
        <>
            <div className={`${drawerClasses} ${!isDrawerOpen ? 'translate-x-full' : 'translate-x-0 w-full max-w-4xl'}`}>
                {/* Sticky Header */}
                <header className="flex-shrink-0 bg-ciec-bg p-4 flex justify-between items-center border-b border-ciec-border sticky top-0 z-10">
                     <div className="flex items-center space-x-4">
                        <button
                            onClick={handleCancelClick}
                            disabled={!isDirty || isSubmitting}
                            className="border border-red-500 bg-transparent text-red-500 hover:bg-red-500 hover:text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-bg focus:ring-red-500"
                            title="Descartar borrador"
                        >
                            <RotateCcw className="w-5 h-5 mr-2" />
                            Descartar
                        </button>
                         <button onClick={handleSubmit} disabled={isSubmitting || loadingDropdowns} className="bg-transparent hover:bg-ciec-blue text-ciec-blue hover:text-white border border-ciec-blue font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-bg focus:ring-ciec-blue">
                            {isSubmitting ? <Spinner size="sm" color="border-white" /> : <><Save className="w-5 h-5 mr-2" /> Guardar Establecimiento</>}
                        </button>
                    </div>
                    <button onClick={handleMinimizeDrawer} className="p-2 rounded-full text-ciec-text-secondary hover:bg-ciec-border" title="Minimizar (el borrador se guardará)">
                        <X className="w-5 h-5" />
                    </button>
                </header>
                
                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto">
                    {loadingDropdowns ? <div className="h-full flex items-center justify-center"><Spinner size="lg" /></div> : (
                        <div className="p-6 space-y-8">
                             {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                            <EmpresaFormFields
                                isEditing={false}
                                formData={formData}
                                updateFormData={handleUpdate}
                                logoPreview={logoPreview}
                                handleLogoChange={handleLogoChange}
                                handleClearLogo={handleClearLogo}
                                dropdowns={{
                                    estados,
                                    municipios,
                                    parroquias,
                                    secCaev,
                                    divCaev,
                                    classCaev,
                                    instituciones
                                }}
                                setExternalError={setError}
                            />
                        </div>
                    )}
                </div>
            </div>
            {/* Overlay */}
            {isDrawerOpen && <div onClick={handleMinimizeDrawer} className="fixed inset-0 bg-black/50 z-20 transition-opacity duration-300"></div>}
        </>
    );
};

export default EmpresaFormDrawer;