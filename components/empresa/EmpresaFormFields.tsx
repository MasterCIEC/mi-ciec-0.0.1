
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Minus, UploadCloud, X, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { darkMapStyle } from '../../styles/mapStyles';
import Spinner from '../ui/Spinner';
import { supabase } from '../../lib/supabase';
import { EstablecimientoFormData, Producto, ProcesoProductivo } from '../../types';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


const InputField: React.FC<{ label: string; name: string; value?: string | number | null; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; type?: string; required?: boolean; readOnly?: boolean; pattern?: string; title?: string; as?: 'textarea', placeholder?: string, onPaste?: (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void; onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void; }> = ({ label, name, as, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}{props.required && '*'}</label>
        {as === 'textarea' ? (
            <textarea id={name} name={name} {...props} value={props.value || ''} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70" rows={3}></textarea>
        ) : (
            <input id={name} name={name} {...props} value={props.value || ''} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70" />
        )}
    </div>
);

const SelectField: React.FC<{ label: string; name: string; value?: string | number | null; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { id: string | number; name: string }[]; disabled?: boolean; required?: boolean; }> = ({ label, name, options, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}{props.required && '*'}</label>
        <select id={name} name={name} {...props} value={props.value || ''} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 appearance-none text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-50">
            <option value="">Seleccione una opción</option>
            {options.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
            ))}
        </select>
    </div>
);

const Fieldset: React.FC<{legend: string; children: React.ReactNode}> = ({ legend, children }) => (
    <fieldset className="border border-ciec-border p-4 rounded-lg">
        <legend className="text-lg font-semibold text-ciec-blue px-2">{legend}</legend>
        <div className="mt-4">{children}</div>
    </fieldset>
);

