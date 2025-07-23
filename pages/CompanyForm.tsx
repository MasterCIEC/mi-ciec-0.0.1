
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Company, Estado, Municipio, Parroquia, Afiliacion, ClassCaev, Urbanizacion } from '../types';
import Spinner from '../components/Spinner';

type FormData = Partial<Company>;

const CompanyForm: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(code);

    const [formData, setFormData] = useState<FormData>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [estados, setEstados] = useState<Estado[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [parroquias, setParroquias] = useState<Parroquia[]>([]);
    const [urbanizaciones, setUrbanizaciones] = useState<Urbanizacion[]>([]);
    const [afiliaciones, setAfiliaciones] = useState<Afiliacion[]>([]);
    const [caevClasses, setCaevClasses] = useState<ClassCaev[]>([]);

    const fetchDropdownData = useCallback(async () => {
        const { data: estadosData, error: e1 } = await supabase.from('estados').select('*');
        const { data: municipiosData, error: e2 } = await supabase.from('municipios').select('*');
        const { data: parroquiasData, error: e3 } = await supabase.from('parroquias').select('*');
        const { data: urbanizacionesData, error: e6 } = await supabase.from('urbanizaciones').select('*');
        const { data: afiliacionesData, error: e4 } = await supabase.from('afiliaciones').select('*');
        const { data: caevData, error: e5 } = await supabase.from('class_caev_clasificaciones').select('*');
        if (e1 || e2 || e3 || e4 || e5 || e6) setError("Failed to load form metadata.");
        else {
            setEstados(estadosData || []);
            setMunicipios(municipiosData || []);
            setParroquias(parroquiasData || []);
            setUrbanizaciones(urbanizacionesData || []);
            setAfiliaciones(afiliacionesData || []);
            setCaevClasses(caevData || []);
        }
    }, []);

    const fetchCompanyData = useCallback(async (companyCode: string) => {
        const { data, error } = await supabase.from('empresas').select('*').eq('code', companyCode).single();
        if (error) {
            setError('Could not fetch company data.');
            console.error(error);
        } else {
            setFormData(data);
        }
    }, []);

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            await fetchDropdownData();
            if (isEditing && code) {
                await fetchCompanyData(code);
            }
            setLoading(false);
        };
        initialize();
    }, [code, isEditing, fetchCompanyData, fetchDropdownData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const numValue = (e.target as HTMLInputElement).type === 'number' ? (value === '' ? null : Number(value)) : value;
        setFormData(prev => ({ ...prev, [name]: numValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.razon_social || !formData.code) {
            alert('El Código y la Razón Social son campos obligatorios.');
            return;
        }

        setSubmitting(true);
        setError(null);
        
        const cleanFormData = Object.fromEntries(
            Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
        );

        let result;
        if (isEditing) {
            result = await supabase.from('empresas').update(cleanFormData).eq('code', code);
        } else {
            result = await supabase.from('empresas').insert(cleanFormData);
        }

        const { error: submitError } = result;

        if (submitError) {
            setError(`Error al guardar: ${submitError.message}`);
            console.error(submitError);
        } else {
            alert(`Empresa ${isEditing ? 'actualizada' : 'creada'} exitosamente.`);
            navigate('/companies');
        }
        setSubmitting(false);
    };

    if (loading) return <Spinner size="lg" />;

    const renderInput = (name: keyof FormData, label: string, type: string = 'text', required: boolean = false) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-ciec-dark-gray">{label}</label>
            <input
                type={type}
                id={name}
                name={name}
                value={(formData[name] as string | number) || ''}
                onChange={handleChange}
                required={required}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-ciec-blue focus:border-ciec-blue sm:text-sm"
            />
        </div>
    );
    
    const renderSelect = <T extends {id: string | number}>(name: keyof FormData, label: string, options: T[], optionKey: keyof T, optionValue: keyof T) => (
        <div>
             <label htmlFor={name} className="block text-sm font-medium text-ciec-dark-gray">{label}</label>
             <select
                id={name}
                name={name}
                value={(formData[name] as string | number) || ''}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-ciec-blue focus:border-ciec-blue sm:text-sm"
            >
                <option value="">Seleccione una opción</option>
                {options.map(option => (
                    <option key={option.id} value={option.id}>{option[optionValue] as string}</option>
                ))}
             </select>
        </div>
    );


    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-md">
            <h1 className="text-3xl font-bold text-ciec-text">{isEditing ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</h1>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderInput('code', 'Código de Empresa', 'text', true)}
                {renderInput('rif', 'RIF')}
                {renderInput('razon_social', 'Razón Social', 'text', true)}
                {renderInput('nombre_establecimiento', 'Nombre del Establecimiento')}
                {renderInput('persona_contacto', 'Persona de Contacto')}
                {renderInput('email', 'E-mail', 'email')}
                {renderInput('telefono', 'Teléfono')}
                {renderInput('telefono2', 'Teléfono 2')}
                {renderInput('direccion_fiscal', 'Dirección Fiscal')}
                {renderInput('direccion_establecimiento', 'Dirección Establecimiento')}
                {renderSelect('estado_id', 'Estado', estados, 'id', 'nombre_estado')}
                {renderSelect('municipio_id', 'Municipio', municipios.filter(m => m.estado_id === Number(formData.estado_id)), 'id', 'nombre_municipio')}
                {renderSelect('parroquia_id', 'Parroquia', parroquias.filter(p => p.municipio_id === Number(formData.municipio_id)), 'id', 'nombre_parroquia')}
                {renderSelect('urbanizacion_id', 'Urbanización', urbanizaciones.filter(u => u.parroquia_id === Number(formData.parroquia_id)), 'id', 'nombre_urbanizacion')}
                {renderInput('latitude', 'Latitud', 'number')}
                {renderInput('longitude', 'Longitud', 'number')}
                {renderSelect('afiliacion_id', 'Afiliada a', afiliaciones, 'id', 'nombre_afiliacion')}
                {renderSelect('class_caev_id', 'Clasificación CAEV', caevClasses, 'id', 'descripcion_class')}
                {renderInput('productos_y_marcas', 'Productos y Marcas')}
                {renderInput('obreros', 'Nº de Obreros', 'number')}
                {renderInput('empleados', 'Nº de Empleados', 'number')}
                {renderInput('directivos', 'Nº de Directivos', 'number')}
                {renderInput('anio_fundacion', 'Año de Fundación', 'number')}
            </div>

            <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => navigate(-1)} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
                    Cancelar
                </button>
                <button type="submit" disabled={submitting} className="bg-ciec-blue hover:bg-ciec-gold text-white font-bold py-2 px-6 rounded-lg disabled:bg-gray-400">
                    {submitting ? <Spinner size="sm" color="border-white" /> : (isEditing ? 'Guardar Cambios' : 'Crear Empresa')}
                </button>
            </div>
        </form>
    );
};

export default CompanyForm;