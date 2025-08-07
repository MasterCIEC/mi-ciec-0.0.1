
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Institucion, Direccion, Estado, Municipio, Parroquia, Servicio, DireccionUpdate, DireccionInsert, InstitucionUpdate, InstitucionInsert, InstitucionServicioInsert, CompaniaInsert } from '../types';
import Spinner from '../components/ui/Spinner';
import { Save, X, UploadCloud, Edit, Building, MapPin, Calendar, CheckSquare } from 'lucide-react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { darkMapStyle } from '../styles/mapStyles';
import RifInput from '../components/ui/RifInput';

// --- Helper Components (Moved outside the main component) ---
const DetailField = React.memo(({ icon, label, value, children }: { icon: React.ReactNode, label: string, value?: any, children?: React.ReactNode }) => (
    <div>
        <label className="text-xs text-ciec-text-secondary flex items-center">{icon}<span className="ml-1">{label}</span></label>
        <div className="text-ciec-text-primary mt-1">
            {children ? (
                children
            ) : (
                value || <span className="italic opacity-70">No disponible</span>
            )}
        </div>
    </div>
));

const FormInput = React.memo(({ label, tabIndex, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string, tabIndex?: number }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}</label>
        <input {...props} tabIndex={tabIndex} id={props.name} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70" />
    </div>
));

const FormSelect = React.memo(({ label, children, tabIndex, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode, tabIndex?: number }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}</label>
        <select {...props} tabIndex={tabIndex} id={props.name} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 appearance-none text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-50">
            {children}
        </select>
    </div>
));

const FormTextarea = React.memo(({ label, tabIndex, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string, tabIndex?: number }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}</label>
        <textarea {...props} tabIndex={tabIndex} id={props.name} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70" rows={3} />
    </div>
));
// --- End Helper Components ---


type GremioFormData = {
    // Institucion fields
    rif?: string;
    nombre?: string;
    abreviacion?: string | null;
    logo_gremio?: string | null;
    id_direccion?: number | null;
    ano_fundacion?: string | null;

    // Direccion fields
    id_parroquia?: number | null;
    direccion_detallada?: string | null;
    latitud?: number | null;
    longitud?: number | null;

    // Form specific state
    id_estado?: number | null;
    id_municipio?: number | null;
    selectedServices?: Servicio[];
};

