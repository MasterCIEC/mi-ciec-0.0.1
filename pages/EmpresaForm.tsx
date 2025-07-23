

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { EstablecimientoFormData, Estado, Municipio, Parroquia, SeccionCaev, DivisionCaev, ClaseCaev, Compania, Direccion, Establecimiento, Producto, ProcesoProductivo, Institucion } from '../types';
import Spinner from '../components/ui/Spinner';
import EmpresaFormFields from '../components/empresa/EmpresaFormFields';
import EmpresaDetailView from '../components/empresa/EmpresaDetailView';
import { Edit, Save, X, RotateCcw } from 'lucide-react';

// Helper to create a deep copy
const deepCopy = (obj: any) => JSON.parse(JSON.stringify(obj));

const EmpresaForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);

    const [initialData, setInitialData] = useState<EstablecimientoFormData | null>(null);
    const [formData, setFormData] = useState<EstablecimientoFormData>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
             const [
                { data: e, error: e1 }, { data: m, error: e2 }, { data: p, error: e3 },
                { data: s, error: e5 }, { data: d, error:e6 }, { data: c, error: e7 },
                { data: i, error: e8 }
            ] = await Promise.all([
                supabase.from('estados').select('*'), supabase.from('municipios').select('*'),
                supabase.from('parroquias').select('*'), supabase.from('secciones_caev').select('*'),
                supabase.from('divisiones_caev').select('*'), supabase.from('clases_caev').select('*'),
                supabase.from('instituciones').select('*')
            ]);
            if (e1 || e2 || e3 || e5 || e6 || e7 || e8) setError("Failed to load form metadata.");
            else {
                setEstados(e || []); setMunicipios(m || []); setParroquias(p || []);
                setSecCaev(s || []); setDivCaev(d || []); setClassCaev(c || []);
                setInstituciones(i || []);
            }
        };

        const initialize = async () => {
            setLoading(true);
            await fetchDropdownData();
            if (id) {
                const { data, error: fetchError } = await supabase.from('establecimientos').select(`
                    *,
                    companias(*),
                    direcciones(*, parroquias(*, municipios(*))),
                    clases_caev(*, divisiones_caev(*)),
                    afiliaciones(rif_institucion),
                    establecimiento_productos(productos(id_producto, nombre_producto)),
                    establecimiento_procesos(*, procesos_productivos(id_proceso, nombre_proceso))
                `).eq('id_establecimiento', id).single();
                
                if (fetchError) setError('Could not fetch establishment data.');
                else if (data) {
                    const flatData: EstablecimientoFormData = {
                        ...data.companias,
                        ...data.direcciones,
                        ...data,
                        id_parroquia: data.direcciones?.id_parroquia,
                        id_municipio: data.direcciones?.parroquias?.municipios?.id_municipio,
                        id_estado: data.direcciones?.parroquias?.municipios?.id_estado,
                        id_clase_caev: data.clases_caev?.id_clase,
                        id_division: data.clases_caev?.divisiones_caev?.id_division,
                        id_seccion: data.clases_caev?.divisiones_caev?.id_seccion,
                        isNewCompany: false,
                        selectedInstitutions: data.afiliaciones?.map(a => a.rif_institucion) || [],
                        selectedProducts: data.establecimiento_productos?.map(ep => ep.productos).filter(Boolean) as any || [],
                        selectedProcesses: data.establecimiento_procesos?.map(ep => ({...ep.procesos_productivos, ...ep})) || []
                    };
                    setFormData(flatData);
                    setInitialData(deepCopy(flatData));
                    setLogoPreview(data.companias?.logo || null);
                }
            }
            setLoading(false);
        };
        initialize();
    }, [id]);

    const handleChange = useCallback((updates: Partial<EstablecimientoFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    }, []);
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleClearLogo = () => {
        setLogoFile(null);
        setLogoPreview(null);
        setFormData(prev => ({...prev, logo: null}));
    }

    const handleCancelEdit = () => {
        if(initialData){
            setFormData(deepCopy(initialData));
            setLogoPreview(initialData.logo || null);
            setLogoFile(null);
        }
        setIsEditing(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.razon_social || !formData.rif) {
            alert('RIF y Razón Social son obligatorios.');
            return;
        }
        setSubmitting(true);
        setError(null);
        
        let logoUrl = formData.logo;
        if (logoFile) {
            const fileName = `${formData.rif}-${Date.now()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage.from('logos').upload(fileName, logoFile, { upsert: true });
            if (uploadError) { setError(`Error uploading logo: ${uploadError.message}`); setSubmitting(false); return; }
            const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(uploadData.path);
            logoUrl = publicUrlData.publicUrl;
        } else if (logoPreview === null && initialData?.logo) {
            logoUrl = null;
        }

        // --- Start Transaction-like process ---
        try {
            // 1. Update Core Entities
            const companiaData: Partial<Compania> = { razon_social: formData.razon_social, logo: logoUrl, direccion_fiscal: formData.direccion_fiscal, ano_fundacion: formData.ano_fundacion };
            const { error: companiaError } = await supabase.from('companias').update(companiaData).eq('rif', formData.rif!);
            if (companiaError) throw new Error(`Error (Compañía): ${companiaError.message}`);

            if (formData.id_direccion) {
                const direccionData: Partial<Direccion> = { id_parroquia: formData.id_parroquia!, direccion_detallada: formData.direccion_detallada, latitud: formData.latitud, longitud: formData.longitud };
                const { error: direccionError } = await supabase.from('direcciones').update(direccionData).eq('id_direccion', formData.id_direccion);
                if (direccionError) throw new Error(`Error (Dirección): ${direccionError.message}`);
            }
            
            const establecimientoData: Partial<Establecimiento> = { nombre_establecimiento: formData.nombre_establecimiento, id_clase_caev: formData.id_clase_caev, email_principal: formData.email_principal, telefono_principal_1: formData.telefono_principal_1, telefono_principal_2: formData.telefono_principal_2, fecha_apertura: formData.fecha_apertura, personal_obrero: formData.personal_obrero, personal_empleado: formData.personal_empleado, personal_directivo: formData.personal_directivo };
            const { error: establecimientoError } = await supabase.from('establecimientos').update(establecimientoData).eq('id_establecimiento', id!);
            if (establecimientoError) throw new Error(`Error (Establecimiento): ${establecimientoError.message}`);
            
            // 2. Sync Join Tables
            const id_establecimiento = parseInt(id!, 10);

            // 2a. Sync Products
            const initialProductIds = new Set(initialData?.selectedProducts?.map(p => p.id_producto));
            const currentProductIds = new Set(formData.selectedProducts?.map(p => p.id_producto));
            const productsToAdd = formData.selectedProducts?.filter(p => !initialProductIds.has(p.id_producto)).map(p => ({id_establecimiento, id_producto: p.id_producto!}));
            const productIdsToRemove = initialData?.selectedProducts?.filter(p => !currentProductIds.has(p.id_producto)).map(p => p.id_producto);
            
            if (productsToAdd && productsToAdd.length > 0) {
                const { error } = await supabase.from('establecimiento_productos').insert(productsToAdd);
                if (error) throw new Error(`Error adding products: ${error.message}`);
            }
            if (productIdsToRemove && productIdsToRemove.length > 0) {
                const { error } = await supabase.from('establecimiento_productos').delete().eq('id_establecimiento', id_establecimiento).in('id_producto', productIdsToRemove);
                if (error) throw new Error(`Error removing products: ${error.message}`);
            }

            // 2b. Sync Processes
            const initialProcessIds = new Set(initialData?.selectedProcesses?.map(p => p.id_proceso));
            const currentProcesses = new Map(formData.selectedProcesses?.map(p => [p.id_proceso, p]));
            const processesToAdd = formData.selectedProcesses?.filter(p => !initialProcessIds.has(p.id_proceso)).map(p => ({id_establecimiento, id_proceso: p.id_proceso!, porcentaje_capacidad_uso: p.porcentaje_capacidad_uso}));
            const processIdsToRemove = initialData?.selectedProcesses?.filter(p => !currentProcesses.has(p.id_proceso)).map(p => p.id_proceso);
            const processesToUpdate = initialData?.selectedProcesses?.filter(p => currentProcesses.has(p.id_proceso) && currentProcesses.get(p.id_proceso)?.porcentaje_capacidad_uso != p.porcentaje_capacidad_uso);

            if (processesToAdd && processesToAdd.length > 0) {
                const { error } = await supabase.from('establecimiento_procesos').insert(processesToAdd);
                if(error) throw new Error(`Error adding processes: ${error.message}`);
            }
            if (processIdsToRemove && processIdsToRemove.length > 0) {
                const { error } = await supabase.from('establecimiento_procesos').delete().eq('id_establecimiento', id_establecimiento).in('id_proceso', processIdsToRemove);
                 if(error) throw new Error(`Error removing processes: ${error.message}`);
            }
            if(processesToUpdate && processesToUpdate.length > 0) {
                for(const process of processesToUpdate) {
                    const { error } = await supabase.from('establecimiento_procesos').update({porcentaje_capacidad_uso: currentProcesses.get(process.id_proceso)?.porcentaje_capacidad_uso}).match({id_establecimiento, id_proceso: process.id_proceso});
                    if(error) throw new Error(`Error updating process ${process.nombre_proceso}: ${error.message}`);
                }
            }

            // 2c. Sync Affiliations
            const initialAffiliationRifs = new Set(initialData?.selectedInstitutions);
            const currentAffiliationRifs = new Set(formData.selectedInstitutions);
            const affiliationsToAdd = formData.selectedInstitutions?.filter(rif => !initialAffiliationRifs.has(rif)).map(rif => ({id_establecimiento, rif_institucion: rif}));
            const affiliationRifsToRemove = initialData?.selectedInstitutions?.filter(rif => !currentAffiliationRifs.has(rif));

             if (affiliationsToAdd && affiliationsToAdd.length > 0) {
                const { error } = await supabase.from('afiliaciones').insert(affiliationsToAdd);
                if(error) throw new Error(`Error adding affiliations: ${error.message}`);
            }
            if (affiliationRifsToRemove && affiliationRifsToRemove.length > 0) {
                const { error } = await supabase.from('afiliaciones').delete().eq('id_establecimiento', id_establecimiento).in('rif_institucion', affiliationRifsToRemove);
                 if(error) throw new Error(`Error removing affiliations: ${error.message}`);
            }
            
            alert(`Establecimiento actualizado exitosamente.`);
            setInitialData(deepCopy(formData));
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center"><Spinner size="lg" /></div>;
    if (error && !initialData) return <div className="h-full flex items-center justify-center text-red-500">{error}</div>;
    
    return (
        <div className="bg-ciec-card p-6 md:p-8 rounded-xl shadow-lg">
            <header className="flex justify-between items-center mb-6 pb-4 border-b border-ciec-border">
                 <h1 className="text-2xl font-bold text-ciec-text-primary">{isEditing ? "Editando Empresa" : (formData.nombre_establecimiento || 'Detalle de la Empresa')}</h1>
                 <div className="flex items-center space-x-4">
                    {!isEditing && (
                         <button onClick={() => setIsEditing(true)} className="flex items-center bg-ciec-blue hover:bg-ciec-blue-hover text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <Edit className="w-5 h-5 mr-2" /> Habilitar Edición
                        </button>
                    )}
                     <button type="button" onClick={() => navigate('/empresas')} className="p-2 rounded-full text-ciec-text-secondary hover:bg-ciec-border" title="Cerrar">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {isEditing ? (
                 <form onSubmit={handleSubmit} className="space-y-8">
                    <EmpresaFormFields
                        isEditing={true}
                        formData={formData}
                        updateFormData={handleChange}
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
                    
                    {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md mt-4">{error}</p>}

                    <div className="flex justify-end space-x-4 pt-4 border-t border-ciec-border">
                        <button type="button" onClick={handleCancelEdit} className="bg-ciec-border text-ciec-text-primary font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors flex items-center">
                             <RotateCcw className="w-5 h-5 mr-2" /> Descartar Cambios
                        </button>
                        <button type="submit" disabled={submitting || loading} className="bg-ciec-blue hover:bg-ciec-blue-hover text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500 transition-colors flex items-center">
                            {submitting ? <Spinner size="sm" color="border-white" /> : <><Save className="w-5 h-5 mr-2" /> Guardar Cambios</>}
                        </button>
                    </div>
                </form>
            ) : (
                initialData && <EmpresaDetailView
                    data={initialData}
                    logoPreview={logoPreview}
                    dropdowns={{
                        estados,
                        municipios,
                        parroquias,
                        secCaev,
                        divCaev,
                        classCaev,
                        instituciones
                    }}
                />
            )}
        </div>
    );
};

export default EmpresaForm;