const CreatableSelector: React.FC<{
    title: string;
    placeholder: string;
    selectedItems: any[];
    onAddItem: (item: any) => void;
    onRemoveItem: (index: number) => void;
    searchFunction: (term: string) => Promise<any[]>;
    itemRenderer: (item: any, onUpdate: (updatedItem: any) => void) => React.ReactNode;
    creatable: boolean;
}> = ({ title, placeholder, selectedItems, onAddItem, onRemoveItem, searchFunction, itemRenderer, creatable }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    useEffect(() => {
        if (debouncedSearchTerm) {
            setLoading(true);
            searchFunction(debouncedSearchTerm).then(data => {
                setResults(data);
                setLoading(false);
            });
        } else {
            setResults([]);
        }
    }, [debouncedSearchTerm, searchFunction]);

    const handleAdd = (item: any) => {
        if (!selectedItems.some(i => i.id === item.id)) {
            onAddItem(item);
        }
        setSearchTerm('');
        setResults([]);
    };

    const handleCreate = () => {
        onAddItem({ id: null, name: searchTerm });
        setSearchTerm('');
        setResults([]);
    };

    const handleUpdateItem = (index: number, updatedItem: any) => {
        const newItems = [...selectedItems];
        newItems[index] = updatedItem;
        onAddItem(newItems); // This is a bit of a hack, parent should handle updates
    }
    
    return (
        <div>
            <label className="block text-sm font-medium text-ciec-text-secondary mb-1">{title}</label>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-ciec-bg border border-ciec-border rounded-lg pl-10 pr-4 py-2"
                />
                {(loading || results.length > 0 || (creatable && searchTerm && !results.some(r => r.name.toLowerCase() === searchTerm.toLowerCase()))) && (
                    <ul className="absolute z-10 w-full bg-ciec-card border border-ciec-border rounded-b-lg mt-1 max-h-60 overflow-y-auto">
                        {loading && <li className="px-4 py-2 text-ciec-text-secondary">Buscando...</li>}
                        {results.map(item => (
                            <li key={item.id} onClick={() => handleAdd(item)} className="px-4 py-2 hover:bg-ciec-blue cursor-pointer">{item.name}</li>
                        ))}
                        {creatable && searchTerm && !results.some(r => r.name.toLowerCase() === searchTerm.toLowerCase()) && (
                             <li onClick={handleCreate} className="px-4 py-2 hover:bg-ciec-blue cursor-pointer flex items-center">
                                <Plus className="w-4 h-4 mr-2" /> Añadir '{searchTerm}' como nuevo
                            </li>
                        )}
                    </ul>
                )}
            </div>
            <div className="mt-2 space-y-2">
                {selectedItems.map((item, index) => (
                    <div key={index} className="bg-ciec-bg p-2 rounded-md flex items-center justify-between">
                         {itemRenderer(item, (updated) => {
                             const newItems = [...selectedItems];
                             newItems[index] = updated;
                             onAddItem(newItems); // A bit hacky again
                         })}
                        <button type="button" onClick={() => onRemoveItem(index)} className="text-red-500 hover:text-red-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
};


interface EmpresaFormFieldsProps {
    isEditing: boolean;
    formData: EstablecimientoFormData;
    updateFormData: (updates: Partial<EstablecimientoFormData>) => void;
    logoPreview: string | null;
    handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleClearLogo: () => void;
    dropdowns: {
        estados: any[];
        municipios: any[];
        parroquias: any[];
        secCaev: any[];
        divCaev: any[];
        classCaev: any[];
        instituciones: any[];
    };
    setExternalError: (error: string | null) => void;
}

const EmpresaFormFields: React.FC<EmpresaFormFieldsProps> = ({
    isEditing, formData, updateFormData, logoPreview, handleLogoChange, handleClearLogo, dropdowns, setExternalError
}) => {
    const [step, setStep] = useState(1);
    const [localCoords, setLocalCoords] = useState('');
    
    // Step 1 state
    const [isCompanyVerified, setIsCompanyVerified] = useState(false);
    const [companyCheckStatus, setCompanyCheckStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
    const [isCompanyLocked, setIsCompanyLocked] = useState(false);

    // Step 2 state
    const [establishmentName, setEstablishmentName] = useState(formData.nombre_establecimiento || '');
    const debouncedName = useDebounce(establishmentName, 500);
    const [nameValidation, setNameValidation] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');


    useEffect(() => {
        if (isEditing) {
            setIsCompanyVerified(true);
            setIsCompanyLocked(true);
            setEstablishmentName(formData.nombre_establecimiento || '');
            if (formData.latitud && formData.longitud) {
                setLocalCoords(`${formData.latitud}, ${formData.longitud}`);
            }
        }
    }, [isEditing, formData.nombre_establecimiento, formData.latitud, formData.longitud]);

    // Sync local state with form data from context, especially after a discard action
    useEffect(() => {
        setEstablishmentName(formData.nombre_establecimiento || '');
    }, [formData.nombre_establecimiento]);

    useEffect(() => {
        if (formData.latitud && formData.longitud) {
            setLocalCoords(`${formData.latitud}, ${formData.longitud}`);
        } else {
            setLocalCoords('');
        }
    }, [formData.latitud, formData.longitud]);

    // Reset company verification status when RIF is cleared (e.g., on draft discard)
    useEffect(() => {
        if (!isEditing && !formData.rif) {
            setIsCompanyVerified(false);
            setCompanyCheckStatus('idle');
            setIsCompanyLocked(false);
            setStep(1); // Reset to the first step on discard
        }
    }, [formData.rif, isEditing]);


    // Effect for establishment name validation
    useEffect(() => {
        if (debouncedName.length < 3 || !formData.rif) {
            setNameValidation('idle');
            return;
        }
        if (isEditing && debouncedName === formData.nombre_establecimiento) {
            setNameValidation('valid');
            return;
        }
        
        setNameValidation('loading');
        supabase.from('establecimientos')
            .select('id_establecimiento')
            .eq('rif_compania', formData.rif)
            .eq('nombre_establecimiento', debouncedName)
            .then(({ data, error }) => {
                if (data && data.length > 0) {
                    setNameValidation('invalid');
                } else {
                    setNameValidation('valid');
                }
            });
    }, [debouncedName, formData.rif, isEditing, formData.nombre_establecimiento]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let processedValue: string | number | null = value;
        if (['id_estado', 'id_municipio', 'id_parroquia', 'id_seccion', 'id_division', 'id_clase_caev', 'personal_obrero', 'personal_empleado', 'personal_directivo'].includes(name)) {
            processedValue = value === '' ? null : Number(value);
        }
        
        const updates: Partial<EstablecimientoFormData> = { [name]: processedValue };
        
        if (name === 'id_estado') { updates.id_municipio = null; updates.id_parroquia = null; }
        if (name === 'id_municipio') updates.id_parroquia = null;
        if (name === 'id_seccion') { updates.id_division = null; updates.id_clase_caev = null; }
        if (name === 'id_division') updates.id_clase_caev = null;
        if (name === 'nombre_establecimiento') setEstablishmentName(value);

        updateFormData(updates);
    };

    const handleVerifyRif = async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const rif = e.currentTarget.value;
        if (!rif || isEditing) return;
        
        setCompanyCheckStatus('loading');
        const { data, error } = await supabase.from('companias').select('*').eq('rif', rif).single();

        if (data) {
            updateFormData({
                razon_social: data.razon_social,
                direccion_fiscal: data.direccion_fiscal,
                ano_fundacion: data.ano_fundacion,
                logo: data.logo,
                isNewCompany: false,
            });
            setIsCompanyLocked(true);
            setCompanyCheckStatus('found');
        } else {
             updateFormData({ isNewCompany: true });
             setIsCompanyLocked(false);
             setCompanyCheckStatus('not_found');
        }
        setIsCompanyVerified(true);
    };

    const onPasteCoordinates = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text');
        const parts = text.split(/[,;]/).map(part => part.trim());
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                updateFormData({ latitud: lat, longitud: lon });
                setLocalCoords(`${lat}, ${lon}`);
            } else {
                alert('Coordenadas no válidas.');
            }
        } else {
            alert('Formato de coordenadas no válido.');
        }
    };
    
    const handleCoordinatesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setLocalCoords(value);
        if (value.trim() === '') {
            updateFormData({ latitud: null, longitud: null });
            return;
        }
        const parts = value.split(/[,;]/).map(part => part.trim());
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lon)) {
                 updateFormData({ latitud: lat, longitud: lon });
            }
        }
    };

    const handleNext = () => setStep(s => s + 1);
    const handleBack = () => setStep(s => s - 1);
    
    // Dynamic Selectors Handlers
    const searchProducts = async (term: string) => {
        const { data } = await supabase.from('productos').select('*').ilike('nombre_producto', `%${term}%`).limit(5);
        return data?.map(d => ({ id: d.id_producto, name: d.nombre_producto })) || [];
    };

    const addProduct = (product: {id: number | null, name: string}) => {
        const newProduct = { id_producto: product.id, nombre_producto: product.name };
        if (!formData.selectedProducts?.some(p => p.id_producto === newProduct.id_producto && p.nombre_producto === newProduct.nombre_producto)) {
            updateFormData({ selectedProducts: [...(formData.selectedProducts || []), newProduct] });
        }
    };
    const removeProduct = (index: number) => {
        updateFormData({ selectedProducts: formData.selectedProducts?.filter((_, i) => i !== index) });
    };

    const searchProcesses = async (term: string) => {
        const { data } = await supabase.from('procesos_productivos').select('*').ilike('nombre_proceso', `%${term}%`).limit(5);
        return data?.map(d => ({ id: d.id_proceso, name: d.nombre_proceso })) || [];
    }
    const addProcess = (process: {id: number | null, name: string}) => {
        const newProcess = { id_proceso: process.id, nombre_proceso: process.name, porcentaje_capacidad_uso: '' };
        if (!formData.selectedProcesses?.some(p => p.id_proceso === newProcess.id_proceso && p.nombre_proceso === newProcess.nombre_proceso)) {
            updateFormData({ selectedProcesses: [...(formData.selectedProcesses || []), newProcess] });
        }
    };
    const removeProcess = (index: number) => {
        updateFormData({ selectedProcesses: formData.selectedProcesses?.filter((_, i) => i !== index) });
    };
    const updateProcessUsage = (index: number, usage: string) => {
        const updatedProcesses = [...(formData.selectedProcesses || [])];
        updatedProcesses[index].porcentaje_capacidad_uso = usage ? parseInt(usage, 10) : '';
        updateFormData({ selectedProcesses: updatedProcesses });
    };
    
    const toggleAffiliation = (rif: string) => {
        const currentRifs = formData.selectedInstitutions || [];
        const newRifs = currentRifs.includes(rif) ? currentRifs.filter(r => r !== rif) : [...currentRifs, rif];
        updateFormData({ selectedInstitutions: newRifs });
    };

    const filteredMunicipios = formData.id_estado ? dropdowns.municipios.filter(m => m.id_estado === formData.id_estado) : [];
    const filteredParroquias = formData.id_municipio ? dropdowns.parroquias.filter(p => p.id_municipio === formData.id_municipio) : [];
    const filteredDivCaev = formData.id_seccion ? dropdowns.divCaev.filter(d => d.id_seccion === formData.id_seccion) : [];
    const filteredClassCaev = formData.id_division ? dropdowns.classCaev.filter(c => c.id_division === formData.id_division) : [];

    const STEPS = [
        { num: 1, name: 'Compañía' },
        { num: 2, name: 'Establecimiento' },
        { num: 3, name: 'Ubicación' },
        { num: 4, name: 'Clasificación' },
        { num: 5, name: 'Afiliaciones' },
        { num: 6, name: 'Revisión' },
    ];
    
    // Componente para renderizar todos los campos en modo edición
    const AllFields = () => (
        <div className="space-y-8">
            <Fieldset legend="Datos de Identificación de la Compañía">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField label="RIF" name="rif" value={formData.rif} onChange={handleChange} required readOnly />
                    <InputField label="Razón Social" name="razon_social" value={formData.razon_social} onChange={handleChange} required />
                    <InputField label="Año de Fundación" name="ano_fundacion" type="date" value={formData.ano_fundacion} onChange={handleChange} />
                    <InputField label="Dirección Fiscal" name="direccion_fiscal" value={formData.direccion_fiscal} onChange={handleChange} as="textarea" />
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Logo</label>
                        <div className="mt-1 flex items-center gap-4">
                            <div className="w-24 h-24 rounded-lg bg-ciec-bg border-2 border-dashed border-ciec-border flex items-center justify-center text-ciec-text-secondary">
                                {logoPreview ? <img src={logoPreview} alt="preview" className="w-full h-full object-cover rounded-md" /> : <UploadCloud size={32}/>}
                            </div>
                            <input type="file" id="logo" onChange={handleLogoChange} accept="image/*" className="hidden" />
                            <button type="button" onClick={() => document.getElementById('logo')?.click()} className="px-4 py-2 bg-ciec-border rounded-lg hover:bg-gray-600">Cambiar</button>
                            { (logoPreview || formData.logo) && <button type="button" onClick={handleClearLogo} className="p-2 text-red-500 hover:bg-red-900/50 rounded-full"><X size={16}/></button>}
                        </div>
                    </div>
                </div>
            </Fieldset>
            <Fieldset legend="Datos del Establecimiento">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Nombre Establecimiento" name="nombre_establecimiento" value={establishmentName} onChange={handleChange} required />
                    <InputField label="E-mail Principal" name="email_principal" type="email" value={formData.email_principal} onChange={handleChange} />
                    <InputField label="Teléfono Principal 1" name="telefono_principal_1" type="tel" value={formData.telefono_principal_1} onChange={handleChange} />
                    <InputField label="Teléfono Principal 2" name="telefono_principal_2" type="tel" value={formData.telefono_principal_2} onChange={handleChange} />
                    <InputField label="Fecha de Apertura" name="fecha_apertura" type="date" value={formData.fecha_apertura} onChange={handleChange} />
                </div>
            </Fieldset>
            <Fieldset legend="Capital Humano">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="Nº de Obreros" name="personal_obrero" type="number" value={formData.personal_obrero} onChange={handleChange} />
                    <InputField label="Nº de Empleados" name="personal_empleado" type="number" value={formData.personal_empleado} onChange={handleChange} />
                    <InputField label="Nº de Directivos" name="personal_directivo" type="number" value={formData.personal_directivo} onChange={handleChange} />
                </div>
            </Fieldset>
            <Fieldset legend="Ubicación Geográfica del Establecimiento">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField label="Estado" name="id_estado" value={formData.id_estado} onChange={handleChange} options={dropdowns.estados.map(e => ({id: e.id_estado, name: e.nombre_estado}))} required/>
                    <SelectField label="Municipio" name="id_municipio" value={formData.id_municipio} onChange={handleChange} options={filteredMunicipios.map(m => ({id: m.id_municipio, name: m.nombre_municipio}))} disabled={!formData.id_estado} required/>
                    <SelectField label="Parroquia" name="id_parroquia" value={formData.id_parroquia} onChange={handleChange} options={filteredParroquias.map(p => ({id: p.id_parroquia, name: p.nombre_parroquia}))} disabled={!formData.id_municipio} required/>
                    <InputField label="Dirección Detallada" name="direccion_detallada" value={formData.direccion_detallada} onChange={handleChange} as="textarea" />
                    <div className="md:col-span-2">
                        <InputField label="Coordenadas (Lat, Lon)" name="coordinates" value={localCoords} onChange={handleCoordinatesChange} onPaste={onPasteCoordinates} placeholder="Pegar o escribir coordenadas (ej: 10.123, -68.456)" />
                        {formData.latitud && formData.longitud && (
                            <div className="mt-4 h-64 rounded-lg overflow-hidden border border-ciec-border">
                                <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={{ lat: formData.latitud, lng: formData.longitud }} zoom={15} options={{ styles: darkMapStyle, mapTypeControl: false, zoomControl: true, streetViewControl: false }}>
                                    <MarkerF position={{ lat: formData.latitud, lng: formData.longitud }} />
                                </GoogleMap>
                            </div>
                        )}
                    </div>
                </div>
            </Fieldset>
            <Fieldset legend="Clasificación y Producción">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <SelectField label="Sección CAEV" name="id_seccion" value={formData.id_seccion} onChange={handleChange} options={dropdowns.secCaev.map(s => ({id: s.id_seccion, name: s.nombre_seccion}))} />
                    <SelectField label="División CAEV" name="id_division" value={formData.id_division} onChange={handleChange} options={filteredDivCaev.map(d => ({id: d.id_division, name: d.nombre_division}))} disabled={!formData.id_seccion} />
                    <SelectField label="Clase CAEV" name="id_clase_caev" value={formData.id_clase_caev} onChange={handleChange} options={filteredClassCaev.map(c => ({id: c.id_clase, name: c.nombre_clase}))} disabled={!formData.id_division} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CreatableSelector 
                        title="Productos"
                        placeholder="Buscar o añadir producto..."
                        selectedItems={formData.selectedProducts || []}
                        onAddItem={(item) => addProduct(item)}
                        onRemoveItem={removeProduct}
                        searchFunction={searchProducts}
                        itemRenderer={(item) => <span>{item.nombre_producto || item.name}</span>}
                        creatable={true}
                    />
                    <CreatableSelector 
                        title="Procesos Productivos"
                        placeholder="Buscar o añadir proceso..."
                        selectedItems={formData.selectedProcesses || []}
                        onAddItem={(item) => addProcess(item)}
                        onRemoveItem={removeProcess}
                        searchFunction={searchProcesses}
                        itemRenderer={(item, onUpdate) => (
                            <div className="flex-grow flex items-center">
                                <span className="flex-1">{item.nombre_proceso || item.name}</span>
                                <input 
                                    type="number" 
                                    min="0"
                                    max="100"
                                    placeholder="Uso %" 
                                    value={item.porcentaje_capacidad_uso || ''} 
                                    onChange={(e) => updateProcessUsage(formData.selectedProcesses?.indexOf(item) ?? -1, e.target.value)}
                                    className="w-24 ml-4 bg-ciec-border rounded px-2 py-1 text-right"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        )}
                        creatable={true}
                    />
                </div>
            </Fieldset>
            <Fieldset legend="Afiliaciones">
                 <div className="space-y-2 max-h-96 overflow-y-auto">
                    {dropdowns.instituciones.map(inst => (
                        <div key={inst.rif} className="flex items-center bg-ciec-bg p-3 rounded-lg">
                            <input
                                type="checkbox"
                                id={`inst-${inst.rif}`}
                                checked={formData.selectedInstitutions?.includes(inst.rif) || false}
                                onChange={() => toggleAffiliation(inst.rif)}
                                className="w-5 h-5 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue"
                            />
                            <label htmlFor={`inst-${inst.rif}`} className="ml-3 text-ciec-text-primary">{inst.nombre}</label>
                        </div>
                    ))}
                </div>
            </Fieldset>
        </div>
    );
    
    return (
        <>
            {isEditing ? (
                <AllFields />
            ) : (
                <>
                    <div className="flex items-center justify-center mb-6">
                        {STEPS.map((s, index) => (
                            <React.Fragment key={s.num}>
                                <div className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s.num ? 'bg-ciec-blue text-white' : 'bg-ciec-border text-ciec-text-secondary'}`}>
                                        {step > s.num ? <CheckCircle size={20} /> : s.num}
                                    </div>
                                    <span className={`ml-2 ${step >= s.num ? 'text-ciec-text-primary' : 'text-ciec-text-secondary'}`}>{s.name}</span>
                                </div>
                                {index < STEPS.length - 1 && <div className={`flex-auto border-t-2 mx-4 ${step > s.num ? 'border-ciec-blue' : 'border-ciec-border'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>
                    <h1 className="text-3xl font-bold text-ciec-text-primary mb-6">{STEPS.find(s=>s.num===step)?.name}</h1>

                    {/* Step 1: Company */}
                    <div className={step === 1 ? 'block' : 'hidden'}>
                        <Fieldset legend="Datos de Identificación de la Compañía">
                            {companyCheckStatus === 'found' && <p className="text-green-400 bg-green-900/50 p-3 rounded-md mb-4">Compañía ya registrada. Proceda a registrar un nuevo establecimiento para esta compañía.</p>}
                            {companyCheckStatus === 'not_found' && <p className="text-yellow-400 bg-yellow-900/50 p-3 rounded-md mb-4">Nueva compañía detectada. Por favor, complete los datos fiscales.</p>}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <InputField label="RIF" name="rif" value={formData.rif} onChange={handleChange} onBlur={handleVerifyRif} required pattern="^[JVEGPCjvegpc]-\d{8,9}-\d$" title="Formato: J-12345678-9" readOnly={isEditing || isCompanyLocked} />
                                <InputField label="Razón Social" name="razon_social" value={formData.razon_social} onChange={handleChange} required readOnly={isCompanyLocked} />
                                <InputField label="Año de Fundación" name="ano_fundacion" type="date" value={formData.ano_fundacion} onChange={handleChange} readOnly={isCompanyLocked}/>
                                <InputField label="Dirección Fiscal" name="direccion_fiscal" value={formData.direccion_fiscal} onChange={handleChange} as="textarea" readOnly={isCompanyLocked} />
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Logo</label>
                                    <div className="mt-1 flex items-center gap-4">
                                        <div className="w-24 h-24 rounded-lg bg-ciec-bg border-2 border-dashed border-ciec-border flex items-center justify-center text-ciec-text-secondary">
                                            {logoPreview ? <img src={logoPreview || formData.logo} alt="preview" className="w-full h-full object-cover rounded-md" /> : <UploadCloud size={32}/>}
                                        </div>
                                        <input type="file" id="logo" onChange={handleLogoChange} accept="image/*" className="hidden" />
                                        <button type="button" onClick={() => document.getElementById('logo')?.click()} className="px-4 py-2 bg-ciec-border rounded-lg hover:bg-gray-600">Cambiar</button>
                                        { (logoPreview || formData.logo) && <button type="button" onClick={handleClearLogo} className="p-2 text-red-500 hover:bg-red-900/50 rounded-full"><X size={16}/></button>}
                                    </div>
                                </div>
                            </div>
                        </Fieldset>
                    </div>
                    
                    {/* Step 2: Establishment */}
                    <div className={step === 2 ? 'block' : 'hidden'}>
                        <Fieldset legend="Datos del Establecimiento">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputField label="Nombre Establecimiento" name="nombre_establecimiento" value={establishmentName} onChange={handleChange} required />
                                    {nameValidation === 'loading' && <Spinner size="sm"/>}
                                    {nameValidation === 'invalid' && <p className="text-red-500 text-sm mt-1">Ya existe un establecimiento con este nombre para esta compañía.</p>}
                                    {nameValidation === 'valid' && <CheckCircle className="text-green-500 inline-block ml-2"/>}
                                </div>
                                <InputField label="E-mail Principal" name="email_principal" type="email" value={formData.email_principal} onChange={handleChange} />
                                <InputField label="Teléfono Principal 1" name="telefono_principal_1" type="tel" value={formData.telefono_principal_1} onChange={handleChange} />
                                <InputField label="Teléfono Principal 2" name="telefono_principal_2" type="tel" value={formData.telefono_principal_2} onChange={handleChange} />
                                <InputField label="Fecha de Apertura" name="fecha_apertura" type="date" value={formData.fecha_apertura} onChange={handleChange} />
                            </div>
                        </Fieldset>
                        <Fieldset legend="Capital Humano">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InputField label="Nº de Obreros" name="personal_obrero" type="number" value={formData.personal_obrero} onChange={handleChange} />
                                <InputField label="Nº de Empleados" name="personal_empleado" type="number" value={formData.personal_empleado} onChange={handleChange} />
                                <InputField label="Nº de Directivos" name="personal_directivo" type="number" value={formData.personal_directivo} onChange={handleChange} />
                            </div>
                        </Fieldset>
                    </div>

                    {/* Step 3: Location */}
                    <div className={step === 3 ? 'block' : 'hidden'}>
                        <Fieldset legend="Ubicación Geográfica del Establecimiento">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SelectField label="Estado" name="id_estado" value={formData.id_estado} onChange={handleChange} options={dropdowns.estados.map(e => ({id: e.id_estado, name: e.nombre_estado}))} required/>
                                <SelectField label="Municipio" name="id_municipio" value={formData.id_municipio} onChange={handleChange} options={filteredMunicipios.map(m => ({id: m.id_municipio, name: m.nombre_municipio}))} disabled={!formData.id_estado} required/>
                                <SelectField label="Parroquia" name="id_parroquia" value={formData.id_parroquia} onChange={handleChange} options={filteredParroquias.map(p => ({id: p.id_parroquia, name: p.nombre_parroquia}))} disabled={!formData.id_municipio} required/>
                                <InputField label="Dirección Detallada" name="direccion_detallada" value={formData.direccion_detallada} onChange={handleChange} as="textarea" />
                                <div className="md:col-span-2">
                                    <InputField label="Coordenadas (Lat, Lon)" name="coordinates" value={localCoords} onChange={handleCoordinatesChange} onPaste={onPasteCoordinates} placeholder="Pegar o escribir coordenadas (ej: 10.123, -68.456)" />
                                    {formData.latitud && formData.longitud && (
                                        <div className="mt-4 h-64 rounded-lg overflow-hidden border border-ciec-border">
                                            <GoogleMap mapContainerStyle={{ width: '100%', height: '100%' }} center={{ lat: formData.latitud, lng: formData.longitud }} zoom={15} options={{ styles: darkMapStyle, mapTypeControl: false, zoomControl: true, streetViewControl: false }}>
                                                <MarkerF position={{ lat: formData.latitud, lng: formData.longitud }} />
                                            </GoogleMap>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Fieldset>
                    </div>

                    {/* Step 4: Classification */}
                    <div className={step === 4 ? 'block' : 'hidden'}>
                        <Fieldset legend="Clasificación CAEV">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <SelectField label="Sección CAEV" name="id_seccion" value={formData.id_seccion} onChange={handleChange} options={dropdowns.secCaev.map(s => ({id: s.id_seccion, name: s.nombre_seccion}))} />
                                <SelectField label="División CAEV" name="id_division" value={formData.id_division} onChange={handleChange} options={filteredDivCaev.map(d => ({id: d.id_division, name: d.nombre_division}))} disabled={!formData.id_seccion} />
                                <SelectField label="Clase CAEV" name="id_clase_caev" value={formData.id_clase_caev} onChange={handleChange} options={filteredClassCaev.map(c => ({id: c.id_clase, name: c.nombre_clase}))} disabled={!formData.id_division} />
                            </div>
                        </Fieldset>
                        <Fieldset legend="Productos y Procesos">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CreatableSelector 
                                    title="Productos"
                                    placeholder="Buscar o añadir producto..."
                                    selectedItems={formData.selectedProducts || []}
                                    onAddItem={(item) => addProduct(item)}
                                    onRemoveItem={removeProduct}
                                    searchFunction={searchProducts}
                                    itemRenderer={(item) => <span>{item.nombre_producto || item.name}</span>}
                                    creatable={true}
                                />
                                <CreatableSelector 
                                    title="Procesos Productivos"
                                    placeholder="Buscar o añadir proceso..."
                                    selectedItems={formData.selectedProcesses || []}
                                    onAddItem={(item) => addProcess(item)}
                                    onRemoveItem={removeProcess}
                                    searchFunction={searchProcesses}
                                    itemRenderer={(item, onUpdate) => (
                                        <div className="flex-grow flex items-center">
                                            <span className="flex-1">{item.nombre_proceso || item.name}</span>
                                            <input 
                                                type="number" 
                                                min="0"
                                                max="100"
                                                placeholder="Uso %" 
                                                value={item.porcentaje_capacidad_uso || ''} 
                                                onChange={(e) => updateProcessUsage(formData.selectedProcesses?.indexOf(item) ?? -1, e.target.value)}
                                                className="w-24 ml-4 bg-ciec-border rounded px-2 py-1 text-right"
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </div>
                                    )}
                                    creatable={true}
                                />
                            </div>
                        </Fieldset>
                    </div>
                    
                    {/* Step 5: Affiliations */}
                    <div className={step === 5 ? 'block' : 'hidden'}>
                        <Fieldset legend="Afiliaciones">
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {dropdowns.instituciones.map(inst => (
                                    <div key={inst.rif} className="flex items-center bg-ciec-bg p-3 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id={`inst-${inst.rif}`}
                                            checked={formData.selectedInstitutions?.includes(inst.rif) || false}
                                            onChange={() => toggleAffiliation(inst.rif)}
                                            className="w-5 h-5 text-ciec-blue bg-gray-700 border-gray-600 rounded focus:ring-ciec-blue"
                                        />
                                        <label htmlFor={`inst-${inst.rif}`} className="ml-3 text-ciec-text-primary">{inst.nombre}</label>
                                    </div>
                                ))}
                            </div>
                        </Fieldset>
                    </div>
                    
                    {/* Step 6: Review */}
                    <div className={step === 6 ? 'block' : 'hidden'}>
                        <p className="text-center text-lg text-ciec-text-secondary">Por favor, revise todos los datos antes de guardar.</p>
                        {/* A full review component could be added here */}
                    </div>


                    <div className="flex justify-between mt-8 pt-4 border-t border-ciec-border">
                        <button type="button" onClick={handleBack} disabled={step === 1} className="bg-ciec-border text-ciec-text-primary font-bold py-2 px-6 rounded-lg hover:bg-gray-600 disabled:opacity-50">Atrás</button>
                        {step < STEPS.length ? 
                            <button type="button" onClick={handleNext} disabled={(step === 2 && nameValidation !== 'valid') || (step === 1 && !isCompanyVerified)} className="bg-ciec-blue hover:bg-ciec-blue-hover text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50">Siguiente</button> :
                            null
                        }
                    </div>
                </>
            )}
        </>
    );
};

export default EmpresaFormFields;
