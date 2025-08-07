
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Minus, UploadCloud, X, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { darkMapStyle } from '../../styles/mapStyles';
import Spinner from '../ui/Spinner';
import { supabase } from '../../lib/supabase';
import { EstablecimientoFormData, Producto, ProcesoProductivo } from '../../types';
import RifInput from '../ui/RifInput';
import PhoneInput from '../ui/PhoneInput';

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


const InputField = React.memo(({ label, name, as, tabIndex, ...props }: React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & { label: string; name: string; value?: string | number | null; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; type?: string; required?: boolean; readOnly?: boolean; pattern?: string; title?: string; as?: 'textarea', placeholder?: string, onPaste?: (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void; onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void; tabIndex?: number; }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}{props.required && '*'}</label>
        {as === 'textarea' ? (
            <textarea id={name} name={name} {...props} tabIndex={tabIndex} value={props.value || ''} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70" rows={3}></textarea>
        ) : (
            <input id={name} name={name} {...props} tabIndex={tabIndex} value={props.value || ''} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-70" />
        )}
    </div>
));

const SelectField = React.memo(({ label, name, options, tabIndex, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; name: string; value?: string | number | null; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { id: string | number; name: string }[]; disabled?: boolean; required?: boolean; tabIndex?: number; }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-ciec-text-secondary mb-1">{label}{props.required && '*'}</label>
        <select id={name} name={name} {...props} tabIndex={tabIndex} value={props.value || ''} className="w-full bg-ciec-bg border border-ciec-border rounded-lg px-3 py-2 appearance-none text-ciec-text-primary focus:ring-2 focus:ring-ciec-blue focus:outline-none disabled:opacity-50">
            <option value="">Seleccione una opción</option>
            {options.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
            ))}
        </select>
    </div>
));

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
    onUpdateItem: (index: number, updatedItem: any) => void;
    searchFunction: (term: string) => Promise<any[]>;
    itemRenderer: (item: any, onUpdate: (updatedItem: any) => void) => React.ReactNode;
    creatable: boolean;
    tabIndex?: number;
}> = ({ title, placeholder, selectedItems, onAddItem, onRemoveItem, onUpdateItem, searchFunction, itemRenderer, creatable, tabIndex }) => {
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
                    tabIndex={tabIndex}
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
                         {itemRenderer(item, (updated) => onUpdateItem(index, updated))}
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

const STEPS = [
    { num: 1, name: 'Compañía' },
    { num: 2, name: 'Establecimiento' },
    { num: 3, name: 'Ubicación' },
    { num: 4, name: 'Clasificación' },
    { num: 5, name: 'Afiliaciones' },
    { num: 6, name: 'Revisión' },
];

type StepStatus = 'complete' | 'incomplete' | 'empty';


// AllFields component is now outside EmpresaFormFields
const AllFields = ({ formData, updateFormData, logoPreview, handleLogoChange, handleClearLogo, dropdowns, tabIdx, localCoords, setLocalCoords }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let processedValue: string | number | null = value;
        
        if (['id_estado', 'id_municipio', 'id_parroquia', 'personal_obrero', 'personal_empleado', 'personal_directivo'].includes(name)) {
            processedValue = value === '' ? null : Number(value);
        } else if (['id_seccion', 'id_division', 'id_clase_caev'].includes(name)) {
            processedValue = value === '' ? null : value;
        }
        
        const updates: Partial<EstablecimientoFormData> = { [name]: processedValue };
        
        if (name === 'id_estado') { 
            updates.id_municipio = null; 
            updates.id_parroquia = null; 
        }
        if (name === 'id_municipio') {
            updates.id_parroquia = null;
        }
        if (name === 'id_seccion') { 
            updates.id_division = null; 
            updates.id_clase_caev = null; 
        }
        if (name === 'id_division') {
            updates.id_clase_caev = null;
        }
        
        updateFormData(updates);
    }, [updateFormData]);

    const handleFileSelect = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            const mockEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleLogoChange(mockEvent);
        }
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

    const searchProducts = async (term: string) => {
        const { data } = await supabase.from('productos').select('*').ilike('nombre_producto', `%${term}%`).limit(5);
        return (data as any)?.map((d: any) => ({ id: d.id_producto, name: d.nombre_producto })) || [];
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
        return (data as any)?.map((d: any) => ({ id: d.id_proceso, name: d.nombre_proceso })) || [];
    }
    const addProcess = (process: {id: number | null, name: string}) => {
        const newProcess = { id_proceso: process.id, nombre_proceso: process.name, porcentaje_capacidad_uso: null };
        if (!formData.selectedProcesses?.some(p => p.id_proceso === newProcess.id_proceso && p.nombre_proceso === newProcess.nombre_proceso)) {
            updateFormData({ selectedProcesses: [...(formData.selectedProcesses || []), newProcess] });
        }
    };
    const removeProcess = (index: number) => {
        updateFormData({ selectedProcesses: formData.selectedProcesses?.filter((_, i) => i !== index) });
    };
    
    const updateProcess = (index: number, updatedItem: any) => {
        const updatedProcesses = [...(formData.selectedProcesses || [])];
        updatedProcesses[index] = updatedItem;
        updateFormData({ selectedProcesses: updatedProcesses });
    };

    const toggleAffiliation = (rif: string) => {
        const currentRifs = formData.selectedInstitutions || [];
        const newRifs = currentRifs.includes(rif) ? currentRifs.filter(r => r !== rif) : [...currentRifs, rif];
        updateFormData({ selectedInstitutions: newRifs });
    };

    const filteredMunicipios = formData.id_estado ? dropdowns.municipios.filter(m => m.id_estado === formData.id_estado) : [];
    const filteredParroquias = formData.id_municipio ? dropdowns.parroquias.filter(p => p.id_municipio === formData.id_municipio) : [];
    
    const logoDropZoneClasses = `
        relative w-full h-48 rounded-lg bg-ciec-bg border-2 border-dashed border-ciec-border 
        flex flex-col items-center justify-center text-ciec-text-secondary cursor-pointer
        transition-all duration-200
        ${isDraggingOver ? 'border-ciec-blue ring-2 ring-ciec-blue' : ''}
    `;

    return (
        <div className="space-y-8">
            <Fieldset legend="Datos de Identificación de la Compañía">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <RifInput label="RIF" value={formData.rif} onChange={(newValue) => updateFormData({ rif: newValue })} required readOnly selectTabIndex={tabIdx++} numberTabIndex={tabIdx++}/>
                    <InputField label="Razón Social" name="razon_social" value={formData.razon_social} onChange={handleChange} required tabIndex={tabIdx++}/>
                    <InputField label="Año de Fundación" name="ano_fundacion" type="date" value={formData.ano_fundacion} onChange={handleChange} tabIndex={tabIdx++}/>
                    <InputField label="Dirección Fiscal" name="direccion_fiscal" value={formData.direccion_fiscal} onChange={handleChange} as="textarea" tabIndex={tabIdx++}/>
                    <div className="lg:col-span-2">
                         <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Logo</label>
                        <div 
                            className={logoDropZoneClasses}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDraggingOver(false); }}
                            onDrop={(e) => { e.preventDefault(); setIsDraggingOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
                            tabIndex={tabIdx++}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                                accept="image/*"
                                className="hidden"
                            />
                            {logoPreview ? (
                                <img src={logoPreview} alt="preview" className="w-full h-full object-contain rounded-md p-2" />
                            ) : (
                                <>
                                    <UploadCloud size={48} />
                                    <p className="mt-2 text-sm">Arrastra y suelta o haz clic para subir</p>
                                </>
                            )}
                             {(logoPreview || formData.logo) && (
                                <button 
                                    type="button" 
                                    onClick={(e) => { e.stopPropagation(); handleClearLogo(); }} 
                                    className="absolute top-2 right-2 p-1 bg-red-800/70 text-white rounded-full hover:bg-red-700"
                                    title="Eliminar logo"
                                >
                                    <X size={16}/>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Fieldset>
            <Fieldset legend="Datos del Establecimiento">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField label="Nombre Establecimiento" name="nombre_establecimiento" value={formData.nombre_establecimiento || ''} onChange={handleChange} required tabIndex={tabIdx++}/>
                    <InputField label="E-mail Principal" name="email_principal" type="email" value={formData.email_principal} onChange={handleChange} tabIndex={tabIdx++}/>
                    <PhoneInput label="Teléfono Principal 1" value={formData.telefono_principal_1} onChange={(newValue) => updateFormData({ telefono_principal_1: newValue })} selectTabIndex={tabIdx++} numberTabIndex={tabIdx++}/>
                    <PhoneInput label="Teléfono Principal 2" value={formData.telefono_principal_2} onChange={(newValue) => updateFormData({ telefono_principal_2: newValue })} selectTabIndex={tabIdx++} numberTabIndex={tabIdx++}/>
                    <InputField label="Fecha de Apertura" name="fecha_apertura" type="date" value={formData.fecha_apertura} onChange={handleChange} tabIndex={tabIdx++}/>
                </div>
            </Fieldset>
            <Fieldset legend="Capital Humano">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <InputField label="Nº de Obreros" name="personal_obrero" type="number" value={formData.personal_obrero} onChange={handleChange} tabIndex={tabIdx++}/>
                    <InputField label="Nº de Empleados" name="personal_empleado" type="number" value={formData.personal_empleado} onChange={handleChange} tabIndex={tabIdx++}/>
                    <InputField label="Nº de Directivos" name="personal_directivo" type="number" value={formData.personal_directivo} onChange={handleChange} tabIndex={tabIdx++}/>
                </div>
            </Fieldset>
            <Fieldset legend="Ubicación Geográfica del Establecimiento">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField label="Estado" name="id_estado" value={formData.id_estado} onChange={handleChange} options={dropdowns.estados.map(e => ({id: e.id_estado, name: e.nombre_estado}))} required tabIndex={tabIdx++}/>
                    <SelectField label="Municipio" name="id_municipio" value={formData.id_municipio} onChange={handleChange} options={filteredMunicipios.map(m => ({id: m.id_municipio, name: m.nombre_municipio}))} disabled={!formData.id_estado} required tabIndex={tabIdx++}/>
                    <SelectField label="Parroquia" name="id_parroquia" value={formData.id_parroquia} onChange={handleChange} options={filteredParroquias.map(p => ({id: p.id_parroquia, name: p.nombre_parroquia}))} disabled={!formData.id_municipio} required tabIndex={tabIdx++}/>
                    <InputField label="Dirección Detallada" name="direccion_detallada" value={formData.direccion_detallada} onChange={handleChange} as="textarea" tabIndex={tabIdx++}/>
                    <div className="md:col-span-2">
                        <InputField label="Coordenadas (Lat, Lon)" name="coordinates" value={localCoords} onChange={handleCoordinatesChange} onPaste={onPasteCoordinates} placeholder="Pegar o escribir coordenadas (ej: 10.123, -68.456)" tabIndex={tabIdx++}/>
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
                    <SelectField label="Sección CAEV" name="id_seccion" value={formData.id_seccion} onChange={handleChange} options={dropdowns.secCaev.map(s => ({id: s.id_seccion, name: `${s.nombre_seccion}${s.descripcion_seccion ? ` - ${s.descripcion_seccion}` : ''}`}))} tabIndex={tabIdx++}/>
                    <SelectField label="División CAEV" name="id_division" value={formData.id_division} onChange={handleChange} options={dropdowns.divCaev.filter(d => d.id_seccion === formData.id_seccion).map(d => ({id: d.id_division, name: `${d.nombre_division}${d.descripcion_division ? ` - ${d.descripcion_division}` : ''}`}))} disabled={!formData.id_seccion} tabIndex={tabIdx++}/>
                    <SelectField label="Clase CAEV" name="id_clase_caev" value={formData.id_clase_caev} onChange={handleChange} options={dropdowns.classCaev.filter(c => c.id_division === formData.id_division).map(c => ({id: c.id_clase, name: `${c.nombre_clase}${c.descripcion_clase ? ` - ${c.descripcion_clase}` : ''}`}))} disabled={!formData.id_division} tabIndex={tabIdx++}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CreatableSelector 
                        title="Productos"
                        placeholder="Buscar o añadir producto..."
                        selectedItems={formData.selectedProducts || []}
                        onAddItem={addProduct}
                        onRemoveItem={removeProduct}
                        onUpdateItem={()=>{}}
                        searchFunction={searchProducts}
                        itemRenderer={(item) => <span>{item.nombre_producto || item.name}</span>}
                        creatable={true}
                        tabIndex={tabIdx++}
                    />
                    <CreatableSelector 
                        title="Procesos Productivos"
                        placeholder="Buscar o añadir proceso..."
                        selectedItems={formData.selectedProcesses || []}
                        onAddItem={addProcess}
                        onRemoveItem={removeProcess}
                        onUpdateItem={updateProcess}
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
                                    onChange={(e) => onUpdate({ ...item, porcentaje_capacidad_uso: e.target.value ? parseInt(e.target.value, 10) : null })}
                                    className="w-24 ml-4 bg-ciec-border rounded px-2 py-1 text-right"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        )}
                        creatable={true}
                        tabIndex={tabIdx++}
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
};


const EmpresaFormFields: React.FC<EmpresaFormFieldsProps> = ({
    isEditing, formData, updateFormData, logoPreview, handleLogoChange, handleClearLogo, dropdowns, setExternalError
}) => {
    const [step, setStep] = useState(1);
    const [localCoords, setLocalCoords] = useState('');
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Step 1 state
    const [isCompanyVerified, setIsCompanyVerified] = useState(false);
    const [companyCheckStatus, setCompanyCheckStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
    const [isCompanyLocked, setIsCompanyLocked] = useState(false);

    // Step 2 state
    const debouncedName = useDebounce(formData.nombre_establecimiento || '', 500);
    const [nameValidation, setNameValidation] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
    
    const [stepStatuses, setStepStatuses] = useState<{[key: number]: StepStatus}>({});


    useEffect(() => {
        if (isEditing) {
            setIsCompanyVerified(true);
            setIsCompanyLocked(true);
            if (formData.latitud && formData.longitud) {
                setLocalCoords(`${formData.latitud}, ${formData.longitud}`);
            }
        }
    }, [isEditing, formData.latitud, formData.longitud]);


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
        if (isEditing && debouncedName === initialData.nombre_establecimiento) {
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

    const getStepStatus = useCallback((stepNum: number): StepStatus => {
        switch (stepNum) {
            case 1: // Compañía
                if (!formData.rif && !formData.razon_social) return 'empty';
                if (formData.rif && formData.razon_social && isCompanyVerified) return 'complete';
                return 'incomplete';
            case 2: // Establecimiento
                const hasDataStep2 = formData.nombre_establecimiento || formData.email_principal || formData.telefono_principal_1 || formData.fecha_apertura || formData.personal_obrero || formData.personal_empleado || formData.personal_directivo;
                if (!hasDataStep2) return 'empty';
                if (formData.nombre_establecimiento && nameValidation === 'valid') return 'complete';
                return 'incomplete';
            case 3: // Ubicación
                const hasLocationData = formData.id_estado || formData.direccion_detallada || formData.latitud;
                if (!hasLocationData) return 'empty';
                if (formData.id_estado && formData.id_municipio && formData.id_parroquia) return 'complete';
                return 'incomplete';
            case 4: // Clasificación
                const hasClassificationData = formData.id_seccion || (formData.selectedProducts && formData.selectedProducts.length > 0) || (formData.selectedProcesses && formData.selectedProcesses.length > 0);
                if (!hasClassificationData) return 'empty';
                if (formData.id_seccion && formData.id_division && formData.id_clase_caev) return 'complete';
                return 'incomplete';
            case 5: // Afiliaciones
                if (!formData.selectedInstitutions || formData.selectedInstitutions.length === 0) return 'empty';
                return 'complete';
            case 6: // Revisión
                return 'empty';
            default:
                return 'empty';
        }
    }, [formData, isCompanyVerified, nameValidation]);
    
    useEffect(() => {
        const newStatuses = STEPS.reduce((acc, s) => {
            acc[s.num] = getStepStatus(s.num);
            return acc;
        }, {} as {[key: number]: StepStatus});
        setStepStatuses(newStatuses);
    }, [formData, getStepStatus]);

    // This reference helps the validation useEffect to not trigger on the very first render with initial data
    const initialData = useRef(formData).current;

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let processedValue: string | number | null = value;
        
        if (['id_estado', 'id_municipio', 'id_parroquia', 'personal_obrero', 'personal_empleado', 'personal_directivo'].includes(name)) {
            processedValue = value === '' ? null : Number(value);
        } else if (['id_seccion', 'id_division', 'id_clase_caev'].includes(name)) {
            processedValue = value === '' ? null : value;
        }
        
        const updates: Partial<EstablecimientoFormData> = { [name]: processedValue };
        
        if (name === 'id_estado') { 
            updates.id_municipio = null; 
            updates.id_parroquia = null; 
        }
        if (name === 'id_municipio') {
            updates.id_parroquia = null;
        }
        if (name === 'id_seccion') { 
            updates.id_division = null; 
            updates.id_clase_caev = null; 
        }
        if (name === 'id_division') {
            updates.id_clase_caev = null;
        }
        
        updateFormData(updates);
    }, [updateFormData]);
    
    const handleFileSelect = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            // This is a way to simulate a file input change event
            const mockEvent = {
                target: {
                    files: [file]
                }
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleLogoChange(mockEvent);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };


    const handleVerifyRif = async () => {
        const rif = formData.rif;
        if (!rif || isEditing) return;
        
        setCompanyCheckStatus('loading');
        const { data, error } = await supabase.from('companias').select('*').eq('rif', rif).single();
        
        const typedData = data as any;

        if (typedData) {
            updateFormData({
                razon_social: typedData.razon_social,
                direccion_fiscal: typedData.direccion_fiscal,
                ano_fundacion: typedData.ano_fundacion,
                logo: typedData.logo,
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
    
    // Dynamic Selectors Handlers
    const searchProducts = async (term: string) => {
        const { data } = await supabase.from('productos').select('*').ilike('nombre_producto', `%${term}%`).limit(5);
        return (data as any)?.map((d: any) => ({ id: d.id_producto, name: d.nombre_producto })) || [];
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
        return (data as any)?.map((d: any) => ({ id: d.id_proceso, name: d.nombre_proceso })) || [];
    }
    const addProcess = (process: {id: number | null, name: string}) => {
        const newProcess = { id_proceso: process.id, nombre_proceso: process.name, porcentaje_capacidad_uso: null };
        if (!formData.selectedProcesses?.some(p => p.id_proceso === newProcess.id_proceso && p.nombre_proceso === newProcess.nombre_proceso)) {
            updateFormData({ selectedProcesses: [...(formData.selectedProcesses || []), newProcess] });
        }
    };
    const removeProcess = (index: number) => {
        updateFormData({ selectedProcesses: formData.selectedProcesses?.filter((_, i) => i !== index) });
    };
    const updateProcessUsage = (index: number, updatedItem: any) => {
        const updatedProcesses = [...(formData.selectedProcesses || [])];
        updatedProcesses[index] = updatedItem;
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
    
    const logoDropZoneClasses = `
        relative w-full h-48 rounded-lg bg-ciec-bg border-2 border-dashed border-ciec-border 
        flex flex-col items-center justify-center text-ciec-text-secondary cursor-pointer
        transition-all duration-200
        ${isDraggingOver ? 'border-ciec-blue ring-2 ring-ciec-blue' : ''}
    `;

    let tabIdx = 1;
    
    const statusClasses: {[key in StepStatus]: string} = {
        complete: 'bg-green-500 hover:bg-green-600',
        incomplete: 'bg-yellow-500 hover:bg-yellow-600',
        empty: 'bg-ciec-border hover:bg-gray-600',
    };
    
    const activeClasses = 'ring-2 ring-offset-2 ring-offset-ciec-card ring-ciec-blue';

    return (
        <>
            {isEditing ? (
                 <AllFields
                    formData={formData}
                    updateFormData={updateFormData}
                    logoPreview={logoPreview}
                    handleLogoChange={handleLogoChange}
                    handleClearLogo={handleClearLogo}
                    dropdowns={dropdowns}
                    tabIdx={tabIdx}
                    localCoords={localCoords}
                    setLocalCoords={setLocalCoords}
                />
            ) : (
                <>
                    <div className="flex items-start justify-center mb-8">
                        {STEPS.map((s, index) => (
                            <React.Fragment key={s.num}>
                                <div className="flex flex-col items-center cursor-pointer" onClick={() => setStep(s.num)}>
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all duration-200 ${statusClasses[stepStatuses[s.num] || 'empty']} ${step === s.num ? activeClasses : ''}`}
                                    >
                                        {stepStatuses[s.num] === 'complete' ? <CheckCircle size={24} /> : s.num}
                                    </div>
                                    <span className="text-xs mt-2 text-ciec-text-secondary text-center w-20">{s.name}</span>
                                </div>
                                {index < STEPS.length - 1 && <div className={`flex-auto border-t-2 mt-5 mx-2 md:mx-4 ${step > s.num ? 'border-ciec-blue' : 'border-ciec-border'}`}></div>}
                            </React.Fragment>
                        ))}
                    </div>

                    <h2 className="text-2xl font-bold text-ciec-text-primary mb-6">{STEPS.find(s=>s.num===step)?.name}</h2>

                    {/* Step 1: Company */}
                    <div className={step === 1 ? 'block' : 'hidden'}>
                        <Fieldset legend="Datos de Identificación de la Compañía">
                            {companyCheckStatus === 'found' && <p className="text-yellow-400 bg-yellow-900/50 p-3 rounded-md mb-4">Compañía ya registrada. Proceda a registrar un nuevo establecimiento para esta compañía.</p>}
                            {companyCheckStatus === 'not_found' && <p className="text-green-400 bg-green-900/50 p-3 rounded-md mb-4">Nueva compañía detectada. Por favor, complete los datos fiscales.</p>}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <RifInput label="RIF" value={formData.rif} onChange={(newValue) => updateFormData({ rif: newValue })} onBlur={handleVerifyRif} required readOnly={isEditing || isCompanyLocked} selectTabIndex={tabIdx++} numberTabIndex={tabIdx++}/>
                                <InputField label="Razón Social" name="razon_social" value={formData.razon_social} onChange={handleChange} required readOnly={isCompanyLocked} tabIndex={tabIdx++}/>
                                <InputField label="Año de Fundación" name="ano_fundacion" type="date" value={formData.ano_fundacion} onChange={handleChange} readOnly={isCompanyLocked} tabIndex={tabIdx++}/>
                                <InputField label="Dirección Fiscal" name="direccion_fiscal" value={formData.direccion_fiscal} onChange={handleChange} as="textarea" readOnly={isCompanyLocked} tabIndex={tabIdx++}/>
                                <div className="lg:col-span-2">
                                     <label className="block text-sm font-medium text-ciec-text-secondary mb-1">Logo</label>
                                    <div 
                                        className={logoDropZoneClasses}
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        tabIndex={tabIdx++}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="preview" className="w-full h-full object-contain rounded-md p-2" />
                                        ) : (
                                            <>
                                                <UploadCloud size={48} />
                                                <p className="mt-2 text-sm">Arrastra y suelta o haz clic para subir</p>
                                            </>
                                        )}
                                        {(logoPreview || formData.logo) && (
                                            <button 
                                                type="button" 
                                                onClick={(e) => { e.stopPropagation(); handleClearLogo(); }} 
                                                className="absolute top-2 right-2 p-1 bg-red-800/70 text-white rounded-full hover:bg-red-700"
                                                title="Eliminar logo"
                                            >
                                                <X size={16}/>
                                            </button>
                                        )}
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
                                    <InputField label="Nombre Establecimiento" name="nombre_establecimiento" value={formData.nombre_establecimiento || ''} onChange={handleChange} required tabIndex={tabIdx++}/>
                                    {nameValidation === 'loading' && <Spinner size="sm"/>}
                                    {nameValidation === 'invalid' && <p className="text-red-500 text-sm mt-1">Ya existe un establecimiento con este nombre para esta compañía.</p>}
                                    {nameValidation === 'valid' && formData.nombre_establecimiento && <CheckCircle className="text-green-500 inline-block ml-2"/>}
                                </div>
                                <InputField label="E-mail Principal" name="email_principal" type="email" value={formData.email_principal} onChange={handleChange} tabIndex={tabIdx++}/>
                                <PhoneInput label="Teléfono Principal 1" value={formData.telefono_principal_1} onChange={(newValue) => updateFormData({ telefono_principal_1: newValue })} selectTabIndex={tabIdx++} numberTabIndex={tabIdx++} />
                                <PhoneInput label="Teléfono Principal 2" value={formData.telefono_principal_2} onChange={(newValue) => updateFormData({ telefono_principal_2: newValue })} selectTabIndex={tabIdx++} numberTabIndex={tabIdx++} />
                                <InputField label="Fecha de Apertura" name="fecha_apertura" type="date" value={formData.fecha_apertura} onChange={handleChange} tabIndex={tabIdx++}/>
                            </div>
                        </Fieldset>
                        <Fieldset legend="Capital Humano">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InputField label="Nº de Obreros" name="personal_obrero" type="number" value={formData.personal_obrero} onChange={handleChange} tabIndex={tabIdx++}/>
                                <InputField label="Nº de Empleados" name="personal_empleado" type="number" value={formData.personal_empleado} onChange={handleChange} tabIndex={tabIdx++}/>
                                <InputField label="Nº de Directivos" name="personal_directivo" type="number" value={formData.personal_directivo} onChange={handleChange} tabIndex={tabIdx++}/>
                            </div>
                        </Fieldset>
                    </div>

                    {/* Step 3: Location */}
                    <div className={step === 3 ? 'block' : 'hidden'}>
                        <Fieldset legend="Ubicación Geográfica del Establecimiento">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SelectField label="Estado" name="id_estado" value={formData.id_estado} onChange={handleChange} options={dropdowns.estados.map(e => ({id: e.id_estado, name: e.nombre_estado}))} required tabIndex={tabIdx++}/>
                                <SelectField label="Municipio" name="id_municipio" value={formData.id_municipio} onChange={handleChange} options={filteredMunicipios.map(m => ({id: m.id_municipio, name: m.nombre_municipio}))} disabled={!formData.id_estado} required tabIndex={tabIdx++}/>
                                <SelectField label="Parroquia" name="id_parroquia" value={formData.id_parroquia} onChange={handleChange} options={filteredParroquias.map(p => ({id: p.id_parroquia, name: p.nombre_parroquia}))} disabled={!formData.id_municipio} required tabIndex={tabIdx++}/>
                                <InputField label="Dirección Detallada" name="direccion_detallada" value={formData.direccion_detallada} onChange={handleChange} as="textarea" tabIndex={tabIdx++}/>
                                <div className="md:col-span-2">
                                    <InputField label="Coordenadas (Lat, Lon)" name="coordinates" value={localCoords} onChange={handleCoordinatesChange} onPaste={onPasteCoordinates} placeholder="Pegar o escribir coordenadas (ej: 10.123, -68.456)" tabIndex={tabIdx++}/>
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
                                <SelectField label="Sección CAEV" name="id_seccion" value={formData.id_seccion} onChange={handleChange} options={dropdowns.secCaev.map(s => ({id: s.id_seccion, name: `${s.nombre_seccion}${s.descripcion_seccion ? ` - ${s.descripcion_seccion}` : ''}`}))} tabIndex={tabIdx++}/>
                                <SelectField label="División CAEV" name="id_division" value={formData.id_division} onChange={handleChange} options={filteredDivCaev.map(d => ({id: d.id_division, name: `${d.nombre_division}${d.descripcion_division ? ` - ${d.descripcion_division}` : ''}`}))} disabled={!formData.id_seccion} tabIndex={tabIdx++}/>
                                <SelectField label="Clase CAEV" name="id_clase_caev" value={formData.id_clase_caev} onChange={handleChange} options={filteredClassCaev.map(c => ({id: c.id_clase, name: `${c.nombre_clase}${c.descripcion_clase ? ` - ${c.descripcion_clase}` : ''}`}))} disabled={!formData.id_division} tabIndex={tabIdx++}/>
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
                                    onUpdateItem={()=>{}}
                                    searchFunction={searchProducts}
                                    itemRenderer={(item) => <span>{item.nombre_producto || item.name}</span>}
                                    creatable={true}
                                    tabIndex={tabIdx++}
                                />
                                <CreatableSelector 
                                    title="Procesos Productivos"
                                    placeholder="Buscar o añadir proceso..."
                                    selectedItems={formData.selectedProcesses || []}
                                    onAddItem={(item) => addProcess(item)}
                                    onRemoveItem={removeProcess}
                                    onUpdateItem={updateProcessUsage}
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
                                                onChange={(e) => onUpdate({ ...item, porcentaje_capacidad_uso: e.target.value ? parseInt(e.target.value, 10) : null })}
                                                className="w-24 ml-4 bg-ciec-border rounded px-2 py-1 text-right"
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </div>
                                    )}
                                    creatable={true}
                                    tabIndex={tabIdx++}
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
                </>
            )}
        </>
    );
};

export default EmpresaFormFields;
