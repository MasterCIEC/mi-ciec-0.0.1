import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Institucion, Direccion, Estado, Municipio, Parroquia, Servicio } from '../types';
import Spinner from '../components/ui/Spinner';
import { Save, X, UploadCloud, Edit, Building, MapPin, Calendar, CheckSquare } from 'lucide-react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { darkMapStyle } from '../styles/mapStyles';

// --- Helper Components ---
const DetailField = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: any }) => (
    <div>
        <label className="text-xs text-ciec-text-secondary flex items-center">{icon}<span className="ml-1">{label}</span></label>
        <p className="text-ciec-text-primary mt-1">{value || 'No disponible'}</p>
    </div>
);

const FormInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}</label>
        <input {...props} id={props.name} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70" />
    </div>
);

const FormSelect = ({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}</label>
        <select {...props} id={props.name} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 appearance-none text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-50">
            {children}
        </select>
    </div>
);

const FormTextarea = ({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}</label>
        <textarea {...props} id={props.name} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70" rows={3} />
    </div>
);
// --- End Helper Components ---


type GremioFormData = Partial<Institucion & Direccion & {
    id_estado: number | null;
    id_municipio: number | null;
    selectedServices: { id_servicio: number | null, nombre_servicio: string }[];
}>;

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
                setEstados(results[0].data || []);
                setMunicipios(results[1].data || []);
                setParroquias(results[2].data || []);
                setServicios(results[3].data || []);
            }
        };

        const fetchGremioData = async () => {
            if (!rif) {
                setLoading(false);
                return;
            }
            setLoading(true);
            const { data, error: fetchError } = await supabase
                .from('instituciones')
                .select(`
                    *,
                    direcciones(*, parroquias(*, municipios(*))),
                    institucion_servicios(servicios(id_servicio, nombre_servicio))
                `)
                .eq('rif', rif)
                .single();

            if (fetchError) {
                setError('No se pudo cargar la información del gremio.');
                console.error(fetchError);
            } else if (data) {
                const flatData: GremioFormData = {
                    ...data,
                    ...data.direcciones,
                    id_parroquia: data.direcciones?.id_parroquia,
                    id_municipio: data.direcciones?.parroquias?.municipios?.id_municipio,
                    id_estado: data.direcciones?.parroquias?.municipios?.id_estado,
                    selectedServices: data.institucion_servicios?.map(is => is.servicios).filter(Boolean) as any || [],
                };
                setFormData(flatData);
                setInitialData(JSON.parse(JSON.stringify(flatData))); // Deep copy
                if (data.logo) setLogoPreview(data.logo);
                if (flatData.latitud && flatData.longitud) {
                    setLocalCoords(`${flatData.latitud}, ${flatData.longitud}`);
                }
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
        let processedValue: string | number | null = value;
         if (['id_estado', 'id_municipio', 'id_parroquia'].includes(name)) {
            processedValue = value === '' ? null : Number(value);
        }
        const updates: Partial<GremioFormData> = { [name]: processedValue };
        if (name === 'id_estado') { updates.id_municipio = null; updates.id_parroquia = null; }
        if (name === 'id_municipio') updates.id_parroquia = null;
        setFormData(prev => ({ ...prev, ...updates }));
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

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const toggleService = (service: { id_servicio: number | null; nombre_servicio: string }) => {
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
        if (!formData.nombre || !formData.rif) {
            alert('RIF y Nombre son obligatorios.');
            return;
        }
        setSubmitting(true);
        setError(null);

        try {
            // --- Logo ---
            let logoUrl = formData.logo;
            if (logoFile) {
                const fileName = `gremio-${formData.rif}-${Date.now()}`;
                const { data: uploadData, error: uploadError } = await supabase.storage.from('logos').upload(fileName, logoFile, { upsert: true });
                if (uploadError) throw new Error(`Error al subir el logo: ${uploadError.message}`);
                logoUrl = supabase.storage.from('logos').getPublicUrl(uploadData.path).data.publicUrl;
            }

            // --- Dirección ---
            let direccionId = formData.id_direccion;
            // Si hay datos de dirección, se crea/actualiza
            if (formData.id_parroquia) {
                const direccionData = {
                    id_parroquia: formData.id_parroquia,
                    direccion_detallada: formData.direccion_detallada,
                    latitud: formData.latitud,
                    longitud: formData.longitud,
                };
                if (direccionId) { // Actualizar dirección existente
                    const { error } = await supabase.from('direcciones').update(direccionData).eq('id_direccion', direccionId);
                    if (error) throw new Error(`Error actualizando dirección: ${error.message}`);
                } else { // Crear nueva dirección
                    const { data, error } = await supabase.from('direcciones').insert(direccionData).select().single();
                    if (error) throw new Error(`Error creando dirección: ${error.message}`);
                    direccionId = data.id_direccion;
                }
            }

            // --- Institución ---
            const institucionData = {
                rif: formData.rif,
                nombre: formData.nombre,
                logo: logoUrl,
                ano_fundacion: formData.ano_fundacion,
                id_direccion: direccionId,
            };

            const { error: instError } = isCreating
                ? await supabase.from('instituciones').insert(institucionData)
                : await supabase.from('instituciones').update(institucionData).eq('rif', rif!);
            if (instError) throw instError;

            // --- Servicios (Join Table) ---
            if (!isCreating) {
                const initialServiceIds = new Set(initialData?.selectedServices?.map(s => s.id_servicio));
                const currentServiceIds = new Set(formData.selectedServices?.map(s => s.id_servicio));
                
                const servicesToAdd = formData.selectedServices?.filter(s => !initialServiceIds.has(s.id_servicio)).map(s => ({ rif_institucion: rif!, id_servicio: s.id_servicio! }));
                const serviceIdsToRemove = initialData?.selectedServices?.filter(s => !currentServiceIds.has(s.id_servicio)).map(s => s.id_servicio!);

                if (servicesToAdd && servicesToAdd.length > 0) {
                    const { error } = await supabase.from('institucion_servicios').insert(servicesToAdd);
                    if (error) throw new Error(`Error añadiendo servicios: ${error.message}`);
                }
                if (serviceIdsToRemove && serviceIdsToRemove.length > 0) {
                    const { error } = await supabase.from('institucion_servicios').delete().eq('rif_institucion', rif!).in('id_servicio', serviceIdsToRemove);
                    if (error) throw new Error(`Error eliminando servicios: ${error.message}`);
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

    const filteredMunicipios = formData.id_estado ? municipios.filter(m => m.id_estado === formData.id_estado) : [];
    const filteredParroquias = formData.id_municipio ? parroquias.filter(p => p.id_municipio === formData.id_municipio) : [];


    if (loading) return <div className="flex items-center justify-center h-full"><Spinner size="lg" /></div>;

    return (
        <div className="max-w-4xl mx-auto bg-ciec-card p-8 rounded-lg">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">{formData.nombre || 'Añadir Gremio / Institución'}</h1>
                <div className="flex items-center gap-4">
                    {!isCreating && isViewMode && (
                        <button onClick={() => setIsViewMode(false)} className="flex items-center bg-ciec-blue hover:bg-ciec-blue-hover text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            <Edit className="w-5 h-5 mr-2" /> Habilitar Edición
                        </button>
                    )}
                    <button onClick={() => navigate(-1)} className="text-ciec-text-secondary hover:text-white p-2 rounded-full hover:bg-ciec-border">
                        <X />
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                
                <fieldset className="border border-ciec-border p-4 rounded-lg">
                    <legend className="text-lg font-semibold text-ciec-blue px-2">Datos Principales</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {isViewMode ? <>
                            <DetailField icon={<Building size={14}/>} label="RIF" value={formData.rif} />
                            <DetailField icon={<Building size={14}/>} label="Nombre" value={formData.nombre} />
                            <DetailField icon={<Calendar size={14}/>} label="Año de Fundación" value={formData.ano_fundacion} />
                        </> : <>
                            <FormInput label="RIF*" name="rif" value={formData.rif || ''} onChange={handleChange} required readOnly={!isCreating} />
                            <FormInput label="Nombre*" name="nombre" value={formData.nombre || ''} onChange={handleChange} required />
                            <FormInput label="Año de Fundación" name="ano_fundacion" value={formData.ano_fundacion || ''} onChange={handleChange} type="date" />
                        </>}
                        <div>
                            <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Logo</label>
                            <div className="flex items-center gap-4 mt-2">
                                <div className="w-20 h-20 rounded-lg bg-ciec-bg border-2 border-dashed border-ciec-border flex items-center justify-center">
                                    {logoPreview ? <img src={logoPreview} className="w-full h-full object-cover rounded-md" /> : <UploadCloud />}
                                </div>
                                {!isViewMode && <button type="button" onClick={() => document.getElementById('logo-gremio')?.click()} className="px-4 py-2 bg-ciec-border rounded-lg">Cambiar</button>}
                                <input type="file" id="logo-gremio" onChange={handleLogoChange} accept="image/*" className="hidden" />
                            </div>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="border border-ciec-border p-4 rounded-lg">
                    <legend className="text-lg font-semibold text-ciec-blue px-2">Ubicación</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                        {isViewMode ? <>
                            <DetailField icon={<MapPin size={14}/>} label="Estado" value={estados.find(e => e.id_estado === formData.id_estado)?.nombre_estado} />
                            <DetailField icon={<MapPin size={14}/>} label="Municipio" value={municipios.find(m => m.id_municipio === formData.id_municipio)?.nombre_municipio} />
                            <DetailField icon={<MapPin size={14}/>} label="Parroquia" value={parroquias.find(p => p.id_parroquia === formData.id_parroquia)?.nombre_parroquia} />
                            <div className="lg:col-span-3"><DetailField icon={<MapPin size={14}/>} label="Dirección Detallada" value={formData.direccion_detallada} /></div>
                            
                            {formData.latitud && formData.longitud ? (
                                <div className="lg:col-span-3 mt-4 h-64 rounded-lg overflow-hidden border border-ciec-border">
                                    <GoogleMap 
                                        mapContainerStyle={{ width: '100%', height: '100%' }} 
                                        center={{ lat: formData.latitud, lng: formData.longitud }} 
                                        zoom={15} 
                                        options={{ styles: darkMapStyle, mapTypeControl: false, zoomControl: false, streetViewControl: false, draggable: false, fullscreenControl: false }}
                                    >
                                        <MarkerF position={{ lat: formData.latitud, lng: formData.longitud }} />
                                    </GoogleMap>
                                </div>
                            ) : (
                                <div className="lg:col-span-3"><DetailField icon={<MapPin size={14}/>} label="Ubicación en Mapa" value="No disponible" /></div>
                            )}
                        </> : <>
                            <FormSelect label="Estado" name="id_estado" value={formData.id_estado || ''} onChange={handleChange}><option value="">Seleccione Estado</option>{estados.map(e => <option key={e.id_estado} value={e.id_estado}>{e.nombre_estado}</option>)}</FormSelect>
                            <FormSelect label="Municipio" name="id_municipio" value={formData.id_municipio || ''} onChange={handleChange} disabled={!formData.id_estado}><option value="">Seleccione Municipio</option>{filteredMunicipios.map(m => <option key={m.id_municipio} value={m.id_municipio}>{m.nombre_municipio}</option>)}</FormSelect>
                            <FormSelect label="Parroquia" name="id_parroquia" value={formData.id_parroquia || ''} onChange={handleChange} disabled={!formData.id_municipio}><option value="">Seleccione Parroquia</option>{filteredParroquias.map(p => <option key={p.id_parroquia} value={p.id_parroquia}>{p.nombre_parroquia}</option>)}</FormSelect>
                            <FormTextarea label="Dirección Detallada" name="direccion_detallada" value={formData.direccion_detallada || ''} onChange={handleChange} className="lg:col-span-3" />
                            <div className="lg:col-span-3">
                                <FormInput 
                                    label="Coordenadas (Lat, Lon)" 
                                    name="coordinates" 
                                    value={localCoords} 
                                    onChange={handleCoordinatesChange} 
                                    placeholder="Ej: 10.123, -68.456"
                                />
                            </div>
                             {formData.latitud && formData.longitud && (
                                <div className="lg:col-span-3 mt-2 h-64 rounded-lg overflow-hidden border border-ciec-border">
                                    <GoogleMap 
                                        mapContainerStyle={{ width: '100%', height: '100%' }} 
                                        center={{ lat: formData.latitud, lng: formData.longitud }} 
                                        zoom={15} 
                                        options={{ styles: darkMapStyle, mapTypeControl: false, zoomControl: true, streetViewControl: false }}
                                    >
                                        <MarkerF position={{ lat: formData.latitud, lng: formData.longitud }} />
                                    </GoogleMap>
                                </div>
                            )}
                        </>}
                    </div>
                </fieldset>

                <fieldset className="border border-ciec-border p-4 rounded-lg">
                    <legend className="text-lg font-semibold text-ciec-blue px-2">Servicios Ofrecidos</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {servicios.map(service => (
                            <div key={service.id_servicio} className="flex items-center">
                                <input
                                    type="checkbox"
                                    id={`service-${service.id_servicio}`}
                                    checked={formData.selectedServices?.some(s => s.id_servicio === service.id_servicio) || false}
                                    onChange={() => toggleService(service)}
                                    disabled={isViewMode}
                                    className="w-5 h-5 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue disabled:opacity-50"
                                />
                                <label htmlFor={`service-${service.id_servicio}`} className="ml-3 text-ciec-text-primary">{service.nombre_servicio}</label>
                            </div>
                        ))}
                    </div>
                </fieldset>

                {!isViewMode && (
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={() => isCreating ? navigate('/gremios') : setIsViewMode(true)} className="bg-ciec-border text-ciec-text-primary font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" disabled={submitting} className="bg-ciec-blue hover:bg-ciec-blue-hover text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-500 transition-colors">
                            <div className="flex items-center">
                                {submitting ? <Spinner size="sm" color="border-white" /> : <Save className="w-5 h-5 mr-2" />}
                                {isCreating ? 'Crear Gremio' : 'Guardar Cambios'}
                            </div>
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default GremioForm;