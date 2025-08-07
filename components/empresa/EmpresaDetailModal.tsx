
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { EstablecimientoFormData, Estado, Municipio, Parroquia, SeccionCaev, DivisionCaev, ClaseCaev, CompaniaUpdate, DireccionUpdate, EstablecimientoUpdate, Institucion, EstablecimientoProductoInsert, AfiliacionInsert, EstablecimientoProcesoInsert, EstablecimientoProcesoUpdate, ProductoInsert, ProcesoProductivoInsert } from '../../types';
import Spinner from '../ui/Spinner';
import EmpresaFormFields from './EmpresaFormFields';
import EmpresaDetailView from './EmpresaDetailView';
import { Edit, Save, RotateCcw } from 'lucide-react';
import Modal from '../ui/Modal';

// Helper to create a deep copy
const deepCopy = (obj: any) => JSON.parse(JSON.stringify(obj));

interface EmpresaDetailModalProps {
    establecimientoId: string;
    onClose: (refreshed?: boolean) => void;
    startInEditMode?: boolean;
}

const EmpresaDetailModal: React.FC<EmpresaDetailModalProps> = ({ establecimientoId, onClose, startInEditMode = false }) => {
    const [isEditing, setIsEditing] = useState(startInEditMode);
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
        const fetchAllData = async () => {
            if (!establecimientoId) return;
            
            setLoading(true);
            setError(null);
            try {
                const [
                    { data: e, error: e1 }, { data: m, error: e2 }, { data: p, error: e3 },
                    { data: s, error: e5 }, { data: d, error: e6 }, { data: c, error: e7 },
                    { data: i, error: e8 }
                ] = await Promise.all([
                    supabase.from('estados').select('*'), supabase.from('municipios').select('*'),
                    supabase.from('parroquias').select('*'), supabase.from('secciones_caev').select('*'),
                    supabase.from('divisiones_caev').select('*'), supabase.from('clases_caev').select('*'),
                    supabase.from('instituciones').select('*')
                ]);
                if (e1 || e2 || e3 || e5 || e6 || e7 || e8) throw new Error("Failed to load form metadata.");
                
                setEstados((e as any) || []); setMunicipios((m as any) || []); setParroquias((p as any) || []);
                setSecCaev((s as any) || []); setDivCaev((d as any) || []); setClassCaev((c as any) || []);
                setInstituciones((i as any) || []);

                const { data, error: fetchError } = await supabase.from('establecimientos').select(`
                    *,
                    companias(*),
                    direcciones(*, parroquias(*, municipios(*))),
                    clases_caev(*, divisiones_caev(*)),
                    afiliaciones(rif_institucion),
                    establecimiento_productos(productos(id_producto, nombre_producto)),
                    establecimiento_procesos(*, procesos_productivos(id_proceso, nombre_proceso))
                `).eq('id_establecimiento', establecimientoId).single();
                
                if (fetchError) throw new Error('Could not fetch establishment data.');
                
                const typedData = data as any;
                if (typedData) {
                    const flatData: EstablecimientoFormData = {
                        ...typedData.companias, ...typedData.direcciones, ...typedData,
                        id_parroquia: typedData.direcciones?.id_parroquia,
                        id_municipio: typedData.direcciones?.parroquias?.municipios?.id_municipio,
                        id_estado: typedData.direcciones?.parroquias?.municipios?.id_estado,
                        id_clase_caev: typedData.clases_caev?.id_clase,
                        id_division: typedData.clases_caev?.divisiones_caev?.id_division,
                        id_seccion: typedData.clases_caev?.divisiones_caev?.id_seccion,
                        isNewCompany: false,
                        selectedInstitutions: typedData.afiliaciones?.map((a:any) => a.rif_institucion) || [],
                        selectedProducts: typedData.establecimiento_productos?.map((ep:any) => ep.productos).filter(Boolean) as any || [],
                        selectedProcesses: typedData.establecimiento_procesos?.map((ep:any) => ({...ep.procesos_productivos, ...ep, porcentaje_capacidad_uso: ep.porcentaje_capacidad_uso || null})) || []
                    };
                    setFormData(flatData);
                    setInitialData(deepCopy(flatData));
                    setLogoPreview(typedData.companias?.logo || null);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [establecimientoId]);

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
    };

    const handleCancelEdit = () => {
        if(initialData){
            setFormData(deepCopy(initialData));
            setLogoPreview(initialData.logo || null);
            setLogoFile(null);
        }
        setIsEditing(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.razon_social || !formData.rif) {
            alert('RIF y Razón Social son obligatorios.');
            return;
        }
        setSubmitting(true);
        setError(null);
        
        try {
            // Step 1: Handle logo upload. This must be sequential if a new logo exists.
            let logoUrl = formData.logo;
            if (logoFile) {
                const fileName = `${formData.rif}-${Date.now()}`;
                const { data: uploadData, error: uploadError } = await supabase.storage.from('logos-empresas').upload(fileName, logoFile, { upsert: true });
                if (uploadError) throw new Error(`Error al subir el logo: ${uploadError.message}`);
                logoUrl = supabase.storage.from('logos-empresas').getPublicUrl(uploadData.path).data.publicUrl;
            } else if (logoPreview === null && initialData?.logo) {
                // This handles logo deletion
                logoUrl = null;
            }

            // Step 2: Handle "on-the-fly" creations. These must also be sequential to get IDs.
            const newProductsToCreate = formData.selectedProducts?.filter(p => p.id_producto === null).map(p => ({ nombre_producto: p.nombre_producto })) || [];
            let createdProducts: { id_producto: number; nombre_producto: string; }[] = [];
            if (newProductsToCreate.length > 0) {
                const { data, error } = await supabase.from('productos').insert(newProductsToCreate as any).select();
                if (error) throw new Error(`Error creando nuevos productos: ${error.message}`);
                createdProducts = data as { id_producto: number; nombre_producto: string; }[] || [];
            }

            const newProcessesToCreate = formData.selectedProcesses?.filter(p => p.id_proceso === null).map(p => ({ nombre_proceso: p.nombre_proceso })) || [];
            let createdProcesses: { id_proceso: number; nombre_proceso: string; }[] = [];
            if (newProcessesToCreate.length > 0) {
                const { data, error } = await supabase.from('procesos_productivos').insert(newProcessesToCreate as any).select();
                if (error) throw new Error(`Error creando nuevos procesos: ${error.message}`);
                createdProcesses = data as { id_proceso: number; nombre_proceso: string; }[] || [];
            }
            
            // Create maps for new IDs
            const productMap = new Map(createdProducts?.map(p => [p.nombre_producto, p.id_producto]));
            const allProducts = formData.selectedProducts?.map(p => ({
                id_producto: p.id_producto ?? productMap.get(p.nombre_producto) ?? null
            })) || [];

            const processMap = new Map(createdProcesses?.map(p => [p.nombre_proceso, p.id_proceso]));
            const allProcesses = formData.selectedProcesses?.map(p => ({
                id_proceso: p.id_proceso ?? processMap.get(p.nombre_proceso) ?? null,
                nombre_proceso: p.nombre_proceso,
                porcentaje_capacidad_uso: p.porcentaje_capacidad_uso
            })) || [];


            // Step 3: Batch all remaining DB operations
            const dbPromises = [];
            const id_establecimiento = establecimientoId;

            // A. Main table updates
            const companiaData: CompaniaUpdate = { razon_social: formData.razon_social, logo: logoUrl, direccion_fiscal: formData.direccion_fiscal, ano_fundacion: formData.ano_fundacion };
            dbPromises.push(supabase.from('companias').update(companiaData as any).eq('rif', formData.rif!));
            
            if (formData.id_direccion && formData.id_parroquia) {
                const direccionData: DireccionUpdate = { id_parroquia: formData.id_parroquia, direccion_detallada: formData.direccion_detallada, latitud: formData.latitud, longitud: formData.longitud };
                dbPromises.push(supabase.from('direcciones').update(direccionData as any).eq('id_direccion', formData.id_direccion));
            }
            
            const establecimientoData: EstablecimientoUpdate = { nombre_establecimiento: formData.nombre_establecimiento, id_clase_caev: formData.id_clase_caev, email_principal: formData.email_principal, telefono_principal_1: formData.telefono_principal_1, telefono_principal_2: formData.telefono_principal_2, fecha_apertura: formData.fecha_apertura, personal_obrero: formData.personal_obrero, personal_empleado: formData.personal_empleado, personal_directivo: formData.personal_directivo };
            dbPromises.push(supabase.from('establecimientos').update(establecimientoData as any).eq('id_establecimiento', establecimientoId));

            // B. Sync junction tables
            // Sync Products
            const initialProductIds = new Set(initialData?.selectedProducts?.map(p => p.id_producto).filter(Boolean));
            const currentProductIds = new Set(allProducts.map(p => p.id_producto).filter(Boolean));
            const productsToAdd: EstablecimientoProductoInsert[] = allProducts.filter(p => p.id_producto && !initialProductIds.has(p.id_producto)).map(p => ({id_establecimiento, id_producto: p.id_producto!}));
            const productIdsToRemove = Array.from(initialProductIds).filter(id => !currentProductIds.has(id));
            
            if (productsToAdd.length > 0) dbPromises.push(supabase.from('establecimiento_productos').insert(productsToAdd as any));
            if (productIdsToRemove.length > 0) dbPromises.push(supabase.from('establecimiento_productos').delete().eq('id_establecimiento', id_establecimiento).in('id_producto', productIdsToRemove));

            // Sync Processes
            const initialProcesses = new Map(initialData?.selectedProcesses?.map(p => [p.id_proceso, p]));
            const currentProcessesMap = new Map(allProcesses.map(p => [p.id_proceso, p]));
            const processesToAdd: EstablecimientoProcesoInsert[] = allProcesses.filter(p => p.id_proceso && !initialProcesses.has(p.id_proceso)).map(p => ({id_establecimiento, id_proceso: p.id_proceso!, porcentaje_capacidad_uso: Number(p.porcentaje_capacidad_uso) || null}));
            const processIdsToRemove = Array.from(initialProcesses.keys()).filter(id => id && !currentProcessesMap.has(id));
            const processesToUpdate = allProcesses.filter(p => {
                if (!p.id_proceso || !initialProcesses.has(p.id_proceso)) return false;
                const initialUsage = initialProcesses.get(p.id_proceso)?.porcentaje_capacidad_uso;
                const currentUsage = p.porcentaje_capacidad_uso;
                // Normalize to number or null for comparison to avoid '50' != 50 issues
                const initialVal = initialUsage != null ? Number(initialUsage) : null;
                const currentVal = currentUsage != null ? Number(currentUsage) : null;
                return initialVal !== currentVal;
            });

            if (processesToAdd.length > 0) dbPromises.push(supabase.from('establecimiento_procesos').insert(processesToAdd as any));
            if (processIdsToRemove.length > 0) dbPromises.push(supabase.from('establecimiento_procesos').delete().eq('id_establecimiento', id_establecimiento).in('id_proceso', processIdsToRemove));
            processesToUpdate.forEach(p => {
                if(!p.id_proceso) return;
                const updatePayload: EstablecimientoProcesoUpdate = { porcentaje_capacidad_uso: Number(p.porcentaje_capacidad_uso) || null };
                dbPromises.push(supabase.from('establecimiento_procesos').update(updatePayload as any).match({id_establecimiento, id_proceso: p.id_proceso}));
            });

            // Sync Affiliations
            const initialAffiliationRifs = new Set(initialData?.selectedInstitutions);
            const currentAffiliationRifs = new Set(formData.selectedInstitutions);
            const affiliationsToAdd: AfiliacionInsert[] = formData.selectedInstitutions?.filter(rif => !initialAffiliationRifs.has(rif)).map(rif => ({id_establecimiento, rif_institucion: rif})) || [];
            const affiliationRifsToRemove = initialData?.selectedInstitutions?.filter(rif => !currentAffiliationRifs.has(rif));

            if (affiliationsToAdd.length > 0) dbPromises.push(supabase.from('afiliaciones').insert(affiliationsToAdd as any));
            if (affiliationRifsToRemove && affiliationRifsToRemove.length > 0) dbPromises.push(supabase.from('afiliaciones').delete().eq('id_establecimiento', id_establecimiento).in('rif_institucion', affiliationRifsToRemove));

            // 4. Execute all promises concurrently
            const results = await Promise.all(dbPromises);
            const anyError = results.find(res => res.error);
            if (anyError) throw new Error(`Error al actualizar la base de datos: ${anyError.error!.message}`);
            
            alert(`Establecimiento actualizado exitosamente.`);
            onClose(true);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        // Reset edit mode when modal is closed externally
        setIsEditing(false);
        onClose(false);
    }

    const renderFooter = () => {
        if (loading) return null;
        if (isEditing) {
            return (
                <>
                    <button type="button" onClick={handleCancelEdit} className="border border-ciec-border bg-transparent text-ciec-text-secondary hover:bg-ciec-border hover:text-ciec-text-primary font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-border">
                        <RotateCcw className="w-5 h-5 mr-2" /> Cancelar
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={submitting} className="bg-transparent hover:bg-ciec-blue text-ciec-blue hover:text-white border border-ciec-blue font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-blue">
                        {submitting ? <Spinner size="sm" color="border-white" /> : <><Save className="w-5 h-5 mr-2" /> Guardar Cambios</>}
                    </button>
                </>
            );
        }
        return (
            <button onClick={() => setIsEditing(true)} className="bg-transparent hover:bg-ciec-blue text-ciec-blue hover:text-white border border-ciec-blue font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-blue">
                <Edit className="w-5 h-5 mr-2" /> Habilitar Edición
            </button>
        );
    };

    return (
        <Modal
            isOpen={true}
            onClose={handleClose}
            title={isEditing ? `Editando: ${initialData?.nombre_establecimiento}` : `${initialData?.nombre_establecimiento || 'Detalle de Empresa'}`}
            size="5xl"
            footer={renderFooter()}
        >
            {loading ? <div className="h-96 flex items-center justify-center"><Spinner size="lg" /></div> :
             error ? <div className="h-full flex items-center justify-center text-red-500">{error}</div> :
             isEditing ? (
                 <form onSubmit={handleSubmit} className="space-y-8">
                     <EmpresaFormFields
                         isEditing={true}
                         formData={formData}
                         updateFormData={handleChange}
                         logoPreview={logoPreview}
                         handleLogoChange={handleLogoChange}
                         handleClearLogo={handleClearLogo}
                         dropdowns={{ estados, municipios, parroquias, secCaev, divCaev, classCaev, instituciones }}
                         setExternalError={setError}
                     />
                 </form>
             ) : (
                initialData && <EmpresaDetailView
                     data={initialData}
                     logoPreview={logoPreview}
                     dropdowns={{ estados, municipios, parroquias, secCaev, divCaev, classCaev, instituciones }}
                 />
             )
            }
        </Modal>
    );
};

export default EmpresaDetailModal;