const GremioForm: React.FC = () => {
    const { rif } = useParams<{ rif: string }>();
    const isCreating = !rif;
    const navigate = useNavigate();

    const [isViewMode, setIsViewMode] = useState(!isCreating);
    const [formData, setFormData] = useState<GremioFormData>({ selectedServices: [] });
    const [initialData, setInitialData] = useState<GremioFormData | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [localCoords, setLocalCoords] = useState('');
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dropdown data
    const [estados, setEstados] = useState<Estado[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [parroquias, setParroquias] = useState<Parroquia[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);


    useEffect(() => {
        const fetchDropdownData = async () => {
            const results = await Promise.all([
                supabase.from('estados').select('*'),
                supabase.from('municipios').select('*'),
                supabase.from('parroquias').select('*'),
                supabase.from('servicios').select('*').order('nombre_servicio'),
            ]);
            const errors = results.some(r => r.error);
            if (errors) {
                setError("No se pudieron cargar los datos necesarios para el formulario.");
            } else {
                setEstados((results[0].data as any) || []);
                setMunicipios((results[1].data as any) || []);
                setParroquias((results[2].data as any) || []);
                setServicios((results[3].data as any) || []);
            }
        };

        const fetchGremioData = async () => {
            if (!rif) {
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null); // Reset error on new fetch
            
            const { data, error: fetchError } = await supabase
                .from('instituciones')
                .select(`
                    rif,
                    nombre,
                    abreviacion,
                    logo_gremio,
                    id_direccion,
                    ano_fundacion,
                    direcciones(*, parroquias(*, municipios(*, estados(*)))),
                    institucion_servicios(servicios(id_servicio, nombre_servicio))
                `)
                .eq('rif', rif)
                .single();

            const typedData = data as any;
            if (fetchError || !typedData) {
                setError('No se pudo cargar la información del gremio.');
                console.error(fetchError || 'No data found for the provided RIF.');
                setLoading(false);
                return;
            }
            
            const flatData: GremioFormData = {
                rif: typedData.rif,
                nombre: typedData.nombre,
                abreviacion: typedData.abreviacion,
                ano_fundacion: typedData.ano_fundacion,
                logo_gremio: typedData.logo_gremio || null,
                
                id_direccion: typedData.direcciones?.id_direccion,
                direccion_detallada: typedData.direcciones?.direccion_detallada,
                latitud: typedData.direcciones?.latitud,
                longitud: typedData.direcciones?.longitud,

                id_parroquia: typedData.direcciones?.parroquias?.id_parroquia,
                id_municipio: typedData.direcciones?.parroquias?.municipios?.id_municipio,
                id_estado: typedData.direcciones?.parroquias?.municipios?.estados?.id_estado,

                selectedServices: (typedData.institucion_servicios as any)?.map((is: any) => is.servicios).filter(Boolean) as any || [],
            };
            
            setFormData(flatData);
            setInitialData(JSON.parse(JSON.stringify(flatData))); // Deep copy
            if (flatData.logo_gremio) setLogoPreview(flatData.logo_gremio);
            if (flatData.latitud && flatData.longitud) {
                setLocalCoords(`${flatData.latitud}, ${flatData.longitud}`);
            }
            setLoading(false);
        };

        fetchDropdownData().then(() => {
            if (!isCreating) {
                fetchGremioData();
            } else {
                setLoading(false);
            }
        });

    }, [rif, isCreating]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            let processedValue: string | number | null = value;
            if (['id_estado', 'id_municipio', 'id_parroquia'].includes(name)) {
                processedValue = value === '' ? null : Number(value);
            }
            const updates: Partial<GremioFormData> = { [name]: processedValue };
            if (name === 'id_estado') { updates.id_municipio = null; updates.id_parroquia = null; }
            if (name === 'id_municipio') updates.id_parroquia = null;
            
            return { ...prev, ...updates };
        });
    };

    const handleCoordinatesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setLocalCoords(value);
        if (value.trim() === '') {
            setFormData(prev => ({ ...prev, latitud: null, longitud: null }));
            return;
        }
        const parts = value.split(/[,;]/).map(part => part.trim());
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lon)) {
                setFormData(prev => ({ ...prev, latitud: lat, longitud: lon }));
            }
        }
    };

    const handleLogoChange = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!isViewMode) setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (!isViewMode) {
            const file = e.dataTransfer.files[0];
            handleLogoChange(file);
        }
    };

    const toggleService = (service: Servicio) => {
        const currentServices = formData.selectedServices || [];
        const serviceIndex = currentServices.findIndex(s => s.id_servicio === service.id_servicio);

        let newServices;
        if (serviceIndex > -1) {
            newServices = currentServices.filter((_, index) => index !== serviceIndex);
        } else {
            newServices = [...currentServices, service];
        }
        setFormData(prev => ({ ...prev, selectedServices: newServices }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre || !formData.rif || !formData.abreviacion || !formData.id_estado || !formData.id_municipio || !formData.id_parroquia) {
            alert('RIF, Nombre, Abreviación, Estado, Municipio y Parroquia son obligatorios.');
            return;
        }
        setSubmitting(true);
        setError(null);

        const currentRif = formData.rif!;

        try {
            // 1. Handle logo upload
            let logoUrl = formData.logo_gremio;
            if (logoFile) {
                const fileName = `${currentRif}-${Date.now()}`;
                const { data: uploadData, error: uploadError } = await supabase.storage.from('logos-gremios').upload(fileName, logoFile, { upsert: true });
                if (uploadError) throw new Error(`Error al subir el logo: ${uploadError.message}`);
                const { data: publicUrlData } = supabase.storage.from('logos-gremios').getPublicUrl(uploadData.path);
                logoUrl = publicUrlData.publicUrl;
            } else if (logoPreview === null && initialData?.logo_gremio) {
                logoUrl = null;
            }

            // 2. Upsert direccion
            let direccionId = formData.id_direccion;
            if (direccionId && !isCreating) {
                const direccionPayload: DireccionUpdate = {
                    id_parroquia: formData.id_parroquia!,
                    direccion_detallada: formData.direccion_detallada || null,
                    latitud: formData.latitud || null,
                    longitud: formData.longitud || null,
                };
                const { error } = await supabase.from('direcciones').update(direccionPayload as any).eq('id_direccion', direccionId);
                if (error) throw new Error(`Error actualizando dirección: ${error.message}`);
            } else {
                const direccionPayload: DireccionInsert = {
                    id_parroquia: formData.id_parroquia!,
                    direccion_detallada: formData.direccion_detallada || null,
                    latitud: formData.latitud || null,
                    longitud: formData.longitud || null,
                };
                const { data, error } = await supabase.from('direcciones').insert(direccionPayload as any).select().single();
                if (error) throw new Error(`Error creando dirección: ${error.message}`);
                direccionId = (data as any).id_direccion;
            }

            // 3. Upsert institucion main data
            if (isCreating) {
                const institucionPayload: InstitucionInsert = {
                    rif: currentRif,
                    nombre: formData.nombre,
                    abreviacion: formData.abreviacion || null,
                    id_direccion: direccionId,
                    ano_fundacion: formData.ano_fundacion || null,
                    logo_gremio: logoUrl,
                };
                const { error } = await supabase.from('instituciones').insert(institucionPayload as any);
                if (error) throw new Error(`Error creando institución: ${error.message}`);
            } else {
                const institucionPayload: InstitucionUpdate = {
                    nombre: formData.nombre,
                    abreviacion: formData.abreviacion || null,
                    id_direccion: direccionId,
                    ano_fundacion: formData.ano_fundacion || null,
                    logo_gremio: logoUrl,
                };
                const { error } = await supabase.from('instituciones').update(institucionPayload as any).eq('rif', currentRif);
                if (error) throw new Error(`Error actualizando datos de la institución: ${error.message}`);
            }


            // 4. Sync services
            if (isCreating) {
                const servicesToInsert: InstitucionServicioInsert[] = formData.selectedServices?.map(s => ({rif_institucion: currentRif, id_servicio: s.id_servicio})) || [];
                if (servicesToInsert.length > 0) {
                    const { error } = await supabase.from('institucion_servicios').insert(servicesToInsert as any);
                    if (error) throw new Error (`Error añadiendo servicios: ${error.message}`);
                }
            } else { // Sync on update
                const initialServiceIds = new Set(initialData?.selectedServices?.map(s => s.id_servicio));
                const currentServiceIds = new Set(formData.selectedServices?.map(s => s.id_servicio));

                const servicesToAdd: InstitucionServicioInsert[] = formData.selectedServices?.filter(s => s.id_servicio && !initialServiceIds.has(s.id_servicio))
                    .map(s => ({ rif_institucion: currentRif, id_servicio: s.id_servicio! })) || [];
                
                const serviceIdsToRemove = initialData?.selectedServices?.filter(s => s.id_servicio && !currentServiceIds.has(s.id_servicio))
                    .map(s => s.id_servicio!);

                if (serviceIdsToRemove && serviceIdsToRemove.length > 0) {
                    const { error } = await supabase.from('institucion_servicios').delete().eq('rif_institucion', currentRif).in('id_servicio', serviceIdsToRemove);
                    if (error) throw new Error(`Error eliminando servicios antiguos: ${error.message}`);
                }
                
                if (servicesToAdd.length > 0) {
                    const { error } = await supabase.from('institucion_servicios').insert(servicesToAdd as any);
                    if (error) throw new Error(`Error añadiendo nuevos servicios: ${error.message}`);
                }
            }


            alert(`Gremio ${isCreating ? 'creado' : 'actualizado'} exitosamente.`);
            navigate('/gremios');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };
    
    if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

    const filteredMunicipios = formData.id_estado ? municipios.filter(m => m.id_estado === formData.id_estado) : [];
    const filteredParroquias = formData.id_municipio ? parroquias.filter(p => p.id_municipio === formData.id_municipio) : [];

    const logoDropZoneClasses = `
        relative mt-1 w-full h-48 rounded-lg bg-ciec-bg border-2 border-dashed border-ciec-border 
        flex flex-col items-center justify-center text-ciec-text-secondary transition-all duration-200
        ${!isViewMode ? 'cursor-pointer' : ''}
        ${isDraggingOver ? 'border-ciec-blue ring-2 ring-ciec-blue' : ''}
    `;

    let tabIdx = 1;

    return (
        <div className="max-w-6xl mx-auto bg-ciec-card p-4 sm:p-8 rounded-lg">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">{isCreating ? 'Nuevo Gremio' : isViewMode ? formData.nombre : `Editando: ${formData.nombre}`}</h1>
                <div className="flex items-center gap-4">
                    {!isCreating && isViewMode && (
                        <button onClick={() => setIsViewMode(false)} className="flex items-center justify-center bg-transparent hover:bg-ciec-blue text-ciec-blue hover:text-white border border-ciec-blue font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-blue">
                            <Edit className="w-5 h-5 mr-2" /> Habilitar Edición
                        </button>
                    )}
                     <button onClick={() => navigate('/gremios')} className="text-ciec-text-secondary hover:text-white p-2 rounded-full hover:bg-ciec-border">
                        <X />
                    </button>
                </div>
            </div>
            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md mb-6">{error}</p>}
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form Fields */}
                    <div className="lg:col-span-2 space-y-6">
                        {isViewMode ? (
                            <>
                                <DetailField icon={<Building />} label="Nombre" value={formData.nombre} />
                                <DetailField icon={<Building />} label="Abreviación" value={formData.abreviacion} />
                                <DetailField icon={<Building />} label="RIF" value={formData.rif} />
                                <DetailField icon={<Calendar />} label="Año Fundación" value={formData.ano_fundacion} />
                                <DetailField icon={<MapPin />} label="Estado" value={estados.find(e => e.id_estado === formData.id_estado)?.nombre_estado} />
                                <DetailField icon={<MapPin />} label="Municipio" value={municipios.find(m => m.id_municipio === formData.id_municipio)?.nombre_municipio} />
                                <DetailField icon={<MapPin />} label="Parroquia" value={parroquias.find(p => p.id_parroquia === formData.id_parroquia)?.nombre_parroquia} />
                                <DetailField icon={<MapPin />} label="Dirección Detallada" value={formData.direccion_detallada} />
                                <DetailField icon={<CheckSquare />} label="Servicios Ofrecidos">
                                    <ul className="list-disc list-inside space-y-1">
                                    {(formData.selectedServices && formData.selectedServices.length > 0)
                                        ? formData.selectedServices.map(s => <li key={s.id_servicio}>{s.nombre_servicio}</li>)
                                        : <li className="list-none italic opacity-70">No hay servicios registrados.</li>}
                                    </ul>
                                </DetailField>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <RifInput 
                                        label="RIF*" 
                                        value={formData.rif} 
                                        onChange={(newValue) => setFormData(prev => ({ ...prev, rif: newValue }))} 
                                        readOnly={!isCreating}
                                        selectTabIndex={tabIdx++}
                                        numberTabIndex={tabIdx++}
                                        required 
                                    />
                                    <FormInput label="Nombre*" name="nombre" value={formData.nombre || ''} onChange={handleChange} required tabIndex={tabIdx++}/>
                                    <FormInput label="Abreviación*" name="abreviacion" value={formData.abreviacion || ''} onChange={handleChange} required tabIndex={tabIdx++}/>
                                    <FormInput label="Año de Fundación" name="ano_fundacion" value={formData.ano_fundacion || ''} onChange={handleChange} type="date" tabIndex={tabIdx++}/>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                     <FormSelect label="Estado*" name="id_estado" value={formData.id_estado || ''} onChange={handleChange} required tabIndex={tabIdx++}>
                                        <option value="">Seleccione un estado</option>
                                        {estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre_estado}</option>)}
                                    </FormSelect>
                                    <FormSelect label="Municipio*" name="id_municipio" value={formData.id_municipio || ''} onChange={handleChange} disabled={!formData.id_estado} required tabIndex={tabIdx++}>
                                        <option value="">Seleccione un municipio</option>
                                        {filteredMunicipios.map(m => <option key={m.id_municipio} value={m.id_municipio}>{m.nombre_municipio}</option>)}
                                    </FormSelect>
                                     <FormSelect label="Parroquia*" name="id_parroquia" value={formData.id_parroquia || ''} onChange={handleChange} disabled={!formData.id_municipio} required tabIndex={tabIdx++}>
                                        <option value="">Seleccione una parroquia</option>
                                        {filteredParroquias.map(p => <option key={p.id_parroquia} value={p.id_parroquia}>{p.nombre_parroquia}</option>)}
                                    </FormSelect>
                                </div>
                                <FormTextarea label="Dirección Detallada" name="direccion_detallada" value={formData.direccion_detallada || ''} onChange={handleChange} tabIndex={tabIdx++}/>
                                <div>
                                    <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Servicios Ofrecidos</label>
                                    <div className="max-h-60 overflow-y-auto bg-ciec-bg border border-ciec-border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {servicios.map(service => (
                                            <div key={service.id_servicio} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`service-${service.id_servicio}`}
                                                    checked={formData.selectedServices?.some(s => s.id_servicio === service.id_servicio) || false}
                                                    onChange={() => toggleService(service)}
                                                    className="w-4 h-4 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue"
                                                />
                                                <label htmlFor={`service-${service.id_servicio}`} className="ml-2 text-sm">{service.nombre_servicio}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Column: Logo & Map */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Logo</label>
                            <div 
                                tabIndex={isViewMode ? undefined : tabIdx++}
                                className={logoDropZoneClasses}
                                onClick={() => !isViewMode && document.getElementById('logo-upload')?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input 
                                    type="file" 
                                    id="logo-upload" 
                                    onChange={(e) => handleLogoChange(e.target.files ? e.target.files[0] : null)}
                                    accept="image/*" 
                                    className="hidden" 
                                />
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Vista previa del logo" className="w-full h-full object-contain rounded-md p-2" />
                                ) : (
                                    <>
                                        <UploadCloud size={48} />
                                        {!isViewMode && <p className="mt-2 text-sm">Arrastra y suelta o haz clic para subir</p>}
                                    </>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Ubicación en Mapa</label>
                            {!isViewMode && <FormInput tabIndex={tabIdx++} label="" name="coordinates" value={localCoords} onChange={handleCoordinatesChange} placeholder="Latitud, Longitud"/>}
                            <div className="mt-2 h-72 rounded-lg overflow-hidden border border-ciec-border">
                                {formData.latitud && formData.longitud ? (
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={{ lat: formData.latitud, lng: formData.longitud }}
                                        zoom={15}
                                        options={{ styles: darkMapStyle, mapTypeControl: false, zoomControl: true, streetViewControl: false }}
                                    >
                                        <MarkerF position={{ lat: formData.latitud, lng: formData.longitud }} />
                                    </GoogleMap>
                                ) : <div className="flex h-full items-center justify-center text-ciec-text-secondary">Mapa no disponible (sin coordenadas)</div>}
                            </div>
                        </div>
                    </div>
                </div>
                 {!isViewMode && (
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4 gap-3 sm:gap-0 pt-8 mt-8 border-t border-ciec-border">
                        <button type="button" onClick={() => isCreating ? navigate('/gremios') : setIsViewMode(true)} className="border border-ciec-border bg-transparent text-ciec-text-secondary hover:bg-ciec-border hover:text-ciec-text-primary font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-border">
                            Cancelar
                        </button>
                        <button type="submit" disabled={submitting} className="bg-transparent hover:bg-ciec-blue text-ciec-blue hover:text-white border border-ciec-blue font-bold py-2 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-ciec-card focus:ring-ciec-blue">
                            {submitting ? <Spinner size="sm" color="border-white" /> : <Save className="w-5 h-5 mr-2" />}
                            {isCreating ? 'Crear Gremio' : 'Guardar Cambios'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default GremioForm;
